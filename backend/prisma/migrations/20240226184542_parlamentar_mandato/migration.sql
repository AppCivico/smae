-- CreateEnum
CREATE TYPE "EleicaoTipo" AS ENUM ('Municipal', 'Estadual');

-- CreateEnum
CREATE TYPE "ParlamentarCargo" AS ENUM ('DeputadoEstadual', 'DeputadoFederal', 'Vereador');

-- CreateEnum
CREATE TYPE "ParlamentarSuplente" AS ENUM ('PrimeiroSuplente', 'SegundoSuplente');

-- CreateTable
CREATE TABLE "eleicao" (
    "id" SERIAL NOT NULL,
    "tipo" "EleicaoTipo" NOT NULL,
    "ano" INTEGER NOT NULL,
    "atual_para_mandatos" BOOLEAN NOT NULL,

    CONSTRAINT "eleicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parlamentar" (
    "id" SERIAL NOT NULL,
    "regiao_id" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "nome_popular" TEXT,
    "nascimento" DATE,
    "telefone" TEXT,
    "email" TEXT,
    "gabinete" TEXT,
    "endereco" TEXT,
    "atuacao" TEXT,
    "em_atividade" BOOLEAN NOT NULL DEFAULT false,
    "criado_por" INTEGER,
    "criado_em" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "parlamentar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParlamentarMandato" (
    "id" SERIAL NOT NULL,
    "parlamentar_id" INTEGER NOT NULL,
    "eleicao_id" INTEGER NOT NULL,
    "partido_candidatura_id" INTEGER NOT NULL,
    "partido_atual_id" INTEGER NOT NULL,
    "eleito" BOOLEAN,
    "cargo" "ParlamentarCargo" NOT NULL,
    "suplencia" "ParlamentarSuplente" NOT NULL,
    "atuacao" TEXT,
    "votos_estado" BIGINT,
    "votos_capital" BIGINT,
    "votos_interior" BIGINT,
    "mandato_principal_id" INTEGER,
    "criado_por" INTEGER,
    "criado_em" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "ParlamentarMandato_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "eleicao_tipo_ano_idx" ON "eleicao"("tipo", "ano");

-- AddForeignKey
ALTER TABLE "parlamentar" ADD CONSTRAINT "parlamentar_regiao_id_fkey" FOREIGN KEY ("regiao_id") REFERENCES "regiao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parlamentar" ADD CONSTRAINT "parlamentar_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parlamentar" ADD CONSTRAINT "parlamentar_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parlamentar" ADD CONSTRAINT "parlamentar_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParlamentarMandato" ADD CONSTRAINT "ParlamentarMandato_parlamentar_id_fkey" FOREIGN KEY ("parlamentar_id") REFERENCES "parlamentar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParlamentarMandato" ADD CONSTRAINT "ParlamentarMandato_eleicao_id_fkey" FOREIGN KEY ("eleicao_id") REFERENCES "eleicao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParlamentarMandato" ADD CONSTRAINT "ParlamentarMandato_partido_candidatura_id_fkey" FOREIGN KEY ("partido_candidatura_id") REFERENCES "partido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParlamentarMandato" ADD CONSTRAINT "ParlamentarMandato_partido_atual_id_fkey" FOREIGN KEY ("partido_atual_id") REFERENCES "partido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParlamentarMandato" ADD CONSTRAINT "ParlamentarMandato_mandato_principal_id_fkey" FOREIGN KEY ("mandato_principal_id") REFERENCES "ParlamentarMandato"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParlamentarMandato" ADD CONSTRAINT "ParlamentarMandato_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParlamentarMandato" ADD CONSTRAINT "ParlamentarMandato_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParlamentarMandato" ADD CONSTRAINT "ParlamentarMandato_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
