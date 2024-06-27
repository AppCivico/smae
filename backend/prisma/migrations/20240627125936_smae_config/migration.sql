-- DropForeignKey
ALTER TABLE "distribuicao_recurso_status" DROP CONSTRAINT "distribuicao_recurso_status_atualizado_por_fkey";

-- DropForeignKey
ALTER TABLE "distribuicao_recurso_status" DROP CONSTRAINT "distribuicao_recurso_status_criado_por_fkey";

-- DropForeignKey
ALTER TABLE "distribuicao_recurso_status" DROP CONSTRAINT "distribuicao_recurso_status_removido_por_fkey";

-- DropForeignKey
ALTER TABLE "projeto_tag" DROP CONSTRAINT "projeto_tag_atualizado_por_fkey";

-- DropForeignKey
ALTER TABLE "projeto_tag" DROP CONSTRAINT "projeto_tag_criado_por_fkey";

-- DropForeignKey
ALTER TABLE "projeto_tag" DROP CONSTRAINT "projeto_tag_removido_por_fkey";

-- CreateTable
CREATE TABLE "smae_config" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "smae_config_pkey" PRIMARY KEY ("key")
);
