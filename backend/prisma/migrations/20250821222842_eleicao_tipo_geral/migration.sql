-- AlterEnum
BEGIN;
ALTER TYPE "EleicaoTipo" ADD VALUE 'Geral';
COMMIT;
INSERT INTO eleicao (id, tipo, ano, atual_para_mandatos, removido_em)
SELECT id, 'Geral', ano, atual_para_mandatos, removido_em
FROM eleicao
WHERE tipo = 'Estadual'
ON CONFLICT (tipo, ano) DO NOTHING;
DELETE FROM eleicao
WHERE tipo = 'Estadual';
