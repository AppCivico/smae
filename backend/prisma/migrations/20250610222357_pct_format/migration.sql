/*
  Warnings:

  - You are about to alter the column `pct_custeio` on the `distribuicao_recurso` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(5,2)`.
  - You are about to alter the column `pct_investimento` on the `distribuicao_recurso` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(5,2)`.
  - You are about to alter the column `pct_custeio` on the `transferencia` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(5,2)`.
  - You are about to alter the column `pct_investimento` on the `transferencia` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(5,2)`.

*/
-- 1. Add temporary new columns
ALTER TABLE "transferencia"
ADD COLUMN "new_pct_investimento" DECIMAL(5,2),
ADD COLUMN "new_pct_custeio" DECIMAL(5,2);

-- 2. Convert and copy data with rounding and range checks
UPDATE "transferencia" SET
    "new_pct_investimento" = 
        CASE 
            WHEN "pct_investimento" BETWEEN -999.99 AND 999.99 
            THEN ROUND("pct_investimento"::numeric, 2) 
            ELSE NULL  -- Handle out-of-range values as NULL
        END,
    "new_pct_custeio" = 
        CASE 
            WHEN "pct_custeio" BETWEEN -999.99 AND 999.99 
            THEN ROUND("pct_custeio"::numeric, 2) 
            ELSE NULL 
        END;

-- 3. Drop original columns
ALTER TABLE "transferencia"
DROP COLUMN "pct_investimento",
DROP COLUMN "pct_custeio";

-- 4. Rename new columns to original names
ALTER TABLE "transferencia" RENAME COLUMN "new_pct_investimento" TO "pct_investimento";
ALTER TABLE "transferencia" RENAME COLUMN "new_pct_custeio" TO "pct_custeio";


ALTER TABLE "distribuicao_recurso"
ADD COLUMN "new_pct_investimento" DECIMAL(5,2),
ADD COLUMN "new_pct_custeio" DECIMAL(5,2);

UPDATE "distribuicao_recurso" SET
    "new_pct_investimento" = 
        CASE 
            WHEN "pct_investimento" BETWEEN -999.99 AND 999.99 
            THEN ROUND("pct_investimento"::numeric, 2) 
            ELSE NULL  -- Handle out-of-range values as NULL
        END,
    "new_pct_custeio" = 
        CASE 
            WHEN "pct_custeio" BETWEEN -999.99 AND 999.99 
            THEN ROUND("pct_custeio"::numeric, 2) 
            ELSE NULL 
        END;

ALTER TABLE "distribuicao_recurso"
DROP COLUMN "pct_investimento",
DROP COLUMN "pct_custeio";

ALTER TABLE "distribuicao_recurso" RENAME COLUMN "new_pct_investimento" TO "pct_investimento";
ALTER TABLE "distribuicao_recurso" RENAME COLUMN "new_pct_custeio" TO "pct_custeio";
