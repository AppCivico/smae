TRUNCATE transferencia_status_consolidado;

ALTER TABLE "transferencia_status_consolidado" DROP CONSTRAINT "transferencia_status_consolidado_pkey",
ADD COLUMN     "id" INTEGER NOT NULL,
ADD CONSTRAINT "transferencia_status_consolidado_pkey" PRIMARY KEY ("id");
-- AlterTable
CREATE SEQUENCE transferencia_status_consolidado_id_seq;
ALTER TABLE "transferencia_status_consolidado" ALTER COLUMN "id" SET DEFAULT nextval('transferencia_status_consolidado_id_seq');
ALTER SEQUENCE transferencia_status_consolidado_id_seq OWNED BY "transferencia_status_consolidado"."id";



CREATE OR REPLACE PROCEDURE add_refresh_transferencia_task(p_transferencia_id INTEGER)
AS $$
DECLARE
    current_txid bigint;
BEGIN
    current_txid := txid_current();

    IF NOT EXISTS (
        SELECT 1
        FROM task_queue
        WHERE "type" = 'refresh_transferencia'
        AND status = 'pending'
        AND (params->>'transferencia_id')::INTEGER = p_transferencia_id
        AND (params->>'current_txid')::bigint = current_txid
        AND criado_em = now()
    ) THEN
        INSERT INTO task_queue ("type", params)
        VALUES ('refresh_transferencia', json_build_object('transferencia_id', p_transferencia_id, 'current_txid', current_txid));
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION f_add_refresh_transferencia_task(p_transferencia_id INTEGER)
RETURNS VOID AS
$$
BEGIN
    CALL add_refresh_transferencia_task(p_transferencia_id);
END;
$$
LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION f_tarefa_refresh_transferencia_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_transferencia_id INTEGER;
BEGIN

    select transferencia_id into v_transferencia_id
    from tarefa_cronograma where id = NEW.tarefa_cronograma_id;

    IF (transferencia_id IS NOT NULL) THEN
        CALL add_refresh_transferencia_task(v_transferencia_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_refresh_transferencia_tarefa_insert
AFTER INSERT ON tarefa
FOR EACH ROW
EXECUTE FUNCTION f_tarefa_refresh_transferencia_trigger();

CREATE TRIGGER trg_refresh_transferencia_tarefa_update
AFTER UPDATE ON tarefa
FOR EACH ROW
WHEN (
    (OLD.removido_em IS DISTINCT FROM NEW.removido_em)
    OR
    (OLD.eh_marco IS DISTINCT FROM NEW.eh_marco)
    OR
    (OLD.termino_planejado IS DISTINCT FROM NEW.termino_planejado)
    OR
    (OLD.termino_real IS DISTINCT FROM NEW.termino_real)
    OR
    (OLD.percentual_concluido IS DISTINCT FROM NEW.percentual_concluido)
    OR
    (OLD.n_filhos_imediatos IS DISTINCT FROM NEW.n_filhos_imediatos)
)
EXECUTE FUNCTION f_tarefa_refresh_transferencia_trigger();

CREATE OR REPLACE FUNCTION f_transferencia_refresh_trigger()
RETURNS TRIGGER AS $$
BEGIN
    CALL add_refresh_transferencia_task(NEW.id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_refresh_transferencia_insert
AFTER INSERT ON transferencia
FOR EACH ROW
EXECUTE FUNCTION f_tarefa_refresh_transferencia_trigger();

CREATE TRIGGER trg_refresh_transferencia_update
AFTER UPDATE ON transferencia
FOR EACH ROW
WHEN (
    (OLD.removido_em IS DISTINCT FROM NEW.removido_em)
)
EXECUTE FUNCTION f_tarefa_refresh_transferencia_trigger();

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
        AND tf.eh_marco
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

select atualiza_transferencia_status_consolidado(id) from transferencia where removido_em is null;
