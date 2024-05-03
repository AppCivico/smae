CREATE OR REPLACE FUNCTION refresh_serie_indicador(pIndicador_id int, pInfo jsonb)
    RETURNS varchar
    AS $$
DECLARE
    current_txid bigint;
BEGIN

    UPDATE indicador
    SET
        recalculando = true,
        recalculo_erro = null,
        recalculo_tempo = null
    WHERE id = pIndicador_id;

    current_txid := txid_current();

    if (pInfo is null) then
        pInfo := '{}'::jsonb;
    end if;

    INSERT INTO task_queue ("type", params)
    VALUES ('refresh_indicador', json_build_object('indicador_id', pIndicador_id, 'current_txid', current_txid)::jsonb || pInfo);

    --
    RETURN '';

END
$$
LANGUAGE plpgsql;

