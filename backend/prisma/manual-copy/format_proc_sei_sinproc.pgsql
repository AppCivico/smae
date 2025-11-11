CREATE OR REPLACE FUNCTION format_proc_sei_sinproc(p_input VARCHAR)
RETURNS VARCHAR AS
$$
DECLARE
    v_clean TEXT := p_input;
    v_len   INT := length(v_clean);
    v_result TEXT;
BEGIN
    -- SEI format: DDDD.DDDD/DDDDDDD-D  → 15 digits
    IF v_len = 15 THEN
        v_result := substr(v_clean, 1, 4) || '.' ||
                    substr(v_clean, 5, 4) || '/' ||
                    substr(v_clean, 9, 7) || '-' ||
                    substr(v_clean, 16, 1);
        RETURN v_result;

    -- SINPROC format: AAAA-D.DDD.DDD-D  → 12 digits
    ELSIF v_len = 12 THEN
        v_result := substr(v_clean, 1, 4) || '-' ||
                    substr(v_clean, 5, 1) || '.' ||
                    substr(v_clean, 6, 3) || '.' ||
                    substr(v_clean, 9, 3) || '-' ||
                    substr(v_clean, 12, 1);
        RETURN v_result;

    -- se não enfia o ' pra ajustar o excel
    ELSE
        RETURN '''' || p_input;
    END IF;
END;
$$
LANGUAGE plpgsql IMMUTABLE;
