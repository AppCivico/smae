CREATE OR REPLACE VIEW view_meta_pessoa_responsavel AS
SELECT
    mr.*
FROM
    meta_responsavel mr
    JOIN meta_orgao mo ON mo.orgao_id = mr.orgao_id
        AND mr.meta_id = mo.meta_id
WHERE
    mo.responsavel;

CREATE OR REPLACE VIEW view_meta_pessoa_responsavel_na_cp AS
SELECT
    mr.*
FROM
    meta_responsavel mr
    JOIN meta_orgao mo ON mo.orgao_id = mr.orgao_id
        AND mr.meta_id = mo.meta_id
WHERE
    mr.coordenador_responsavel_cp;

