CREATE OR REPLACE FUNCTION atualiza_transferencia_status_consolidado(pTransferenciaId int)
    RETURNS varchar
    AS $$
DECLARE

v_situacao varchar;
v_orgaos_envolvidos int[];
v_data date;
v_data_origem varchar;

v_orgao_concedente_id int;
v_secretaria_concedente_id int;
v_xpto varchar;
v_id int;

v_debug varchar;

BEGIN
    PERFORM pg_advisory_xact_lock(pTransferenciaId * 10000);

    v_debug := '';

    if (pTransferenciaId is null) then
        RETURN 'transferencia_id is required!';
    end if;


    --
    delete from transferencia_status_consolidado where transferencia_id = pTransferenciaId;

    raise notice 'pTransferenciaId: %', pTransferenciaId;
    SELECT
        id,
        clausula_suspensiva_vencimento,
        orgao_concedente_id,
        secretaria_concedente_id
    INTO
        v_id,
        v_data,
        v_orgao_concedente_id,
        v_secretaria_concedente_id
    FROM transferencia
    WHERE id = pTransferenciaId
    AND removido_em is null;

    raise notice 'v_id: %', v_id;
    raise notice 'v_data: %', v_data;
    raise notice 'v_xpto: %', v_xpto;
    raise notice 'v_orgao_concedente_id: %',v_orgao_concedente_id;

    if (v_id is null) then
        return 'removido';
    end if;

    --
    v_situacao := case when (v_id % 2)::int = 0 then 'Situação 0' ELSE 'Situação 4' end;
    v_data_origem:='Dia corrente';
    v_orgaos_envolvidos := ARRAY[ v_orgao_concedente_id ]::int[];
    -- append v_secretaria_concedente_id v_orgaos_envolvidos if not null
    IF v_secretaria_concedente_id IS NOT NULL THEN
        v_orgaos_envolvidos := v_orgaos_envolvidos || ARRAY[v_secretaria_concedente_id]::int[];
    END IF;
    raise notice 'v_orgao_concedente_id: %', v_orgao_concedente_id;
    raise notice 'v_xpto: %', v_xpto;

    if (v_data is not null) then
        v_situacao := case when v_xpto = 'Vereador' then 'Situação 2' ELSE 'Situação 3' end;
        v_data_origem:='xis pê tê ó';
    end if;

    v_data := coalesce(v_data, CURRENT_DATE);

    insert into transferencia_status_consolidado (
        transferencia_id,
        situacao,
        orgaos_envolvidos,
        "data",
        data_origem,
        atualizado_em

    ) values (
        pTransferenciaId,
        v_situacao,
        v_orgaos_envolvidos,
        v_data,
        v_data_origem,

        now()
    );
    --
    RETURN v_debug;
END
$$
LANGUAGE plpgsql;


select atualiza_transferencia_status_consolidado(id) from transferencia where removido_em is null and id=65;
