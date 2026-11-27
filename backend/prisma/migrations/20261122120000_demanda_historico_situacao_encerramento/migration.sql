-- AlterTable
ALTER TABLE "demanda_historico" ADD COLUMN     "situacao_encerramento" "DemandaSituacao";

-- Só o cancelamento encerra a partir de Registro ou Validação
UPDATE "demanda_historico"
SET "situacao_encerramento" = 'Cancelada'
WHERE "status_novo" = 'Encerrado'
  AND "status_anterior" IN ('Registro', 'Validacao');

-- Último encerramento de demanda ainda encerrada
UPDATE "demanda_historico" h
SET "situacao_encerramento" = d."situacao_encerramento"
FROM "demanda" d
WHERE d."id" = h."demanda_id"
  AND d."status" = 'Encerrado'
  AND d."situacao_encerramento" IS NOT NULL
  AND h."id" = (
      SELECT h2."id"
      FROM "demanda_historico" h2
      WHERE h2."demanda_id" = d."id"
        AND h2."status_novo" = 'Encerrado'
      ORDER BY h2."criado_em" DESC, h2."id" DESC
      LIMIT 1
  );
