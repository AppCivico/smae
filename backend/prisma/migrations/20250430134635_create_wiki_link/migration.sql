-- CreateTable
CREATE TABLE "wiki_link" (
    "id" SERIAL NOT NULL,
    "chave_smae" TEXT NOT NULL,
    "url_wiki" TEXT NOT NULL,
    "criado_por" INTEGER,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMP(3),

    CONSTRAINT "wiki_link_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wiki_link_chave_smae_key" ON "wiki_link"("chave_smae");
