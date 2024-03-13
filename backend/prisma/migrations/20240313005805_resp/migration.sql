/*
 Warnings:

 - A unique constraint covering the columns `[pessoa_id,atividade_id]` on the table `atividade_responsavel` will be added. If there are existing duplicate values, this will fail.
 - A unique constraint covering the columns `[pessoa_id,iniciativa_id]` on the table `iniciativa_responsavel` will be added. If there are existing duplicate values, this will fail.
 - A unique constraint covering the columns `[pessoa_id,meta_id]` on the table `meta_responsavel` will be added. If there are existing duplicate values, this will fail.
 - A unique constraint covering the columns `[pessoa_id,variavel_id]` on the table `variavel_responsavel` will be added. If there are existing duplicate values, this will fail.
 */
DELETE FROM "atividade_responsavel"
WHERE (pessoa_id, atividade_id, id)
    NOT IN (
        SELECT
            pessoa_id,
            atividade_id,
            max(id) AS max_id
        FROM
            "atividade_responsavel"
        GROUP BY
            pessoa_id,
            atividade_id);

DELETE FROM "iniciativa_responsavel"
WHERE (pessoa_id, iniciativa_id, id)
    NOT IN (
        SELECT
            pessoa_id,
            iniciativa_id,
            max(id) AS max_id
        FROM
            "iniciativa_responsavel"
        GROUP BY
            pessoa_id,
            iniciativa_id);

DELETE FROM "meta_responsavel"
WHERE (pessoa_id, meta_id, id)
    NOT IN (
        SELECT
            pessoa_id,
            meta_id,
            max(id) AS max_id
        FROM
            "meta_responsavel"
        GROUP BY
            pessoa_id,
            meta_id);

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

-- CreateIndex
CREATE UNIQUE INDEX "atividade_responsavel_pessoa_id_atividade_id_key" ON "atividade_responsavel"("pessoa_id", "atividade_id");

-- CreateIndex
CREATE UNIQUE INDEX "iniciativa_responsavel_pessoa_id_iniciativa_id_key" ON "iniciativa_responsavel"("pessoa_id", "iniciativa_id");

-- CreateIndex
CREATE UNIQUE INDEX "meta_responsavel_pessoa_id_meta_id_key" ON "meta_responsavel"("pessoa_id", "meta_id");

-- CreateIndex
CREATE UNIQUE INDEX "variavel_responsavel_pessoa_id_variavel_id_key" ON "variavel_responsavel"("pessoa_id", "variavel_id");

