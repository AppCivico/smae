-- o create gravava o criador em removido_por; avisos removidos já têm removido_por sobrescrito e ficam sem criado_por
UPDATE aviso_email
SET criado_por = removido_por,
    removido_por = NULL
WHERE criado_por IS NULL
AND removido_em IS NULL
AND removido_por IS NOT NULL;
