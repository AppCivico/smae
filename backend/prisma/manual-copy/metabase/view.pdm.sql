CREATE OR REPLACE FUNCTION f_regiao_filha_ate_nivel(p_regiao_id INT, p_max_nivel INT)
RETURNS TABLE (
    id INT,
    parent INT,
    nivel INT
)
AS $$
BEGIN
    RETURN QUERY


    WITH RECURSIVE RegionHierarchy AS (
        SELECT
            me.id,
            me.parente_id, me.nivel
        FROM
            regiao me
        WHERE
            me.id = p_regiao_id
        UNION ALL
        SELECT
            r.id,
            r.parente_id , r.nivel
        FROM
            regiao r
        INNER JOIN
            RegionHierarchy h ON r.parente_id = h.id
    )
    select me.*
    from RegionHierarchy me where me.nivel = p_max_nivel;

END;
$$ LANGUAGE plpgsql;



