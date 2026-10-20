import type { Prisma } from "@prisma/client";
import prisma from "../../prisma/client.js";
import type { CreateNoteInput, NoteQueryInput, UpdateNoteInput } from "./notes.schema.js";

/**
 * Lógica de negócio do módulo notes — regras puras, sem side effects de HTTP.
 * Regra do vault: "Regra de negócio é sempre responsabilidade do backend."
 *
 * Conexões com o banco via Prisma Client singleton (ver prisma/client.ts).
 * Todas as queries filtram por userId garantido pelo middleware de auth.
 */

/**
 * Shape de uma nota com suas tags relacionadas (para o formatador de saída).
 * Define apenas os campos que o formatador realmente usa.
 */
interface NotaComTags {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  kind: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  noteTags: { tag: { name: string } }[];
}

/**
 * Formata um Note do Prisma no shape esperado pelo frontend (NoteItem).
 * Extrai nomes de tags e converte datas para ISO string.
 */
function formatarNota(note: NotaComTags) {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    tags: note.noteTags.map((nt) => nt.tag.name),
    isPinned: note.isPinned,
    kind: note.kind,
    version: note.version,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}

/**
 * Find-or-create de tags para o usuário a partir de uma lista de nomes.
 * Tags são por-usuário (@@unique([userId, name])); evita duplicatas.
 * Executado dentro de transação para atomicidade.
 */
async function findOrCreateTags(
  tx: Prisma.TransactionClient,
  userId: string,
  nomes: string[],
): Promise<{ id: string }[]> {
  const tags: { id: string }[] = [];

  for (const nome of nomes) {
    const tag = await tx.tag.upsert({
      where: {
        userId_name: {
          userId,
          name: nome,
        },
      },
      update: {},
      create: { userId, name: nome },
    });
    tags.push({ id: tag.id });
  }

  return tags;
}

/**
 * Cria uma nova nota com suas tags associadas.
 * Transação: cria a nota + associal as tags em um único commit.
 */
export async function criarNota(userId: string, dados: CreateNoteInput) {
  const { id, title, content, tags, kind, isPinned } = dados;

  const note = await prisma.$transaction(async (tx) => {
    // Find-or-create de todas as tags informadas
    const tagsEncontradas = tags.length > 0 ? await findOrCreateTags(tx, userId, tags) : [];

    // Cria a nota e associa as tags via relação N:N (NoteTag)
    const nota = await tx.note.create({
      data: {
        id,
        userId,
        title,
        content,
        kind,
        isPinned,
        noteTags: {
          create: tagsEncontradas.map((t) => ({ tagId: t.id })),
        },
      },
      include: {
        noteTags: {
          include: { tag: true },
        },
      },
    });

    return formatarNota(nota);
  });

  return note;
}

/**
 * Lista notas do usuário autenticado com paginação, busca e filtros.
 * Apenas notas não excluídas (deletedAt IS NULL).
 */
export async function listarNotas(userId: string, query: NoteQueryInput) {
  const { page, limit, search, pinned, tag } = query;
  const skip = (page - 1) * limit;

  // Monta filtro dinâmico
  const where: Prisma.NoteWhereInput = {
    userId,
    deletedAt: null, // soft delete: ignora excluídas
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { content: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(pinned !== undefined ? { isPinned: pinned } : {}),
    ...(tag ? { noteTags: { some: { tag: { name: tag, userId } } } } : {}),
  };

  // Busca as notas + total (para paginação) em paralelo
  const [notas, total] = await Promise.all([
    prisma.note.findMany({
      where,
      orderBy: [
        { isPinned: "desc" }, // fixadas primeiro
        { updatedAt: "desc" }, // mais recentes primeiro
      ],
      skip,
      take: limit,
      include: {
        noteTags: { include: { tag: true } },
      },
    }),
    prisma.note.count({ where }),
  ]);

  const totalPaginas = Math.ceil(total / limit);

  return {
    notas: notas.map(formatarNota),
    paginacao: {
      pagina: page,
      porPagina: limit,
      total,
      totalPaginas,
      temProximo: page < totalPaginas,
      temAnterior: page > 1,
    },
  };
}

/**
 * Busca uma única nota pelo id, garantindo que pertença ao usuário
 * e não esteja excluída (soft delete).
 */
export async function buscarNota(userId: string, id: string) {
  const note = await prisma.note.findFirst({
    where: {
      id,
      userId,
      deletedAt: null,
    },
    include: {
      noteTags: { include: { tag: true } },
    },
  });

  if (!note) return null;
  return formatarNota(note);
}

/**
 * Atualiza nota com concurrency otimista via campo `version`.
 * Se o cliente envia `version` e não bate com o atual, retorna conflito=true.
 * Reconcilia tags: remove associações antigas e recria com os novos nomes.
 */
export async function atualizarNota(
  userId: string,
  id: string,
  dados: UpdateNoteInput,
): Promise<{
  nota: ReturnType<typeof formatarNota> | null;
  conflito: boolean;
}> {
  const { title, content, tags, isPinned, version } = dados;

  return await prisma.$transaction(async (tx) => {
    // Busca a nota atual para checar concurrency
    const notaAtual = await tx.note.findFirst({
      where: { id, userId, deletedAt: null },
      include: { noteTags: { include: { tag: true } } },
    });

    if (!notaAtual) {
      return { nota: null, conflito: false };
    }

    // Concurrency otimista: se versão bate, rejeita
    if (version !== undefined && version !== notaAtual.version) {
      return { nota: null, conflito: true };
    }

    // Reconcilia tags se foram enviadas
    if (tags !== undefined) {
      // Remove todas as associações atuais
      await tx.noteTag.deleteMany({ where: { noteId: id } });

      // Find-or-create das novas tags
      if (tags.length > 0) {
        const tagsEncontradas = await findOrCreateTags(tx, userId, tags);
        await tx.noteTag.createMany({
          data: tagsEncontradas.map((t) => ({
            noteId: id,
            tagId: t.id,
          })),
        });
      }
    }

    // Atualiza a nota e incrementa a versão
    const notaAtualizada = await tx.note.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(content !== undefined ? { content } : {}),
        ...(isPinned !== undefined ? { isPinned } : {}),
        version: { increment: 1 }, // sempre incrementa para concurrency
      },
      include: {
        noteTags: { include: { tag: true } },
      },
    });

    return { nota: formatarNota(notaAtualizada), conflito: false };
  });
}

/**
 * Exclusão lógica (soft delete): marca deletedAt sem remover do banco.
 * Permite recuperação futura e mantém integridade referencial.
 */
export async function excluirNota(userId: string, id: string): Promise<boolean> {
  const result = await prisma.note.updateMany({
    where: {
      id,
      userId,
      deletedAt: null, // só exclui se não estiver já excluída
    },
    data: {
      deletedAt: new Date(),
    },
  });

  return result.count > 0;
}
