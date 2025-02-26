CREATE OR REPLACE FUNCTION atualiza_ciclos_config(pPdmId INT)
RETURNS VOID AS $$
DECLARE
    vConfig RECORD;
    vToday DATE;
    vCurrentMonth INT;
    vCurrentYear INT;
    vNextCycleDate DATE;
    vActiveCycle RECORD;
    vFirstDayOfMonth BOOLEAN;

    vNovoCicloId INT;
    vStartDate DATE;
    vEndDate DATE;
    vYear INT;
    vMonth INT;
    vCycleDate DATE;
    vLastCycleDate DATE := NULL;
BEGIN
    -- Pega a data atual no fuso horário de São Paulo
    vToday := (now() AT TIME ZONE 'America/Sao_Paulo')::DATE;
    vCurrentMonth := EXTRACT(MONTH FROM vToday);
    vCurrentYear := EXTRACT(YEAR FROM vToday);
    vFirstDayOfMonth := EXTRACT(DAY FROM vToday) = 1;

    -- Pega a configuração mais recente
    SELECT
        c.meses,
        COALESCE(c.data_inicio, vToday) AS data_inicio,
        c.data_fim
    INTO vConfig
    FROM pdm_ciclo_config c
    WHERE c.pdm_id = pPdmId
    AND c.ultima_revisao = true;

    IF vConfig IS NULL THEN
        RETURN;
    END IF;

    -- Verificar se o array meses está vazio
    IF array_length(vConfig.meses, 1) IS NULL OR array_length(vConfig.meses, 1) = 0 THEN
        -- Se não tem meses configurados, não há nada a fazer
        RETURN;
    END IF;

    -- Verifica se data_fim é anterior a data_inicio
    IF vConfig.data_fim IS NOT NULL AND vConfig.data_fim < vConfig.data_inicio THEN
        -- Considera apenas data_inicio
        vConfig.data_fim := NULL;
    END IF;

    -- Trata o cenário inicial, pra quando não há ciclos criados
    IF NOT EXISTS (SELECT 1 FROM ciclo_fisico WHERE pdm_id = pPdmId) THEN
        -- ciclos desde data_inicio até data_fim ou hoje (o que for menor)
        vStartDate := vConfig.data_inicio;
        vEndDate := COALESCE(vConfig.data_fim, vToday);

        -- Para cada ano entre a data de início e a data de fim
        FOR vYear IN EXTRACT(YEAR FROM vStartDate)::INT..EXTRACT(YEAR FROM vEndDate)::INT LOOP
            -- Para cada mês na configuração
            FOREACH vMonth IN ARRAY vConfig.meses LOOP
                -- Criar data para este mês e ano
                vCycleDate := make_date(vYear, vMonth, 1);

                -- Verificar se a data está dentro do intervalo
                IF vCycleDate >= vStartDate AND vCycleDate <= vEndDate THEN
                    -- Lembrar o último ciclo criado
                    vLastCycleDate := vCycleDate;

                    -- Criar ciclo para esta data (apenas o último será ativo)
                    INSERT INTO ciclo_fisico (
                        pdm_id, data_ciclo, ativo, tipo
                    ) VALUES (
                        pPdmId,
                        vCycleDate,
                        FALSE, -- Todos iniciam como inativos, atualizamos o último depois
                        'CicloConfig'
                    );
                END IF;
            END LOOP;
        END LOOP;

        -- Se encontrou pelo menos um ciclo para criar
        IF vLastCycleDate IS NOT NULL THEN
            -- Tornar o último ciclo ativo
            UPDATE ciclo_fisico
            SET ativo = TRUE
            WHERE pdm_id = pPdmId
            AND data_ciclo = vLastCycleDate
            RETURNING id INTO vNovoCicloId;

            -- Determinar o próximo ciclo após o último criado
            SELECT MIN(cycle_date)
            INTO vNextCycleDate
            FROM (
                SELECT
                    make_date(
                        CASE
                            WHEN m <= EXTRACT(MONTH FROM vLastCycleDate) THEN
                                EXTRACT(YEAR FROM vLastCycleDate)::INT + 1
                            ELSE
                                EXTRACT(YEAR FROM vLastCycleDate)::INT
                        END,
                        m,
                        1
                    ) AS cycle_date
                FROM unnest(vConfig.meses) AS m
            ) future_cycles
            WHERE cycle_date > vLastCycleDate;

            -- Atualizar o acordar_ciclo_em para o ciclo ativo
            IF vNextCycleDate IS NOT NULL THEN
                UPDATE ciclo_fisico
                SET acordar_ciclo_em = vNextCycleDate
                WHERE id = vNovoCicloId;
            END IF;
        END IF;

        RETURN;
    END IF;

    -- Encontra o ciclo ativo, se existir
    SELECT * INTO vActiveCycle
    FROM ciclo_fisico
    WHERE pdm_id = pPdmId
    AND ativo = true
    ORDER BY data_ciclo DESC
    LIMIT 1;

    -- Determina a data do próximo ciclo com base na configuração
    vNextCycleDate := NULL;

    -- Encontra o próximo mês na configuração que seja estritamente maior que o mês atual
    -- para evitar criar um ciclo no meio do mês atual
    FOR i IN 1..array_length(vConfig.meses, 1) LOOP
        IF vConfig.meses[i] > vCurrentMonth THEN
            -- Encontrou um mês futuro neste ano
            vNextCycleDate := make_date(vCurrentYear, vConfig.meses[i], 1);
            EXIT;
        END IF;
    END LOOP;

    -- Se nenhum mês futuro foi encontrado neste ano, pega o primeiro mês do próximo ano
    IF vNextCycleDate IS NULL AND array_length(vConfig.meses, 1) > 0 THEN
        vNextCycleDate := make_date(vCurrentYear + 1, vConfig.meses[1], 1);
    END IF;

    -- Caso especial: Se hoje é o primeiro dia do mês E este mês está na configuração,
    -- E ainda não temos um ciclo para este mês, criar um
    IF vFirstDayOfMonth AND vConfig.meses @> ARRAY[vCurrentMonth] AND
       NOT EXISTS (
           SELECT 1 FROM ciclo_fisico
           WHERE pdm_id = pPdmId
           AND data_ciclo = date_trunc('month', vToday)
       ) THEN
        -- Cria um ciclo para o mês atual (primeiro dia)
        WITH new_cycle AS (
            INSERT INTO ciclo_fisico (
                pdm_id, data_ciclo, ativo, tipo,
                acordar_ciclo_em
            ) VALUES (
                pPdmId,
                date_trunc('month', vToday),
                true,
                'CicloConfig',
                vNextCycleDate  -- Define a data do próximo ciclo para acordar
            )
            RETURNING id
        )
        SELECT id INTO vNovoCicloId FROM new_cycle;

        -- Fecha o ciclo ativo anterior, se existir
        IF vActiveCycle IS NOT NULL AND vActiveCycle.id != vNovoCicloId THEN
            PERFORM fechar_ciclo_anterior(pPdmId, vNovoCicloId);
        END IF;
    ELSE
        -- Atualiza acordar_ciclo_em para o ciclo ativo acordar na data do próximo ciclo
        IF vActiveCycle IS NOT NULL AND vNextCycleDate IS NOT NULL THEN
            UPDATE ciclo_fisico
            SET acordar_ciclo_em = vNextCycleDate
            WHERE id = vActiveCycle.id
            AND (acordar_ciclo_em IS NULL OR acordar_ciclo_em <> vNextCycleDate);
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;
