CREATE OR REPLACE FUNCTION valor_indicador_em_json(pIndicador_id int, pSerie "Serie", pPeriodo date, janela int)
    RETURNS jsonb
    AS $$
DECLARE
    _result jsonb;
    _valor numeric(95, 60);
    _eh_previa boolean := false;
    _elementos jsonb;
    _casas_decimais int;
    _variavel_categorica_id int;
    _variavel_categoria_id int;
    _categorica_valores jsonb;
    _periodicidade "Periodicidade";
BEGIN
    -- Busca metadata do indicador (casas_decimais e variavel_categorica_id)
    SELECT
        i.casas_decimais,
        v.variavel_categorica_id,
        i.variavel_categoria_id,
        i.periodicidade
    INTO
        _casas_decimais,
        _variavel_categorica_id,
        _variavel_categoria_id,
        _periodicidade
    FROM indicador i
    LEFT JOIN variavel v ON v.id = i.variavel_categoria_id
    WHERE i.id = pIndicador_id;

    -- Consulta única: eh_previa já está no registro da série Realizado
    SELECT
        si.valor_nominal,
        COALESCE(si.eh_previa, false),
        si.elementos
    INTO
        _valor,
        _eh_previa,
        _elementos
    FROM
        serie_indicador si
    WHERE si.indicador_id = pIndicador_id
        AND si.serie = pSerie
        AND si.data_valor <= pPeriodo
        AND si.data_valor > (pPeriodo - (janela || ' months')::interval)::date
        AND (si.ha_conferencia_pendente = false OR si.eh_previa)
        AND si.previa_invalidada_em IS NULL
    ORDER BY si.data_valor DESC
    LIMIT 1;

    IF _valor IS NULL THEN
        RETURN NULL;
    END IF;

    -- Se indicador categórico e tem elementos, constrói valores categóricos
    IF _variavel_categorica_id IS NOT NULL AND _elementos IS NOT NULL AND _elementos ? 'totais_categorica' THEN
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', vcv.id,
                'titulo', vcv.titulo,
                'valor_variavel', vcv.valor_variavel,
                'quantidade', (elem->1)::int
            )
            ORDER BY vcv.valor_variavel
        )
        INTO _categorica_valores
        FROM jsonb_array_elements(_elementos->'totais_categorica') elem
        JOIN variavel_categorica_valor vcv ON vcv.id = (elem->>0)::int
        WHERE vcv.variavel_categorica_id = _variavel_categorica_id
          AND vcv.removido_em IS NULL;
    ELSIF _variavel_categoria_id IS NOT NULL AND _periodicidade != 'Mensal' THEN
        -- busca na serie_variavel diretamente
        -- estrutura: [[variavel_id, quantidade], ...] onde variavel_id aponta para variáveis que têm serie_variavel.variavel_categorica_valor_id
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', vcv.id,
                'titulo', vcv.titulo,
                'valor_variavel', vcv.valor_variavel,
                'quantidade', sum_qty
            )
            ORDER BY vcv.valor_variavel
        )
        INTO _categorica_valores
        FROM (
            SELECT 
                sv_child.variavel_categorica_valor_id,
                SUM((elem->1)::text::int) as sum_qty
            FROM (
                SELECT sv.elementos
                FROM serie_variavel sv
                WHERE sv.variavel_id = _variavel_categoria_id
                    AND sv.serie = pSerie
                    AND sv.data_valor <= pPeriodo
                    AND sv.data_valor > (pPeriodo - (janela || ' months')::interval)::date
                    AND sv.conferida = true
                ORDER BY sv.data_valor DESC
                LIMIT 1
            ) latest_sv
            CROSS JOIN LATERAL jsonb_array_elements((latest_sv.elementos::jsonb)->'categorica') elem
            LEFT JOIN LATERAL (
                SELECT sv2.variavel_categorica_valor_id
                FROM serie_variavel sv2
                WHERE sv2.variavel_id = (elem->0)::text::int
                    AND sv2.serie = pSerie
                    AND sv2.data_valor <= pPeriodo
                    AND sv2.data_valor > (pPeriodo - (janela || ' months')::interval)::date
                    AND sv2.conferida = true
                ORDER BY sv2.data_valor DESC
                LIMIT 1
            ) sv_child ON true
            WHERE sv_child.variavel_categorica_valor_id IS NOT NULL
            GROUP BY sv_child.variavel_categorica_valor_id
        ) grouped
        JOIN variavel_categorica_valor vcv ON vcv.id = grouped.variavel_categorica_valor_id
            AND vcv.variavel_categorica_id = _variavel_categorica_id
            AND vcv.removido_em IS NULL;
        ELSIF _variavel_categoria_id IS NOT NULL AND _periodicidade = 'Mensal' THEN
            -- Buscando no serie_variavel, vamos utilizar variavel_categorica_valor_id
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', vcv_id,
                    'titulo', vcv_titulo,
                    'valor_variavel', vcv_valor_variavel,
                    'quantidade', total_count
                )
                ORDER BY vcv_valor_variavel
            )
            INTO _categorica_valores
            FROM (
                SELECT 
                    vcv.id as vcv_id,
                    vcv.titulo as vcv_titulo,
                    vcv.valor_variavel as vcv_valor_variavel,
                    COUNT(*) as total_count
                FROM serie_variavel sv
                JOIN variavel_categorica_valor vcv ON vcv.id = sv.variavel_categorica_valor_id
                    AND vcv.variavel_categorica_id = _variavel_categorica_id
                    AND vcv.removido_em IS NULL
                WHERE sv.variavel_id = _variavel_categoria_id
                    AND sv.serie = pSerie
                    AND sv.data_valor <= pPeriodo
                    AND sv.data_valor > (pPeriodo - (janela || ' months')::interval)::date
                    AND sv.conferida = true
                GROUP BY vcv.id, vcv.titulo, vcv.valor_variavel, sv.data_valor
                ORDER BY sv.data_valor DESC
                LIMIT 1
            ) latest_sv;
    END IF;

    _result := jsonb_build_object(
        'valor_nominal', round(_valor, COALESCE(_casas_decimais, 2)),
        'eh_previa', _eh_previa,
        'valores_categorica', _categorica_valores
    );

    RETURN _result;
END
$$
LANGUAGE plpgsql STABLE;


DROP FUNCTION IF EXISTS valor_indicador_em(int, "Serie", date, int);


CREATE OR REPLACE FUNCTION valor_variavel_em_json(pVariavelId int, pSerie "Serie", pPeriodo date, janela int)
    RETURNS jsonb
    AS $$
DECLARE
    _valor jsonb;
    _valor_nominal numeric(95, 60);
    _atualizado_em timestamptz;
    _valor_categorica_titulo text;
    _casas_decimais int;
    _elementos jsonb;
    _categorica_valores jsonb;
BEGIN
    -- Busca o registro da série com todos os dados necessários
    SELECT
        si.valor_nominal,
        si.atualizado_em,
        vcv.titulo,
        v.casas_decimais,
        si.elementos
    INTO
        _valor_nominal,
        _atualizado_em,
        _valor_categorica_titulo,
        _casas_decimais,
        _elementos
    FROM
        serie_variavel si
    LEFT JOIN variavel v ON v.id = si.variavel_id
    LEFT JOIN variavel_categorica_valor vcv ON vcv.id = si.variavel_categorica_valor_id
    WHERE si.variavel_id = pVariavelId
        AND si.serie = pSerie
        AND si.data_valor <= pPeriodo
        AND si.data_valor > (pPeriodo - (janela || ' months')::interval)::date
        AND conferida = true
    ORDER BY si.data_valor desc
    LIMIT 1;

    -- Se não encontrou registro, retorna NULL
    IF _valor_nominal IS NULL THEN
        RETURN NULL;
    END IF;

    -- Se tem elementos categóricos (variável calculada), constrói os valores categóricos
    IF _elementos IS NOT NULL AND _elementos ? 'categorica' THEN
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', vcv.id,
                'titulo', vcv.titulo,
                'valor_variavel', vcv.valor_variavel,
                'variavel_id', (elem->>0)::int
            )
            ORDER BY vcv.valor_variavel
        )
        INTO _categorica_valores
        FROM jsonb_array_elements(_elementos->'categorica') elem
        LEFT JOIN variavel_categorica_valor vcv ON vcv.id = (elem->>1)::int AND vcv.removido_em IS NULL;
    END IF;

    -- Constrói o resultado
    _valor := jsonb_build_object(
        'valor_nominal',
        round(_valor_nominal, COALESCE(_casas_decimais, 2)),
        'atualizado_em',
        COALESCE(_atualizado_em, '1970-01-01T00:00:00Z'::timestamptz),
        'valor_categorica',
        _valor_categorica_titulo,
        'valores_categorica',
        _categorica_valores
    );

    RETURN _valor;
END
$$
LANGUAGE plpgsql STABLE RETURNS NULL ON NULL INPUT;

CREATE OR REPLACE FUNCTION valor_variavel_em(pVariavelId int, pSerie "Serie", pPeriodo date, janela int)
    RETURNS numeric(95, 60)
    AS $$
DECLARE
    _valor numeric(95, 60);
BEGIN
    SELECT
        si.valor_nominal into _valor
    FROM
        serie_variavel si
    WHERE si.variavel_id = pVariavelId
        AND si.serie = pSerie
        AND si.data_valor <= pPeriodo
        AND si.data_valor > (pPeriodo - (janela || ' months')::interval)::date
        AND conferida = true
    ORDER BY si.data_valor desc
    LIMIT 1;
    RETURN _valor;
END
$$
LANGUAGE plpgsql STABLE RETURNS NULL ON NULL INPUT;
