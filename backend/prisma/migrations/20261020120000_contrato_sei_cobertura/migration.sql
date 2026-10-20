-- projeto_registro_sei.processo_sei passa a ser só dígitos em todas as linhas (append_sei já grava assim).
UPDATE projeto_registro_sei
SET processo_sei = regexp_replace(processo_sei, '[^0-9]', '', 'g')
WHERE processo_sei ~ '[^0-9]'
  AND regexp_replace(processo_sei, '[^0-9]', '', 'g') <> '';

-- Todo processo de contrato ativo precisa estar cadastrado em alguma obra vinculada: reativa um registro
-- removido de obra vinculada e, se ainda faltar, cria um Manual na obra de origem (ou na vinculada mais antiga).
WITH descoberto AS (
    SELECT DISTINCT cs.contrato_id, regexp_replace(cs.numero_sei, '[^0-9]', '', 'g') AS digitos
    FROM contrato_sei cs
    JOIN contrato c ON c.id = cs.contrato_id AND c.removido_em IS NULL
    WHERE regexp_replace(cs.numero_sei, '[^0-9]', '', 'g') <> ''
      AND NOT EXISTS (
          SELECT 1
          FROM contrato_projeto cp
          JOIN projeto p ON p.id = cp.projeto_id AND p.removido_em IS NULL
          JOIN projeto_registro_sei prs ON prs.projeto_id = cp.projeto_id AND prs.removido_em IS NULL
          WHERE cp.contrato_id = cs.contrato_id
            AND cp.removido_em IS NULL
            AND prs.processo_sei = regexp_replace(cs.numero_sei, '[^0-9]', '', 'g')
      )
)
UPDATE projeto_registro_sei
SET removido_em = NULL, removido_por = NULL, atualizado_em = now(), atualizado_por = NULL
WHERE id IN (
    SELECT max(prs.id)
    FROM descoberto d
    JOIN contrato_projeto cp ON cp.contrato_id = d.contrato_id AND cp.removido_em IS NULL
    JOIN projeto p ON p.id = cp.projeto_id AND p.removido_em IS NULL
    JOIN projeto_registro_sei prs ON prs.projeto_id = cp.projeto_id
        AND prs.removido_em IS NOT NULL
        AND prs.processo_sei = d.digitos
    GROUP BY d.contrato_id, d.digitos
);

WITH descoberto AS (
    SELECT DISTINCT cs.contrato_id, regexp_replace(cs.numero_sei, '[^0-9]', '', 'g') AS digitos
    FROM contrato_sei cs
    JOIN contrato c ON c.id = cs.contrato_id AND c.removido_em IS NULL
    WHERE regexp_replace(cs.numero_sei, '[^0-9]', '', 'g') <> ''
      AND NOT EXISTS (
          SELECT 1
          FROM contrato_projeto cp
          JOIN projeto p ON p.id = cp.projeto_id AND p.removido_em IS NULL
          JOIN projeto_registro_sei prs ON prs.projeto_id = cp.projeto_id AND prs.removido_em IS NULL
          WHERE cp.contrato_id = cs.contrato_id
            AND cp.removido_em IS NULL
            AND prs.processo_sei = regexp_replace(cs.numero_sei, '[^0-9]', '', 'g')
      )
),
destino AS (
    SELECT d.digitos,
           coalesce(
               (SELECT cp.projeto_id
                  FROM contrato_projeto cp
                  JOIN projeto p ON p.id = cp.projeto_id AND p.removido_em IS NULL
                 WHERE cp.contrato_id = d.contrato_id AND cp.removido_em IS NULL
                   AND cp.projeto_id = c.projeto_id_deprecated
                 LIMIT 1),
               (SELECT cp.projeto_id
                  FROM contrato_projeto cp
                  JOIN projeto p ON p.id = cp.projeto_id AND p.removido_em IS NULL
                 WHERE cp.contrato_id = d.contrato_id AND cp.removido_em IS NULL
                 ORDER BY cp.id
                 LIMIT 1)
           ) AS projeto_id
    FROM descoberto d
    JOIN contrato c ON c.id = d.contrato_id
)
INSERT INTO projeto_registro_sei (projeto_id, categoria, processo_sei, criado_em, criado_por)
SELECT DISTINCT projeto_id, 'Manual'::"CategoriaProcessoSei", digitos, now(), NULL::int
FROM destino
WHERE projeto_id IS NOT NULL;
