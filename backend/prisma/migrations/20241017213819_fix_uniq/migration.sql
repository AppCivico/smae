-- DropIndex
DROP INDEX "variavel_categorica_valor_variavel_categorica_id_valor_vari_key";


CREATE UNIQUE INDEX "ix_variavel_categorica_valor_variavel_categorica_id_valor_vari_key"
    ON "variavel_categorica_valor"("variavel_categorica_id", "valor_variavel") where removido_em is null;

