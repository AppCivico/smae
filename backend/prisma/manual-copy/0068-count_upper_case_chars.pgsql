-- função usada pra normalizar os dados da query de auto-complete do orgão do sof
CREATE OR REPLACE FUNCTION count_upper_case_chars(_input TEXT)
RETURNS INTEGER AS $$
DECLARE
    count_upper INTEGER := 0;
    char_idx INTEGER := 0;
    current_char CHAR(1);
BEGIN
    FOR char_idx IN 1..length(_input)
    LOOP
        current_char := substring(_input FROM char_idx FOR 1);
        IF current_char = UPPER(current_char) AND current_char != LOWER(current_char) THEN
            count_upper := count_upper + 1;
        END IF;
    END LOOP;
    RETURN count_upper;
END;
$$ LANGUAGE plpgsql;

/*
WITH upper_case_counts AS (
  SELECT descricao, lower(descricao) AS lower_descricao, count_upper_case_chars(descricao) AS num_upper_case
  FROM sof_entidades_linhas
  WHERE col = 'orgaos'
),
min_upper_case_counts AS (
  SELECT lower_descricao, MIN(num_upper_case) AS min_num_upper_case
  FROM upper_case_counts
  GROUP BY lower_descricao
)
SELECT ucc.descricao
FROM upper_case_counts AS ucc
JOIN min_upper_case_counts AS mucc
ON ucc.lower_descricao = mucc.lower_descricao AND ucc.num_upper_case = mucc.min_num_upper_case;
*/
