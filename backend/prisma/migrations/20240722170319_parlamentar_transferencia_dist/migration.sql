-- CreateTable
CREATE TABLE "transferencia_parlamentar" (
    "id" SERIAL NOT NULL,
    "transferencia_id" INTEGER NOT NULL,
    "partido_id" INTEGER,
    "parlamentar_id" INTEGER NOT NULL,
    "cargo" "ParlamentarCargo",
    "objeto" TEXT NOT NULL DEFAULT '',
    "valor" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "criado_por" INTEGER,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "transferencia_parlamentar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distribuicao_parlamentar" (
    "id" SERIAL NOT NULL,
    "distribuicao_recurso_id" INTEGER NOT NULL,
    "partido_id" INTEGER,
    "parlamentar_id" INTEGER NOT NULL,
    "cargo" "ParlamentarCargo",
    "objeto" TEXT,
    "valor" DECIMAL(15,2),
    "criado_por" INTEGER,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "distribuicao_parlamentar_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "transferencia_parlamentar" ADD CONSTRAINT "transferencia_parlamentar_transferencia_id_fkey" FOREIGN KEY ("transferencia_id") REFERENCES "transferencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_parlamentar" ADD CONSTRAINT "transferencia_parlamentar_partido_id_fkey" FOREIGN KEY ("partido_id") REFERENCES "partido"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_parlamentar" ADD CONSTRAINT "transferencia_parlamentar_parlamentar_id_fkey" FOREIGN KEY ("parlamentar_id") REFERENCES "parlamentar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_parlamentar" ADD CONSTRAINT "transferencia_parlamentar_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_parlamentar" ADD CONSTRAINT "transferencia_parlamentar_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_parlamentar" ADD CONSTRAINT "transferencia_parlamentar_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_parlamentar" ADD CONSTRAINT "distribuicao_parlamentar_distribuicao_recurso_id_fkey" FOREIGN KEY ("distribuicao_recurso_id") REFERENCES "distribuicao_recurso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_parlamentar" ADD CONSTRAINT "distribuicao_parlamentar_partido_id_fkey" FOREIGN KEY ("partido_id") REFERENCES "partido"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_parlamentar" ADD CONSTRAINT "distribuicao_parlamentar_parlamentar_id_fkey" FOREIGN KEY ("parlamentar_id") REFERENCES "parlamentar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_parlamentar" ADD CONSTRAINT "distribuicao_parlamentar_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_parlamentar" ADD CONSTRAINT "distribuicao_parlamentar_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_parlamentar" ADD CONSTRAINT "distribuicao_parlamentar_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO transferencia_parlamentar (transferencia_id, partido_id, parlamentar_id, cargo, valor, objeto)
SELECT
    id as transferencia_id,
    partido_id,
    parlamentar_id,
    cargo,
    valor,
    objeto
FROM transferencia
WHERE parlamentar_id IS NOT NULL AND partido_id IS NOT NULL AND removido_em IS NULL;

CREATE OR REPLACE VIEW view_transferencia_analise AS
SELECT
    t.id AS transferencia_id,
    t.workflow_finalizado,
    tp.partido_id,
    t.workflow_etapa_atual_id,
    t.workflow_fase_atual_id,
    tp.parlamentar_id,
    t.valor_total,
    dr.orgao_gestor_id AS distribuicao_orgao_id,
    dr.valor_total AS distribuicao_valor_total,
    t.prejudicada,
    t.esfera,
    t.ano
FROM transferencia t
LEFT JOIN transferencia_parlamentar tp ON tp.transferencia_id = t.id AND tp.removido_em IS NULL
JOIN parlamentar p ON tp.parlamentar_id = p.id AND p.removido_em IS NULL
LEFT JOIN distribuicao_recurso dr ON dr.transferencia_id = t.id AND dr.removido_em IS NULL
WHERE t.removido_em IS NULL;

-- DropForeignKey
ALTER TABLE "transferencia" DROP CONSTRAINT "transferencia_parlamentar_id_fkey";

-- DropForeignKey
ALTER TABLE "transferencia" DROP CONSTRAINT "transferencia_partido_id_fkey";

-- AlterTable
ALTER TABLE "transferencia" DROP COLUMN "cargo",
DROP COLUMN "parlamentar_id",
DROP COLUMN "partido_id";