-- AlterTable
ALTER TABLE "projeto_licao_aprendida" ADD COLUMN     "contexto" TEXT,
ADD COLUMN     "resultado" TEXT,
ADD COLUMN     "sequencial" INTEGER;

UPDATE "projeto_licao_aprendida" l1 SET "sequencial" = l2.seq
FROM ( (select id, row_number() OVER (partition by projeto_id) as seq from projeto_licao_aprendida)) l2
WHERE l1.id = l2.id;

ALTER TABLE "projeto_licao_aprendida" ALTER COLUMN "sequencial" SET NOT NULL;