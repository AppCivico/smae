-- CreateEnum
CREATE TYPE "ComunicadoTipo" AS ENUM ('Geral', 'Individual', 'Especial', 'Bancada');

-- DropForeignKey
ALTER TABLE "nota" DROP CONSTRAINT "nota_orgao_responsavel_id_fkey";

-- AlterTable
ALTER TABLE "nota" ADD COLUMN     "dados" JSON,
ADD COLUMN     "titulo" TEXT,
ALTER COLUMN "orgao_responsavel_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "comunicado_transfere_gov" (
    "id" SERIAL NOT NULL,
    "numero" INTEGER NOT NULL,
    "ano" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "descricao" TEXT,
    "tipo" "ComunicadoTipo" NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comunicado_transfere_gov_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "comunicado_transfere_gov_numero_ano_titulo_key" ON "comunicado_transfere_gov"("numero", "ano", "titulo");

-- AddForeignKey
ALTER TABLE "nota" ADD CONSTRAINT "nota_orgao_responsavel_id_fkey" FOREIGN KEY ("orgao_responsavel_id") REFERENCES "orgao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "nota" ADD COLUMN     "usuarios_lidos" INTEGER[];
