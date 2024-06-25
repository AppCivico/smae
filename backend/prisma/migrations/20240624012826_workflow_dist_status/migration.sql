-- CreateTable
CREATE TABLE "workflow_distribuicao_status" (
    "id" SERIAL NOT NULL,
    "workflow_id" INTEGER NOT NULL,
    "status_base_id" INTEGER,
    "status_id" INTEGER,

    CONSTRAINT "workflow_distribuicao_status_pkey" PRIMARY KEY ("id"),
    CONSTRAINT  "status_distribuicao_one_fk" CHECK ( status_base_id IS NOT NULL AND status_id IS NULL OR status_base_id IS NULL AND status_id IS NOT NULL )
);

-- AddForeignKey
ALTER TABLE "workflow_distribuicao_status" ADD CONSTRAINT "workflow_distribuicao_status_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_distribuicao_status" ADD CONSTRAINT "workflow_distribuicao_status_status_base_id_fkey" FOREIGN KEY ("status_base_id") REFERENCES "distribuicao_status_base"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_distribuicao_status" ADD CONSTRAINT "workflow_distribuicao_status_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "transferencia_tipo_distribuicao_status"("id") ON DELETE SET NULL ON UPDATE CASCADE;
