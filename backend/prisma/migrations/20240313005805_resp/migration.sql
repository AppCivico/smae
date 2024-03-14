/*
 Warnings:

 - A unique constraint covering the columns `[pessoa_id,atividade_id,coordenador_responsavel_cp]` on the table `atividade_responsavel` will be added. If there are existing duplicate values, this will fail.
 - A unique constraint covering the columns `[pessoa_id,iniciativa_id,coordenador_responsavel_cp]` on the table `iniciativa_responsavel` will be added. If there are existing duplicate values, this will fail.
 - A unique constraint covering the columns `[pessoa_id,meta_id,coordenador_responsavel_cp]` on the table `meta_responsavel` will be added. If there are existing duplicate values, this will fail.
 */
DELETE FROM "atividade_responsavel"
WHERE (pessoa_id, atividade_id, coordenador_responsavel_cp, id)
    NOT IN (
        SELECT
            pessoa_id,
            atividade_id,
            coordenador_responsavel_cp,
            max(id) AS max_id
        FROM
            "atividade_responsavel"
        GROUP BY
            1,
            2,
            3);

DELETE FROM "iniciativa_responsavel"
WHERE (pessoa_id, iniciativa_id, coordenador_responsavel_cp, id)
    NOT IN (
        SELECT
            pessoa_id,
            iniciativa_id,
            coordenador_responsavel_cp,
            max(id) AS max_id
        FROM
            "iniciativa_responsavel"
        GROUP BY
            1,
            2,
            3);

DELETE FROM "meta_responsavel"
WHERE (pessoa_id, meta_id, coordenador_responsavel_cp, id)
    NOT IN (
        SELECT
            pessoa_id,
            meta_id,
            coordenador_responsavel_cp,
            max(id) AS max_id
        FROM
            "meta_responsavel"
        GROUP BY
            1,
            2,
            3);

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
CREATE UNIQUE INDEX "atividade_responsavel_pessoa_id_atividade_id_coordenador_re_key" ON "atividade_responsavel"("pessoa_id", "atividade_id", "coordenador_responsavel_cp");

-- CreateIndex
CREATE UNIQUE INDEX "iniciativa_responsavel_pessoa_id_iniciativa_id_coordenador__key" ON "iniciativa_responsavel"("pessoa_id", "iniciativa_id", "coordenador_responsavel_cp");

-- CreateIndex
CREATE UNIQUE INDEX "meta_responsavel_pessoa_id_meta_id_coordenador_responsavel__key" ON "meta_responsavel"("pessoa_id", "meta_id", "coordenador_responsavel_cp");

