-- CreateEnum
CREATE TYPE "StatusNota" AS ENUM ('Programado', 'Em Curso', 'Suspenso', 'Encerrado', 'Cancelado');

-- CreateTable
CREATE TABLE "bloco_nota" (
    "id" SERIAL NOT NULL,
    "bloco" TEXT NOT NULL,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6),
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "bloco_nota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipo_nota" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "permite_revisao" BOOLEAN NOT NULL,
    "permite_enderecamento" BOOLEAN NOT NULL,
    "permite_email" BOOLEAN NOT NULL,
    "permite_replica" BOOLEAN NOT NULL,
    "visivel_resp_orgao" BOOLEAN NOT NULL,
    "eh_publico" BOOLEAN NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_em" TIMESTAMPTZ(6),
    "atualizado_em" TIMESTAMPTZ(6),

    CONSTRAINT "tipo_nota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipo_nota_modulo" (
    "id" SERIAL NOT NULL,
    "modulo_sistema" "ModuloSistema" NOT NULL,
    "tipo_nota_id" INTEGER NOT NULL,

    CONSTRAINT "tipo_nota_modulo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nota" (
    "id" SERIAL NOT NULL,
    "bloco_nota_id" INTEGER NOT NULL,
    "tipo_nota_id" INTEGER NOT NULL,
    "data_nota" TIMESTAMP(3) NOT NULL,
    "orgao_responsavel_id" INTEGER NOT NULL,
    "pessoa_responsavel_id" INTEGER NOT NULL,
    "nota" TEXT NOT NULL,
    "rever_em" TIMESTAMP(3),
    "dispara_email" BOOLEAN NOT NULL DEFAULT false,
    "status" "StatusNota" NOT NULL,
    "n_encaminhamentos" INTEGER NOT NULL DEFAULT 0,
    "n_repostas" INTEGER NOT NULL DEFAULT 0,
    "ultima_resposta" TIMESTAMP(3),
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "nota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nota_revisao" (
    "id" SERIAL NOT NULL,
    "nota_id" INTEGER NOT NULL,
    "nota" TEXT NOT NULL,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nota_revisao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nota_enderecamento" (
    "id" SERIAL NOT NULL,
    "nota_id" INTEGER NOT NULL,
    "orgao_enderecado_id" INTEGER NOT NULL,
    "pessoa_enderecado_id" INTEGER,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "nota_enderecamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nota_enderecamento_resposta" (
    "id" SERIAL NOT NULL,
    "nota_id" INTEGER NOT NULL,
    "nota_enderecamento_id" INTEGER NOT NULL,
    "resposta" TEXT NOT NULL,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "nota_enderecamento_resposta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tipo_nota_codigo_key" ON "tipo_nota"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "tipo_nota_modulo_modulo_sistema_tipo_nota_id_key" ON "tipo_nota_modulo"("modulo_sistema", "tipo_nota_id");

-- CreateIndex
CREATE INDEX "nota_data_nota_status_idx" ON "nota"("data_nota", "status");

-- CreateIndex
CREATE INDEX "nota_rever_em_idx" ON "nota"("rever_em");

-- CreateIndex
CREATE INDEX "nota_enderecamento_nota_id_idx" ON "nota_enderecamento"("nota_id");

-- AddForeignKey
ALTER TABLE "bloco_nota" ADD CONSTRAINT "bloco_nota_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloco_nota" ADD CONSTRAINT "bloco_nota_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloco_nota" ADD CONSTRAINT "bloco_nota_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tipo_nota_modulo" ADD CONSTRAINT "tipo_nota_modulo_tipo_nota_id_fkey" FOREIGN KEY ("tipo_nota_id") REFERENCES "tipo_nota"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota" ADD CONSTRAINT "nota_tipo_nota_id_fkey" FOREIGN KEY ("tipo_nota_id") REFERENCES "tipo_nota"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota" ADD CONSTRAINT "nota_bloco_nota_id_fkey" FOREIGN KEY ("bloco_nota_id") REFERENCES "bloco_nota"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota" ADD CONSTRAINT "nota_orgao_responsavel_id_fkey" FOREIGN KEY ("orgao_responsavel_id") REFERENCES "orgao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota" ADD CONSTRAINT "nota_pessoa_responsavel_id_fkey" FOREIGN KEY ("pessoa_responsavel_id") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota" ADD CONSTRAINT "nota_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota" ADD CONSTRAINT "nota_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota_revisao" ADD CONSTRAINT "nota_revisao_nota_id_fkey" FOREIGN KEY ("nota_id") REFERENCES "nota"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota_enderecamento" ADD CONSTRAINT "nota_enderecamento_nota_id_fkey" FOREIGN KEY ("nota_id") REFERENCES "nota"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota_enderecamento" ADD CONSTRAINT "nota_enderecamento_orgao_enderecado_id_fkey" FOREIGN KEY ("orgao_enderecado_id") REFERENCES "orgao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota_enderecamento" ADD CONSTRAINT "nota_enderecamento_pessoa_enderecado_id_fkey" FOREIGN KEY ("pessoa_enderecado_id") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota_enderecamento" ADD CONSTRAINT "nota_enderecamento_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota_enderecamento" ADD CONSTRAINT "nota_enderecamento_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota_enderecamento_resposta" ADD CONSTRAINT "nota_enderecamento_resposta_nota_id_fkey" FOREIGN KEY ("nota_id") REFERENCES "nota"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota_enderecamento_resposta" ADD CONSTRAINT "nota_enderecamento_resposta_nota_enderecamento_id_fkey" FOREIGN KEY ("nota_enderecamento_id") REFERENCES "nota_enderecamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota_enderecamento_resposta" ADD CONSTRAINT "nota_enderecamento_resposta_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota_enderecamento_resposta" ADD CONSTRAINT "nota_enderecamento_resposta_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
