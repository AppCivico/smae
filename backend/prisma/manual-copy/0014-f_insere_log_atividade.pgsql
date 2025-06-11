CREATE OR REPLACE FUNCTION f_insere_log_atividade(
    p_pessoa_id INTEGER,
    p_ip INET,
    p_pessoa_sessao_id INTEGER
)
RETURNS VOID AS $$
DECLARE
    v_existing_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO v_existing_count
    FROM pessoa_atividade_log
    WHERE pessoa_sessao_id = p_pessoa_sessao_id
      AND criado_em > (NOW() - INTERVAL '1 minute');

    IF v_existing_count = 0 THEN
        INSERT INTO pessoa_atividade_log (pessoa_id, ip, pessoa_sessao_id, criado_em)
        VALUES (p_pessoa_id, p_ip, p_pessoa_sessao_id, NOW());
    END IF;
END;
$$ LANGUAGE plpgsql;
