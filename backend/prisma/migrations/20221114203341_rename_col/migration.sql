-- AlterTable
ALTER TABLE "meta_responsavel" rename COLUMN "coorderandor_responsavel_cp" to "coordenador_responsavel_cp";


CREATE OR REPLACE FUNCTION atualiza_fase_meta_pdm (pPdmId int, pCicloFisicoId int)
    RETURNS varchar
    AS $$
DECLARE
BEGIN
    -- recebe o PDM-id e o ciclo_fisico como parametro pois é
    -- executada pelo mesmo crontab que avança as fases da tabela ciclo_fisico
    -- se precisar executar manualmente, basca buscar os dados do ciclo_fisico ativo
    -- avança os ciclos da meta, exceto se a fase atual da meta já for maior que a fase do ciclo atual (para permitir que os usuários
    -- mova as fases manualmente (desde que dentro do mesmo ciclo_fisico corrente
    UPDATE meta m
    SET
        ciclo_fase_id = novo_ciclo_fase_id,
        ciclo_fisico_id = pCicloFisicoId
    from (
        SELECT
            x.*,
            CASE WHEN data_meta_ciclo_fase_id IS NULL THEN
                cf_cff_id
            WHEN data_meta_ciclo_fase_id <= data_cf_cff_id THEN
                cf_cff_id
            ELSE
                meta_ciclo_fase_id
            END AS novo_ciclo_fase_id
        FROM (
            SELECT
                x.*,
                (SELECT data_inicio FROM ciclo_fisico_fase inn WHERE inn.id = x.cf_cff_id) AS data_cf_cff_id,
                (SELECT data_inicio FROM ciclo_fisico_fase inn WHERE inn.id = x.meta_ciclo_fase_id
                    AND inn.ciclo_fisico_id = x.ciclo_fisico_id -- se a fase for de outro ciclo, vai ser atualizado
                    -- mesmo que seja de uma data mais avançada
                ) AS data_meta_ciclo_fase_id
                FROM (
                    SELECT
                        m.id as meta_id,
                        cf.id as ciclo_fisico_id,
                        (
                            SELECT
                                id
                            FROM
                                ciclo_fisico_fase cff
                            WHERE
                                cff.ciclo_fisico_id = cf.id
                                AND data_inicio <= timezone('America/Sao_Paulo', now()::timestamp with time zone)::date
                            ORDER BY
                                data_inicio DESC
                            LIMIT 1
                            )
                            AS cf_cff_id,
                        ciclo_fase_id AS meta_ciclo_fase_id
                    FROM
                        meta m
                    CROSS JOIN ciclo_fisico cf
                    WHERE
                    m.pdm_id = pPdmId
                    AND cf.id = pCicloFisicoId
                )
            x)
        x) subq
    WHERE m.id = subq.meta_id
    AND (
        (m.ciclo_fase_id is distinct from novo_ciclo_fase_id)
            OR
        (m.ciclo_fisico_id is distinct from pCicloFisicoId)
    );
    --
    RETURN '';
END
$$
LANGUAGE plpgsql;

