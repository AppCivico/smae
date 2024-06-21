-- AlterEnum
ALTER TYPE "FonteRelatorio" ADD VALUE 'ObraStatus';

-- AlterTable
ALTER TABLE "projeto" ADD COLUMN     "tags" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
