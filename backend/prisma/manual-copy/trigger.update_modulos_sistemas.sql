
CREATE OR REPLACE FUNCTION update_modulos_sistemas()
RETURNS TRIGGER AS $$
DECLARE
    new_modulos_sistemas_array "ModuloSistema"[];
BEGIN
    SELECT ARRAY_AGG(DISTINCT ms ORDER BY ms)
    INTO new_modulos_sistemas_array
    FROM (
        SELECT unnest(pm.modulo_sistema) AS ms
        FROM Privilegio p
        JOIN Privilegio_Modulo pm ON p.modulo_id = pm.id
        WHERE p.id IN (SELECT privilegio_id FROM Perfil_Privilegio WHERE perfil_acesso_id = NEW.perfil_acesso_id)
    ) sub;

    UPDATE Perfil_Acesso pa
    SET modulos_sistemas = new_modulos_sistemas_array
    WHERE pa.id = NEW.perfil_acesso_id
    AND pa.modulos_sistemas IS DISTINCT FROM new_modulos_sistemas_array;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

/* removido
CREATE OR REPLACE FUNCTION update_modulos_sistemas_priv_updated()
RETURNS TRIGGER AS $$
BEGIN
    WITH updated_modulos AS (
        SELECT
            pp.perfil_acesso_id,
            ARRAY_AGG(DISTINCT ms ORDER BY ms) AS new_modulos_sistemas_array
        FROM Perfil_Privilegio pp
        JOIN Privilegio p ON p.id = pp.privilegio_id
        JOIN Privilegio_Modulo pm ON pm.id = p.modulo_id
        CROSS JOIN LATERAL unnest(pm.modulo_sistema) AS ms
        WHERE pp.privilegio_id = NEW.id
        GROUP BY pp.perfil_acesso_id
    )
    UPDATE Perfil_Acesso pa
    SET modulos_sistemas = um.new_modulos_sistemas_array
    FROM updated_modulos um
    WHERE pa.id = um.perfil_acesso_id
    AND pa.modulos_sistemas IS DISTINCT FROM um.new_modulos_sistemas_array;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;*/


CREATE OR REPLACE FUNCTION f_update_modulos_sistemas()
    RETURNS varchar
    AS $$

BEGIN
    WITH updated_modulos AS (
        SELECT
            pp.perfil_acesso_id,
            ARRAY_AGG(DISTINCT ms ORDER BY ms) AS new_modulos_sistemas_array
        FROM Perfil_Privilegio pp
        JOIN Privilegio p ON p.id = pp.privilegio_id
        JOIN Privilegio_Modulo pm ON pm.id = p.modulo_id
        CROSS JOIN LATERAL unnest(pm.modulo_sistema) AS ms
        GROUP BY pp.perfil_acesso_id
    )
    UPDATE Perfil_Acesso pa
    SET modulos_sistemas = um.new_modulos_sistemas_array
    FROM updated_modulos um
    WHERE pa.id = um.perfil_acesso_id
    AND pa.modulos_sistemas IS DISTINCT FROM um.new_modulos_sistemas_array;

    --
    RETURN '';
END
$$
LANGUAGE plpgsql;

DO
$$BEGIN
CREATE TRIGGER perfil_privilegio_trigger
AFTER INSERT OR UPDATE
ON Perfil_Privilegio
FOR EACH ROW
EXECUTE FUNCTION update_modulos_sistemas();

CREATE TRIGGER privilegio_trigger_update
AFTER UPDATE
ON privilegio
FOR EACH ROW
WHEN (
    (OLD.modulo_id IS DISTINCT FROM NEW.modulo_id)
)
EXECUTE FUNCTION update_modulos_sistemas_priv_updated();
EXCEPTION
   WHEN duplicate_object THEN
      NULL;
END;$$;

drop trigger if exists privilegio_trigger_update on privilegio;
drop FUNCTION if exists update_modulos_sistemas_priv_updated();
