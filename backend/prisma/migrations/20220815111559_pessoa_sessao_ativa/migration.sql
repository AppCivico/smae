-- CreateTable
CREATE TABLE "pessoa_sessao_ativa" (
    "id" SERIAL NOT NULL,
    "pessoa_id" INTEGER NOT NULL,

    CONSTRAINT "pessoa_sessao_ativa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pessoa_sessao_ativa_id_key" ON "pessoa_sessao_ativa"("id");

-- AddForeignKey
ALTER TABLE "pessoa_sessao_ativa" ADD CONSTRAINT "pessoa_sessao_ativa_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
