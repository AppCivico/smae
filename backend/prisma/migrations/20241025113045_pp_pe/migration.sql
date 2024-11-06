-- AlterTable
ALTER TABLE "feature_flag" ADD COLUMN     "pp_pe" BOOLEAN NOT NULL DEFAULT false;

UPDATE pdm p1
SET pdm_anteriores = (
    SELECT array_agg(id ORDER BY id)
    FROM pdm p2
    WHERE p2.id = ANY(p1.pdm_anteriores)
    AND p2.removido_em IS NULL
)
WHERE p1.pdm_anteriores IS NOT NULL;
