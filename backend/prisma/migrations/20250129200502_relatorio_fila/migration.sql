-- AlterTable
ALTER TABLE "relatorio" ADD COLUMN     "processado_em" TIMESTAMPTZ(6);

-- CreateTable
CREATE TABLE "relatorio_fila" (
    "id" SERIAL NOT NULL,
    "relatorio_id" INTEGER NOT NULL,
    "erros" JSON,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locked_at" TIMESTAMP(3),
    "executado_em" TIMESTAMP(3),

    CONSTRAINT "relatorio_fila_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "relatorio_fila_relatorio_id_key" ON "relatorio_fila"("relatorio_id");

-- AddForeignKey
ALTER TABLE "relatorio_fila" ADD CONSTRAINT "relatorio_fila_relatorio_id_fkey" FOREIGN KEY ("relatorio_id") REFERENCES "relatorio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
