-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DistribuicaoStatusTipo" ADD VALUE 'NaoIniciado';
ALTER TYPE "DistribuicaoStatusTipo" ADD VALUE 'EmAndamento';
ALTER TYPE "DistribuicaoStatusTipo" ADD VALUE 'Suspenso';
ALTER TYPE "DistribuicaoStatusTipo" ADD VALUE 'Cancelado';
ALTER TYPE "DistribuicaoStatusTipo" ADD VALUE 'ConcluidoComSucesso';
ALTER TYPE "DistribuicaoStatusTipo" ADD VALUE 'EncerradoSemSucesso';
ALTER TYPE "DistribuicaoStatusTipo" ADD VALUE 'Terminal';
