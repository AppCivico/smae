CREATE OR REPLACE VIEW view_parlamentares_mandatos_part_atual AS
SELECT
    coalesce(p.id::text, '') || 'pm' || coalesce(pm.id::text, '') || 'e' || coalesce(e.id::text, '') AS virtual_id,
    p.id,
    p.nome AS nome_civil,
    p.nome_popular AS nome_parlamentar,
    pa.sigla AS partido_sigla,
    pm.cargo,
    pm.uf,
    CASE WHEN pm.suplencia IS NOT NULL THEN
        'S'
    ELSE
        'T'
    END AS titular_suplente,
    pm.endereco,
    pm.gabinete,
    pm.telefone,
    EXTRACT(DAY FROM p.nascimento) AS dia_aniversario,
    EXTRACT(MONTH FROM p.nascimento) AS mes_aniversario,
    pm.email,
    e.ano AS ano_eleicao,
    e.id AS eleicao_id,
    pm.partido_atual_id AS partido_atual_id
FROM
    parlamentar p
    JOIN parlamentar_mandato pm ON p.id = pm.parlamentar_id
    JOIN partido pa ON pm.partido_atual_id = pa.id
    LEFT JOIN eleicao e ON pm.eleicao_id = e.id
WHERE
    p.removido_em IS NULL
    AND pm.removido_em IS NULL;

