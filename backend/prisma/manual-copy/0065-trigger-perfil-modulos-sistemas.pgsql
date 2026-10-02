CREATE OR REPLACE FUNCTION update_modulos_sistemas()
RETURNS TRIGGER AS $$
DECLARE
    vPerfilId int;
    new_modulos_sistemas_array "ModuloSistema"[];
BEGIN
    FOR vPerfilId IN
        SELECT DISTINCT x FROM unnest(ARRAY[
            CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN OLD.perfil_acesso_id END,
            CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN NEW.perfil_acesso_id END
        ]) x WHERE x IS NOT NULL
    LOOP
        SELECT COALESCE(ARRAY_AGG(DISTINCT ms ORDER BY ms), '{}'::"ModuloSistema"[])
        INTO new_modulos_sistemas_array
        FROM (
            SELECT unnest(pm.modulo_sistema) AS ms
            FROM Privilegio p
            JOIN Privilegio_Modulo pm ON p.modulo_id = pm.id
            WHERE p.id IN (SELECT privilegio_id FROM Perfil_Privilegio WHERE perfil_acesso_id = vPerfilId)
        ) sub;

        UPDATE Perfil_Acesso pa
        SET modulos_sistemas = new_modulos_sistemas_array
        WHERE pa.id = vPerfilId
        AND pa.modulos_sistemas IS DISTINCT FROM new_modulos_sistemas_array;
    END LOOP;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS perfil_privilegio_trigger ON perfil_privilegio;
CREATE TRIGGER perfil_privilegio_trigger AFTER INSERT OR UPDATE OR DELETE ON perfil_privilegio
    FOR EACH ROW
    EXECUTE FUNCTION update_modulos_sistemas();
