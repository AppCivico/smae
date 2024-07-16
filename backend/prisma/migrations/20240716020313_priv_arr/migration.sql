
ALTER TABLE "privilegio_modulo" DROP COLUMN "modulo_sistema";

ALTER TABLE "privilegio_modulo" ADD COLUMN "modulo_sistema" "ModuloSistema"[] DEFAULT ARRAY['SMAE']::"ModuloSistema"[];

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
$$ LANGUAGE plpgsql;

-- update again, just in case
CREATE OR REPLACE FUNCTION f_transferencia_update_tsvector() RETURNS TRIGGER AS $$
BEGIN
    new.vetores_busca = (
        SELECT
            to_tsvector(
                'simple',
                COALESCE(CAST(NEW.esfera AS TEXT), '') || ' ' ||
                COALESCE(CAST(NEW.interface AS TEXT), '') || ' ' ||
                COALESCE(CAST(NEW.ano AS TEXT), '') || ' ' ||
                COALESCE(NEW.gestor_contrato, ' ') || ' ' ||
                COALESCE(NEW.secretaria_concedente_str, ' ') || ' ' ||
                COALESCE(NEW.emenda, ' ') || ' ' ||
                COALESCE(NEW.nome_programa, ' ') || ' ' ||
                COALESCE(NEW.objeto, ' ') || ' ' ||
                COALESCE(tt.nome, '') || ' ' ||
                COALESCE(p.sigla, ' ') || ' ' ||
                COALESCE(p.nome, ' ')  || ' ' ||
                COALESCE(o1.sigla, '') || '' ||
                COALESCE(o1.descricao, '') || '' ||
                COALESCE(o2.sigla, '') || '' ||
                COALESCE(o2.descricao, '')
            )
        FROM (SELECT new.partido_id, new.orgao_concedente_id, new.secretaria_concedente_id, new.tipo_id ) t
        JOIN transferencia_tipo tt ON tt.id = t.tipo_id
        LEFT JOIN partido p ON p.id = t.partido_id
        LEFT JOIN orgao o1 ON o1.id = t.orgao_concedente_id
        LEFT JOIN orgao o2 ON o2.id = t.secretaria_concedente_id
    );

    RETURN NEW;
END
$$ LANGUAGE 'plpgsql';
update  transferencia set vetores_busca='';
update  transferencia set id=id;
