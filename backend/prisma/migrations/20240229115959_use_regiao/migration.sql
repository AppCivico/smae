/*
  Warnings:

  - You are about to drop the column `estado_id` on the `eleicao_comparecimento` table. All the data in the column will be lost.
  - You are about to drop the column `municipio_id` on the `eleicao_comparecimento` table. All the data in the column will be lost.
  - You are about to drop the column `subprefeitura_id` on the `eleicao_comparecimento` table. All the data in the column will be lost.
  - You are about to drop the column `estado_id` on the `mandato_representatividade` table. All the data in the column will be lost.
  - You are about to drop the column `municipio_id` on the `mandato_representatividade` table. All the data in the column will be lost.
  - You are about to drop the column `subprefeitura_id` on the `mandato_representatividade` table. All the data in the column will be lost.
  - You are about to drop the column `estado_id` on the `parlamentar_mandato` table. All the data in the column will be lost.
  - You are about to drop the column `municipio_id` on the `parlamentar_mandato` table. All the data in the column will be lost.
  - You are about to drop the column `subprefeitura_id` on the `parlamentar_mandato` table. All the data in the column will be lost.
  - You are about to drop the `estado` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `municipio` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subprefeitura` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `regiao_id` to the `eleicao_comparecimento` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mandato_id` to the `mandato_representatividade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `regiao_id` to the `mandato_representatividade` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "eleicao_comparecimento" DROP CONSTRAINT "eleicao_comparecimento_estado_id_fkey";

-- DropForeignKey
ALTER TABLE "eleicao_comparecimento" DROP CONSTRAINT "eleicao_comparecimento_municipio_id_fkey";

-- DropForeignKey
ALTER TABLE "eleicao_comparecimento" DROP CONSTRAINT "eleicao_comparecimento_subprefeitura_id_fkey";

-- DropForeignKey
ALTER TABLE "mandato_representatividade" DROP CONSTRAINT "mandato_representatividade_estado_id_fkey";

-- DropForeignKey
ALTER TABLE "mandato_representatividade" DROP CONSTRAINT "mandato_representatividade_municipio_id_fkey";

-- DropForeignKey
ALTER TABLE "mandato_representatividade" DROP CONSTRAINT "mandato_representatividade_subprefeitura_id_fkey";

-- DropForeignKey
ALTER TABLE "municipio" DROP CONSTRAINT "municipio_estado_id_fkey";

-- DropForeignKey
ALTER TABLE "parlamentar_mandato" DROP CONSTRAINT "parlamentar_mandato_estado_id_fkey";

-- DropForeignKey
ALTER TABLE "parlamentar_mandato" DROP CONSTRAINT "parlamentar_mandato_municipio_id_fkey";

-- DropForeignKey
ALTER TABLE "parlamentar_mandato" DROP CONSTRAINT "parlamentar_mandato_subprefeitura_id_fkey";

-- DropForeignKey
ALTER TABLE "subprefeitura" DROP CONSTRAINT "subprefeitura_atualizado_por_fkey";

-- DropForeignKey
ALTER TABLE "subprefeitura" DROP CONSTRAINT "subprefeitura_criado_por_fkey";

-- DropForeignKey
ALTER TABLE "subprefeitura" DROP CONSTRAINT "subprefeitura_municipio_id_fkey";

-- DropForeignKey
ALTER TABLE "subprefeitura" DROP CONSTRAINT "subprefeitura_removido_por_fkey";

-- AlterTable
ALTER TABLE "eleicao_comparecimento" DROP COLUMN "estado_id",
DROP COLUMN "municipio_id",
DROP COLUMN "subprefeitura_id",
ADD COLUMN     "regiao_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "mandato_representatividade" DROP COLUMN "estado_id",
DROP COLUMN "municipio_id",
DROP COLUMN "subprefeitura_id",
ADD COLUMN     "mandato_id" INTEGER NOT NULL,
ADD COLUMN     "municipio_tipo" "MunicipioTipo",
ADD COLUMN     "regiao_id" INTEGER NOT NULL,
ALTER COLUMN "pct_participacao" DROP NOT NULL;

-- AlterTable
ALTER TABLE "parlamentar_mandato" DROP COLUMN "estado_id",
DROP COLUMN "municipio_id",
DROP COLUMN "subprefeitura_id";

-- DropTable
DROP TABLE "estado";

-- DropTable
DROP TABLE "municipio";

-- DropTable
DROP TABLE "subprefeitura";

-- DropEnum
DROP TYPE "SubprefeituraRegiao";

-- AddForeignKey
ALTER TABLE "eleicao_comparecimento" ADD CONSTRAINT "eleicao_comparecimento_regiao_id_fkey" FOREIGN KEY ("regiao_id") REFERENCES "regiao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandato_representatividade" ADD CONSTRAINT "mandato_representatividade_regiao_id_fkey" FOREIGN KEY ("regiao_id") REFERENCES "regiao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mandato_representatividade" ADD CONSTRAINT "mandato_representatividade_mandato_id_fkey" FOREIGN KEY ("mandato_id") REFERENCES "parlamentar_mandato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
