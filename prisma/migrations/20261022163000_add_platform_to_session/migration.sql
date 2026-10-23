-- Adiciona coluna platform pra identificar sessões mobile vs web
-- Idempotent: só altera se a coluna nao existir (evita erro no Neon deploy)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sessions' AND column_name = 'platform'
  ) THEN
    ALTER TABLE "sessions" ADD COLUMN "platform" TEXT NOT NULL DEFAULT 'web';
  END IF;
END $$;
