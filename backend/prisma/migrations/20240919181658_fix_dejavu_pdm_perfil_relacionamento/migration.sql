
delete from pdm_perfil where relacionamento ='ETAPA'; -- o relacionamento sempre é com a meta/ini/atv, o que tem a fk é a etapa
-- se fosse fazer mais checks ai seriam contra o a fase->subfase, mas isso ainda n foi implementado

BEGIN;
CREATE TYPE "PdmPerfilRelacionamento_new" AS ENUM ('PDM', 'META', 'INICIATIVA', 'ATIVIDADE');
ALTER TABLE "pdm_perfil" ALTER COLUMN "relacionamento" DROP DEFAULT;
ALTER TABLE "pdm_perfil" ALTER COLUMN "relacionamento" TYPE "PdmPerfilRelacionamento_new" USING ("relacionamento"::text::"PdmPerfilRelacionamento_new");
ALTER TYPE "PdmPerfilRelacionamento" RENAME TO "PdmPerfilRelacionamento_old";
ALTER TYPE "PdmPerfilRelacionamento_new" RENAME TO "PdmPerfilRelacionamento";
DROP TYPE "PdmPerfilRelacionamento_old";
ALTER TABLE "pdm_perfil" ALTER COLUMN "relacionamento" SET DEFAULT 'PDM';
COMMIT;



/*

-- Function to generate a unique identifier for each row
CREATE OR REPLACE FUNCTION generate_unique_id(
    p_pdm_id INT,
    p_tipo "PdmPerfilTipo",
    p_equipe_id INT,
    p_etapa_id INT,
    p_meta_id INT,
    p_relacionamento "PdmPerfilRelacionamento",
    p_atividade_id INT,
    p_iniciativa_id INT
) RETURNS TEXT AS $$
BEGIN
    RETURN p_pdm_id || '_' || p_tipo || '_' ||
           COALESCE(p_equipe_id::text, '') || '_' ||
           COALESCE(p_etapa_id::text, '') || '_' ||
           COALESCE(p_meta_id::text, '') || '_' ||
           p_relacionamento || '_' ||
           COALESCE(p_atividade_id::text, '') || '_' ||
           COALESCE(p_iniciativa_id::text, '');
END;
$$ LANGUAGE plpgsql;

-- Create a temporary table to store the rows to keep
CREATE TEMPORARY TABLE temp_pdm_perfil AS
SELECT DISTINCT ON (generate_unique_id(pdm_id, tipo, equipe_id, etapa_id, meta_id, relacionamento, atividade_id, iniciativa_id))
    *
FROM pdm_perfil
ORDER BY generate_unique_id(pdm_id, tipo, equipe_id, etapa_id, meta_id, relacionamento, atividade_id, iniciativa_id),
         criado_em DESC;

-- Delete all rows from the original table
DELETE FROM pdm_perfil;

-- Insert the unique rows back into the original table
INSERT INTO pdm_perfil
SELECT * FROM temp_pdm_perfil;

-- Drop the temporary table
DROP TABLE temp_pdm_perfil;

-- Drop the function as it's no longer needed
DROP FUNCTION generate_unique_id;

-- Vacuum the table to reclaim space and update statistics
VACUUM ANALYZE pdm_perfil;

*/

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
