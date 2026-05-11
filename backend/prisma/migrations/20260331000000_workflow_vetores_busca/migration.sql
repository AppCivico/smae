ALTER TABLE "workflow"
    ADD COLUMN "vetores_busca" tsvector DEFAULT '';

-- f_workflow_update_tsvector() and the BEFORE INSERT/UPDATE triggers on
-- workflow live in prisma/manual-copy/0061-f_workflow_update_tsvector.pgsql
-- and are installed on startup. Project convention: SQL functions/triggers
-- belong in manual-copy, not in Prisma migrations.
