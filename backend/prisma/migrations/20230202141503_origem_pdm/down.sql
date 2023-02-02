-- AlterTable
ALTER TABLE "projeto" DROP COLUMN "meta_codigo",
DROP COLUMN "origem_tipo";

-- DropEnum
DROP TYPE "ProjetoOrigemTipo";

