-- AlterTable
ALTER TABLE "cargo" ALTER COLUMN "removido_em" DROP NOT NULL;

-- AlterTable
ALTER TABLE "coordenadoria" ALTER COLUMN "removido_em" DROP NOT NULL;

-- AlterTable
ALTER TABLE "departamento" ALTER COLUMN "removido_em" DROP NOT NULL;

-- AlterTable
ALTER TABLE "divisao_tecnica" ALTER COLUMN "removido_em" DROP NOT NULL;

-- AlterTable
ALTER TABLE "orgao" ALTER COLUMN "removido_em" DROP NOT NULL;
