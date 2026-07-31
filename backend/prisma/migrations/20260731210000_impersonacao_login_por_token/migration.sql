-- AlterTable
ALTER TABLE "pessoa_sessao" ADD COLUMN     "impersonado_por_pessoa_id" INTEGER;

-- CreateTable
CREATE TABLE "pessoa_impersonacao_token" (
    "id" SERIAL NOT NULL,
    "token_hash" TEXT NOT NULL,
    "criado_por_pessoa_id" INTEGER NOT NULL,
    "criado_por_sessao_id" INTEGER NOT NULL,
    "alvo_pessoa_id" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_ip" INET NOT NULL,
    "expira_em" TIMESTAMPTZ(6) NOT NULL,
    "usado_em" TIMESTAMPTZ(6),
    "usado_ip" INET,
    "sessao_criada_id" INTEGER,

    CONSTRAINT "pessoa_impersonacao_token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pessoa_impersonacao_token_token_hash_key" ON "pessoa_impersonacao_token"("token_hash");

-- CreateIndex
CREATE INDEX "pessoa_impersonacao_token_criado_por_pessoa_id_idx" ON "pessoa_impersonacao_token"("criado_por_pessoa_id");

-- CreateIndex
CREATE INDEX "pessoa_impersonacao_token_alvo_pessoa_id_idx" ON "pessoa_impersonacao_token"("alvo_pessoa_id");

-- CreateIndex
CREATE INDEX "pessoa_impersonacao_token_expira_em_idx" ON "pessoa_impersonacao_token"("expira_em");

-- AddForeignKey
ALTER TABLE "pessoa_sessao" ADD CONSTRAINT "pessoa_sessao_impersonado_por_pessoa_id_fkey" FOREIGN KEY ("impersonado_por_pessoa_id") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoa_impersonacao_token" ADD CONSTRAINT "pessoa_impersonacao_token_criado_por_pessoa_id_fkey" FOREIGN KEY ("criado_por_pessoa_id") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoa_impersonacao_token" ADD CONSTRAINT "pessoa_impersonacao_token_criado_por_sessao_id_fkey" FOREIGN KEY ("criado_por_sessao_id") REFERENCES "pessoa_sessao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoa_impersonacao_token" ADD CONSTRAINT "pessoa_impersonacao_token_alvo_pessoa_id_fkey" FOREIGN KEY ("alvo_pessoa_id") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoa_impersonacao_token" ADD CONSTRAINT "pessoa_impersonacao_token_sessao_criada_id_fkey" FOREIGN KEY ("sessao_criada_id") REFERENCES "pessoa_sessao"("id") ON DELETE SET NULL ON UPDATE CASCADE;
