/*
CREATE OR REPLACE FUNCTION periodicidade_intervalo (p "Periodicidade")
 RETURNS interval
 LANGUAGE SQL
 AS $$
 SELECT
 CASE WHEN p = 'Mensal' THEN
 '1 month'::interval
 WHEN p = 'Bimestral' THEN
 '2 month'::interval
 WHEN p = 'Trimestral' THEN
 '3 month'::interval
 WHEN p = 'Quadrimestral' THEN
 '4 month'::interval
 WHEN p = 'Semestral' THEN
 '6 month'::interval
 WHEN p = 'Anual' THEN
 '1 year'::interval
 WHEN p = 'Quinquenal' THEN
 '5 year'::interval
 WHEN p = 'Secular' THEN
 '10 year'::interval
 ELSE
 NULL
 END;

$$;
 */
CREATE OR REPLACE FUNCTION monta_formula (indicador_id int, serie "Serie", periodo date)
    RETURNS varchar
    AS $$
DECLARE
    _formula varchar;
    _dadoValido int;
    _valor numeric(95, 60);
    _registros int;
BEGIN
    SELECT
        formula INTO _formula
    FROM
        indicador i
    WHERE
        i.id = indicador_id;
    RETURN _formula;
END
$$
LANGUAGE plpgsql;

