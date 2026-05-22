-- Drop orphan tsvector triggers/function on workflow.
--
-- Commit fd395295e (2026-04-01) dropped the workflow.vetores_busca column and
-- deleted prisma/manual-copy/0061-trigger.workflow.pgsql, but left the
-- f_workflow_update_tsvector() function and its BEFORE INSERT/UPDATE triggers
-- on workflow in the database. The triggers still assign NEW.vetores_busca,
-- which now raises 'record "new" has no field "vetores_busca"' (Prisma P2022
-- column="new") and blocks every INSERT/UPDATE on workflow.

DROP TRIGGER IF EXISTS trigger_workflow_update_tsvector_insert ON workflow;
DROP TRIGGER IF EXISTS trigger_workflow_update_tsvector_update ON workflow;
DROP TRIGGER IF EXISTS trigger_workflow_tsvector_insert ON workflow;
DROP TRIGGER IF EXISTS trigger_workflow_tsvector_update ON workflow;
DROP FUNCTION IF EXISTS f_workflow_update_tsvector();
