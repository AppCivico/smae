-- AlterTable
ALTER TABLE "Tarefa" ADD COLUMN     "custo_estimado" DOUBLE PRECISION,
ADD COLUMN     "custo_real" DOUBLE PRECISION,
ADD COLUMN     "duracao_planejado" INTEGER,
ADD COLUMN     "duracao_real" INTEGER,
ADD COLUMN     "inicio_planejado" TIMESTAMP(3),
ADD COLUMN     "inicio_real" TIMESTAMP(3),
ADD COLUMN     "percentual_concluido" DOUBLE PRECISION,
ADD COLUMN     "termino_planejado" TIMESTAMP(3),
ADD COLUMN     "termino_real" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Predecessor" (
    "id" SERIAL NOT NULL,
    "tarefa_id" INTEGER NOT NULL,
    "tarefa_predecessora_id" INTEGER NOT NULL,

    CONSTRAINT "Predecessor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Risco" (
    "id" SERIAL NOT NULL,
    "tarefa_id" INTEGER NOT NULL,
    "numero" INTEGER NOT NULL,
    "data_registro" TIMESTAMP(3) NOT NULL,
    "descricao" TEXT,
    "causa" TEXT,
    "consequencia" TEXT,
    "probabilidade" DOUBLE PRECISION,
    "impacto" DOUBLE PRECISION,
    "nivel" DOUBLE PRECISION,
    "grau" DOUBLE PRECISION,
    "resposta" TEXT,

    CONSTRAINT "Risco_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Predecessor" ADD CONSTRAINT "Predecessor_tarefa_id_fkey" FOREIGN KEY ("tarefa_id") REFERENCES "Tarefa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Predecessor" ADD CONSTRAINT "Predecessor_tarefa_predecessora_id_fkey" FOREIGN KEY ("tarefa_predecessora_id") REFERENCES "Tarefa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risco" ADD CONSTRAINT "Risco_tarefa_id_fkey" FOREIGN KEY ("tarefa_id") REFERENCES "Tarefa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
