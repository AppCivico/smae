-- CreateTable
CREATE TABLE "pessoa_ultima_atividade" (
    "id" SERIAL NOT NULL,
    "pessoa_id" INTEGER NOT NULL,
    "pessoa_sessao_id" INTEGER,
    "ip" INET NOT NULL,
    "ultima_atividade_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pessoa_ultima_atividade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pessoa_ultima_atividade_ultima_atividade_em_idx" ON "pessoa_ultima_atividade"("ultima_atividade_em");

-- CreateIndex
CREATE UNIQUE INDEX "pessoa_ultima_atividade_pessoa_id_key" ON "pessoa_ultima_atividade"("pessoa_id");

-- AddForeignKey
ALTER TABLE "pessoa_ultima_atividade" ADD CONSTRAINT "pessoa_ultima_atividade_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoa_ultima_atividade" ADD CONSTRAINT "pessoa_ultima_atividade_pessoa_sessao_id_fkey" FOREIGN KEY ("pessoa_sessao_id") REFERENCES "pessoa_sessao"("id") ON DELETE SET NULL ON UPDATE CASCADE;
