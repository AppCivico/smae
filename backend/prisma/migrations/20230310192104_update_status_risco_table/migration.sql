/*
  Warnings:

  - You are about to drop the column `status_risco` on the `plano_acao` table. All the data in the column will be lost.
  - Added the required column `status_risco` to the `projeto_risco` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProjetoRiscoStatus" AS ENUM ('SemInformacao');

-- AlterEnum
ALTER TYPE "StatusRisco" ADD VALUE 'Fechado';

-- AlterTable
ALTER TABLE "plano_acao" DROP COLUMN "status_risco";

-- AlterTable
ALTER TABLE "projeto_risco" ADD COLUMN     "status_risco" "StatusRisco" NOT NULL;
