import type { NoteItem } from "./types";

export const initialNotes: NoteItem[] = [
  {
    id: "note-1",
    title: "Comandos úteis de Docker para o dia a dia",
    tags: ["docker", "devops", "comandos"],
    content: `Anotações rápidas para quando precisar limpar containers ou debugar serviços locais:

- Limpar containers e volumes orfãos:
docker system prune -a --volumes

- Ver logs em tempo real de um container:
docker logs -f --tail 100 <container_id>

- Entrar no shell de um container rodando:
docker exec -it <container_id> sh`,
    isPinned: true,
    updatedAt: "Hoje às 14:32",
    createdAt: "2026-10-19T14:32:00Z",
  },
  {
    id: "note-2",
    title: "Variáveis de ambiente e conexão com Neon no Prisma",
    tags: ["prisma", "neon", "backend"],
    content: `Lembrar sempre que no NeonDB o pooler usa porta 6543 e o endpoint direto usa 5432.

No schema.prisma:
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL") // conexão com pooling para queries normais
  directUrl = env("DIRECT_URL")   // conexão direta sem pooler para migrations
}

Caso a migração falhe na Vercel com timeout de transação, verifique se DIRECT_URL está configurada corretamente nos environments.`,
    isPinned: false,
    updatedAt: "Ontem às 18:20",
    createdAt: "2026-10-18T18:20:00Z",
  },
  {
    id: "note-3",
    title: "Comandos Git que sempre esqueço",
    tags: ["git", "dicas"],
    content: `- Desfazer o último commit mantendo as alterações nos arquivos (staged):
git reset --soft HEAD~1

- Descartar todas as alterações não commitadas:
git restore .

- Renomear a branch atual localmente:
git branch -m novo-nome`,
    isPinned: false,
    updatedAt: "3 dias atrás",
    createdAt: "2026-10-16T11:00:00Z",
  },
];
