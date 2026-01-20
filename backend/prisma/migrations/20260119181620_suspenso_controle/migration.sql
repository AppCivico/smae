-- AlterTable
ALTER TABLE "variavel_suspensa_controle" ADD COLUMN     "removido_em" TIMESTAMPTZ(6),
ADD COLUMN     "removido_por" INTEGER;

-- CreateIndex
CREATE INDEX "variavel_suspensa_controle_variavel_id_removido_em_idx" ON "variavel_suspensa_controle"("variavel_id", "removido_em");
