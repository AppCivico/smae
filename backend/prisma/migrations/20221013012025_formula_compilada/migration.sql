-- AlterTable
ALTER TABLE "indicador" ADD COLUMN     "formula_compilada" TEXT;

-- CreateIndex
CREATE INDEX "idx_serie_variavel_variavel_id_data_valor" ON "serie_variavel"("serie", "variavel_id", "data_valor");

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

