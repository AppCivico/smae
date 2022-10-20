CREATE OR REPLACE FUNCTION monta_ciclos_pdm (pPdmId int, pApagarCiclo boolean)
    RETURNS varchar
    AS $$
DECLARE
    vCount int;
BEGIN
    --
    IF (pApagarCiclo) THEN
        DELETE FROM ciclo_fisico_fase
        WHERE id IN (
                SELECT
                    fase.id
                FROM
                    ciclo_fisico_fase fase
                    JOIN ciclo_fisico cf ON cf.id = fase.ciclo_fisico_id
                WHERE
                    pdm_id = pPdmId);
        DELETE FROM ciclo_fisico
        WHERE pdm_id = pPdmId;
    END IF;
    --
    SELECT
        count(1) INTO vCount
    FROM
        ciclo_fisico
    WHERE
        pdm_id = pPdmId;
    --
    IF (vCount > 0) THEN
        RETURN 'os ciclos já foram iniciados no PDM';
    END IF;
    --

    --
    RETURN '';
END
$$
LANGUAGE plpgsql;

