/*
  Warnings:

  - You are about to drop the column `status_risco` on the `plano_acao_monitoramento` table. All the data in the column will be lost.
  - Added the required column `status_risco` to the `plano_acao` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "plano_acao" ADD COLUMN     "status_risco" "StatusRisco" NOT NULL;

-- AlterTable
ALTER TABLE "plano_acao_monitoramento" DROP COLUMN "status_risco";
