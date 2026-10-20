import { Prisma } from "@prisma/client";
import type { Request, Response } from "express";
import { Router } from "express";
import { autenticar } from "../../middlewares/auth.middleware.js";
import {
  CreateNoteSchema,
  NoteIdSchema,
  NoteQuerySchema,
  UpdateNoteSchema,
} from "./notes.schema.js";
import { atualizarNota, buscarNota, criarNota, excluirNota, listarNotas } from "./notes.service.js";

/**
 * Rotas de CRUD de notas (Express Router):
 * - POST   /api/v1/notes       -> criar nota
 * - GET    /api/v1/notes       -> listar notas (paginado, busca, filtros)
 * - GET    /api/v1/notes/:id   -> buscar nota por id
 * - PUT    /api/v1/notes/:id   -> atualizar nota
 * - PATCH  /api/v1/notes/:id   -> atualizar parcialmente a nota
 * - DELETE /api/v1/notes/:id   -> excluir nota (soft delete)
 */
export const notesRoutes: Router = Router();

notesRoutes.use(autenticar);

function obterUserId(req: Request, res: Response) {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ error: "Usuario nao autenticado" });
    return null;
  }

  return userId;
}

async function atualizarNotaHandler(req: Request, res: Response) {
  const userId = obterUserId(req, res);
  if (!userId) {
    return;
  }

  const parsedParams = NoteIdSchema.safeParse(req.params);
  if (!parsedParams.success) {
    return res.status(400).json({
      error: "ID invalido",
      details: parsedParams.error.errors,
    });
  }

  const parsedBody = UpdateNoteSchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({
      error: "Dados invalidos",
      details: parsedBody.error.errors,
    });
  }

  try {
    const { nota, conflito } = await atualizarNota(userId, parsedParams.data.id, parsedBody.data);

    if (conflito) {
      return res.status(409).json({
        error: "Conflito de versao: a nota foi modificada por outro cliente",
      });
    }

    if (!nota) {
      return res.status(404).json({ error: "Nota nao encontrada" });
    }

    return res.status(200).json(nota);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return res.status(500).json({ error: message });
  }
}

notesRoutes.post("/", async (req: Request, res: Response) => {
  const userId = obterUserId(req, res);
  if (!userId) {
    return;
  }

  const parsed = CreateNoteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Dados invalidos",
      details: parsed.error.errors,
    });
  }

  try {
    const note = await criarNota(userId, parsed.data);
    return res.status(201).json(note);
  } catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaErrorCode = err.code;

      if (prismaErrorCode === "P2002") {
        return res.status(409).json({ error: "Nota com este ID ja existe" });
      }
    }

    if (err instanceof Error) {
      return res.status(500).json({ error: err.message });
    }

    return res.status(500).json({ error: "Erro interno" });
  }
});

notesRoutes.get("/", async (req: Request, res: Response) => {
  const userId = obterUserId(req, res);
  if (!userId) {
    return;
  }

  const parsed = NoteQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Parametros de consulta invalidos",
      details: parsed.error.errors,
    });
  }

  const result = await listarNotas(userId, parsed.data);
  return res.status(200).json(result);
});

notesRoutes.get("/:id", async (req: Request, res: Response) => {
  const userId = obterUserId(req, res);
  if (!userId) {
    return;
  }

  const parsed = NoteIdSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({
      error: "ID invalido",
      details: parsed.error.errors,
    });
  }

  const note = await buscarNota(userId, parsed.data.id);
  if (!note) {
    return res.status(404).json({ error: "Nota nao encontrada" });
  }

  return res.status(200).json(note);
});

notesRoutes.put("/:id", atualizarNotaHandler);
notesRoutes.patch("/:id", atualizarNotaHandler);

notesRoutes.delete("/:id", async (req: Request, res: Response) => {
  const userId = obterUserId(req, res);
  if (!userId) {
    return;
  }

  const parsed = NoteIdSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({
      error: "ID invalido",
      details: parsed.error.errors,
    });
  }

  const excluida = await excluirNota(userId, parsed.data.id);

  if (!excluida) {
    return res.status(404).json({ error: "Nota nao encontrada" });
  }

  return res.status(204).send();
});
