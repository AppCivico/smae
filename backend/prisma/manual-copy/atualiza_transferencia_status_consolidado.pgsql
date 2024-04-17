CREATE OR REPLACE FUNCTION atualiza_transferencia_status_consolidado(pTransferenciaId int)
    RETURNS varchar
    AS $$
DECLARE

v_situacao varchar;
v_orgaos_envolvidos int[];
v_data date;
v_data_origem varchar;


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

    SELECT
        id,
        clausula_suspensiva_vencimento,
        cargo::text
    INTO
        v_id,
        v_data
        v_xpto
    FROM transferencia
    WHERE id = pTransferenciaId
    AND removido_em is null;

    if (v_id is null) then
        return 'removido';
    end if;


    --
    v_situacao := case when (v_id % 2)::int = 0 then 'Situação 0' ELSE 'Situação 4' end;
    v_data_origem:='Dia corrente';
    v_orgaos_envolvidos := '{}'::int[];

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


select atualiza_transferencia_status_consolidado(id) from transferencia where removido_em is null;
