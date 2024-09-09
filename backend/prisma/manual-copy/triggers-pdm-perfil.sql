
CREATE OR REPLACE FUNCTION check_pdm_perfil_relations() RETURNS TRIGGER AS $$
BEGIN
    -- Verificação para linhas META
    IF (NEW.relacionamento != 'PDM' ) AND NEW.removido_em IS NULL THEN
        IF NOT EXISTS (
            SELECT 1
            FROM pdm_perfil
            WHERE pdm_id = NEW.pdm_id
              AND equipe_id = NEW.equipe_id
              AND tipo = NEW.tipo
              AND removido_em IS NULL
              AND relacionamento = 'PDM'
        ) THEN
            RAISE EXCEPTION '__HTTP__ % __EOF__', jsonb_build_object(
                'message', 'Deve existir uma linha PDM correspondente com o mesmo pdm_id, equipe_id e tipo que não esteja removida.',
                'code', 400
            );
        END IF;
    END IF;

    -- Verificação ao atualizar removido_em para linhas PDM
    IF TG_OP = 'UPDATE' AND OLD.relacionamento = 'PDM' AND OLD.removido_em IS NULL AND NEW.removido_em IS NOT NULL THEN
        IF EXISTS (
            SELECT 1
            FROM pdm_perfil
            WHERE pdm_id = NEW.pdm_id
              AND equipe_id = NEW.equipe_id
              AND tipo = NEW.tipo
              AND removido_em IS NULL
              AND relacionamento != 'PDM'
        ) THEN
            RAISE EXCEPTION '__HTTP__ % __EOF__', jsonb_build_object(
                'message', 'Não é possível remover a linha PDM enquanto existirem linhas META/ETAPA correspondentes.',
                'code', 400
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_pdm_perfil_relations_trigger
BEFORE INSERT OR UPDATE ON pdm_perfil
FOR EACH ROW
EXECUTE FUNCTION check_pdm_perfil_relations();
