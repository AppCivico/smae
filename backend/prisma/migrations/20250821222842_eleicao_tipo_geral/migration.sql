-- AlterEnum
BEGIN;
ALTER TYPE "EleicaoTipo" ADD VALUE 'Geral';
COMMIT;

-- update eleicao set tipo = 'Geral' where tipo='Estadual';
