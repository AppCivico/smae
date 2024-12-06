-- AlterEnum
ALTER TYPE "task_type" ADD VALUE 'refresh_variavel';

-- AlterTable
ALTER TABLE "formula_composta" ADD COLUMN     "criar_variavel" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "variavel_calc_erro" TEXT,
ADD COLUMN     "variavel_calc_id" INTEGER;

-- AlterTable
ALTER TABLE "variavel" ADD COLUMN     "recalculando" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recalculo_erro" TEXT,
ADD COLUMN     "recalculo_tempo" DECIMAL(65,30);

-- AddForeignKey
ALTER TABLE "formula_composta" ADD CONSTRAINT "formula_composta_variavel_calc_id_fkey" FOREIGN KEY ("variavel_calc_id") REFERENCES "variavel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION f_trg_formula_composta_variavel_calculada()
    RETURNS TRIGGER
    AS $emp_stamp$
DECLARE
    _debug varchar;
BEGIN
    IF NEW.variavel_calc_id IS NOT NULL THEN
        SELECT
            refresh_variavel(NEW.variavel_calc_id, '{}'::jsonb) INTO _debug;
    END IF;
    RETURN NEW;
END;
$emp_stamp$
LANGUAGE plpgsql;

CREATE TRIGGER trg_formula_composta_variavel_calculada
    AFTER INSERT OR UPDATE ON formula_composta
    FOR EACH ROW
    EXECUTE FUNCTION f_trg_formula_composta_variavel_calculada();


CREATE OR REPLACE FUNCTION ultimo_periodo_valido(pPeriodicidade "Periodicidade", pAtrasoMeses INT)
RETURNS DATE
AS $$
DECLARE
    vUltimoPeriodo DATE;
BEGIN
    vUltimoPeriodo := date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo') - (pAtrasoMeses || ' months')::interval;
    vUltimoPeriodo := vUltimoPeriodo - ((EXTRACT(MONTH FROM vUltimoPeriodo)::integer - 1) % (EXTRACT(MONTH FROM periodicidade_intervalo(pPeriodicidade))::integer)) * '1 month'::interval;

    RETURN vUltimoPeriodo;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_variavel(pVariavelId int, pInfo jsonb)
    RETURNS varchar
    AS $$
DECLARE
    current_txid bigint;
BEGIN
    UPDATE
        variavel
    SET
        recalculando = TRUE,
        recalculo_erro = NULL,
        recalculo_tempo = NULL
    WHERE
        id = pVariavelId;
    current_txid := txid_current();
    IF (pInfo IS NULL) THEN
        pInfo := '{}'::jsonb;
    END IF;
    INSERT INTO task_queue("type", params)
        VALUES ('refresh_variavel', json_build_object('variavel_id', pVariavelId, 'current_txid', current_txid)::jsonb || pInfo);
    --
    RETURN '';
END
$$
LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION monta_serie_variavel_calculada(pVariavelId INT)
RETURNS VARCHAR
AS $$
DECLARE
    vFormulaCompostaId INT;
    vFormulaComposta RECORD;
    vVariavel RECORD;
    vPeriodicidade INTERVAL;
    vPeriodoInicio DATE;
    vPeriodoFim DATE;
    vSerieAtual "Serie";
    vFormula VARCHAR;
    vJanela INT;
    vVariavelIdLookup INT;
    vSerieLookup "Serie";
    vReferencia VARCHAR;
    resultado DOUBLE PRECISION;
    vStartTime timestamp;
    vPeriodo DATE; -- Loop variable for generate_series
    vVariavelFormula RECORD; -- To store individual FormulaCompostaVariavel row
    skip_period BOOLEAN; -- Flag to skip the current period if any resultado is NULL
BEGIN
    vStartTime := clock_timestamp();

    -- Get FormulaComposta ID
    SELECT fc.id
    INTO vFormulaCompostaId
    FROM Formula_Composta fc
    WHERE fc.variavel_calc_id = pVariavelId;

    -- If no FormulaComposta is found, exit
    IF vFormulaCompostaId IS NULL THEN
        RETURN 'FormulaComposta not found for Variavel ID: ' || pVariavelId;
    END IF;

    -- Get FormulaComposta details
    SELECT fc.*
    INTO vFormulaComposta
    FROM Formula_Composta fc
    WHERE fc.id = vFormulaCompostaId;

    -- Get associated Variavel details
    SELECT v.*
    INTO vVariavel
    FROM Variavel v
    WHERE v.id = pVariavelId;

    -- Determine the calculation period
    WITH varPeriodos as (
        SELECT
            v.id,
            v.inicio_medicao,
            v.periodicidade,
            coalesce(fim_medicao, ultimo_periodo_valido( v.periodicidade::"Periodicidade" , 0)) AS fim_medicao
        FROM variavel v
        JOIN formula_composta_variavel fcv ON fcv.variavel_id = v.id
        AND fcv.formula_composta_id = vFormulaCompostaId
    )
    SELECT periodicidade_intervalo(vp.periodicidade) , MIN(vp.inicio_medicao) AS inicio_medicao, MAX(vp.fim_medicao) AS fim_medicao
    INTO
        vPeriodicidade,
        vPeriodoInicio,
        vPeriodoFim
    FROM varPeriodos vp
    GROUP BY 1
    LIMIT 1;

    -- Loop through each Serie
    FOR vSerieAtual IN
        SELECT unnest(enum_range(NULL::"Serie")) serie
    LOOP
        --raise notice 'Calculating Serie %, Periodicidade %, Periodo Inicio %, Periodo Fim %', vSerieAtual, vPeriodicidade, vPeriodoInicio, vPeriodoFim;

        -- Delete existing SerieVariavel entries for the calculated variable and current Serie
        DELETE FROM Serie_Variavel
        WHERE variavel_id = pVariavelId
            AND serie = vSerieAtual;

        -- Loop through each period within the calculation range
        FOR vPeriodo IN SELECT generate_series(vPeriodoInicio, vPeriodoFim, vPeriodicidade)
        LOOP
            --raise notice 'Calculating Period %', vPeriodo;

            -- Construct the formula expression
            vFormula := vFormulaComposta.formula_compilada;

            -- Initialize skip_period flag for each period
            skip_period := FALSE;

            -- Fetch and iterate over FormulaCompostaVariavel entries within the loop
            FOR vVariavelFormula IN
                SELECT fcv.*
                FROM Formula_Composta_Variavel fcv
                WHERE fcv.formula_composta_id = vFormulaCompostaId
            LOOP
                -- Extract relevant data from vVariavelFormula
                vJanela := vVariavelFormula.janela;
                vReferencia := vVariavelFormula.referencia;
                vVariavelIdLookup := vVariavelFormula.variavel_id;

                vSerieLookup := vSerieAtual; -- Initialize with current Serie
                IF vVariavelFormula.usar_serie_acumulada THEN
                    SELECT
                        CASE
                            WHEN vSerieLookup = 'Previsto' THEN 'PrevistoAcumulado'
                            WHEN vSerieLookup = 'Realizado' THEN 'RealizadoAcumulado'
                            ELSE vSerieLookup
                        END
                    INTO vSerieLookup;
                END IF;

                -- Atraso Handling
                IF vJanela = 1 THEN
                    SELECT
                        valor_nominal
                    INTO resultado
                    FROM Serie_Variavel
                    WHERE variavel_id = vVariavelIdLookup
                        AND serie = vSerieLookup
                        AND data_valor <= vPeriodo
                        AND data_valor > vPeriodo - (vJanela || ' months')::interval;
                ELSIF vJanela > 1 THEN
                    -- Average of Past N Periods
                    SELECT
                        AVG(valor_nominal)
                    INTO resultado
                    FROM Serie_Variavel
                    WHERE variavel_id = vVariavelIdLookup
                        AND serie = vSerieLookup
                        AND data_valor <= vPeriodo
                        AND data_valor > vPeriodo - (vJanela || ' months')::interval;
                ELSIF vJanela < 1 THEN
                    -- Past Period (N months ago)
                    SELECT
                        valor_nominal
                    INTO resultado
                    FROM Serie_Variavel
                    WHERE variavel_id = vVariavelIdLookup
                        AND serie = vSerieLookup
                        AND data_valor = vPeriodo - (abs(vJanela) || ' months')::interval;
                END IF;

                -- Check if resultado is NULL and set skip_period flag
                IF resultado IS NULL THEN
                    skip_period := TRUE;
                    EXIT; -- Exit the inner loop if any resultado is NULL
                END IF;

                -- Replace placeholders with calculated values
                vFormula := replace(vFormula, '$' || vReferencia, 'round(' || resultado::text || ', ' || vVariavel.casas_decimais || ')');
            END LOOP;

            -- Skip evaluation and insertion if skip_period is TRUE
            IF skip_period THEN
                --raise notice 'Skipping period % due to missing value.', vPeriodo;
                CONTINUE;
            END IF;

            -- Evaluate the expression and insert the result into Serie_Variavel
            EXECUTE 'SELECT ' || vFormula INTO resultado;
            INSERT INTO Serie_Variavel (variavel_id, serie, data_valor, valor_nominal)
            VALUES (pVariavelId, vSerieAtual, vPeriodo, resultado);
        END LOOP;
    END LOOP;

    --RAISE NOTICE 'monta_serie_variavel_calculada (%s) demorou %', pVariavelId, clock_timestamp() - vStartTime;

    RETURN '';
END;
$$ LANGUAGE plpgsql;

