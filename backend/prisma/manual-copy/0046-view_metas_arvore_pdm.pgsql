CREATE OR REPLACE VIEW view_metas_arvore_pdm AS
SELECT m.id AS id,
       'meta' AS tipo,
       m.id AS meta_id,
       NULL::integer AS iniciativa_id,
       NULL::integer AS atividade_id,
       m.pdm_id
  FROM meta m
 WHERE m.removido_em IS NULL
UNION ALL
SELECT i.id AS id,
       'iniciativa' AS tipo,
       i.meta_id AS meta_id,
       i.id AS iniciativa_id,
       NULL::integer AS atividade_id,
       m.pdm_id
  FROM iniciativa i
  JOIN meta m ON m.id = i.meta_id
 WHERE i.removido_em IS NULL
   AND m.removido_em IS NULL
UNION ALL
SELECT a.id AS id,
       'atividade' AS tipo,
       i.meta_id AS meta_id,
       a.iniciativa_id AS iniciativa_id,
       a.id AS atividade_id,
       m.pdm_id
  FROM atividade a
  JOIN iniciativa i ON i.id = a.iniciativa_id
  JOIN meta m ON m.id = i.meta_id
 WHERE a.removido_em IS NULL
   AND i.removido_em IS NULL
   AND m.removido_em IS NULL;

