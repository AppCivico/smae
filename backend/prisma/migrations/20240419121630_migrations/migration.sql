
CREATE OR REPLACE VIEW view_atividade_pessoa_responsavel AS
SELECT
    a.id,
    mr.meta_id,
    mr.pessoa_id,
    mr.orgao_id,
    i.id as iniciativa_id,
    a.id as atividade_id
FROM
    meta_responsavel mr
    JOIN meta_orgao mo ON mo.orgao_id = mr.orgao_id
        AND mr.meta_id = mo.meta_id
    JOIN iniciativa i ON i.meta_id = mr.meta_id
    JOIN atividade a ON a.iniciativa_id = i.id
    JOIN atividade_responsavel ar ON ar.atividade_id = a.id AND ar.pessoa_id = mr.pessoa_id
    JOIN atividade_orgao ao ON ao.atividade_id = a.id AND ao.orgao_id = mr.orgao_id

WHERE
    mo.responsavel
    AND ao.responsavel
AND a.removido_em is null
;

CREATE OR REPLACE VIEW view_iniciativa_pessoa_responsavel AS
SELECT
    i.id,
    mr.meta_id,
    mr.pessoa_id,
    mr.orgao_id,
    i.id as iniciativa_id
FROM
    meta_responsavel mr
    JOIN meta_orgao mo ON mo.orgao_id = mr.orgao_id
        AND mr.meta_id = mo.meta_id
    JOIN iniciativa i ON i.meta_id = mr.meta_id
    JOIN iniciativa_responsavel ir ON ir.iniciativa_id = i.id AND ir.pessoa_id = mr.pessoa_id
    JOIN iniciativa_orgao io ON io.iniciativa_id = i.id AND io.orgao_id = mr.orgao_id

WHERE
    mo.responsavel
    AND io.responsavel
AND i.removido_em is null
;
