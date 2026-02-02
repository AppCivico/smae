-- CreateEnum
CREATE TYPE "DemandaStatus" AS ENUM ('Registro', 'Validacao', 'Publicado', 'Encerrado');

-- CreateEnum
CREATE TYPE "DemandaFinalidade" AS ENUM ('Custeio', 'Investimento');

-- CreateTable
CREATE TABLE "demanda" (
    "id" SERIAL NOT NULL,
    "orgao_id" INTEGER NOT NULL,
    "unidade_responsavel" VARCHAR(255) NOT NULL,
    "nome_responsavel" VARCHAR(255) NOT NULL,
    "cargo_responsavel" VARCHAR(255) NOT NULL,
    "email_responsavel" VARCHAR(255) NOT NULL,
    "telefone_responsavel" VARCHAR(20) NOT NULL,
    "nome_projeto" VARCHAR(255) NOT NULL,
    "descricao" VARCHAR(2048) NOT NULL,
    "justificativa" VARCHAR(2048) NOT NULL,
    "valor" DECIMAL(15,2) NOT NULL,
    "finalidade" "DemandaFinalidade" NOT NULL,
    "observacao" VARCHAR(2048),
    "area_tematica_id" INTEGER NOT NULL,
    "status" "DemandaStatus" NOT NULL,
    "data_status_atual" TIMESTAMPTZ(6) NOT NULL,
    "data_registro" TIMESTAMPTZ(6),
    "data_validacao" TIMESTAMPTZ(6),
    "data_publicado" TIMESTAMPTZ(6),
    "data_encerrado" TIMESTAMPTZ(6),
    "dias_em_registro" INTEGER NOT NULL DEFAULT 0,
    "dias_em_validacao" INTEGER NOT NULL DEFAULT 0,
    "dias_em_publicado" INTEGER NOT NULL DEFAULT 0,
    "dias_em_encerrado" INTEGER NOT NULL DEFAULT 0,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "demanda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demanda_acao" (
    "id" SERIAL NOT NULL,
    "demanda_id" INTEGER NOT NULL,
    "acao_id" INTEGER NOT NULL,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "demanda_acao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demanda_localizacao" (
    "id" SERIAL NOT NULL,
    "demanda_id" INTEGER NOT NULL,
    "geo_loc_id" INTEGER,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "demanda_localizacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demanda_arquivo" (
    "id" SERIAL NOT NULL,
    "demanda_id" INTEGER NOT NULL,
    "arquivo_id" INTEGER NOT NULL,
    "autoriza_divulgacao" BOOLEAN NOT NULL DEFAULT false,
    "descricao" VARCHAR(500),
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "demanda_arquivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demanda_historico" (
    "id" SERIAL NOT NULL,
    "demanda_id" INTEGER NOT NULL,
    "status_anterior" "DemandaStatus",
    "status_novo" "DemandaStatus" NOT NULL,
    "motivo" TEXT,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demanda_historico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demanda_snapshot" (
    "id" SERIAL NOT NULL,
    "demanda_id" INTEGER NOT NULL,
    "versao" INTEGER NOT NULL,
    "dados_originais" JSON NOT NULL,
    "dados_diff" JSON,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demanda_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "demanda_orgao_id_idx" ON "demanda"("orgao_id");

-- CreateIndex
CREATE INDEX "demanda_status_idx" ON "demanda"("status");

-- CreateIndex
CREATE INDEX "demanda_area_tematica_id_idx" ON "demanda"("area_tematica_id");

-- CreateIndex
CREATE UNIQUE INDEX "demanda_acao_demanda_id_acao_id_key" ON "demanda_acao"("demanda_id", "acao_id") WHERE "removido_em" IS NULL;

-- AddForeignKey
ALTER TABLE "demanda" ADD CONSTRAINT "demanda_orgao_id_fkey" FOREIGN KEY ("orgao_id") REFERENCES "orgao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demanda" ADD CONSTRAINT "demanda_area_tematica_id_fkey" FOREIGN KEY ("area_tematica_id") REFERENCES "area_tematica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demanda" ADD CONSTRAINT "demanda_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demanda" ADD CONSTRAINT "demanda_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demanda" ADD CONSTRAINT "demanda_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demanda_acao" ADD CONSTRAINT "demanda_acao_demanda_id_fkey" FOREIGN KEY ("demanda_id") REFERENCES "demanda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demanda_acao" ADD CONSTRAINT "demanda_acao_acao_id_fkey" FOREIGN KEY ("acao_id") REFERENCES "acao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demanda_acao" ADD CONSTRAINT "demanda_acao_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demanda_acao" ADD CONSTRAINT "demanda_acao_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demanda_localizacao" ADD CONSTRAINT "demanda_localizacao_demanda_id_fkey" FOREIGN KEY ("demanda_id") REFERENCES "demanda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demanda_localizacao" ADD CONSTRAINT "demanda_localizacao_geo_loc_id_fkey" FOREIGN KEY ("geo_loc_id") REFERENCES "geo_localizacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demanda_localizacao" ADD CONSTRAINT "demanda_localizacao_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demanda_localizacao" ADD CONSTRAINT "demanda_localizacao_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demanda_localizacao" ADD CONSTRAINT "demanda_localizacao_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demanda_arquivo" ADD CONSTRAINT "demanda_arquivo_demanda_id_fkey" FOREIGN KEY ("demanda_id") REFERENCES "demanda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demanda_arquivo" ADD CONSTRAINT "demanda_arquivo_arquivo_id_fkey" FOREIGN KEY ("arquivo_id") REFERENCES "arquivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demanda_arquivo" ADD CONSTRAINT "demanda_arquivo_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demanda_arquivo" ADD CONSTRAINT "demanda_arquivo_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demanda_arquivo" ADD CONSTRAINT "demanda_arquivo_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demanda_historico" ADD CONSTRAINT "demanda_historico_demanda_id_fkey" FOREIGN KEY ("demanda_id") REFERENCES "demanda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demanda_historico" ADD CONSTRAINT "demanda_historico_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demanda_snapshot" ADD CONSTRAINT "demanda_snapshot_demanda_id_fkey" FOREIGN KEY ("demanda_id") REFERENCES "demanda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demanda_snapshot" ADD CONSTRAINT "demanda_snapshot_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
