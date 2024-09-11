-- CreateEnum
CREATE TYPE "VariavelFase" AS ENUM ('Preenchimento', 'Validacao', 'Liberacao');

-- CreateTable
CREATE TABLE "variavel_ciclo_corrente" (
    "id" SERIAL NOT NULL,
    "variavel_id" INTEGER NOT NULL,
    "fase" "VariavelFase" NOT NULL,
    "proximo_periodo_abertura" DATE NOT NULL,
    "ultimo_periodo_valido" DATE NOT NULL,

    CONSTRAINT "variavel_ciclo_corrente_pkey" PRIMARY KEY ("id")
);

CREATE unique index "variavel_ciclo_corrente_variavel_id_key" on "variavel_ciclo_corrente"("variavel_id");

-- CreateTable
CREATE TABLE "variavel_global_ciclo_analise" (
    "id" SERIAL NOT NULL,
    "variavel_id" INTEGER NOT NULL,
    "referencia_data" DATE NOT NULL,
    "informacoes_complementares" TEXT,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por" INTEGER NOT NULL,
    "ultima_revisao" BOOLEAN NOT NULL,
    "removido_em" TIMESTAMP(3),
    "removido_por" INTEGER,

    CONSTRAINT "variavel_global_ciclo_analise_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "variavel_global_ciclo_analise" ADD COLUMN     "valores" JSONB NOT NULL;

-- CreateTable
CREATE TABLE "variavel_global_ciclo_documento" (
    "id" SERIAL NOT NULL,
    "variavel_id" INTEGER NOT NULL,
    "referencia_data" DATE NOT NULL,
    "arquivo_id" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por" INTEGER NOT NULL,
    "removido_em" TIMESTAMP(3),
    "removido_por" INTEGER,

    CONSTRAINT "variavel_global_ciclo_documento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "variavel_global_ciclo_analise_variavel_id_ultima_revisao_idx" ON "variavel_global_ciclo_analise"("variavel_id", "ultima_revisao");

-- CreateIndex
CREATE INDEX "variavel_global_ciclo_documento_variavel_id_idx" ON "variavel_global_ciclo_documento"("variavel_id");

-- AddForeignKey
ALTER TABLE "variavel_ciclo_corrente" ADD CONSTRAINT "variavel_ciclo_corrente_variavel_id_fkey" FOREIGN KEY ("variavel_id") REFERENCES "variavel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel_global_ciclo_analise" ADD CONSTRAINT "variavel_global_ciclo_analise_variavel_id_fkey" FOREIGN KEY ("variavel_id") REFERENCES "variavel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel_global_ciclo_analise" ADD CONSTRAINT "variavel_global_ciclo_analise_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel_global_ciclo_analise" ADD CONSTRAINT "variavel_global_ciclo_analise_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel_global_ciclo_documento" ADD CONSTRAINT "variavel_global_ciclo_documento_arquivo_id_fkey" FOREIGN KEY ("arquivo_id") REFERENCES "arquivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel_global_ciclo_documento" ADD CONSTRAINT "variavel_global_ciclo_documento_variavel_id_fkey" FOREIGN KEY ("variavel_id") REFERENCES "variavel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel_global_ciclo_documento" ADD CONSTRAINT "variavel_global_ciclo_documento_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel_global_ciclo_documento" ADD CONSTRAINT "variavel_global_ciclo_documento_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;


CREATE OR REPLACE FUNCTION periodicidade_intervalo (p "Periodicidade")
    RETURNS interval
    LANGUAGE SQL IMMUTABLE
    AS $$
    SELECT
        CASE WHEN p = 'Mensal' THEN
            '1 month'::interval
        WHEN p = 'Bimestral' THEN
            '2 month'::interval
        WHEN p = 'Trimestral' THEN
            '3 month'::interval
        WHEN p = 'Quadrimestral' THEN
            '4 month'::interval
        WHEN p = 'Semestral' THEN
            '6 month'::interval
        WHEN p = 'Anual' THEN
            '1 year'::interval
        WHEN p = 'Quinquenal' THEN
            '5 year'::interval
        WHEN p = 'Secular' THEN
            '100 year'::interval
        ELSE
            NULL
        END;
$$;

CREATE OR REPLACE FUNCTION f_atualiza_todas_variaveis() RETURNS void AS $$
DECLARE
    v_record RECORD;
BEGIN
    FOR v_record IN (
        SELECT id
        FROM variavel
        WHERE tipo = 'Global'
        AND variavel_mae_id IS NULL
        AND removido_em IS NULL
    ) LOOP
        BEGIN
            PERFORM update_variable_state_by_id(v_record.id);
        EXCEPTION WHEN OTHERS THEN
            -- só faz o log do erro e continua o loop
            RAISE NOTICE 'Erro ID %: %', v_record.id, SQLERRM;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION f_atualiza_variavel_ciclo_corrente(p_variavel_id INT) RETURNS void AS $$
DECLARE
    v_record RECORD;
    v_last_valid_period DATE;
BEGIN
    SELECT id, periodicidade, atraso_meses
    INTO v_record
    FROM variavel
    WHERE id = p_variavel_id
      AND tipo = 'Global'
      AND variavel_mae_id IS NULL
      AND removido_em IS NULL;

    IF v_record IS NULL THEN
        RAISE NOTICE 'Variável com ID % não encontrada ou != global/mae', p_variavel_id;
        RETURN;
    END IF;

    SELECT ultimo_periodo_valido(v_record.periodicidade, v_record.atraso_meses) INTO v_last_valid_period;

    INSERT INTO variavel_ciclo_corrente (variavel_id, ultimo_periodo_valido, fase, proximo_periodo_abertura)
    VALUES (v_record.id, v_last_valid_period, 'Preenchimento', v_last_valid_period + (v_record.atraso_meses || ' months')::INTERVAL)
    ON CONFLICT (variavel_id) DO UPDATE
    SET ultimo_periodo_valido = EXCLUDED.ultimo_periodo_valido,
        proximo_periodo_abertura = EXCLUDED.proximo_periodo_abertura;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Falha ao atualizar variavel_ciclo_corrente para variável ID %', p_variavel_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION f_trigger_update_variavel_ciclo() RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') OR (TG_OP = 'INSERT') THEN
        PERFORM f_atualiza_variavel_ciclo_corrente(NEW.id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tgr_update_variavel_ciclo_corrente
AFTER UPDATE ON variavel
FOR EACH ROW
WHEN ((OLD.fim_medicao IS DISTINCT FROM NEW.fim_medicao OR
      OLD.periodo_preenchimento IS DISTINCT FROM NEW.periodo_preenchimento OR
      OLD.periodo_validacao IS DISTINCT FROM NEW.periodo_validacao OR
      OLD.periodo_liberacao IS DISTINCT FROM NEW.periodo_liberacao))
EXECUTE FUNCTION f_trigger_update_variavel_ciclo();

CREATE TRIGGER tgr_insert_variavel_ciclo_corrente
AFTER INSERT ON variavel
FOR EACH ROW
EXECUTE FUNCTION f_trigger_update_variavel_ciclo();

