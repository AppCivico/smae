CREATE OR REPLACE FUNCTION check_pdm_perfil_relations() RETURNS TRIGGER AS $$
BEGIN
    -- Inserção e atualização (exceto remoção)
    IF ( (TG_OP = 'INSERT' AND NEW.removido_em IS NULL) OR (TG_OP = 'UPDATE' AND NEW.removido_em IS NULL)) THEN
        -- Verificação para linhas META
        IF NEW.relacionamento = 'META'  THEN
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
                    'code', 400,
                    'pdm_id', NEW.pdm_id,
                    'equipe_id', NEW.equipe_id,
                    'tipo', NEW.tipo
                );
            END IF;
        END IF;

        -- Verificação para linhas INICIATIVA
        IF NEW.relacionamento = 'INICIATIVA' THEN
            IF NOT EXISTS (
                SELECT 1
                FROM pdm_perfil
                WHERE pdm_id = NEW.pdm_id
                  AND equipe_id = NEW.equipe_id
                  AND tipo = NEW.tipo
                  AND removido_em IS NULL
                  AND relacionamento = 'META'
            ) THEN
                RAISE EXCEPTION '__HTTP__ % __EOF__', jsonb_build_object(
                    'message', 'Deve existir uma linha META correspondente com o mesmo pdm_id, equipe_id e tipo que não esteja removida.',
                    'code', 400,
                    'pdm_id', NEW.pdm_id,
                    'equipe_id', NEW.equipe_id,
                    'tipo', NEW.tipo
                );
            END IF;
        END IF;

        -- Verificação para linhas ATIVIDADE
        IF NEW.relacionamento = 'ATIVIDADE' THEN
            IF NOT EXISTS (
                SELECT 1
                FROM pdm_perfil
                WHERE pdm_id = NEW.pdm_id
                  AND equipe_id = NEW.equipe_id
                  AND tipo = NEW.tipo
                  AND removido_em IS NULL
                  AND relacionamento = 'INICIATIVA'
            ) THEN
                RAISE EXCEPTION '__HTTP__ % __EOF__', jsonb_build_object(
                    'message', 'Deve existir uma linha INICIATIVA correspondente com o mesmo pdm_id, equipe_id e tipo que não esteja removida.',
                    'code', 400,
                    'pdm_id', NEW.pdm_id,
                    'equipe_id', NEW.equipe_id,
                    'tipo', NEW.tipo
                );
            END IF;
        END IF;
    END IF;

    -- Verificação ao atualizar removido_em (soft delete)
    IF TG_OP = 'UPDATE' AND OLD.removido_em IS NULL AND NEW.removido_em IS NOT NULL THEN
        -- Verificação para remoção de PDM
        IF OLD.relacionamento = 'PDM' THEN
            IF EXISTS (
                SELECT 1
                FROM pdm_perfil
                WHERE pdm_id = NEW.pdm_id
                  AND equipe_id = NEW.equipe_id
                  AND tipo = NEW.tipo
                  AND removido_em IS NULL
                  AND relacionamento IN ('META', 'ETAPA', 'INICIATIVA', 'ATIVIDADE')
            ) THEN
                RAISE EXCEPTION '__HTTP__ % __EOF__', jsonb_build_object(
                    'message', 'Não é possível remover a linha PDM enquanto existirem linhas META/ETAPA/INICIATIVA/ATIVIDADE correspondentes.',
                    'code', 400
                );
            END IF;
        -- Verificação para remoção de META
        ELSIF OLD.relacionamento = 'META' THEN
            IF EXISTS (
                SELECT 1
                FROM pdm_perfil
                WHERE pdm_id = NEW.pdm_id
                  AND equipe_id = NEW.equipe_id
                  AND tipo = NEW.tipo
                  AND removido_em IS NULL
                  AND relacionamento IN ('INICIATIVA', 'ATIVIDADE')
            ) THEN
                RAISE EXCEPTION '__HTTP__ % __EOF__', jsonb_build_object(
                    'message', 'Não é possível remover a linha META enquanto existirem linhas INICIATIVA/ATIVIDADE correspondentes.',
                    'code', 400
                );
            END IF;
        -- Verificação para remoção de INICIATIVA
        ELSIF OLD.relacionamento = 'INICIATIVA' THEN
            IF EXISTS (
                SELECT 1
                FROM pdm_perfil
                WHERE pdm_id = NEW.pdm_id
                  AND equipe_id = NEW.equipe_id
                  AND tipo = NEW.tipo
                  AND removido_em IS NULL
                  AND relacionamento = 'ATIVIDADE'
            ) THEN
                RAISE EXCEPTION '__HTTP__ % __EOF__', jsonb_build_object(
                    'message', 'Não é possível remover a linha INICIATIVA enquanto existirem linhas ATIVIDADE correspondentes.',
                    'code', 400
                );
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--CREATE TRIGGER check_pdm_perfil_relations_trigger
--BEFORE INSERT OR UPDATE ON pdm_perfil
--FOR EACH ROW
--EXECUTE FUNCTION check_pdm_perfil_relations();
