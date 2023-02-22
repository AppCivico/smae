/*
  Warnings:

  - You are about to drop the `ProjetoRegistroSei` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProjetoRegistroSei" DROP CONSTRAINT "ProjetoRegistroSei_projeto_id_fkey";

-- DropTable
DROP TABLE "ProjetoRegistroSei";

-- CreateTable
CREATE TABLE "projeto_registro_sei" (
    "id" SERIAL NOT NULL,
    "projeto_id" INTEGER NOT NULL,
    "categoria" "CategoriaProcessoSei" NOT NULL,
    "processo_sei" TEXT NOT NULL,
    "registro_sei_info" JSONB NOT NULL,
    "registro_sei_errmsg" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL,
    "criado_por" INTEGER NOT NULL,

    CONSTRAINT "projeto_registro_sei_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "projeto_registro_sei" ADD CONSTRAINT "projeto_registro_sei_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
