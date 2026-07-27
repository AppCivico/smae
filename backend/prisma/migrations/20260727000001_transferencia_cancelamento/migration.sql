-- AlterTable
ALTER TABLE "transferencia" ADD COLUMN "cancelada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "cancelada_em" TIMESTAMPTZ(6),
ADD COLUMN "cancelada_por" INTEGER;

-- AddForeignKey
ALTER TABLE "transferencia" ADD CONSTRAINT "transferencia_cancelada_por_fkey" FOREIGN KEY ("cancelada_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
