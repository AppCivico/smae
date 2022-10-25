-- DropForeignKey
ALTER TABLE "painel_conteudo_detalhe" DROP CONSTRAINT "painel_conteudo_detalhe_pai_id_fkey";

-- DropForeignKey
ALTER TABLE "painel_conteudo_detalhe" DROP CONSTRAINT "painel_conteudo_detalhe_painel_conteudo_id_fkey";

-- AddForeignKey
ALTER TABLE "painel_conteudo_detalhe" ADD CONSTRAINT "painel_conteudo_detalhe_painel_conteudo_id_fkey" FOREIGN KEY ("painel_conteudo_id") REFERENCES "painel_conteudo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "painel_conteudo_detalhe" ADD CONSTRAINT "painel_conteudo_detalhe_pai_id_fkey" FOREIGN KEY ("pai_id") REFERENCES "painel_conteudo_detalhe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
