-- Step 1: Identify the duplicates
WITH duplicates AS (
  SELECT
    portifolio_id,
    orgao_id,
    ROW_NUMBER() OVER (PARTITION BY portifolio_id, orgao_id ORDER BY id) AS rnum
  FROM
    portifolio_orgao
)

-- Step 2: Remove the duplicates while keeping one instance of each duplicate set
DELETE FROM portifolio_orgao
WHERE id IN (
  SELECT id
  FROM duplicates
  WHERE rnum > 1
);

-- CreateIndex
CREATE UNIQUE INDEX "portifolio_orgao_portifolio_id_orgao_id_key" ON "portifolio_orgao"("portifolio_id", "orgao_id");
