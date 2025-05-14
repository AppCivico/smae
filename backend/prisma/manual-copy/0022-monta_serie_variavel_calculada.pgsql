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
    vPeriodo DATE;
    vVariavelFormula RECORD;
    skip_period BOOLEAN;
    vElementos INT[][];
    vCategoricaJSON JSON;
BEGIN
    vStartTime := clock_timestamp();

    EXECUTE pg_advisory_xact_lock(pVariavelId::bigint);

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
            coalesce(
                    fim_medicao,
                    case when v.inicio_medicao is null then null else ultimo_periodo_valido( v.periodicidade::"Periodicidade" , 0, v.inicio_medicao) end
            ) AS fim_medicao
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

    IF vPeriodicidade IS NULL THEN
        RETURN 'FormulaComposta sem periodo, provavelmente faltando data de inicio de medicao - ' || pVariavelId;
    END IF;

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


            IF vVariavel.variavel_categorica_id IS NOT NULL THEN
                -- Initiate vElementos tuple
                vElementos := ARRAY[]::INT[][];
            ELSE
                vElementos := NULL;
            END IF;

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

                    IF resultado IS NOT NULL AND vVariavel.variavel_categorica_id IS NOT NULL THEN
                        -- Use array concatenation operator instead of array_append
                        vElementos := vElementos || ARRAY[ARRAY[vVariavelIdLookup, resultado::int]];
                    END IF;

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

                    IF resultado IS NOT NULL AND vVariavel.variavel_categorica_id IS NOT NULL THEN
                        -- Use array concatenation operator instead of array_append
                        vElementos := vElementos || ARRAY[ARRAY[vVariavelIdLookup, resultado::int]];
                    END IF;
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

            -- Put into vCategoriaJSON if vElementos is not null on key categorica
            IF vVariavel.variavel_categorica_id IS NOT NULL THEN
                vCategoricaJSON := json_build_object('categorica', vElementos);
            END IF;

            -- Evaluate the expression and insert the result into Serie_Variavel
            EXECUTE 'SELECT ' || vFormula INTO resultado;
            INSERT INTO Serie_Variavel (variavel_id, serie, data_valor, valor_nominal, elementos)
            VALUES (pVariavelId, vSerieAtual, vPeriodo, resultado, vCategoricaJSON);
        END LOOP;
    END LOOP;

    --RAISE NOTICE 'monta_serie_variavel_calculada (%s) demorou %', pVariavelId, clock_timestamp() - vStartTime;

    RETURN '';
END;
$$ LANGUAGE plpgsql;
