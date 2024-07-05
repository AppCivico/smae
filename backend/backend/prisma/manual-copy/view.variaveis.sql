CREATE OR REPLACE VIEW view_variavel_global AS
WITH PlanoSetorial AS (
    select
        variavel_id,
        array_agg(distinct pdm_id) as pdm_ids
    from mv_variavel_pdm
    group by 1
),
AssuntoVariavel AS (
    select
        variavel_id,
        array_agg(distinct av.assunto_variavel_id ) AS assunto_ids
    from variavel_assunto_variavel AS av
    group by 1
)
SELECT
  v.id,
  v.titulo,
  v.codigo,
  v.orgao_id,
  v.orgao_proprietario_id,
  coalesce( ps.pdm_ids , '{}'::int[]) as planos,
  v.periodicidade,
  v.inicio_medicao,
  v.fim_medicao,
  v.criado_em,
  av.assunto_ids,
  tipo
FROM variavel AS v
LEFT JOIN PlanoSetorial ps ON v.id = ps.variavel_id
LEFT JOIN AssuntoVariavel av ON v.id = av.variavel_id
WHERE v.removido_em IS NULL;
