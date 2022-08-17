/*
  Warnings:

  - You are about to drop the column `eh_super_admin` on the `pessoa` table. All the data in the column will be lost.
  - You are about to drop the column `secretaria_id` on the `time_pessoa` table. All the data in the column will be lost.
  - You are about to drop the `secretaria` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[nome]` on the table `time` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "time_pessoa" DROP CONSTRAINT "time_pessoa_secretaria_id_fkey";

-- AlterTable
ALTER TABLE "emaildb_config" ALTER COLUMN "delete_after" SET DEFAULT '10 year'::interval;

-- AlterTable
ALTER TABLE "pessoa" DROP COLUMN "eh_super_admin",
ADD COLUMN     "desativado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "desativado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "desativado_por" INTEGER,
ADD COLUMN     "pessoa_fisica_id" INTEGER;

-- AlterTable
ALTER TABLE "time_pessoa" DROP COLUMN "secretaria_id";

-- DropTable
DROP TABLE "secretaria";

-- CreateTable
CREATE TABLE "pessoa_fisica" (
    "id" SERIAL NOT NULL,
    "cargo_id" INTEGER NOT NULL,
    "divisao_tecnica_id" INTEGER,
    "departamento_id" INTEGER,
    "coordenadoria_id" INTEGER NOT NULL,
    "orgao_id" INTEGER NOT NULL,

    CONSTRAINT "pessoa_fisica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cargao" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "cargao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "divisao_tecnica" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "divisao_tecnica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coordenadoria" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "coordenadoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departamento" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "departamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orgao" (
    "id" SERIAL NOT NULL,
    "sigla" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo_orgao_id" INTEGER NOT NULL,

    CONSTRAINT "orgao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipo_orgao" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,

    CONSTRAINT "tipo_orgao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pessoa_fisica_id_key" ON "pessoa_fisica"("id");

-- CreateIndex
CREATE UNIQUE INDEX "cargao_id_key" ON "cargao"("id");

-- CreateIndex
CREATE UNIQUE INDEX "divisao_tecnica_id_key" ON "divisao_tecnica"("id");

-- CreateIndex
CREATE UNIQUE INDEX "coordenadoria_id_key" ON "coordenadoria"("id");

-- CreateIndex
CREATE UNIQUE INDEX "departamento_id_key" ON "departamento"("id");

-- CreateIndex
CREATE UNIQUE INDEX "orgao_id_key" ON "orgao"("id");

-- CreateIndex
CREATE UNIQUE INDEX "tipo_orgao_id_key" ON "tipo_orgao"("id");

-- CreateIndex
CREATE UNIQUE INDEX "time_nome_key" ON "time"("nome");

-- AddForeignKey
ALTER TABLE "pessoa" ADD CONSTRAINT "pessoa_desativado_por_fkey" FOREIGN KEY ("desativado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoa" ADD CONSTRAINT "pessoa_pessoa_fisica_id_fkey" FOREIGN KEY ("pessoa_fisica_id") REFERENCES "pessoa_fisica"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoa_fisica" ADD CONSTRAINT "pessoa_fisica_orgao_id_fkey" FOREIGN KEY ("orgao_id") REFERENCES "orgao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orgao" ADD CONSTRAINT "orgao_tipo_orgao_id_fkey" FOREIGN KEY ("tipo_orgao_id") REFERENCES "tipo_orgao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
