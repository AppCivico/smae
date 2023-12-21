-- AlterTable
ALTER TABLE "variavel" ADD COLUMN     "suspendida_em" TIMESTAMPTZ(6);

-- CreateTable
CREATE TABLE "variavel_suspensao_log" (
    "variavel_id" INTEGER NOT NULL,
    "pessoa_id" INTEGER NOT NULL,
    "suspendida" BOOLEAN NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL
);

-- CreateTable
CREATE TABLE "variavel_suspensa_controle" (
    "id" SERIAL NOT NULL,
    "variavel_id" INTEGER NOT NULL,
    "ciclo_fisico_base_id" INTEGER NOT NULL,
    "ciclo_fisico_corrente_id" INTEGER NOT NULL,
    "serie" "Serie" NOT NULL,
    "valor_antigo" DECIMAL(65,30),
    "valor_novo" DECIMAL(65,30),
    "processado_em" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "variavel_suspensa_controle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "variavel_suspensao_log_variavel_id_key" ON "variavel_suspensao_log"("variavel_id");

-- CreateIndex
CREATE UNIQUE INDEX "variavel_suspensa_controle_variavel_id_ciclo_fisico_corrent_key" ON "variavel_suspensa_controle"("variavel_id", "ciclo_fisico_corrente_id", "serie");

-- AddForeignKey
ALTER TABLE "variavel_suspensao_log" ADD CONSTRAINT "variavel_suspensao_log_variavel_id_fkey" FOREIGN KEY ("variavel_id") REFERENCES "variavel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel_suspensao_log" ADD CONSTRAINT "variavel_suspensao_log_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel_suspensa_controle" ADD CONSTRAINT "variavel_suspensa_controle_variavel_id_fkey" FOREIGN KEY ("variavel_id") REFERENCES "variavel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel_suspensa_controle" ADD CONSTRAINT "variavel_suspensa_controle_ciclo_fisico_base_id_fkey" FOREIGN KEY ("ciclo_fisico_base_id") REFERENCES "ciclo_fisico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel_suspensa_controle" ADD CONSTRAINT "variavel_suspensa_controle_ciclo_fisico_corrente_id_fkey" FOREIGN KEY ("ciclo_fisico_corrente_id") REFERENCES "ciclo_fisico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
