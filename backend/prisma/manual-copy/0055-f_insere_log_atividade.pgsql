CREATE OR REPLACE FUNCTION f_insere_log_atividade(
    p_pessoa_id        INTEGER,
    p_ip               INET,
    p_pessoa_sessao_id INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_existing_count INTEGER;
BEGIN
    INSERT INTO pessoa_ultima_atividade
        (pessoa_id, pessoa_sessao_id, ip, ultima_atividade_em)
    VALUES
        (p_pessoa_id, p_pessoa_sessao_id, p_ip, NOW())
    ON CONFLICT (pessoa_id) DO UPDATE
        SET pessoa_sessao_id    = EXCLUDED.pessoa_sessao_id,
            ip                  = EXCLUDED.ip,
            ultima_atividade_em = EXCLUDED.ultima_atividade_em;

    SELECT COUNT(*)
      INTO v_existing_count
      FROM pessoa_atividade_log
     WHERE pessoa_sessao_id = p_pessoa_sessao_id
       AND criado_em > (NOW() - INTERVAL '1 minute');

    IF v_existing_count = 0 THEN
        INSERT INTO pessoa_atividade_log
            (pessoa_id, ip, pessoa_sessao_id, criado_em)
        VALUES
            (p_pessoa_id, p_ip, p_pessoa_sessao_id, NOW());
    END IF;
END;
$$;
