-- Função auxiliar para extrair projeto_atividade da dotacao
CREATE OR REPLACE FUNCTION f_extrair_projeto_atividade(dotacao TEXT)
RETURNS TEXT AS $$
DECLARE
    partes TEXT[];
    codigo TEXT;
BEGIN
    -- Split da dotação por ponto
    partes := string_to_array(dotacao, '.');
    
    IF array_length(partes, 1) >= 7 THEN
        codigo := partes[6] || partes[7];
        RETURN codigo;
    ELSE
        RETURN '';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função auxiliar para classificar projeto_atividade
CREATE OR REPLACE FUNCTION f_classificar_projeto_atividade(dotacao TEXT)
RETURNS TEXT AS $$
DECLARE
    projeto_atividade TEXT;
    primeiro_digito CHAR(1);
    digito_numerico INT;
BEGIN
    -- Extrai o projeto_atividade da dotação
    projeto_atividade := f_extrair_projeto_atividade(dotacao);
    
    -- Se não conseguiu extrair, retorna desconhecido
    IF projeto_atividade = '' OR projeto_atividade IS NULL THEN
        RETURN 'desconhecido';
    END IF;
    
    -- Extrai o primeiro dígito do projeto_atividade
    primeiro_digito := substring(projeto_atividade from 1 for 1);
    
    -- Tenta converter para número
    BEGIN
        digito_numerico := primeiro_digito::INT;
    EXCEPTION WHEN OTHERS THEN
        -- Se não for número, retorna 'desconhecido'
        RETURN 'desconhecido';
    END;
    
    -- Classifica baseado no primeiro dígito
    IF digito_numerico = 0 THEN
        RETURN 'operacao_especial';
    ELSIF digito_numerico % 2 = 1 THEN
        RETURN 'projeto';
    ELSE
        RETURN 'atividade';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função para recalcular consolidado de uma meta
CREATE OR REPLACE FUNCTION f_refresh_meta_orcamento_consolidado(p_meta_id INT)
RETURNS VOID AS $$
DECLARE
    v_total_previsao DECIMAL(19,2);
    v_total_empenhado DECIMAL(19,2);
    v_total_liquidado DECIMAL(19,2);
    v_total_previsao_projeto DECIMAL(19,2);
    v_total_empenhado_projeto DECIMAL(19,2);
    v_total_liquidado_projeto DECIMAL(19,2);
    v_total_previsao_atividade DECIMAL(19,2);
    v_total_empenhado_atividade DECIMAL(19,2);
    v_total_liquidado_atividade DECIMAL(19,2);
    v_total_previsao_operacao DECIMAL(19,2);
    v_total_empenhado_operacao DECIMAL(19,2);
    v_total_liquidado_operacao DECIMAL(19,2);
BEGIN
    -- Calcula totais de planejado
    -- Inclui orçamentos diretos da meta, de iniciativas e de atividades
    WITH planejado_com_classificacao AS (
        SELECT
            op.valor_planejado,
            f_classificar_projeto_atividade(op.dotacao) as tipo
        FROM orcamento_planejado op
        LEFT JOIN iniciativa i ON i.id = op.iniciativa_id
        LEFT JOIN atividade a ON a.id = op.atividade_id
        LEFT JOIN iniciativa ia ON ia.id = a.iniciativa_id
        WHERE (
            op.meta_id = p_meta_id OR 
            i.meta_id = p_meta_id OR 
            ia.meta_id = p_meta_id
        )
            AND op.removido_em IS NULL
    )
    SELECT
        COALESCE(SUM(valor_planejado), 0),
        COALESCE(SUM(CASE WHEN tipo = 'projeto' THEN valor_planejado ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN tipo = 'atividade' THEN valor_planejado ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN tipo = 'operacao_especial' THEN valor_planejado ELSE 0 END), 0)
    INTO
        v_total_previsao,
        v_total_previsao_projeto,
        v_total_previsao_atividade,
        v_total_previsao_operacao
    FROM planejado_com_classificacao;

    -- Calcula totais de realizado
    -- Inclui orçamentos diretos da meta, de iniciativas e de atividades
    WITH realizado_com_classificacao AS (
        SELECT
            orc.soma_valor_empenho,
            orc.soma_valor_liquidado,
            f_classificar_projeto_atividade(orc.dotacao) as tipo
        FROM orcamento_realizado orc
        LEFT JOIN iniciativa i ON i.id = orc.iniciativa_id
        LEFT JOIN atividade a ON a.id = orc.atividade_id
        LEFT JOIN iniciativa ia ON ia.id = a.iniciativa_id
        WHERE (
            orc.meta_id = p_meta_id OR 
            i.meta_id = p_meta_id OR 
            ia.meta_id = p_meta_id
        )
            AND orc.removido_em IS NULL
    )
    SELECT
        COALESCE(SUM(soma_valor_empenho), 0),
        COALESCE(SUM(soma_valor_liquidado), 0),
        COALESCE(SUM(CASE WHEN tipo = 'projeto' THEN soma_valor_empenho ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN tipo = 'projeto' THEN soma_valor_liquidado ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN tipo = 'atividade' THEN soma_valor_empenho ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN tipo = 'atividade' THEN soma_valor_liquidado ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN tipo = 'operacao_especial' THEN soma_valor_empenho ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN tipo = 'operacao_especial' THEN soma_valor_liquidado ELSE 0 END), 0)
    INTO
        v_total_empenhado,
        v_total_liquidado,
        v_total_empenhado_projeto,
        v_total_liquidado_projeto,
        v_total_empenhado_atividade,
        v_total_liquidado_atividade,
        v_total_empenhado_operacao,
        v_total_liquidado_operacao
    FROM realizado_com_classificacao;

    -- Upsert na tabela consolidada
    INSERT INTO meta_orcamento_consolidado (
        meta_id,
        total_previsao,
        total_empenhado,
        total_liquidado,
        total_previsao_projeto,
        total_empenhado_projeto,
        total_liquidado_projeto,
        total_previsao_atividade,
        total_empenhado_atividade,
        total_liquidado_atividade,
        total_previsao_operacao_especial,
        total_empenhado_operacao_especial,
        total_liquidado_operacao_especial,
        atualizado_em
    ) VALUES (
        p_meta_id,
        v_total_previsao,
        v_total_empenhado,
        v_total_liquidado,
        v_total_previsao_projeto,
        v_total_empenhado_projeto,
        v_total_liquidado_projeto,
        v_total_previsao_atividade,
        v_total_empenhado_atividade,
        v_total_liquidado_atividade,
        v_total_previsao_operacao,
        v_total_empenhado_operacao,
        v_total_liquidado_operacao,
        NOW()
    )
    ON CONFLICT (meta_id) DO UPDATE SET
        total_previsao = EXCLUDED.total_previsao,
        total_empenhado = EXCLUDED.total_empenhado,
        total_liquidado = EXCLUDED.total_liquidado,
        total_previsao_projeto = EXCLUDED.total_previsao_projeto,
        total_empenhado_projeto = EXCLUDED.total_empenhado_projeto,
        total_liquidado_projeto = EXCLUDED.total_liquidado_projeto,
        total_previsao_atividade = EXCLUDED.total_previsao_atividade,
        total_empenhado_atividade = EXCLUDED.total_empenhado_atividade,
        total_liquidado_atividade = EXCLUDED.total_liquidado_atividade,
        total_previsao_operacao_especial = EXCLUDED.total_previsao_operacao_especial,
        total_empenhado_operacao_especial = EXCLUDED.total_empenhado_operacao_especial,
        total_liquidado_operacao_especial = EXCLUDED.total_liquidado_operacao_especial,
        atualizado_em = NOW();
END;
$$ LANGUAGE plpgsql;

-- Procedure para enfileirar recálculo assíncrono (com deduplicação por txid)
CREATE OR REPLACE PROCEDURE add_refresh_meta_orcamento_consolidado_task(p_meta_id INTEGER)
AS $$
DECLARE
    current_txid bigint;
BEGIN
    current_txid := txid_current();
    IF NOT EXISTS (
        SELECT 1 FROM task_queue
        WHERE "type" = 'refresh_meta_orcamento_consolidado'
          AND status = 'pending'
          AND (params->>'meta_id')::INTEGER = p_meta_id
          AND (params->>'current_txid')::bigint = current_txid
          AND criado_em = now()
    ) THEN
        INSERT INTO task_queue ("type", params)
        VALUES (
            'refresh_meta_orcamento_consolidado',
            json_build_object('meta_id', p_meta_id, 'current_txid', current_txid)
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Wrapper function para uso nos triggers (triggers usam PERFORM em funções, não CALL em procedures)
CREATE OR REPLACE FUNCTION f_add_refresh_meta_orcamento_consolidado_task(p_meta_id INTEGER)
RETURNS VOID AS $$
BEGIN
    CALL add_refresh_meta_orcamento_consolidado_task(p_meta_id);
END;
$$ LANGUAGE plpgsql;

-- Trigger para OrcamentoPlanejado
CREATE OR REPLACE FUNCTION tg_orcamento_planejado_refresh_consolidado()  
RETURNS TRIGGER AS $$
DECLARE
    v_meta_id INT;
    v_old_meta_id INT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        -- Busca a meta_id considerando meta, iniciativa e atividade
        IF OLD.meta_id IS NOT NULL THEN
            v_meta_id := OLD.meta_id;
        ELSIF OLD.iniciativa_id IS NOT NULL THEN
            SELECT meta_id INTO v_meta_id FROM iniciativa WHERE id = OLD.iniciativa_id;
        ELSIF OLD.atividade_id IS NOT NULL THEN
            SELECT i.meta_id INTO v_meta_id 
            FROM atividade a 
            JOIN iniciativa i ON i.id = a.iniciativa_id 
            WHERE a.id = OLD.atividade_id;
        END IF;
        
        IF v_meta_id IS NOT NULL THEN
            PERFORM f_add_refresh_meta_orcamento_consolidado_task(v_meta_id);
        END IF;
        RETURN OLD;
    ELSE
        -- Busca a meta_id do registro novo
        IF NEW.meta_id IS NOT NULL THEN
            v_meta_id := NEW.meta_id;
        ELSIF NEW.iniciativa_id IS NOT NULL THEN
            SELECT meta_id INTO v_meta_id FROM iniciativa WHERE id = NEW.iniciativa_id;
        ELSIF NEW.atividade_id IS NOT NULL THEN
            SELECT i.meta_id INTO v_meta_id 
            FROM atividade a 
            JOIN iniciativa i ON i.id = a.iniciativa_id 
            WHERE a.id = NEW.atividade_id;
        END IF;
        
        IF v_meta_id IS NOT NULL THEN
            PERFORM f_add_refresh_meta_orcamento_consolidado_task(v_meta_id);
        END IF;
        
        -- Se o meta_id/iniciativa_id/atividade_id mudou, atualiza o antigo também
        IF TG_OP = 'UPDATE' THEN
            IF OLD.meta_id IS NOT NULL THEN
                v_old_meta_id := OLD.meta_id;
            ELSIF OLD.iniciativa_id IS NOT NULL THEN
                SELECT meta_id INTO v_old_meta_id FROM iniciativa WHERE id = OLD.iniciativa_id;
            ELSIF OLD.atividade_id IS NOT NULL THEN
                SELECT i.meta_id INTO v_old_meta_id 
                FROM atividade a 
                JOIN iniciativa i ON i.id = a.iniciativa_id 
                WHERE a.id = OLD.atividade_id;
            END IF;
            
            IF v_old_meta_id IS NOT NULL AND v_old_meta_id IS DISTINCT FROM v_meta_id THEN
                PERFORM f_add_refresh_meta_orcamento_consolidado_task(v_old_meta_id);
            END IF;
        END IF;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tg_orcamento_planejado_refresh_consolidado ON orcamento_planejado;
CREATE TRIGGER tg_orcamento_planejado_refresh_consolidado
    AFTER INSERT OR UPDATE OR DELETE ON orcamento_planejado
    FOR EACH ROW
    EXECUTE FUNCTION tg_orcamento_planejado_refresh_consolidado();

-- Trigger para OrcamentoRealizado
CREATE OR REPLACE FUNCTION tg_orcamento_realizado_refresh_consolidado()
RETURNS TRIGGER AS $$
DECLARE
    v_meta_id INT;
    v_old_meta_id INT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        -- Busca a meta_id considerando meta, iniciativa e atividade
        IF OLD.meta_id IS NOT NULL THEN
            v_meta_id := OLD.meta_id;
        ELSIF OLD.iniciativa_id IS NOT NULL THEN
            SELECT meta_id INTO v_meta_id FROM iniciativa WHERE id = OLD.iniciativa_id;
        ELSIF OLD.atividade_id IS NOT NULL THEN
            SELECT i.meta_id INTO v_meta_id 
            FROM atividade a 
            JOIN iniciativa i ON i.id = a.iniciativa_id 
            WHERE a.id = OLD.atividade_id;
        END IF;
        
        IF v_meta_id IS NOT NULL THEN
            PERFORM f_add_refresh_meta_orcamento_consolidado_task(v_meta_id);
        END IF;
        RETURN OLD;
    ELSE
        -- Busca a meta_id do registro novo
        IF NEW.meta_id IS NOT NULL THEN
            v_meta_id := NEW.meta_id;
        ELSIF NEW.iniciativa_id IS NOT NULL THEN
            SELECT meta_id INTO v_meta_id FROM iniciativa WHERE id = NEW.iniciativa_id;
        ELSIF NEW.atividade_id IS NOT NULL THEN
            SELECT i.meta_id INTO v_meta_id 
            FROM atividade a 
            JOIN iniciativa i ON i.id = a.iniciativa_id 
            WHERE a.id = NEW.atividade_id;
        END IF;
        
        IF v_meta_id IS NOT NULL THEN
            PERFORM f_add_refresh_meta_orcamento_consolidado_task(v_meta_id);
        END IF;
        
        -- Se o meta_id/iniciativa_id/atividade_id mudou, atualiza o antigo também
        IF TG_OP = 'UPDATE' THEN
            IF OLD.meta_id IS NOT NULL THEN
                v_old_meta_id := OLD.meta_id;
            ELSIF OLD.iniciativa_id IS NOT NULL THEN
                SELECT meta_id INTO v_old_meta_id FROM iniciativa WHERE id = OLD.iniciativa_id;
            ELSIF OLD.atividade_id IS NOT NULL THEN
                SELECT i.meta_id INTO v_old_meta_id 
                FROM atividade a 
                JOIN iniciativa i ON i.id = a.iniciativa_id 
                WHERE a.id = OLD.atividade_id;
            END IF;
            
            IF v_old_meta_id IS NOT NULL AND v_old_meta_id IS DISTINCT FROM v_meta_id THEN
                PERFORM f_add_refresh_meta_orcamento_consolidado_task(v_old_meta_id);
            END IF;
        END IF;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tg_orcamento_realizado_refresh_consolidado ON orcamento_realizado;
CREATE TRIGGER tg_orcamento_realizado_refresh_consolidado
    AFTER INSERT OR UPDATE OR DELETE ON orcamento_realizado
    FOR EACH ROW
    EXECUTE FUNCTION tg_orcamento_realizado_refresh_consolidado();

-- Popular dados existentes
INSERT INTO meta_orcamento_consolidado (meta_id)
SELECT DISTINCT id FROM meta WHERE removido_em IS NULL
ON CONFLICT (meta_id) DO NOTHING;

-- Recalcular todos os consolidados existentes
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN SELECT id FROM meta WHERE removido_em IS NULL LOOP
        PERFORM f_refresh_meta_orcamento_consolidado(rec.id);
    END LOOP;
END $$;