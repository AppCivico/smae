-- CreateIndex
CREATE INDEX "orcamento_realizado_ano_referencia_dotacao_idx" ON "orcamento_realizado"("ano_referencia", "dotacao");

CREATE INDEX "orcamento_planejado_ano_referencia_dotacao_idx" ON "orcamento_planejado"("ano_referencia", "dotacao");

CREATE OR REPLACE FUNCTION f_tgr_update_soma_dotacao()
    RETURNS TRIGGER
    AS $$
DECLARE
 tmp INTEGER;
BEGIN
    -- Pdm dotacao_planejado
    WITH pdm_sum AS(
        SELECT
            m.pdm_id,
            COALESCE(SUM(op.valor_planejado) filter (where op.removido_em IS NULL AND m.removido_em IS NULL), 0) AS valor_planejado_sum
        FROM orcamento_planejado op
        JOIN meta m ON m.id = op.meta_id
        WHERE op.ano_referencia = NEW.ano_referencia
        AND op.dotacao = NEW.dotacao
        GROUP BY 1
    ),
    pdm_upsert AS(
    INSERT INTO pdm_dotacao_planejado(pdm_id, ano_referencia, dotacao, pressao_orcamentaria, soma_valor_planejado)
        SELECT
            pdm_sum.pdm_id,
            NEW.ano_referencia,
            NEW.dotacao,
            pdm_sum.valor_planejado_sum > NEW.val_orcado_atualizado,
            pdm_sum.valor_planejado_sum
        FROM
            pdm_sum
        ON CONFLICT(pdm_id,
            ano_referencia,
            dotacao)
            DO UPDATE SET
                pressao_orcamentaria = EXCLUDED.pressao_orcamentaria,
                soma_valor_planejado = EXCLUDED.soma_valor_planejado
    ) SELECT 1 into tmp;

    -- Portfoliodotacao_planejado calculations
    WITH portfolio_sum AS(
        SELECT
            p.portfolio_id,
            COALESCE(SUM(op.valor_planejado) FILTER (where op.removido_em IS NULL AND p.removido_em IS NULL), 0) AS valor_planejado_sum
        FROM orcamento_planejado op
        JOIN projeto p ON op.projeto_id = p.id
        WHERE
            op.ano_referencia = NEW.ano_referencia
        AND op.dotacao = NEW.dotacao
        GROUP BY 1
    ),
    portfolio_upsert AS(
    INSERT INTO portfolio_dotacao_planejado(portfolio_id, ano_referencia, dotacao, pressao_orcamentaria, soma_valor_planejado)
        SELECT
            portfolio_sum.portfolio_id,
            NEW.ano_referencia,
            NEW.dotacao,
            portfolio_sum.valor_planejado_sum > NEW.val_orcado_atualizado,
            portfolio_sum.valor_planejado_sum
        FROM
            portfolio_sum
        ON CONFLICT(portfolio_id, ano_referencia, dotacao)
            DO UPDATE SET
                pressao_orcamentaria = EXCLUDED.pressao_orcamentaria,
                soma_valor_planejado = EXCLUDED.soma_valor_planejado
    ) SELECT 1 into tmp;

    RETURN NEW;
END;
$$
LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION f_tgr_update_soma_dotacao_realizado()
    RETURNS TRIGGER
    AS $$
DECLARE
 tmp INTEGER;
BEGIN
    -- Pdm dotacao_planejado SEM PROCESSO (logo, sem NF)
    WITH pdm_sum AS(
        SELECT
            m.pdm_id,
            COALESCE(SUM(op.soma_valor_empenho) FILTER (where op.removido_em IS NULL AND m.removido_em IS NULL), 0) AS soma_valor_empenho_sum,
            COALESCE(SUM(op.soma_valor_liquidado) FILTER (where op.removido_em IS NULL AND m.removido_em IS NULL), 0) AS soma_valor_liquidado_sum
        FROM orcamento_realizado op
        JOIN meta m ON m.id = op.meta_id
        WHERE
            op.ano_referencia = NEW.ano_referencia
        AND op.dotacao = NEW.dotacao
        AND op.processo IS NULL
        GROUP BY 1
    ),
    pdm_upsert AS(
    INSERT INTO pdm_dotacao_realizado(pdm_id, ano_referencia, dotacao, soma_valor_empenho, soma_valor_liquidado)
        SELECT
            pdm_sum.pdm_id,
            NEW.ano_referencia,
            NEW.dotacao,
            pdm_sum.soma_valor_empenho_sum,
            pdm_sum.soma_valor_liquidado_sum
        FROM
            pdm_sum
        ON CONFLICT(pdm_id,
            ano_referencia,
            dotacao)
            DO UPDATE SET
                soma_valor_empenho = EXCLUDED.soma_valor_empenho,
                soma_valor_liquidado = EXCLUDED.soma_valor_liquidado
    ) SELECT 1 into tmp WHERE NEW.processo IS NULL; -- só roda esse SQL do insert/recalc quando não tem processo

    -- Portfolio dotacao_planejado   SEM PROCESSO (logo, sem NF)
    WITH portfolio_sum AS(
        SELECT
            p.portfolio_id,
            COALESCE(SUM(op.soma_valor_empenho) FILTER (where op.removido_em IS NULL AND p.removido_em IS NULL), 0) AS soma_valor_empenho_sum,
            COALESCE(SUM(op.soma_valor_liquidado) FILTER (where op.removido_em IS NULL AND p.removido_em IS NULL), 0) AS soma_valor_liquidado_sum
        FROM orcamento_realizado op
        JOIN projeto p ON op.projeto_id = p.id
        WHERE
            op.ano_referencia = NEW.ano_referencia
        AND op.dotacao = NEW.dotacao
        AND op.processo IS NULL
        GROUP BY 1
    ),
    portfolio_upsert AS(
    INSERT INTO portfolio_dotacao_realizado(portfolio_id, ano_referencia, dotacao, soma_valor_empenho, soma_valor_liquidado)
        SELECT
            portfolio_sum.portfolio_id,
            NEW.ano_referencia,
            NEW.dotacao,
            portfolio_sum.soma_valor_empenho_sum,
            portfolio_sum.soma_valor_liquidado_sum
        FROM
            portfolio_sum
        ON CONFLICT(portfolio_id, ano_referencia, dotacao)
            DO UPDATE SET
                soma_valor_empenho = EXCLUDED.soma_valor_empenho,
                soma_valor_liquidado = EXCLUDED.soma_valor_liquidado
    ) SELECT 1 into tmp WHERE NEW.processo IS NULL; -- só roda esse SQL do insert/recalc quando não tem processo

    -----------------

    -- Pdm dotacao_planejado com processo (mas sem NF)
    WITH pdm_sum AS(
        SELECT
            m.pdm_id,
            COALESCE(SUM(op.soma_valor_empenho) FILTER (where op.removido_em IS NULL AND m.removido_em IS NULL), 0) AS soma_valor_empenho_sum,
            COALESCE(SUM(op.soma_valor_liquidado) FILTER (where op.removido_em IS NULL AND m.removido_em IS NULL), 0) AS soma_valor_liquidado_sum
        FROM orcamento_realizado op
        JOIN meta m ON m.id = op.meta_id
        WHERE
            op.ano_referencia = NEW.ano_referencia
        AND op.dotacao = NEW.dotacao
        AND op.processo = NEW.processo
        AND op.nota_empenho IS NULL
        GROUP BY 1
    ),
    pdm_upsert AS(
    INSERT INTO pdm_dotacao_processo(pdm_id, ano_referencia, dotacao, dotacao_processo, soma_valor_empenho, soma_valor_liquidado)
        SELECT
            pdm_sum.pdm_id,
            NEW.ano_referencia,
            NEW.dotacao,
            NEW.processo,
            pdm_sum.soma_valor_empenho_sum,
            pdm_sum.soma_valor_liquidado_sum
        FROM
            pdm_sum
        ON CONFLICT(pdm_id, ano_referencia, dotacao, dotacao_processo)
            DO UPDATE SET
                soma_valor_empenho = EXCLUDED.soma_valor_empenho,
                soma_valor_liquidado = EXCLUDED.soma_valor_liquidado
    ) SELECT 1 into tmp WHERE NEW.nota_empenho IS NULL;

    -- Portfolio dotacao_planejado com processo (mas sem NF)
    WITH portfolio_sum AS(
        SELECT
            p.portfolio_id,
            COALESCE(SUM(op.soma_valor_empenho) FILTER (where op.removido_em IS NULL AND p.removido_em IS NULL), 0) AS soma_valor_empenho_sum,
            COALESCE(SUM(op.soma_valor_liquidado) FILTER (where op.removido_em IS NULL AND p.removido_em IS NULL), 0) AS soma_valor_liquidado_sum
        FROM orcamento_realizado op
        JOIN projeto p ON op.projeto_id = p.id
        WHERE
            op.ano_referencia = NEW.ano_referencia
        AND op.dotacao = NEW.dotacao
        AND op.processo = NEW.processo
        AND op.nota_empenho IS NULL
        GROUP BY 1
    ),
    portfolio_upsert AS(
    INSERT INTO portfolio_dotacao_processo(portfolio_id, ano_referencia, dotacao, dotacao_processo, soma_valor_empenho, soma_valor_liquidado)
        SELECT
            portfolio_sum.portfolio_id,
            NEW.ano_referencia,
            NEW.dotacao,
            NEW.processo,
            portfolio_sum.soma_valor_empenho_sum,
            portfolio_sum.soma_valor_liquidado_sum
        FROM
            portfolio_sum
        ON CONFLICT(portfolio_id, ano_referencia, dotacao, dotacao_processo)
            DO UPDATE SET
                soma_valor_empenho = EXCLUDED.soma_valor_empenho,
                soma_valor_liquidado = EXCLUDED.soma_valor_liquidado
    ) SELECT 1 into tmp WHERE NEW.nota_empenho IS NULL;


    -----------
    -- Pdm dotacao_planejado com NF
    WITH pdm_sum AS(
        SELECT
            m.pdm_id,
            COALESCE(SUM(op.soma_valor_empenho) FILTER (where op.removido_em IS NULL AND m.removido_em IS NULL), 0) AS soma_valor_empenho_sum,
            COALESCE(SUM(op.soma_valor_liquidado) FILTER (where op.removido_em IS NULL AND m.removido_em IS NULL), 0) AS soma_valor_liquidado_sum
        FROM orcamento_realizado op
        JOIN meta m ON m.id = op.meta_id
        WHERE
            op.ano_referencia = NEW.ano_referencia
        AND op.dotacao = NEW.dotacao
        AND op.processo = NEW.processo
        AND op.nota_empenho = NEW.nota_empenho
        GROUP BY 1
    ),
    pdm_upsert AS(
    INSERT INTO pdm_dotacao_processo_nota(pdm_id, ano_referencia, dotacao, dotacao_processo, dotacao_processo_nota, soma_valor_empenho, soma_valor_liquidado)
        SELECT
            pdm_sum.pdm_id,
            NEW.ano_referencia,
            NEW.dotacao,
            NEW.processo,
            NEW.nota_empenho,
            pdm_sum.soma_valor_empenho_sum,
            pdm_sum.soma_valor_liquidado_sum
        FROM
            pdm_sum
        ON CONFLICT(pdm_id, ano_referencia, dotacao, dotacao_processo, dotacao_processo_nota)
            DO UPDATE SET
                soma_valor_empenho = EXCLUDED.soma_valor_empenho,
                soma_valor_liquidado = EXCLUDED.soma_valor_liquidado
    ) SELECT 1 into tmp WHERE NEW.nota_empenho IS NOT NULL;

    -- Portfolio dotacao_planejado com processo (mas sem NF)
    WITH portfolio_sum AS(
        SELECT
            p.portfolio_id,
            COALESCE(SUM(op.soma_valor_empenho) FILTER (where op.removido_em IS NULL AND p.removido_em IS NULL), 0) AS soma_valor_empenho_sum,
            COALESCE(SUM(op.soma_valor_liquidado) FILTER (where op.removido_em IS NULL AND p.removido_em IS NULL), 0) AS soma_valor_liquidado_sum
        FROM orcamento_realizado op
        JOIN projeto p ON op.projeto_id = p.id
        WHERE
            op.ano_referencia = NEW.ano_referencia
        AND op.dotacao = NEW.dotacao
        AND op.processo = NEW.processo
        AND op.nota_empenho = NEW.nota_empenho
        GROUP BY 1
    ),
    portfolio_upsert AS(
    INSERT INTO portfolio_dotacao_processo_nota(portfolio_id, ano_referencia, dotacao, dotacao_processo, dotacao_processo_nota, soma_valor_empenho, soma_valor_liquidado)
        SELECT
            portfolio_sum.portfolio_id,
            NEW.ano_referencia,
            NEW.dotacao,
            NEW.processo,
            NEW.nota_empenho,
            portfolio_sum.soma_valor_empenho_sum,
            portfolio_sum.soma_valor_liquidado_sum
        FROM
            portfolio_sum
        ON CONFLICT(portfolio_id, ano_referencia, dotacao, dotacao_processo, dotacao_processo_nota)
            DO UPDATE SET
                soma_valor_empenho = EXCLUDED.soma_valor_empenho,
                soma_valor_liquidado = EXCLUDED.soma_valor_liquidado
    ) SELECT 1 into tmp WHERE NEW.nota_empenho IS NOT NULL;




    RETURN NEW;
END;
$$
LANGUAGE plpgsql;


update orcamento_realizado set id=id;
update orcamento_planejado set id=id;
