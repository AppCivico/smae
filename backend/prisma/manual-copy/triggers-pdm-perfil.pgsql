CREATE OR REPLACE FUNCTION check_pdm_perfil_relations() RETURNS TRIGGER AS $$
DECLARE
    _string varchar;
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
                  AND relacionamento IN ('META', 'INICIATIVA', 'ATIVIDADE')
            ) THEN

                -- select usage
                SELECT
                    string_agg(lower(relacionamento::text) || ' ' ||
                        coalesce(
                            m.codigo,
                            i.codigo,
                            a.codigo
                        ) || ' - ' || coalesce(
                            m.titulo,
                            i.titulo,
                            a.titulo,
                            ''
                        )
                    , ', ') INTO _string
                FROM pdm_perfil p
                LEFT JOIN meta m ON m.id = p.meta_id
                LEFT JOIN iniciativa i ON i.id = p.iniciativa_id
                LEFT JOIN atividade a ON a.id = p.atividade_id
                WHERE p.pdm_id = NEW.pdm_id
                  AND p.equipe_id = NEW.equipe_id
                  AND p.tipo = NEW.tipo
                  AND p.removido_em IS NULL
                  AND p.relacionamento IN ('META', 'INICIATIVA', 'ATIVIDADE');

                RAISE EXCEPTION '__HTTP__ % __EOF__', jsonb_build_object(
                    'message', 'Não é possível equipe enquanto existirem relacionamentos utilizando: ' || _string,
                    'code', 400
                );
            END IF;
        -- Verificação para remoção de META
        ELSIF OLD.relacionamento IN ('META', 'INICIATIVA', 'ATIVIDADE') THEN
            IF EXISTS (
                SELECT 1
                FROM pdm_perfil
                WHERE pdm_id = NEW.pdm_id
                  AND equipe_id = NEW.equipe_id
                  AND tipo = NEW.tipo
                  AND removido_em IS NULL
                  AND (
                    (
                        relacionamento = 'INICIATIVA'
                        AND iniciativa_id = OLD.iniciativa_id
                    )
                    OR
                    (
                        relacionamento = 'ATIVIDADE'
                        AND atividade_id = (
                            SELECT a.id
                            FROM atividade a
                            JOIN iniciativa i ON i.id = a.iniciativa_id
                            WHERE i.meta_id = OLD.meta_id AND a.removido_em IS NULL
                        )
                    )
                  )
            ) THEN
                -- select usage
                SELECT
                    string_agg(lower(relacionamento::text) || ' ' ||
                        coalesce(
                            m.codigo,
                            i.codigo,
                            a.codigo,
                            ''
                        ) || ' - ' || coalesce(
                            m.titulo,
                            i.titulo,
                            a.titulo,
                            ''
                        ) ||
                        case when e.id is not null then ' na etapa ' ||
                            coalesce(e.titulo, 'id ' || e.id)
                        else '' end
                    , ', ') INTO _string
                FROM pdm_perfil p
                LEFT JOIN meta m ON m.id = p.meta_id AND m.removido_em IS NULL
                LEFT JOIN iniciativa i ON i.id = p.iniciativa_id AND i.removido_em IS NULL
                LEFT JOIN atividade a ON a.id = p.atividade_id AND a.removido_em IS NULL
                LEFT JOIN etapa e on e.id = p.etapa_id AND e.removido_em IS NULL
                WHERE p.pdm_id = NEW.pdm_id
                  AND p.equipe_id = NEW.equipe_id
                  AND p.tipo = NEW.tipo
                  AND p.removido_em IS NULL
                  AND (
                    (
                        p.relacionamento = 'INICIATIVA'
                        AND p.iniciativa_id = OLD.iniciativa_id
                    )
                    OR
                    (
                        p.relacionamento = 'ATIVIDADE'
                        AND p.atividade_id = (
                            SELECT a.id FROM atividade a
                            JOIN iniciativa i ON i.id = a.iniciativa_id
                            WHERE i.meta_id = NEW.meta_id AND a.removido_em IS NULL
                        )
                    )
                  );

                RAISE EXCEPTION '__HTTP__ % __EOF__', jsonb_build_object(
                    'message', 'Não é possível remover a linha enquanto existirem relacionamentos utilizando: ' || _string,
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
