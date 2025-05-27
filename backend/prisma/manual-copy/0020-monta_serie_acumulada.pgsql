CREATE OR REPLACE FUNCTION monta_serie_acumulada (pVariavelId int, eh_serie_realizado boolean)
    RETURNS varchar
    AS $$
DECLARE
    serieRecord record;
    vPeriodicidade interval;
    vTipoSerie "Serie";
    vVariavelBase numeric;
    vVariavelNumeroCasas integer;
    vInicio date;
    vFim date; -- Data fim original, baseada nos períodos da variável
    vFimCalculo date; -- Data fim a ser usada no cálculo, potencialmente ajustada pelos flags
    vAcumulativa boolean;
    vFeatureFlagRealizadoApenasPassado boolean; -- Flag para ACUMULADO_REALIZADO_APENAS_PASSADO
    vFeatureFlagPrevistoApenasPassado boolean;  -- Flag para ACUMULADO_PREVISTO_APENAS_PASSADO
    vUltimoRealizado date;
    vUltimoPrevisto date;
    vNow date;
BEGIN
    EXECUTE pg_advisory_xact_lock(pVariavelId::bigint);

    vNow := (date_trunc('day', NOW() AT TIME ZONE 'America/Sao_Paulo'))::date;

    -- --- Feature Flags ---
    SELECT value::boolean
    INTO vFeatureFlagRealizadoApenasPassado
    FROM smae_config
    WHERE key = 'ACUMULADO_REALIZADO_APENAS_PASSADO'
    LIMIT 1;
    vFeatureFlagRealizadoApenasPassado := COALESCE(vFeatureFlagRealizadoApenasPassado, false);

    SELECT value::boolean
    INTO vFeatureFlagPrevistoApenasPassado -- Renamed key
    FROM smae_config
    WHERE key = 'ACUMULADO_PREVISTO_APENAS_PASSADO' -- Use the new key name
    LIMIT 1;
    vFeatureFlagPrevistoApenasPassado := COALESCE(vFeatureFlagPrevistoApenasPassado, false);


    -- --- Coleta informações da variável e seus períodos ---
    WITH indicador_info AS (
         SELECT iv.variavel_id, iv.indicador_id
         FROM indicador_variavel iv
         WHERE iv.indicador_origem_id IS NULL
         AND iv.desativado = FALSE
         AND iv.variavel_id = pVariavelId
     ),
     periodo_data AS (
         SELECT
             v.id AS variavel_id,
             v.acumulativa,
             v.tipo,
             CASE
                 WHEN v.tipo = 'Global' THEN
                     (SELECT me.periodicidade::INTERVAL FROM busca_periodos_variavel(v.id) me)
                 WHEN v.tipo = 'PDM' THEN
                     (SELECT me.periodicidade::INTERVAL FROM busca_periodos_variavel(v.id, ii.indicador_id) me)
                 ELSE NULL::INTERVAL
             END AS periodicidade,
             CASE
                 WHEN v.tipo = 'Global' THEN
                     (SELECT min FROM busca_periodos_variavel(v.id))
                 WHEN v.tipo = 'PDM' THEN
                     (SELECT min FROM busca_periodos_variavel(v.id, ii.indicador_id))
                 ELSE NULL::date
             END AS inicio_medicao,
             CASE
                 WHEN v.tipo = 'Global' THEN
                     (SELECT max FROM busca_periodos_variavel(v.id))
                 WHEN v.tipo = 'PDM' THEN
                     (SELECT max FROM busca_periodos_variavel(v.id, ii.indicador_id))
                 ELSE NULL::date
             END AS fim_medicao
         FROM variavel v
         LEFT JOIN indicador_info ii ON v.id = ii.variavel_id
         WHERE v.id = pVariavelId
     )
     SELECT
         CASE
             WHEN eh_serie_realizado IS NULL THEN NULL
             WHEN eh_serie_realizado THEN 'Realizado'::"Serie"
             ELSE 'Previsto'::"Serie"
         END AS tipo_serie,
         v.valor_base,
         pd.periodicidade,
         pd.inicio_medicao,
         pd.fim_medicao,
         v.casas_decimais,
         pd.acumulativa
     INTO
         vTipoSerie,
         vVariavelBase,
         vPeriodicidade,
         vInicio,
         vFim,
         vVariavelNumeroCasas,
         vAcumulativa
     FROM
         variavel v
     JOIN periodo_data pd ON v.id = pd.variavel_id;


    -- Validação básica
    IF vInicio IS NULL OR vFim IS NULL THEN
        RAISE WARNING 'Variável %: Não foi possível determinar início/fim da medição.', pVariavelId;
        RETURN 'Variavel não encontrada ou sem período definido';
    END IF;

    -- Processa cada tipo de série (Realizado/Previsto)
    FOR serieRecord IN WITH series AS (
        SELECT
            'Realizado'::"Serie" AS serie
        UNION ALL
        SELECT
            'Previsto'::"Serie"
    )
    SELECT s.serie
    FROM series s
    -- Filtra apenas as series do tipo escolhido [parâmetro] para recalcular, ou todas se for null
    WHERE ((vTipoSerie IS NULL) OR (s.serie::text LIKE vTipoSerie::text || '%'))
    LOOP
        -- Define a data fim para o cálculo desta iteração, começando com a data fim original
        vFimCalculo := vFim;

        -- Busca a última data com valor realizado (necessário para ambos os flags)

        -- AJUSTE 1: Realizado and flag ACUMULADO_REALIZADO_APENAS_PASSADO
        IF serieRecord.serie = 'Realizado'::"Serie" AND vFeatureFlagRealizadoApenasPassado THEN
            SELECT COALESCE(max(data_valor), vInicio) INTO vUltimoRealizado
            FROM serie_variavel WHERE variavel_id = pVariavelId AND serie = 'Realizado'::"Serie";
            vFimCalculo := LEAST(vFim, GREATEST(vUltimoRealizado, vNow));  -- Usa vInicio como fallback se não houver realizado
        END IF;

        -- AJUSTE 2: Previsto and flag ACUMULADO_PREVISTO_APENAS_PASSADO
        IF serieRecord.serie = 'Previsto'::"Serie" AND vFeatureFlagPrevistoApenasPassado THEN
            SELECT COALESCE(max(data_valor), vInicio) INTO vUltimoPrevisto
            FROM serie_variavel WHERE variavel_id = pVariavelId AND serie = 'Previsto'::"Serie";
            vFimCalculo := LEAST(vFim, GREATEST(vUltimoPrevisto, vNow));  -- Usa vInicio como fallback se não houver previsto
        END IF;

        -- Ensure calculation end date is not before the start date
        IF vFimCalculo < vInicio THEN
            vFimCalculo := vInicio;
        END IF;

        -- --- Perform Calculation/Copy based on vAcumulativa and adjusted vFimCalculo ---

        -- Apaga sempre toda a serie acumulada
        DELETE FROM serie_variavel
        WHERE variavel_id = pVariavelId
            AND serie = (serieRecord.serie::text || 'Acumulado')::"Serie";

        IF vAcumulativa THEN
            -- Calculate and insert accumulated values up to vFimCalculo

--            RAISE NOTICE '==> Calculando acumulado para Variavel=%, Serie=%, FlagRealizado=%, FlagPrevisto=%, DataInicio=%, DataFimOriginal=%, DataFimCalculo=%)',
--                pVariavelId::text,
--                (serieRecord.serie::text || 'Acumulado')::"Serie",
--                vFeatureFlagRealizadoApenasPassado,
--                vFeatureFlagPrevistoApenasPassado,
--                vInicio::text,
--                vFim::text,
--                vFimCalculo::text;

            -- Insere os valores acumulados
            INSERT INTO serie_variavel (variavel_id, serie, data_valor, valor_nominal)
            WITH theData AS (
                SELECT
                    gs.gs AS data_serie,
                    round(
                        -- Soma o valor base com a soma acumulada dos valores nominais da série base (Realizado ou Previsto)
                        vVariavelBase + coalesce(sum(sv.valor_nominal::numeric) OVER (ORDER BY gs.gs ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW), 0),
                        vVariavelNumeroCasas
                    ) AS valor_acc
                FROM
                    generate_series(vInicio, vFimCalculo, vPeriodicidade) gs
                LEFT JOIN serie_variavel sv ON sv.variavel_id = pVariavelId
                    AND sv.data_valor = gs.gs::date
                    AND sv.serie = serieRecord.serie -- Join with the corresponding base series
            )
            SELECT
                pVariavelId,
                (serieRecord.serie::text || 'Acumulado')::"Serie",
                td.data_serie,
                td.valor_acc
            FROM theData td
            WHERE td.valor_acc IS NOT NULL; -- Should not be necessary due to coalesce, but safe practice

        ELSE -- Se a variável NÃO for acumulativa
            -- Para casos não acumulativos, a série "Acumulada" é apenas uma cópia da série base.
            -- Usamos INSERT ON CONFLICT para inserir/atualizar os valores.
            -- A lógica de vFimCalculo não se aplica diretamente aqui, pois copiamos pontos existentes,
            -- mas conceitualmente define o limite de interesse. A limpeza prévia garante que
            -- pontos fora do novo vFimCalculo (se aplicável por outras razões) seriam removidos.

            -- Copia os dados da série base para a série 'Acumulada' correspondente
            INSERT INTO serie_variavel (variavel_id, serie, data_valor, valor_nominal)
            SELECT
                pVariavelId,
                (serieRecord.serie::text || 'Acumulado')::"Serie",
                sv.data_valor,
                sv.valor_nominal
            FROM serie_variavel sv
            WHERE sv.variavel_id = pVariavelId
                AND sv.serie = serieRecord.serie
                AND sv.data_valor BETWEEN vInicio AND vFimCalculo;

        END IF;

        vUltimoRealizado := NULL;
        vUltimoPrevisto := NULL;

    END LOOP;

    RETURN '';
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Erro em monta_serie_acumulada para VariavelId %: %', pVariavelId, SQLERRM;
        RETURN 'Erro: ' || SQLERRM;
END
$$
LANGUAGE plpgsql;
