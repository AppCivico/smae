/*
  Warnings:

  - You are about to drop the column `fechado_em` on the `projeto` table. All the data in the column will be lost.
  - You are about to drop the column `fechado_por` on the `projeto` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "projeto" DROP COLUMN "fechado_em",
DROP COLUMN "fechado_por",
ADD COLUMN     "finalizou_planejamento_em" TIMESTAMP(3),
ADD COLUMN     "finalizou_planejamento_por" INTEGER,
ADD COLUMN     "restaurado_em" TIMESTAMP(3),
ADD COLUMN     "restaurado_por" INTEGER,
ADD COLUMN     "terminado_em" TIMESTAMP(3),
ADD COLUMN     "terminado_por" INTEGER,
ADD COLUMN     "validado_em" TIMESTAMP(3),
ADD COLUMN     "validado_por" INTEGER;

-- AddForeignKey
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_suspenso_por_fkey" FOREIGN KEY ("suspenso_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_restaurado_por_fkey" FOREIGN KEY ("restaurado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_validado_por_fkey" FOREIGN KEY ("validado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_finalizou_planejamento_por_fkey" FOREIGN KEY ("finalizou_planejamento_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_cancelado_por_fkey" FOREIGN KEY ("cancelado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_reiniciado_por_fkey" FOREIGN KEY ("reiniciado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_iniciado_por_fkey" FOREIGN KEY ("iniciado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_terminado_por_fkey" FOREIGN KEY ("terminado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
