CREATE OR REPLACE FUNCTION to_char_numeric (p numeric)
    RETURNS varchar
    LANGUAGE SQL
    IMMUTABLE
    AS $$
    SELECT
        CASE WHEN p IS NULL THEN
            ''
        WHEN p = 0 THEN
            '0.00'
        ELSE
            to_char(p, 'FM999999999999999999.00')
        END;
$$;

