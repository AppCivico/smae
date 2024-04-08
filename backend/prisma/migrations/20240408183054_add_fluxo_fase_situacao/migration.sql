-- CreateTable
CREATE TABLE "fluxo_fase_situacao" (
    "id" SERIAL NOT NULL,
    "fluxo_fase_id" INTEGER NOT NULL,
    "situacao_id" INTEGER NOT NULL,

    CONSTRAINT "fluxo_fase_situacao_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "fluxo_fase_situacao" ADD CONSTRAINT "fluxo_fase_situacao_fluxo_fase_id_fkey" FOREIGN KEY ("fluxo_fase_id") REFERENCES "fluxo_fase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fluxo_fase_situacao" ADD CONSTRAINT "fluxo_fase_situacao_situacao_id_fkey" FOREIGN KEY ("situacao_id") REFERENCES "workflow_situacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
