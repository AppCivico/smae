-- CreateEnum
CREATE TYPE "ProjetoFase" AS ENUM ('Registro', 'Detalhamento', 'Planejamento', 'Acompanhamento', 'Encerramento');

-- CreateEnum
CREATE TYPE "ProjetoStatus" AS ENUM ('EmRegistro', 'EmDetalhamento', 'EmPlanejamento', 'EmExecucao', 'EmFechamento', 'EmSuspensao');

-- CreateEnum
CREATE TYPE "StatusRisco" AS ENUM ('Padrao');

-- CreateTable
CREATE TABLE "Diretorio" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "padrao" BOOLEAN NOT NULL,
    "ativo" BOOLEAN NOT NULL,

    CONSTRAINT "Diretorio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projeto" (
    "id" SERIAL NOT NULL,
    "diretorio_id" INTEGER NOT NULL,
    "meta_id" INTEGER,
    "iniciativa_id" INTEGER,
    "atividade_id" INTEGER,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "objeto" TEXT NOT NULL,
    "objetivo" TEXT NOT NULL,
    "origem_eh_pdm" BOOLEAN NOT NULL DEFAULT false,
    "origem_outro" TEXT,
    "publico_alvo" TEXT NOT NULL,
    "previsao_inicio" TIMESTAMP(3),
    "previsao_termino" TIMESTAMP(3),
    "previsao_duracao" INTEGER,
    "previsao_inicio_calc" TIMESTAMP(3),
    "previsao_termino_calc" TIMESTAMP(3),
    "previsao_duracao_calc" INTEGER,
    "previsao_custo" DOUBLE PRECISION,
    "inicio_real" TIMESTAMP(3),
    "termino_real" TIMESTAMP(3),
    "custo_real" DOUBLE PRECISION,
    "status" "ProjetoStatus" NOT NULL,
    "fase" "ProjetoFase" NOT NULL,
    "arquivado" BOOLEAN NOT NULL DEFAULT false,
    "eh_prioritario" BOOLEAN NOT NULL DEFAULT false,
    "escopo" TEXT,
    "nao_escopo" TEXT,
    "secretario_responsavel" TEXT,
    "secretario_executivo" TEXT,
    "responsavel" TEXT,
    "coordenador_ue" TEXT,
    "data_aprovacao" DATE,
    "versao" DATE,
    "priorizado_em" TIMESTAMP(3),
    "priorizado_por" INTEGER,
    "aprovado_em" TIMESTAMP(3),
    "aprovado_por" INTEGER,
    "suspenso_em" TIMESTAMP(3),
    "suspenso_por" INTEGER,
    "arquivado_em" TIMESTAMP(3),
    "arquivado_por" INTEGER,
    "cancelado_em" TIMESTAMP(3),
    "cancelado_por" INTEGER,
    "reiniciado_em" TIMESTAMP(3),
    "reiniciado_por" INTEGER,
    "iniciado_em" TIMESTAMP(3),
    "iniciado_por" INTEGER,
    "fechado_em" TIMESTAMP(3),
    "fechado_por" INTEGER,
    "encerramento_processo_sei" TEXT,
    "encerramento_registro_sei_info" JSONB,
    "encerramento_registro_sei_errmsg" TEXT,
    "aprovacao_processo_sei" TEXT,
    "aprovacao_registro_sei_info" JSONB,
    "aprovacao_registro_sei_errmsg" TEXT,
    "realizado_inicio" TIMESTAMP(3),
    "realizado_termino" TIMESTAMP(3),
    "realizado_custo" DOUBLE PRECISION,

    CONSTRAINT "projeto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projeto_premissa" (
    "id" SERIAL NOT NULL,
    "projeto_id" INTEGER NOT NULL,
    "premissa" TEXT NOT NULL,

    CONSTRAINT "projeto_premissa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projeto_restricao" (
    "id" SERIAL NOT NULL,
    "projeto_id" INTEGER NOT NULL,
    "restricao" TEXT NOT NULL,

    CONSTRAINT "projeto_restricao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projeto_orgao" (
    "id" SERIAL NOT NULL,
    "projeto_id" INTEGER NOT NULL,
    "orgao_id" INTEGER NOT NULL,
    "responsavel" BOOLEAN NOT NULL,

    CONSTRAINT "projeto_orgao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projeto_licao_aprendida" (
    "id" SERIAL NOT NULL,
    "projeto_id" INTEGER NOT NULL,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMP(3),
    "descricao" TEXT NOT NULL,
    "observacao" TEXT,
    "processo_sei" TEXT,
    "registro_sei_info" JSONB,
    "registro_sei_errmsg" TEXT,

    CONSTRAINT "projeto_licao_aprendida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projeto_fonte_recurso" (
    "id" SERIAL NOT NULL,
    "projeto_id" INTEGER NOT NULL,
    "fonte_recurso_id" INTEGER NOT NULL,
    "valor_percentual" DOUBLE PRECISION,
    "valor_nominal" DOUBLE PRECISION,

    check (valor_percentual is not null or valor_nominal is not null),
    CONSTRAINT "projeto_fonte_recurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projeto_documento" (
    "id" SERIAL NOT NULL,
    "projeto_id" INTEGER NOT NULL,
    "documento_id" INTEGER NOT NULL,

    CONSTRAINT "projeto_documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tarefa" (
    "id" SERIAL NOT NULL,
    "projeto_id" INTEGER NOT NULL,
    "orgao_id" INTEGER NOT NULL,
    "tarefa_pai_id" INTEGER,
    "numero" INTEGER NOT NULL,
    "nivel" SMALLINT NOT NULL,
    "inicio_planejado" TIMESTAMP(3),
    "termino_planejado" TIMESTAMP(3),
    "duracao_planejado" INTEGER,
    "inicio_planejado_calc" TIMESTAMP(3),
    "termino_planejado_calc" TIMESTAMP(3),
    "duracao_planejado_calc" INTEGER,
    "inicio_real" TIMESTAMP(3),
    "termino_real" TIMESTAMP(3),
    "duracao_real" INTEGER,
    "custo_estimado" DOUBLE PRECISION,
    "custo_real" DOUBLE PRECISION,
    "percentual_concluido" DOUBLE PRECISION,
    "removido_em" TIMESTAMP(3),
    "removido_por" INTEGER,

    CONSTRAINT "Tarefa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarefa_recurso" (
    "id" SERIAL NOT NULL,
    "tarefa_id" INTEGER NOT NULL,
    "recurso" TEXT NOT NULL,

    CONSTRAINT "tarefa_recurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarefa_predecessora" (
    "id" SERIAL NOT NULL,
    "tarefa_id" INTEGER NOT NULL,
    "tarefa_predecessora_id" INTEGER NOT NULL,

    CONSTRAINT "tarefa_predecessora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projeto_risco" (
    "id" SERIAL NOT NULL,
    "projeto_id" INTEGER NOT NULL,
    "numero" INTEGER NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL,
    "descricao" TEXT,
    "causa" TEXT,
    "consequencia" TEXT,
    "probabilidade" DOUBLE PRECISION,
    "impacto" DOUBLE PRECISION,
    "nivel" DOUBLE PRECISION,
    "grau" DOUBLE PRECISION,
    "resposta" TEXT,

    CONSTRAINT "projeto_risco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risco_tarefa" (
    "id" SERIAL NOT NULL,
    "tarefa_id" INTEGER NOT NULL,
    "projeto_risco_id" INTEGER NOT NULL,

    CONSTRAINT "risco_tarefa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plano_acao" (
    "id" SERIAL NOT NULL,
    "risco_tarefa_id" INTEGER NOT NULL,
    "contramedida" TEXT NOT NULL,
    "prazo_contramedida" DATE NOT NULL,
    "custo" DOUBLE PRECISION NOT NULL,
    "custo_percentual" DOUBLE PRECISION NOT NULL,
    "medidas_contrapartida" TEXT NOT NULL,
    "orgao_id" INTEGER NOT NULL,
    "responsavel" TEXT NOT NULL,

    CONSTRAINT "plano_acao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plano_acao_monitoramento" (
    "id" SERIAL NOT NULL,
    "plano_acao_id" INTEGER NOT NULL,
    "status_risco" "StatusRisco" NOT NULL,
    "data_afericao" DATE NOT NULL,
    "descricao" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL,
    "criado_por" INTEGER NOT NULL,

    CONSTRAINT "plano_acao_monitoramento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projeto_acompanhamento" (
    "id" SERIAL NOT NULL,
    "projeto_id" INTEGER NOT NULL,
    "data_registro" DATE NOT NULL,
    "participantes" TEXT NOT NULL,
    "detalhamento" TEXT NOT NULL,
    "encaminhamento" TEXT NOT NULL,
    "prazo_encaminhamento" DATE NOT NULL,
    "responsavel" TEXT NOT NULL,
    "observacao" TEXT NOT NULL,
    "detalhamento_status" TEXT NOT NULL,
    "pontos_atencao" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL,
    "criado_por" INTEGER NOT NULL,
    "removido_em" TIMESTAMP(3) NOT NULL,
    "removido_por" INTEGER NOT NULL,

    CONSTRAINT "projeto_acompanhamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projeto_acompanhamento_risco" (
    "id" SERIAL NOT NULL,
    "projeto_risco_id" INTEGER NOT NULL,
    "projeto_acompanhamento_id" INTEGER NOT NULL,

    CONSTRAINT "projeto_acompanhamento_risco_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Diretorio_titulo_key" ON "Diretorio"("titulo");

-- AddForeignKey
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_diretorio_id_fkey" FOREIGN KEY ("diretorio_id") REFERENCES "Diretorio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_meta_id_fkey" FOREIGN KEY ("meta_id") REFERENCES "meta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_iniciativa_id_fkey" FOREIGN KEY ("iniciativa_id") REFERENCES "iniciativa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_atividade_id_fkey" FOREIGN KEY ("atividade_id") REFERENCES "atividade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_premissa" ADD CONSTRAINT "projeto_premissa_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_restricao" ADD CONSTRAINT "projeto_restricao_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_orgao" ADD CONSTRAINT "projeto_orgao_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_orgao" ADD CONSTRAINT "projeto_orgao_orgao_id_fkey" FOREIGN KEY ("orgao_id") REFERENCES "orgao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_licao_aprendida" ADD CONSTRAINT "projeto_licao_aprendida_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_licao_aprendida" ADD CONSTRAINT "projeto_licao_aprendida_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_licao_aprendida" ADD CONSTRAINT "projeto_licao_aprendida_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_fonte_recurso" ADD CONSTRAINT "projeto_fonte_recurso_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_fonte_recurso" ADD CONSTRAINT "projeto_fonte_recurso_fonte_recurso_id_fkey" FOREIGN KEY ("fonte_recurso_id") REFERENCES "fonte_recurso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_documento" ADD CONSTRAINT "projeto_documento_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_documento" ADD CONSTRAINT "projeto_documento_documento_id_fkey" FOREIGN KEY ("documento_id") REFERENCES "arquivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarefa" ADD CONSTRAINT "Tarefa_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarefa" ADD CONSTRAINT "Tarefa_tarefa_pai_id_fkey" FOREIGN KEY ("tarefa_pai_id") REFERENCES "Tarefa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarefa" ADD CONSTRAINT "Tarefa_orgao_id_fkey" FOREIGN KEY ("orgao_id") REFERENCES "orgao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefa_recurso" ADD CONSTRAINT "tarefa_recurso_tarefa_id_fkey" FOREIGN KEY ("tarefa_id") REFERENCES "Tarefa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefa_predecessora" ADD CONSTRAINT "tarefa_predecessora_tarefa_id_fkey" FOREIGN KEY ("tarefa_id") REFERENCES "Tarefa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefa_predecessora" ADD CONSTRAINT "tarefa_predecessora_tarefa_predecessora_id_fkey" FOREIGN KEY ("tarefa_predecessora_id") REFERENCES "Tarefa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_risco" ADD CONSTRAINT "projeto_risco_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risco_tarefa" ADD CONSTRAINT "risco_tarefa_tarefa_id_fkey" FOREIGN KEY ("tarefa_id") REFERENCES "Tarefa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risco_tarefa" ADD CONSTRAINT "risco_tarefa_projeto_risco_id_fkey" FOREIGN KEY ("projeto_risco_id") REFERENCES "projeto_risco"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plano_acao" ADD CONSTRAINT "plano_acao_risco_tarefa_id_fkey" FOREIGN KEY ("risco_tarefa_id") REFERENCES "risco_tarefa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plano_acao" ADD CONSTRAINT "plano_acao_orgao_id_fkey" FOREIGN KEY ("orgao_id") REFERENCES "orgao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plano_acao_monitoramento" ADD CONSTRAINT "plano_acao_monitoramento_plano_acao_id_fkey" FOREIGN KEY ("plano_acao_id") REFERENCES "plano_acao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_acompanhamento" ADD CONSTRAINT "projeto_acompanhamento_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_acompanhamento_risco" ADD CONSTRAINT "projeto_acompanhamento_risco_projeto_risco_id_fkey" FOREIGN KEY ("projeto_risco_id") REFERENCES "projeto_risco"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_acompanhamento_risco" ADD CONSTRAINT "projeto_acompanhamento_risco_projeto_acompanhamento_id_fkey" FOREIGN KEY ("projeto_acompanhamento_id") REFERENCES "projeto_acompanhamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

