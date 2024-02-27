CREATE OR REPLACE FUNCTION update_modulos_sistemas()
RETURNS TRIGGER AS $$
DECLARE
    new_modulos_sistemas_array "ModuloSistema"[];
BEGIN
    SELECT ARRAY_AGG(DISTINCT pm.modulo_sistema ORDER BY pm.modulo_sistema)
    INTO new_modulos_sistemas_array
    FROM Privilegio p
    JOIN Privilegio_Modulo pm ON p.modulo_id = pm.id
    WHERE p.id IN (SELECT privilegio_id FROM Perfil_Privilegio WHERE perfil_acesso_id = NEW.perfil_acesso_id);

    UPDATE Perfil_Acesso pa
    SET modulos_sistemas = new_modulos_sistemas_array
    WHERE pa.id = NEW.perfil_acesso_id
    AND pa.modulos_sistemas IS DISTINCT FROM new_modulos_sistemas_array;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER perfil_privilegio_trigger
AFTER INSERT OR UPDATE
ON Perfil_Privilegio
FOR EACH ROW
EXECUTE FUNCTION update_modulos_sistemas();
