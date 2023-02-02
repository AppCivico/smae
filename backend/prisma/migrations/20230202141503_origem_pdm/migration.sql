-- CreateEnum
CREATE TYPE "ProjetoOrigemTipo" AS ENUM ('PdmSistema', 'PdmAntigo', 'Outro');

-- AlterTable
ALTER TABLE "projeto" ADD COLUMN     "origem_tipo" "ProjetoOrigemTipo" NOT NULL DEFAULT 'Outro';
