-- First update Medicao
WITH inconsistent_medicao AS (
    SELECT DISTINCT v.id, gre.orgao_id as medicao_orgao_id
    FROM variavel v
    JOIN variavel_grupo_responsavel_equipe vgre ON vgre.variavel_id = v.id AND vgre.removido_em IS NULL
    JOIN grupo_responsavel_equipe gre ON gre.id = vgre.grupo_responsavel_equipe_id AND gre.removido_em IS NULL
    WHERE gre.perfil = 'Medicao'
    AND COALESCE(gre.orgao_id) is distinct from v.medicao_orgao_id
)
UPDATE variavel v
SET
    medicao_orgao_id = im.medicao_orgao_id,
    atualizado_em = NOW()
FROM inconsistent_medicao im
WHERE v.id = im.id;


-- Then update Validacao
WITH inconsistent_validacao AS (
    SELECT DISTINCT v.id, gre.orgao_id as validacao_orgao_id
    FROM variavel v
    JOIN variavel_grupo_responsavel_equipe vgre ON vgre.variavel_id = v.id AND vgre.removido_em IS NULL
    JOIN grupo_responsavel_equipe gre ON gre.id = vgre.grupo_responsavel_equipe_id AND gre.removido_em IS NULL
    WHERE gre.perfil = 'Validacao'
    AND COALESCE(gre.orgao_id) is distinct from v.validacao_orgao_id
)
UPDATE variavel v
SET
    validacao_orgao_id = iv.validacao_orgao_id,
    atualizado_em = NOW()
FROM inconsistent_validacao iv
WHERE v.id = iv.id;


-- Finally update Liberacao
WITH inconsistent_liberacao AS (
    SELECT DISTINCT v.id, gre.orgao_id as liberacao_orgao_id
    FROM variavel v
    JOIN variavel_grupo_responsavel_equipe vgre ON vgre.variavel_id = v.id AND vgre.removido_em IS NULL
    JOIN grupo_responsavel_equipe gre ON gre.id = vgre.grupo_responsavel_equipe_id AND gre.removido_em IS NULL
    WHERE gre.perfil = 'Liberacao'
    AND gre.orgao_id is distinct from v.liberacao_orgao_id
)
UPDATE variavel v
SET
    liberacao_orgao_id = il.liberacao_orgao_id,
    atualizado_em = NOW()
FROM inconsistent_liberacao il
WHERE v.id = il.id;
