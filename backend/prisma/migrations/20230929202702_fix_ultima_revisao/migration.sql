-- AlterTable
ALTER TABLE "meta_orcamento"
    ADD COLUMN "ultima_revisao" BOOLEAN NOT NULL DEFAULT FALSE;

--
UPDATE
    "meta_orcamento"
SET
    "ultima_revisao" = TRUE
FROM (
    SELECT
        MAX(id) AS id
    FROM
        "meta_orcamento"
    WHERE
        "projeto_id" IS NOT NULL
        AND "removido_em" IS NULL
    GROUP BY
        "ano_referencia",
        "parte_dotacao",
        "projeto_id") AS max_records
WHERE
    "meta_orcamento"."id" = max_records.id;

--
UPDATE
    "meta_orcamento"
SET
    "ultima_revisao" = TRUE
FROM (
    SELECT
        MAX(id) AS id,
        meta_id,
        atividade_id,
        iniciativa_id
    FROM
        "meta_orcamento"
    WHERE
        "projeto_id" IS NULL
        AND "removido_em" IS NULL
    GROUP BY
        "ano_referencia",
        "parte_dotacao",
        meta_id,
        atividade_id,
        iniciativa_id) AS max_records
WHERE
    "meta_orcamento"."id" = max_records.id;

