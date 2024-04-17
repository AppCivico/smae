CREATE OR REPLACE FUNCTION atualiza_transferencia_status_consolidado(pTransferenciaId int)
    RETURNS varchar
    AS $$
DECLARE

v_situacao int;
v_orgaos_envolvidos int[];
v_data date;
v_data_origem varchar;


v_esfera varchar;
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
        esfera
    INTO
        v_id,
        data
        v_esfera
    FROM transferencia
    WHERE id = pTransferenciaId
    AND removido_em is null;

    if (v_id is null) then
        return 'removido';
    end if;


    --
    situacao := case when v_esfera = 'Estadual' then 'Situação 0' ELSE 'Situação 4' end;
    v_data_origem:='Dia corrente';
    orgaos_envolvidos := [];

    if (v_data is not null) then
        situacao := case when v_esfera = 'Estadual' then 'Situação 2' ELSE 'Situação 3' end;
        v_data_origem:='xis pê tê ó';
    end if;

    v_data := coalesce(v_data, CURRENT_DATE);

    insert into meta_status_consolidado_cf (
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


select atualiza_transferencia_status_consolidado(id) from transferencia;
