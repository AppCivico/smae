CREATE OR REPLACE FUNCTION refresh_variavel(pVariavelId int, pInfo jsonb)
    RETURNS varchar
    AS $$
DECLARE
    current_txid bigint;
BEGIN
    UPDATE
        variavel
    SET
        recalculando = TRUE,
        recalculo_erro = NULL,
        recalculo_tempo = NULL
    WHERE
        id = pVariavelId;
    current_txid := txid_current();
    IF (pInfo IS NULL) THEN
        pInfo := '{}'::jsonb;
    END IF;
    INSERT INTO task_queue("type", params)
        VALUES ('refresh_variavel', json_build_object('variavel_id', pVariavelId, 'current_txid', current_txid)::jsonb || pInfo);
    --
    RETURN '';
END
$$
LANGUAGE plpgsql;

