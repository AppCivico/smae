-- CreateEnum
CREATE TYPE "WorkflowResponsabilidade" AS ENUM ('Propria', 'OutroOrgao');

-- CreateTable
CREATE TABLE "workflow_tarefa" (
    "id" SERIAL NOT NULL,
    "tarefa_fluxo" TEXT NOT NULL,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "workflow_tarefa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fluxo_fase" (
    "id" SERIAL NOT NULL,
    "fluxo_id" INTEGER NOT NULL,
    "fase_id" INTEGER NOT NULL,
    "ordem" INTEGER NOT NULL,
    "responsabilidade" "WorkflowResponsabilidade" NOT NULL,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "fluxo_fase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fluxo_tarefa" (
    "id" SERIAL NOT NULL,
    "workflow_tarefa_id" INTEGER NOT NULL,
    "fluxo_fase_id" INTEGER NOT NULL,
    "responsabilidade" "WorkflowResponsabilidade" NOT NULL,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "fluxo_tarefa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fluxo_fase_fluxo_id_fase_id_idx" ON "fluxo_fase"("fluxo_id", "fase_id");

-- CreateIndex
CREATE INDEX "fluxo_tarefa_workflow_tarefa_id_fluxo_fase_id_idx" ON "fluxo_tarefa"("workflow_tarefa_id", "fluxo_fase_id");

-- AddForeignKey
ALTER TABLE "workflow_tarefa" ADD CONSTRAINT "workflow_tarefa_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_tarefa" ADD CONSTRAINT "workflow_tarefa_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_tarefa" ADD CONSTRAINT "workflow_tarefa_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fluxo_fase" ADD CONSTRAINT "fluxo_fase_fluxo_id_fkey" FOREIGN KEY ("fluxo_id") REFERENCES "fluxo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fluxo_fase" ADD CONSTRAINT "fluxo_fase_fase_id_fkey" FOREIGN KEY ("fase_id") REFERENCES "workflow_fase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fluxo_fase" ADD CONSTRAINT "fluxo_fase_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fluxo_fase" ADD CONSTRAINT "fluxo_fase_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fluxo_fase" ADD CONSTRAINT "fluxo_fase_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fluxo_tarefa" ADD CONSTRAINT "fluxo_tarefa_workflow_tarefa_id_fkey" FOREIGN KEY ("workflow_tarefa_id") REFERENCES "workflow_tarefa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fluxo_tarefa" ADD CONSTRAINT "fluxo_tarefa_fluxo_fase_id_fkey" FOREIGN KEY ("fluxo_fase_id") REFERENCES "fluxo_fase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fluxo_tarefa" ADD CONSTRAINT "fluxo_tarefa_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fluxo_tarefa" ADD CONSTRAINT "fluxo_tarefa_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fluxo_tarefa" ADD CONSTRAINT "fluxo_tarefa_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
