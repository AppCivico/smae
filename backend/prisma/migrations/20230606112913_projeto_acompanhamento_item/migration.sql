/*
  Warnings:

  - You are about to drop the column `encaminhamento` on the `projeto_acompanhamento` table. All the data in the column will be lost.
  - You are about to drop the column `prazo_encaminhamento` on the `projeto_acompanhamento` table. All the data in the column will be lost.
  - You are about to drop the column `prazo_realizado` on the `projeto_acompanhamento` table. All the data in the column will be lost.
  - You are about to drop the column `responsavel` on the `projeto_acompanhamento` table. All the data in the column will be lost.

*/
-- AlterTable
begin;

ALTER TABLE "ods" ADD COLUMN     "eh_status_pdm" BOOLEAN NOT NULL DEFAULT false;


-- CreateTable
CREATE TABLE "projeto_acompanhamento_item" (
    "id" SERIAL NOT NULL,
    "projeto_acompanhamento_id" INTEGER NOT NULL,
    "encaminhamento" TEXT,
    "responsavel" TEXT,
    "prazo_encaminhamento" DATE,
    "prazo_realizado" DATE,
    "pauta" TEXT,
    "ordem" SMALLINT NOT NULL,

    CONSTRAINT "projeto_acompanhamento_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "projeto_acompanhamento_item_projeto_acompanhamento_id_idx" ON "projeto_acompanhamento_item"("projeto_acompanhamento_id");

-- AddForeignKey
ALTER TABLE "projeto_acompanhamento_item" ADD CONSTRAINT "projeto_acompanhamento_item_projeto_acompanhamento_id_fkey" FOREIGN KEY ("projeto_acompanhamento_id") REFERENCES "projeto_acompanhamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


insert into projeto_acompanhamento_item (
 projeto_acompanhamento_id,
 encaminhamento,
 responsavel,
 prazo_encaminhamento,
 prazo_realizado,
 ordem
)
select id, encaminhamento,
responsavel,
prazo_encaminhamento,
prazo_realizado, 1
from projeto_acompanhamento;


-- AlterTable
ALTER TABLE "projeto_acompanhamento" DROP COLUMN "encaminhamento",
DROP COLUMN "prazo_encaminhamento",
DROP COLUMN "prazo_realizado",
DROP COLUMN "responsavel";

commit;
