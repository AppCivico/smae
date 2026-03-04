-- CreateTable
CREATE TABLE "demanda_config" (
    "id" SERIAL NOT NULL,
    "data_inicio_vigencia" DATE NOT NULL,
    "data_fim_vigencia" DATE,
    "valor_minimo" DECIMAL(15,2) NOT NULL,
    "valor_maximo" DECIMAL(15,2) NOT NULL,
    "bloqueio_valor_min" BOOLEAN NOT NULL DEFAULT true,
    "bloqueio_valor_max" BOOLEAN NOT NULL DEFAULT false,
    "alerta_valor_min" BOOLEAN NOT NULL DEFAULT false,
    "alerta_valor_max" BOOLEAN NOT NULL DEFAULT true,
    "observacao" TEXT,
    "ativo" BOOLEAN,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "demanda_config_pkey" PRIMARY KEY ("id")
);

ALTER TABLE demanda_config
ADD CONSTRAINT demanda_config_valor_minimo_non_negative
CHECK (valor_minimo >= 0);

ALTER TABLE demanda_config
ADD CONSTRAINT demanda_config_valor_maximo_non_negative
CHECK (valor_maximo >= 0);

ALTER TABLE demanda_config
ADD CONSTRAINT demanda_config_valor_maximo_greater_equal_minimo
CHECK (valor_maximo >= valor_minimo);

ALTER TABLE demanda_config
ADD CONSTRAINT demanda_config_ativo_initial_value
CHECK (ativo IS NULL OR ativo = true);



-- CreateTable
CREATE TABLE "demanda_config_arquivo" (
    "id" SERIAL NOT NULL,
    "demanda_config_id" INTEGER NOT NULL,
    "arquivo_id" INTEGER NOT NULL,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "demanda_config_arquivo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "demanda_config_ativo_removido_em_idx" ON "demanda_config"("ativo", "removido_em");

-- CreateUniqueIndex (partial unique constraint for only one active record)
CREATE UNIQUE INDEX "demanda_config_unico_ativo" ON "demanda_config"("ativo") WHERE ("ativo" = true AND "removido_em" IS NULL);

-- AddForeignKey
ALTER TABLE "demanda_config" ADD CONSTRAINT "demanda_config_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demanda_config" ADD CONSTRAINT "demanda_config_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demanda_config" ADD CONSTRAINT "demanda_config_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demanda_config_arquivo" ADD CONSTRAINT "demanda_config_arquivo_demanda_config_id_fkey" FOREIGN KEY ("demanda_config_id") REFERENCES "demanda_config"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demanda_config_arquivo" ADD CONSTRAINT "demanda_config_arquivo_arquivo_id_fkey" FOREIGN KEY ("arquivo_id") REFERENCES "arquivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demanda_config_arquivo" ADD CONSTRAINT "demanda_config_arquivo_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demanda_config_arquivo" ADD CONSTRAINT "demanda_config_arquivo_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
