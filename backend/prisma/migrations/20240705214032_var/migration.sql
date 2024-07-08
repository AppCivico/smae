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

CREATE OR REPLACE VIEW view_variavel_global AS
WITH PlanoSetorial AS (
    SELECT
        variavel_id,
        array_agg(DISTINCT pdm_id) AS pdm_ids
    FROM
        mv_variavel_pdm
    GROUP BY
        1
),
AssuntoVariavel AS (
    SELECT
        variavel_id,
        array_agg(DISTINCT av.assunto_variavel_id) AS assunto_ids
    FROM
        variavel_assunto_variavel AS av
    GROUP BY
        1
)
SELECT
    v.id,
    v.titulo,
    v.codigo,
    v.orgao_id,
    v.orgao_proprietario_id,
    coalesce(ps.pdm_ids, '{}'::int[]) AS planos,
    v.periodicidade,
    v.inicio_medicao,
    v.fim_medicao,
    v.criado_em,
    coalesce(av.assunto_ids, '{}'::int[]) AS assunto_ids,
    tipo,
    fonte.id AS fonte_id,
    fonte.nome AS fonte_nome
FROM
    variavel AS v
    LEFT JOIN PlanoSetorial ps ON v.id = ps.variavel_id
    LEFT JOIN AssuntoVariavel av ON v.id = av.variavel_id
    LEFT JOIN fonte_variavel fonte ON v.fonte_id = fonte.id
WHERE
    v.removido_em IS NULL;

