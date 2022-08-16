-- AlterTable
ALTER TABLE "pessoa" ADD COLUMN     "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "atualizado_por" INTEGER,
ADD COLUMN     "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "criado_por" INTEGER,
ADD COLUMN     "qtde_senha_invalida" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "senha_atualizada_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "senha_bloqueada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "senha_bloqueada_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "pessoa" ADD CONSTRAINT "pessoa_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoa" ADD CONSTRAINT "pessoa_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
