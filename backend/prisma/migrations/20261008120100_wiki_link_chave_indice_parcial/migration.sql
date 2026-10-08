-- Unicidade de wiki_link.chave_smae passa a valer só entre registros ativos, permitindo
-- reutilizar a chave de um link removido. Índice parcial: o Prisma não representa no schema.

-- DropIndex
DROP INDEX "wiki_link_chave_smae_key";

-- CreateIndex
CREATE UNIQUE INDEX "wiki_link_chave_smae_ativo_uniq" ON "wiki_link"("chave_smae") WHERE "removido_em" IS NULL;
