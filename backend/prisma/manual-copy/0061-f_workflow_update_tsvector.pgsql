-- Canonical home for workflow.vetores_busca search-vector trigger.
-- Originally defined inline in migration 20260331000000_workflow_vetores_busca,
-- which violated the project convention (functions/triggers belong here, in
-- manual-copy, not in Prisma migrations). The column ALTER TABLE stays in
-- the migration; the function and triggers live here.
--
-- The assignment is wrapped in BEGIN..EXCEPTION so that if the
-- "vetores_busca" column is missing (e.g. migration partially applied),
-- the trigger no-ops instead of raising 'record "new" has no field' /
-- Prisma P2022 column="new" and blocking writes to workflow.

CREATE OR REPLACE FUNCTION f_workflow_update_tsvector() RETURNS TRIGGER AS $$
BEGIN
    BEGIN
        NEW.vetores_busca = (
            SELECT
                to_tsvector(
                    'simple',
                    COALESCE(NEW.nome, '') || ' ' ||
                    COALESCE(tt.nome, '') || ' ' ||
                    COALESCE(CAST(tt.esfera AS TEXT), '') || ' ' ||
                    CASE WHEN NEW.ativo THEN 'Ativo' ELSE 'Inativo' END
                )
            FROM transferencia_tipo tt
            WHERE tt.id = NEW.transferencia_tipo_id
        );
    EXCEPTION WHEN undefined_column THEN
        NULL;
    END;
    RETURN NEW;
END
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS trigger_workflow_update_tsvector_insert ON workflow;
CREATE TRIGGER trigger_workflow_update_tsvector_insert
BEFORE INSERT ON workflow
FOR EACH ROW
EXECUTE PROCEDURE f_workflow_update_tsvector();

DROP TRIGGER IF EXISTS trigger_workflow_update_tsvector_update ON workflow;
CREATE TRIGGER trigger_workflow_update_tsvector_update
BEFORE UPDATE ON workflow
FOR EACH ROW
WHEN (
    OLD.nome IS DISTINCT FROM NEW.nome OR
    OLD.ativo IS DISTINCT FROM NEW.ativo OR
    OLD.transferencia_tipo_id IS DISTINCT FROM NEW.transferencia_tipo_id
)
EXECUTE PROCEDURE f_workflow_update_tsvector();
