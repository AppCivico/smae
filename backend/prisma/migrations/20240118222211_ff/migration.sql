-- CreateTable
CREATE TABLE "feature_flag" (
    "id" SERIAL NOT NULL,
    "panorama" BOOLEAN NOT NULL DEFAULT false,
    "mf_v2" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "feature_flag_pkey" PRIMARY KEY ("id")
);
-- fix
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

