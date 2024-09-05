-- CreateTable
CREATE TABLE "projeto_pessoa_revisao" (
    "id" SERIAL NOT NULL,
    "projeto_id" INTEGER NOT NULL,
    "pessoa_id" INTEGER NOT NULL,
    "projeto_revisado" BOOLEAN NOT NULL,
    "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projeto_pessoa_revisao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "projeto_pessoa_revisao_projeto_id_pessoa_id_key" ON "projeto_pessoa_revisao"("projeto_id", "pessoa_id");

-- AddForeignKey
ALTER TABLE "projeto_pessoa_revisao" ADD CONSTRAINT "projeto_pessoa_revisao_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_pessoa_revisao" ADD CONSTRAINT "projeto_pessoa_revisao_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
