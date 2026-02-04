-- AlterEnum
ALTER TYPE "task_type" ADD VALUE 'refresh_demanda';

-- CreateTable
CREATE TABLE "cache_kv" (
    "chave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "expiracao" TIMESTAMP(3),
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cache_kv_pkey" PRIMARY KEY ("chave")
);

INSERT INTO smae_config (key, value) VALUES
    ('DEMANDA_GEOCAMADAS_REGIAO_ID', '180'),
    ('DEMANDA_GEOCAMADAS_NIVEL', '3'),
    ('DEMANDA_PUBLIC_FILE_TOKEN_EXPIRY', '30d')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
