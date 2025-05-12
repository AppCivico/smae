drop view if exists view_parlamentares_mandatos_part_atual;
CREATE OR REPLACE VIEW view_parlamentares_mandatos_part_atual AS
SELECT ((((COALESCE((p.id)::text, ''::text) || 'pm'::text) || COALESCE((pm.id)::text, ''::text)) || 'e'::text) || COALESCE((e.id)::text, ''::text)) AS virtual_id,
    p.id,
    p.nome AS nome_civil,
    p.nome_popular AS nome_parlamentar,
    pa.sigla AS partido_sigla,
    pm.cargo,
    pm.uf,
        CASE
            WHEN (pm.suplencia IS NOT NULL) THEN 'S'::text
            ELSE 'T'::text
        END AS titular_suplente,
    pm.endereco,
    pm.gabinete,
    pm.telefone,
    (EXTRACT(day FROM p.nascimento))::double precision AS dia_aniversario,
    (EXTRACT(month FROM p.nascimento))::double precision AS mes_aniversario,
    pm.email,
    --novo campo
    REGEXP_REPLACE(pm.atuacao, '<\/?p>', ' ', 'g') AS zona_atuacao,
    e.ano AS ano_eleicao,
    e.id AS eleicao_id,
    pm.partido_atual_id
   FROM (((parlamentar p
     JOIN parlamentar_mandato pm ON ((p.id = pm.parlamentar_id)))
     JOIN partido pa ON ((pm.partido_atual_id = pa.id)))
     LEFT JOIN eleicao e ON ((pm.eleicao_id = e.id)))
  WHERE ((p.removido_em IS NULL) AND (pm.removido_em IS NULL));
