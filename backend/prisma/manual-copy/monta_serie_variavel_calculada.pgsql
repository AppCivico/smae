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
            coalesce(fim_medicao, ultimo_periodo_valido( v.periodicidade, 0)) AS fim_medicao
        FROM variavel v
        JOIN formula_composta_variavel fcv ON fcv.variavel_id = v.id
        AND fcv.formula_composta_id = vFormulaCompostaId
    )
    SELECT periodicidade, MIN(inicio_medicao) AS inicio_medicao, MAX(fim_medicao) AS fim_medicao
    INTO
        vPeriodicidade,
        vPeriodoInicio,
        vPeriodoFim
    FROM varPeriodos
    GROUP BY 1
    LIMIT 1;

    -- Loop through each Serie
    FOR vSerieAtual IN
        SELECT unnest(enum_range(NULL::"Serie")) serie
    LOOP
        -- Delete existing SerieVariavel entries for the calculated variable and current Serie
        DELETE FROM Serie_Variavel
        WHERE variavel_id = pVariavelId
            AND serie = vSerieAtual;

        -- Loop through each period within the calculation range
        FOR vPeriodo IN SELECT generate_series(vPeriodoInicio, vPeriodoFim, vPeriodicidade)
        LOOP
            -- Construct the formula expression
            vFormula := vFormulaComposta.formula_compilada;

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
                        COALESCE(valor_nominal, 0)
                    INTO resultado
                    FROM SerieVariavel
                    WHERE variavel_id = vVariavelIdLookup
                        AND serie = vSerieLookup
                        AND data_valor <= vPeriodo
                        AND data_valor > pPeriodo - (vJanela || ' months')::interval;
                ELSIF vJanela > 1 THEN
                    -- Average of Past N Periods
                    SELECT
                        COALESCE(AVG(valor_nominal), 0)
                    INTO resultado
                    FROM SerieVariavel
                    WHERE variavel_id = vVariavelIdLookup
                        AND serie = vSerieLookup
                        AND data_valor <= vPeriodo
                        AND data_valor > vPeriodo - (vJanela || ' months')::interval;
                ELSIF vJanela < 1 THEN
                    -- Past Period (N months ago)
                    SELECT
                        COALESCE(valor_nominal, 0)
                    INTO resultado
                    FROM SerieVariavel
                    WHERE variavel_id = vVariavelIdLookup
                        AND serie = vSerieLookup
                        AND data_valor = vPeriodo - (abs(vJanela) || ' months')::interval;
                END IF;

                -- Replace placeholders with calculated values
                vFormula := replace(vFormula, '$' || vReferencia, 'round(' || coalesce(resultado, 0)::text || ', ' || vVariavel.casas_decimais || ')');
            END LOOP;

            -- Evaluate the expression and insert the result into SerieVariavel
            EXECUTE 'SELECT ' || vFormula INTO resultado;
            INSERT INTO Serie_Variavel (variavel_id, serie, data_valor, valor_nominal)
            VALUES (pVariavelId, vSerieAtual, vPeriodo, resultado);
        END LOOP;
    END LOOP;

    RAISE NOTICE 'monta_serie_variavel_calculada (%s) demorou %', pVariavelId, clock_timestamp() - vStartTime;

    RETURN '';
END;
$$ LANGUAGE plpgsql;