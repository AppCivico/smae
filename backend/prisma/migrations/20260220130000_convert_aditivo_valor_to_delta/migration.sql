-- Convert aditivo valor from absolute (total after) to delta
-- Old model: aditivo.valor = total contract value after this aditivo
-- New model: aditivo.valor = delta to add/subtract from contract value
--
-- Only converts active (non-deleted) records.
-- Soft-deleted records keep their old values (they're never queried).
-- Uses COALESCE(c.valor, 0) for contracts with null valor.
--
-- Backup: original absolute values are preserved in valor_absoluto_bkp.
-- To restore: UPDATE contrato_aditivo SET valor = valor_absoluto_bkp WHERE valor_absoluto_bkp IS NOT NULL;
-- To drop backup after confirming: ALTER TABLE contrato_aditivo DROP COLUMN valor_absoluto_bkp;

ALTER TABLE contrato_aditivo ADD COLUMN valor_absoluto_bkp DECIMAL;

UPDATE contrato_aditivo SET valor_absoluto_bkp = valor WHERE valor IS NOT NULL AND removido_em IS NULL;

WITH ordered_aditivos AS (
    SELECT
        ca.id,
        ca.valor,
        COALESCE(c.valor, 0) as contrato_valor,
        LAG(ca.valor) OVER (
            PARTITION BY ca.contrato_id
            ORDER BY ca.data ASC, ca.id ASC
        ) as prev_valor
    FROM contrato_aditivo ca
    JOIN contrato c ON c.id = ca.contrato_id
    WHERE ca.valor IS NOT NULL
    AND ca.removido_em IS NULL
)
UPDATE contrato_aditivo ca
SET valor = oa.valor - COALESCE(oa.prev_valor, oa.contrato_valor)
FROM ordered_aditivos oa
WHERE ca.id = oa.id;
