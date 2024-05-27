-- CreateEnum
CREATE TYPE "TipoProjeto" AS ENUM ('PP', 'MDO');

-- AlterEnum
ALTER TYPE "ModuloSistema" ADD VALUE 'MDO';

-- AlterTable
ALTER TABLE "projeto" ADD COLUMN     "tipo" "TipoProjeto" NOT NULL DEFAULT 'PP';
