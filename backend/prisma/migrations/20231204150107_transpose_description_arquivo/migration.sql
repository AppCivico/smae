-- This is an empty migration.
UPDATE projeto_documento SET
    descricao = a.descricao
FROM (
    SELECT id, descricao FROM arquivo
) AS a
WHERE arquivo_id = a.id;