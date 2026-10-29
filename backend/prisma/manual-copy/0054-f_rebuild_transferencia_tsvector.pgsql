-- Versões "flexíveis" dos números de um texto, para a busca ignorar pontuação e zeros à esquerda.
-- O parser do Postgres grava números colados em pontuação como um token só
-- (ex.: "2026.067.89922", "034994/2026"), e aí nenhum pedaço casa na busca por prefixo.
-- Para cada número encontrado devolve:
--   - as partes, sem zeros à esquerda:  "2026.067.89922" -> "2026 67 89922"
--   - o número junto, sem zeros à esquerda: "2026.067.89922" -> "202606789922"
--   - para a busca por trecho (começo, meio ou fim), todos os finais do número junto com 3+
--     dígitos, com o prefixo "qx". Buscar pelo começo de um final acha qualquer trecho:
--     "2026.067.89922" -> "qx202606789922 qx02606789922 ... qx89922 qx9922 qx922"
--     ("992", do meio de "89922", casa com "qx9922").
-- O termo digitado é normalizado do mesmo jeito em PrismaHelpers.buscaIdsPalavraChave.
CREATE OR REPLACE FUNCTION f_tsvector_numeros_flexiveis(p_texto TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT COALESCE(
        string_agg(
            regexp_replace(regexp_replace(m[1], '[./\-]+', ' ', 'g'), '\m0+(\d)', '\1', 'g')
            || ' ' ||
            regexp_replace(j.junto, '^0+(\d)', '\1')
            || COALESCE(
                ' ' || (
                    SELECT string_agg('qx' || substr(j.junto, i), ' ')
                    FROM generate_series(1, length(j.junto) - 2) AS i
                ),
                ''
            ),
            ' '
        ),
        ''
    )
    FROM regexp_matches(COALESCE(p_texto, ''), '(\d[\d./\-]*\d|\d)', 'g') AS m
    CROSS JOIN LATERAL (SELECT regexp_replace(m[1], '[./\-]+', '', 'g') AS junto) AS j;
$$;

CREATE OR REPLACE FUNCTION f_rebuild_transferencia_tsvector(p_transferencia_id INTEGER)
RETURNS TSVECTOR
LANGUAGE 'plpgsql'
STABLE
AS $$
DECLARE
    v_texto TEXT;
BEGIN
    SELECT
            COALESCE(CAST(t_main.esfera AS TEXT), '') || ' ' ||
            COALESCE(CAST(t_main.interface AS TEXT), '') || ' ' ||
            COALESCE(CAST(t_main.ano AS TEXT), '') || ' ' ||
            COALESCE(t_main.gestor_contrato, ' ') || ' ' ||
            COALESCE(t_main.secretaria_concedente_str, ' ') || ' ' ||
            COALESCE(t_main.emenda, ' ') || ' ' ||
            COALESCE(t_main.nome_programa, ' ') || ' ' ||
            COALESCE(t_main.objeto, ' ') || ' ' ||
            COALESCE(t_main.demanda, ' ') || ' ' ||
            COALESCE(t_main.plano_de_acao, ' ') || ' ' ||
            COALESCE(t_main.observacoes, ' ') || ' ' ||
            COALESCE(tt.nome, ' ') || ' ' ||
            COALESCE(o1.sigla, ' ') || ' ' ||
            COALESCE(o1.descricao, ' ') || ' ' ||
            COALESCE(o2.sigla, ' ') || ' ' ||
            COALESCE(o2.descricao, ' ') || ' ' ||
            COALESCE(
                ( SELECT string_agg(CAST(p.nome_popular AS TEXT) || ' ' || CAST(p.nome AS TEXT), ' ')
                    FROM transferencia_parlamentar tp
                    JOIN parlamentar p ON p.id = tp.parlamentar_id
                    WHERE tp.transferencia_id = t_main.id AND tp.removido_em IS NULL
                ),
                ' '
            ) || ' ' ||
            COALESCE(
                ( SELECT string_agg(CAST(p.sigla AS TEXT), ' ')
                    FROM transferencia_parlamentar tp
                    JOIN partido p ON p.id = tp.partido_id
                    WHERE tp.transferencia_id = t_main.id AND tp.removido_em IS NULL
                ),
                ' '
            ) || ' ' ||
            COALESCE(
                ( SELECT string_agg(CAST(tp.cargo AS TEXT), ' ')
                    FROM transferencia_parlamentar tp
                    WHERE tp.transferencia_id = t_main.id AND tp.removido_em IS NULL
                ),
                ' '
            ) || ' ' ||
            COALESCE(
                ( SELECT string_agg(
                    CAST(o_dr.sigla AS TEXT) || ' ' || CAST(o_dr.descricao AS TEXT) || ' ' || CAST(dr.nome AS TEXT) || ' ' || CAST(dr.objeto AS TEXT), ' ')
                    FROM distribuicao_recurso dr
                    JOIN orgao o_dr ON o_dr.id = dr.orgao_gestor_id
                    WHERE dr.transferencia_id = t_main.id AND dr.removido_em IS NULL
                ),
                ' '
            ) || ' ' ||
            COALESCE(t_main.programa, ' ')
    INTO v_texto
    FROM transferencia t_main
    LEFT JOIN transferencia_tipo tt ON tt.id = t_main.tipo_id
    LEFT JOIN orgao o1 ON o1.id = t_main.orgao_concedente_id
    LEFT JOIN orgao o2 ON o2.id = t_main.secretaria_concedente_id
    WHERE t_main.id = p_transferencia_id;

    IF v_texto IS NULL THEN
        RETURN NULL;
    END IF;

    RETURN to_tsvector('simple_unaccent', v_texto || ' ' || f_tsvector_numeros_flexiveis(v_texto));
END;
$$;

-- Reconstrói os vetores de busca de todas as transferências ativas, para que
-- alterações nas colunas indexadas acima passem a valer também nos registros já existentes.
UPDATE transferencia
SET vetores_busca = f_rebuild_transferencia_tsvector(id)
WHERE removido_em IS NULL;
