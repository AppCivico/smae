-- CreateTable
CREATE TABLE "projeto_relatorio_fila" (
    "id" SERIAL NOT NULL,
    "projeto_id" INTEGER NOT NULL,
    "locked_at" TIMESTAMP(3),
    "executado_em" TIMESTAMP(3),
    "relatorio_id" INTEGER,

    CONSTRAINT "projeto_relatorio_fila_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "projeto_relatorio_fila" ADD CONSTRAINT "projeto_relatorio_fila_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_relatorio_fila" ADD CONSTRAINT "projeto_relatorio_fila_relatorio_id_fkey" FOREIGN KEY ("relatorio_id") REFERENCES "relatorio"("id") ON DELETE SET NULL ON UPDATE CASCADE;
