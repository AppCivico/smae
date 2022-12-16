/*
  Warnings:

  - You are about to drop the column `empenho_liquido` on the `dotacao_planejado` table. All the data in the column will be lost.
  - You are about to drop the column `valor_liquidado` on the `dotacao_planejado` table. All the data in the column will be lost.
  - Added the required column `saldo_disponivel` to the `dotacao_planejado` table without a default value. This is not possible if the table is not empty.
  - Added the required column `val_orcado_atualizado` to the `dotacao_planejado` table without a default value. This is not possible if the table is not empty.
  - Added the required column `val_orcado_inicial` to the `dotacao_planejado` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable

delete from dotacao_planejado;
update public.orcamento_planejado set valor_planejado=0;

ALTER TABLE "dotacao_planejado" DROP COLUMN "empenho_liquido",
DROP COLUMN "valor_liquidado",
ADD COLUMN     "saldo_disponivel" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "val_orcado_atualizado" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "val_orcado_inicial" DOUBLE PRECISION NOT NULL;
