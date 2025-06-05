CREATE OR REPLACE FUNCTION atualiza_transferencia_status_consolidado(pTransferenciaId int)
    RETURNS varchar
    AS $$
DECLARE

v_debug varchar;

BEGIN
    PERFORM pg_advisory_xact_lock(pTransferenciaId * 10000);

    v_debug := '';

    if (pTransferenciaId is null) then
        RETURN 'transferencia_id is required!';
    end if;

    --
    delete from transferencia_status_consolidado where transferencia_id = pTransferenciaId;

    -- raise notice 'pTransferenciaId: %', pTransferenciaId;

    INSERT INTO transferencia_status_consolidado (
        transferencia_id,
        situacao,
        orgaos_envolvidos,
        "data",
        data_origem,
        atualizado_em
    )
    SELECT
        t.id,
        tf.tarefa,
        case when tf.orgao_id is null then '{}'::int[] ELSE ARRAY[tf.orgao_id] END,
        tf.termino_planejado,
        'Cronograma',
        now()
    FROM
        transferencia t
        JOIN tarefa_cronograma tc ON tc.transferencia_id = t.id
        JOIN tarefa tf ON tf.tarefa_cronograma_id = tc.id
    WHERE
        t.removido_em IS NULL
        AND tf.n_filhos_imediatos = 0
        AND tc.removido_em IS NULL
        AND tf.removido_em IS NULL
        AND tf.termino_planejado IS NOT NULL
        AND (tf.termino_real IS NULL
            AND (tf.percentual_concluido IS NULL
                OR tf.percentual_concluido != 100))
        AND t.id = pTransferenciaId
    ORDER BY
        tf.termino_planejado;

    --
    RETURN v_debug;
END
$$
LANGUAGE plpgsql;

SELECT atualiza_transferencia_status_consolidado(id)
FROM transferencia
WHERE removido_em IS NULL;
