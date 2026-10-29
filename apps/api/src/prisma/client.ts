import { PrismaClient } from "@prisma/client";

/**
 * Prisma Client singleton com retry para Serverless Postgres (Neon).
 *
 * Em bancos serverless como Neon, o container de computação entra em auto-suspend
 * após inatividade. Quando uma nova query chega enquanto o container acorda,
 * conexões antigas do pool local podem ser encerradas pelo servidor (código 57P01:
 * "terminating connection due to administrator command").
 *
 * Esta extensão captura erros transitórios de conexão fechada e reexecuta
 * a query uma vez com uma nova conexão limpa, evitando falhas pro usuário.
 */
const basePrisma = new PrismaClient({
  log: [
    ...(process.env.NODE_ENV !== "production" ? [{ emit: "stdout" as const, level: "query" as const }] : []),
    { emit: "stdout" as const, level: "warn" as const },
    { emit: "event" as const, level: "error" as const },
  ],
});

// Intercepta eventos de erro do driver Rust do Prisma
(basePrisma as any).$on("error", (e: any) => {
  const msg = e?.message || "";
  // Ignora ruído inofensivo de encerramento de conexão ociosa pelo PgBouncer/Neon após COMMIT
  if (
    msg.includes("kind: Closed") ||
    msg.includes("57P01") ||
    msg.includes("terminating connection")
  ) {
    return;
  }
  console.error("Prisma Error:", e);
});

const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query }) {
        try {
          return await query(args);
        } catch (error: any) {
          const mensagem = error?.message || "";
          const ehErroConexaoFechada =
            mensagem.includes("57P01") ||
            mensagem.includes("terminating connection") ||
            mensagem.includes("Connection closed") ||
            mensagem.includes("Server has closed the connection");

          if (ehErroConexaoFechada) {
            // Reconecta e tenta uma segunda vez
            return await query(args);
          }

          throw error;
        }
      },
    },
  },
});

export default prisma as unknown as PrismaClient;
