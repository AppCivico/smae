-- AlterEnum
ALTER TYPE "EleicaoTipo" ADD VALUE 'Geral';
update eleicao set tipo ='Geral' where tipo='Estadual';
