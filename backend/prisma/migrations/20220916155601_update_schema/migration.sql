-- AlterTable
ALTER TABLE "indicador" ADD COLUMN     "nivel_regionalizacao" INTEGER;

-- CreateTable
CREATE TABLE "VariavelResponsavel" (
    "id" SERIAL NOT NULL,
    "variavel_id" INTEGER NOT NULL,
    "pessoa_id" INTEGER NOT NULL,

    CONSTRAINT "VariavelResponsavel_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VariavelResponsavel" ADD CONSTRAINT "VariavelResponsavel_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariavelResponsavel" ADD CONSTRAINT "VariavelResponsavel_variavel_id_fkey" FOREIGN KEY ("variavel_id") REFERENCES "variavel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
