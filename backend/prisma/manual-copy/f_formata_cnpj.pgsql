CREATE OR REPLACE FUNCTION f_formata_cnpj(p_cnpj TEXT)
RETURNS TEXT
AS $$
DECLARE
    v_digits TEXT;
BEGIN
    IF p_cnpj IS NULL THEN
        RETURN NULL;
    END IF;

    v_digits := regexp_replace(p_cnpj, '[^0-9]', '', 'g');

    IF length(v_digits) <> 14 THEN
        RETURN 'Invalido: ' || p_cnpj;
    END IF;

    RETURN substr(v_digits,1,2) || '.' ||
           substr(v_digits,3,3) || '.' ||
           substr(v_digits,6,3) || '/' ||
           substr(v_digits,9,4) || '-' ||
           substr(v_digits,13,2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
