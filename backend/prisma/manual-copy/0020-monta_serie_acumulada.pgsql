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
    vFeatureFlagPrevistoApenasPassado boolean;  -- Flag para PREVISTO_REALIZADO_APENAS_PASSADO
    vUltimoRealizado date;
BEGIN
    EXECUTE pg_advisory_xact_lock(pVariavelId::bigint);

    SELECT value::boolean
    INTO vFeatureFlagRealizadoApenasPassado
    FROM smae_config
    WHERE key = 'ACUMULADO_REALIZADO_APENAS_PASSADO'
    LIMIT 1;

    vFeatureFlagRealizadoApenasPassado := COALESCE(vFeatureFlagRealizadoApenasPassado, false);

    SELECT value::boolean
    INTO vFeatureFlagPrevistoApenasPassado
    FROM smae_config
    WHERE key = 'PREVISTO_REALIZADO_APENAS_PASSADO'
    LIMIT 1;
    -- se não existir o registro, assume como false
    vFeatureFlagPrevistoApenasPassado := COALESCE(vFeatureFlagPrevistoApenasPassado, false);


    -- Coleta informações da variável e seus períodos
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
    JOIN periodo_data pd ON v.id = pd.variavel_id
    WHERE v.id = pVariavelId;

    -- Validação básica
    IF vInicio IS NULL THEN
        RETURN 'Variavel não encontrada';
    END IF;
    IF vFim IS NULL THEN
        RETURN 'vFim não encontrado';
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
        -- Fazemos isso uma vez por loop se algum dos flags que dependem disso estiver ativo
        IF vFeatureFlagRealizadoApenasPassado OR vFeatureFlagPrevistoApenasPassado THEN
             SELECT COALESCE(max(data_valor), vInicio) -- Usa vInicio como fallback se não houver realizado
             INTO vUltimoRealizado
             FROM serie_variavel
             WHERE variavel_id = pVariavelId
                 AND serie = 'Realizado'::"Serie";
        END IF;

        -- AJUSTE 1: Se for RealizadoAcumulado e o flag ACUMULADO_REALIZADO_APENAS_PASSADO estiver ativo
        IF vFeatureFlagRealizadoApenasPassado AND serieRecord.serie = 'Realizado'::"Serie" THEN
            -- Ajusta vFimCalculo para ser o maior entre a última data com realizado e hoje
            -- Garante que não calculamos acumulado realizado futuro se o flag estiver ativo
             vFimCalculo := LEAST(vFim, GREATEST(vUltimoRealizado, (date_trunc('day', NOW() AT TIME ZONE 'America/Sao_Paulo'))::date));
        END IF;

        -- AJUSTE 2: Se for PrevistoAcumulado e o flag PREVISTO_REALIZADO_APENAS_PASSADO estiver ativo (NOVO)
        IF vFeatureFlagPrevistoApenasPassado AND serieRecord.serie = 'Previsto'::"Serie" THEN
             -- Ajusta vFimCalculo para ser o maior entre a última data com realizado e hoje
             -- Garante que não calculamos acumulado previsto muito além do último realizado ou do presente, se o flag estiver ativo
             vFimCalculo := LEAST(vFim, GREATEST(vUltimoRealizado, (date_trunc('day', NOW() AT TIME ZONE 'America/Sao_Paulo'))::date));
        END IF;

        -- Garante que a data fim de cálculo não seja menor que a data de início
        IF vFimCalculo < vInicio THEN
            vFimCalculo := vInicio;
        END IF;

        -- Apenas recalcular a serie acumulada se a variavel for acumulativa
        IF vAcumulativa THEN
            -- Sempre deleta a serie acumulada antes de inserir
            DELETE FROM serie_variavel
            WHERE variavel_id = pVariavelId
                AND serie = (serieRecord.serie::text || 'Acumulado')::"Serie";

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
                    pVariavelId,
                    (serieRecord.serie::text || 'Acumulado')::"Serie" as serie_acumulada,
                    gs.gs AS data_serie,
                    round(
                        -- Soma o valor base com a soma acumulada dos valores nominais da série base (Realizado ou Previsto)
                        vVariavelBase + coalesce(sum(sv.valor_nominal::numeric) OVER (ORDER BY gs.gs), 0),
                        vVariavelNumeroCasas
                    ) AS valor_acc
                FROM
                    -- Gera a série de datas DENTRO DO PERÍODO DE CÁLCULO AJUSTADO (vInicio a vFimCalculo)
                    generate_series(vInicio, vFimCalculo, vPeriodicidade) gs
                LEFT JOIN serie_variavel sv ON sv.variavel_id = pVariavelId
                    AND sv.data_valor = gs.gs::date
                    AND sv.serie = serieRecord.serie -- Junta com a série base correspondente (Realizado ou Previsto)
            )
            SELECT *
            FROM theData
            -- Não insere pontos onde o valor acumulado seria nulo (embora o coalesce(sum(...), 0) evite isso)
            WHERE theData.valor_acc IS NOT NULL;

        ELSE -- Se a variável NÃO for acumulativa
            -- Para casos não acumulativos, a série "Acumulada" é apenas uma cópia da série base.
            -- Usamos INSERT ON CONFLICT para inserir/atualizar os valores.
            -- A lógica de vFimCalculo não se aplica diretamente aqui, pois copiamos pontos existentes,
            -- mas conceitualmente define o limite de interesse. A limpeza prévia garante que
            -- pontos fora do novo vFimCalculo (se aplicável por outras razões) seriam removidos.

            -- Limpa a série 'Acumulada' correspondente antes de copiar, para remover pontos obsoletos
            DELETE FROM serie_variavel
            WHERE variavel_id = pVariavelId
                AND serie = (serieRecord.serie::text || 'Acumulado')::"Serie";

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
                AND sv.data_valor BETWEEN vInicio AND vFimCalculo
            ON CONFLICT (variavel_id, serie, data_valor)
            DO UPDATE SET
                valor_nominal = EXCLUDED.valor_nominal
            WHERE serie_variavel.valor_nominal IS DISTINCT FROM EXCLUDED.valor_nominal;
        END IF;
    END LOOP;

    RETURN '';
END
$$
LANGUAGE plpgsql;
