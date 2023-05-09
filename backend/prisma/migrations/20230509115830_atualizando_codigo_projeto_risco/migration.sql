-- This is an empty migration.
UPDATE "projeto_risco" r1 SET "codigo" = r2.seq
FROM ( (select id, row_number() OVER (partition by projeto_id) as seq from projeto_risco)) r2
WHERE r1.id = r2.id;