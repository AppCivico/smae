-- AlterTable
ALTER TABLE "projeto" ADD COLUMN     "tags" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
