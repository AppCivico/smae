-- DropIndex
DROP INDEX "nota_bloco_nota_id_idx";

-- CreateIndex
CREATE INDEX "bloco_nota_bloco_idx" ON "bloco_nota"("bloco");

-- CreateIndex
CREATE INDEX "nota_data_nota_rever_em_removido_em_idx" ON "nota"("data_nota", "rever_em", "removido_em");

-- CreateIndex
CREATE INDEX "nota_bloco_nota_id_removido_em_status_idx" ON "nota"("bloco_nota_id", "removido_em", "status");


CREATE OR REPLACE VIEW view_notas_transferencias as
SELECT
    nota.id,
    nota.bloco_nota_id,
    nota.data_nota,
    nota.nota,
    nota.status,
    nota.removido_em,

    CASE
        WHEN nota.data_nota <= date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo') + '1 day'::interval AND nota.rever_em IS NOT NULL THEN nota.rever_em
        ELSE nota.data_nota
    END AS data_ordenacao,

    t.id AS transferencia_id,
    t.identificador AS transferencia_identificador
FROM nota
JOIN bloco_nota ON bloco_nota.id = nota.bloco_nota_id
JOIN transferencia t ON 'Transf:' || t.id = bloco_nota.bloco;
