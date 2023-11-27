-- AlterTable
ALTER TABLE "portfolio" ADD COLUMN     "nivel_regionalizacao" SMALLINT DEFAULT 1;

-- AlterTable
ALTER TABLE "projeto" ADD COLUMN     "logradouro_cep" TEXT,
ADD COLUMN     "logradouro_nome" TEXT,
ADD COLUMN     "logradouro_numero" TEXT,
ADD COLUMN     "logradouro_tipo" TEXT,
ADD COLUMN     "regiao_id" INTEGER;

-- AddForeignKey
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_regiao_id_fkey" FOREIGN KEY ("regiao_id") REFERENCES "regiao"("id") ON DELETE SET NULL ON UPDATE CASCADE;
