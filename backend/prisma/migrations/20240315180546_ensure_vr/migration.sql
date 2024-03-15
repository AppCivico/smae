
DELETE FROM "variavel_responsavel"
WHERE (pessoa_id, variavel_id, id)
    NOT IN (
        SELECT
            pessoa_id,
            variavel_id,
            max(id) AS max_id
        FROM
            "variavel_responsavel"
        GROUP BY
            pessoa_id,
            variavel_id);

CREATE UNIQUE INDEX "variavel_responsavel_pessoa_id_variavel_id_key" ON "variavel_responsavel"("pessoa_id", "variavel_id");
