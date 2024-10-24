CREATE OR REPLACE FUNCTION check_pdm_perfil_relations() RETURNS TRIGGER AS $$
DECLARE
    _string varchar;
    _equipe varchar;
    _filhas integer[];
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

        IF (OLD.etapa_id IS NOT NULL) THEN
            WITH RECURSIVE etapa_tree AS (
                SELECT id, etapa_pai_id
                FROM etapa
                WHERE etapa_pai_id = OLD.etapa_id
                AND removido_em IS NULL

                UNION ALL

                SELECT e.id, e.etapa_pai_id
                FROM etapa e
                INNER JOIN etapa_tree et ON et.id = e.etapa_pai_id
                WHERE e.removido_em IS NULL
            )
            SELECT array_agg(id) into _filhas
            FROM etapa_tree;
        END IF;

        -- Verificação para remoção de PDM
        IF OLD.relacionamento = 'PDM' THEN
            IF EXISTS (
                SELECT 1
                FROM pdm_perfil p
                LEFT JOIN meta m on m.id = p.meta_id AND m.removido_em IS NULL
                LEFT JOIN iniciativa i on i.id = p.iniciativa_id AND i.removido_em IS NULL
                LEFT JOIN atividade a ON a.id = p.atividade_id AND a.removido_em IS NULL
                WHERE p.pdm_id = NEW.pdm_id
                  AND p.equipe_id = NEW.equipe_id
                  AND p.tipo = NEW.tipo
                  AND p.removido_em IS NULL
                  AND p.relacionamento IN ('META', 'INICIATIVA', 'ATIVIDADE')
                  AND COALESCE(m.id, i.id, a.id) IS NOT NULL -- verifica se existe alguma linha de meta/iniciativa/atividade
            ) THEN
                SELECT e.titulo INTO _equipe
                FROM grupo_responsavel_equipe e WHERE id = OLD.equipe_id;
                -- aqui pode usar left join pois as linhas removidas não vão importar
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
                LEFT JOIN meta m ON m.id = p.meta_id AND m.removido_em IS NULL
                LEFT JOIN iniciativa i ON i.id = p.iniciativa_id AND i.removido_em IS NULL
                LEFT JOIN atividade a ON a.id = p.atividade_id AND a.removido_em IS NULL
                WHERE p.pdm_id = NEW.pdm_id
                  AND p.equipe_id = NEW.equipe_id
                  AND p.tipo = NEW.tipo
                  AND p.removido_em IS NULL
                  AND p.relacionamento IN ('META', 'INICIATIVA', 'ATIVIDADE')
                  AND COALESCE(m.id, i.id, a.id) IS NOT NULL;

                RAISE EXCEPTION '__HTTP__ % __EOF__', jsonb_build_object(
                    'message', 'Não é possível equipe '|| _equipe ||' enquanto existirem relacionamentos utilizando: ' || _string,
                    'code', 400
                );
            END IF;
        -- Verificação para remoção de META
        ELSIF OLD.relacionamento IN ('META', 'INICIATIVA', 'ATIVIDADE') THEN
            IF EXISTS (
                SELECT 1
                FROM pdm_perfil p
                WHERE p.id != OLD.id
                  AND p.pdm_id = NEW.pdm_id
                  AND p.equipe_id = NEW.equipe_id
                  AND p.tipo = NEW.tipo
                  AND p.removido_em IS NULL
                  AND
                    (
                        (OLD.etapa_id IS NULL) -- está removendo uma linha de meta/iniciativa/atividade itself
                        OR (
                            -- se está removendo uma etapa, verifica se a etapa filha está sendo utilizada
                            OLD.etapa_id IS NOT NULL
                            AND p.etapa_id = ANY(_filhas)
                        )
                    )
                  AND (
                    (
                        p.relacionamento = 'INICIATIVA'
                        AND p.iniciativa_id = OLD.iniciativa_id
                    )
                    OR
                    (
                        p.relacionamento = 'ATIVIDADE'
                        AND p.atividade_id = OLD.atividade_id
                    )
                    OR
                    (
                        p.relacionamento = 'ATIVIDADE'
                        AND p.atividade_id = (
                            SELECT a.id
                            FROM atividade a
                            JOIN iniciativa i ON i.id = a.iniciativa_id
                            WHERE i.meta_id = OLD.meta_id AND a.removido_em IS NULL
                        )
                    )
                  )

            ) THEN
                SELECT e.titulo INTO _equipe
                FROM grupo_responsavel_equipe e WHERE id = OLD.equipe_id;
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
                        case when e.id is not null then ' na etapa/fase ou subfase ' ||
                            coalesce(e.titulo, 'id ' || e.id)
                        else '' end
                    , ', ') INTO _string
                FROM pdm_perfil p
                LEFT JOIN meta m ON m.id = p.meta_id AND m.removido_em IS NULL
                LEFT JOIN iniciativa i ON i.id = p.iniciativa_id AND i.removido_em IS NULL
                LEFT JOIN atividade a ON a.id = p.atividade_id AND a.removido_em IS NULL
                LEFT JOIN etapa e on e.id = p.etapa_id AND e.removido_em IS NULL
                WHERE p.id != OLD.id
                  AND p.pdm_id = NEW.pdm_id
                  AND p.equipe_id = NEW.equipe_id
                  AND p.tipo = NEW.tipo
                  AND p.removido_em IS NULL
                  AND
                    (
                        (OLD.etapa_id IS NULL)
                        OR (
                            OLD.etapa_id IS NOT NULL
                            AND p.etapa_id = ANY(_filhas)
                        )
                    )
                  AND (
                    (
                        p.relacionamento = 'INICIATIVA'
                        AND p.iniciativa_id = OLD.iniciativa_id
                    )
                    OR
                    (
                        p.relacionamento = 'ATIVIDADE'
                        AND p.atividade_id = OLD.atividade_id
                    )
                    OR
                    (
                        p.relacionamento = 'ATIVIDADE'
                        AND p.atividade_id = (
                            SELECT a.id
                            FROM atividade a
                            JOIN iniciativa i ON i.id = a.iniciativa_id
                            WHERE i.meta_id = OLD.meta_id AND a.removido_em IS NULL
                        )
                    )
                  );

                RAISE EXCEPTION '__HTTP__ % __EOF__', jsonb_build_object(
                    'message', 'Não é possível equipe '|| _equipe ||' enquanto existirem relacionamentos utilizando: ' || _string,
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
