-- AlterTable
ALTER TABLE "transferencia" ADD COLUMN     "prejudicada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "workflow_etapa_atual_id" INTEGER,
ADD COLUMN     "workflow_fase_atual_id" INTEGER,
ADD COLUMN     "workflow_finalizado" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "transferencia" ADD CONSTRAINT "transferencia_workflow_etapa_atual_id_fkey" FOREIGN KEY ("workflow_etapa_atual_id") REFERENCES "workflow_etapa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia" ADD CONSTRAINT "transferencia_workflow_fase_atual_id_fkey" FOREIGN KEY ("workflow_fase_atual_id") REFERENCES "workflow_fase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE OR REPLACE VIEW view_transferencia_analise AS
SELECT
    t.id AS transferencia_id,
    t.workflow_finalizado,
    t.partido_id,
    t.workflow_etapa_atual_id,
    t.workflow_fase_atual_id,
    t.parlamentar_id,
    p.foto_upload_id AS parlamentar_foto_id,
    t.valor_total,
    dr.orgao_gestor_id AS distribuicao_orgao_id,
    dr.valor_total AS distribuicao_valor_total
FROM transferencia t
LEFT JOIN parlamentar p ON t.parlamentar_id = p.id AND p.removido_em IS NULL
LEFT JOIN distribuicao_recurso dr ON dr.transferencia_id = t.id AND dr.removido_em IS NULL
WHERE t.removido_em IS NULL;
