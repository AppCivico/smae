ALTER TABLE "workflow"
    ADD COLUMN "vetores_busca" tsvector DEFAULT '';

CREATE OR REPLACE FUNCTION f_workflow_update_tsvector() RETURNS TRIGGER AS $$
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

    RETURN NEW;
END
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER trigger_workflow_update_tsvector_insert
BEFORE INSERT ON workflow
FOR EACH ROW
EXECUTE PROCEDURE f_workflow_update_tsvector();

CREATE TRIGGER trigger_workflow_update_tsvector_update
BEFORE UPDATE ON workflow
FOR EACH ROW
WHEN (
    OLD.nome IS DISTINCT FROM NEW.nome OR
    OLD.ativo IS DISTINCT FROM NEW.ativo OR
    OLD.transferencia_tipo_id IS DISTINCT FROM NEW.transferencia_tipo_id
)
EXECUTE PROCEDURE f_workflow_update_tsvector();

-- Populate existing rows
UPDATE workflow SET vetores_busca = DEFAULT;
