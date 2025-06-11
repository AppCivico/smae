-- AlterTable
ALTER TABLE "variavel" ADD COLUMN     "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "atualizado_por" INTEGER,
ADD COLUMN     "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "criado_por" INTEGER;

ALTER TABLE "variavel"
    ADD COLUMN "vetores_busca" tsvector GENERATED ALWAYS AS (
        to_tsvector('simple',
            COALESCE("titulo", '') || ' '
        || COALESCE("descricao", '')
        )
    ) STORED;

UPDATE variavel
SET  criado_em = COALESCE(
    (select i.criado_em
    from indicador i
    join mv_variavel_pdm mv on mv.indicador_id = i.id
    where mv.variavel_id = variavel.id
    limit 1 --, nao é necessário limitar ainda (pdm), mas é bom para garantir que só vai pegar da crash em prod
    ),
 criado_em);

-- AddForeignKey
ALTER TABLE "variavel" ADD CONSTRAINT "variavel_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel" ADD CONSTRAINT "variavel_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

