-- AlterTable
ALTER TABLE "projeto" DROP COLUMN "versao",
ADD COLUMN     "versao" DATE;

-- AlterTable
ALTER TABLE "projeto_fonte_recurso" DROP COLUMN "fonte_recurso_ano",
DROP COLUMN "fonte_recurso_cod_sof",
ADD COLUMN     "fonte_recurso_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "projeto_fonte_recurso" ADD CONSTRAINT "projeto_fonte_recurso_fonte_recurso_id_fkey" FOREIGN KEY ("fonte_recurso_id") REFERENCES "fonte_recurso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

