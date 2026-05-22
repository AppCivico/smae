-- Add new investimento columns (nullable initially for backfill)
ALTER TABLE "demanda_config"
    ADD COLUMN "valor_minimo_investimento" DECIMAL(15,2),
    ADD COLUMN "valor_maximo_investimento" DECIMAL(15,2);

-- Backfill from existing custeio columns
UPDATE "demanda_config"
    SET "valor_minimo_investimento" = "valor_minimo",
        "valor_maximo_investimento" = "valor_maximo";

-- Enforce NOT NULL after backfill
ALTER TABLE "demanda_config"
    ALTER COLUMN "valor_minimo_investimento" SET NOT NULL,
    ALTER COLUMN "valor_maximo_investimento" SET NOT NULL;

-- Mirror the existing CHECK constraints for the investimento pair
ALTER TABLE "demanda_config"
    ADD CONSTRAINT demanda_config_valor_minimo_investimento_non_negative
    CHECK (valor_minimo_investimento >= 0);

ALTER TABLE "demanda_config"
    ADD CONSTRAINT demanda_config_valor_maximo_investimento_non_negative
    CHECK (valor_maximo_investimento >= 0);

ALTER TABLE "demanda_config"
    ADD CONSTRAINT demanda_config_valor_maximo_investimento_gte_minimo
    CHECK (valor_maximo_investimento >= valor_minimo_investimento);
