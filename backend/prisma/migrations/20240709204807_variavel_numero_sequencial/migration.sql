-- AlterTable
ALTER TABLE "variavel" ADD COLUMN     "polaridade" "Polaridade" NOT NULL DEFAULT 'Neutra';

-- CreateTable
CREATE TABLE "variavel_numero_sequencial" (
    "id" SERIAL NOT NULL,
    "ano_referencia" INTEGER NOT NULL,
    "sequencial" INTEGER NOT NULL,

    CONSTRAINT "variavel_numero_sequencial_pkey" PRIMARY KEY ("id")
);

UPDATE variavel
SET polaridade = COALESCE(
    (select i.polaridade
    from indicador i
    join mv_variavel_pdm mv on mv.indicador_id = i.id
    where mv.variavel_id = variavel.id
    limit 1 --, nao é necessário limitar ainda (pdm), mas é bom para garantir que só vai pegar da crash em prod
    ),
 polaridade);

-- CreateIndex
CREATE UNIQUE INDEX "variavel_numero_sequencial_ano_referencia_key" ON "variavel_numero_sequencial"("ano_referencia");
CREATE OR REPLACE FUNCTION f_regiao_pai_por_filhos_por_nivel(input_ids INT[], max_level INT)
RETURNS TABLE (
    nivel INT,
    parent INT,
    id INT,
    output_ids INT[],
    pdm_codigo_sufixo TEXT
)
AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE RegionHierarchy AS (
        SELECT
            me.id,
            me.parente_id,
            me.nivel,
            me.id AS root_id
        FROM
            regiao me
        WHERE
            me.id = ANY(input_ids)
        UNION ALL
        SELECT
            r.id,
            r.parente_id,
            r.nivel,
            h.root_id
        FROM
            regiao r
        INNER JOIN
            RegionHierarchy h ON r.id = h.parente_id
    ),
    first_pass AS (
        SELECT
            a.nivel,
            a.parente_id AS parent,
            a.id,
            array_agg(DISTINCT a.id) AS regions
        FROM
            RegionHierarchy a
        JOIN
            regiao b ON b.id = a.id
        WHERE
            a.nivel < max_level
        GROUP BY
            1, 2, 3
        ORDER BY
            1, 2
    ),
    initial_ids AS (
        SELECT me.id, me.parente_id, me.nivel
        FROM regiao me
        WHERE me.id = ANY(input_ids)
    ),
    second_pass AS (
        SELECT
            fp.nivel,
            fp.parent,
            fp.id,
            CASE
                WHEN fp.parent IS NULL THEN array_agg(DISTINCT i.id)
                ELSE array_agg(DISTINCT i.id) FILTER (WHERE i.id IS NOT NULL)
            END AS output_ids
        FROM
            first_pass fp
        LEFT JOIN
            initial_ids i ON fp.id = i.parente_id OR fp.parent IS NULL
        GROUP BY
            fp.nivel, fp.parent, fp.id
        ORDER BY
            fp.nivel, fp.parent
    )
    SELECT
        sp.nivel,
        sp.parent,
        sp.id,
        sp.output_ids,
        coalesce(
            r.pdm_codigo_sufixo,
            'Codigo=' || r.codigo,
            'Regiao_ID=' || r.id
        ) AS pdm_codigo_sufixo
    FROM second_pass sp
    JOIN regiao r on sp.id = r.id;
END;
$$ LANGUAGE plpgsql;
