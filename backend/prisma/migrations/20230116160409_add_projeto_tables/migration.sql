-- CreateEnum
CREATE TYPE "ProjetoRecursoTipoValor" AS ENUM ('Percentual', 'Nominal');

-- CreateTable
CREATE TABLE "projeto" (
    "id" SERIAL NOT NULL,
    "meta_id" INTEGER,
    "iniciativa_id" INTEGER,
    "atividade_id" INTEGER,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "objeto" TEXT NOT NULL,
    "objetivo" TEXT NOT NULL,
    "origem" TEXT NOT NULL,
    "publico_alvo" TEXT NOT NULL,
    "previsao_inicio" TIMESTAMP(3),
    "previsao_termino" TIMESTAMP(3),
    "previsao_duracao" INTEGER,
    "previsao_custo" DOUBLE PRECISION,
    "inicio_real" TIMESTAMP(3),
    "termino_real" TIMESTAMP(3),
    "custo_real" DOUBLE PRECISION,

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
CREATE TABLE "projeto_licoes_aprendidas" (
    "id" SERIAL NOT NULL,
    "projeto_id" INTEGER NOT NULL,
    "pessoa_id" INTEGER NOT NULL,
    "data_registro" TIMESTAMP(3) NOT NULL,
    "descricao" TEXT NOT NULL,
    "observacao" TEXT,

    CONSTRAINT "projeto_licoes_aprendidas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projeto_recurso" (
    "id" SERIAL NOT NULL,
    "projeto_id" INTEGER NOT NULL,
    "fonte_recurso_id" INTEGER NOT NULL,
    "valor" DOUBLE PRECISION,
    "tipo_valor" "ProjetoRecursoTipoValor" NOT NULL,

    CONSTRAINT "projeto_recurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projeto_documento" (
    "id" SERIAL NOT NULL,
    "projeto_id" INTEGER NOT NULL,
    "documento_id" INTEGER NOT NULL,

    CONSTRAINT "projeto_documento_pkey" PRIMARY KEY ("id")
);

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
ALTER TABLE "projeto_licoes_aprendidas" ADD CONSTRAINT "projeto_licoes_aprendidas_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_licoes_aprendidas" ADD CONSTRAINT "projeto_licoes_aprendidas_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_recurso" ADD CONSTRAINT "projeto_recurso_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_recurso" ADD CONSTRAINT "projeto_recurso_fonte_recurso_id_fkey" FOREIGN KEY ("fonte_recurso_id") REFERENCES "fonte_recurso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_documento" ADD CONSTRAINT "projeto_documento_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
