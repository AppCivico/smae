-- Índices para otimização de busca em transferencias

-- Índice GIN para busca full-text usando tsvector
-- Este índice acelera drasticamente as buscas por palavras-chave
CREATE INDEX IF NOT EXISTS idx_transferencia_vetores_busca 
ON transferencia USING gin(vetores_busca);

-- Índice para busca por identificador
-- Acelera buscas diretas e combinadas por identificador (ex: "1/2025")
CREATE INDEX IF NOT EXISTS idx_transferencia_identificador 
ON transferencia(identificador) 
WHERE removido_em IS NULL;

-- Índice composto para filtros comuns
-- Acelera queries que filtram por ano, esfera e removido_em
CREATE INDEX IF NOT EXISTS idx_transferencia_ano_esfera 
ON transferencia(ano, esfera) 
WHERE removido_em IS NULL;

-- Comentários documentando os índices
COMMENT ON INDEX idx_transferencia_vetores_busca IS 
'Índice GIN para busca full-text em transferencias. Usado em buscas por palavras-chave.';

COMMENT ON INDEX idx_transferencia_identificador IS 
'Índice para busca por identificador (formato "numero/ano"). Suporta busca direta e combinada.';

COMMENT ON INDEX idx_transferencia_ano_esfera IS 
'Índice composto para filtros comuns em listagens de transferencias.';
