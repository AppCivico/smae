-- Reparo pontual do PR #665 (fix/perfil-modulos-sistemas). Idempotente.
-- Rodar UMA vez após o deploy, depois do `prisma migrate deploy` e do runner de manual-copy
-- (a função update_modulos_sistemas() nova da 0065 precisa estar aplicada):
--   psql -v ON_ERROR_STOP=1 -f prisma/reparos/20260929-smae-core.sql "$DATABASE_URL"
-- Não apaga nem altera dados de usuário além de perfil_acesso.modulos_sistemas.
-- Não precisa re-login: a sessão guarda só o session_id, privilégios e sistemas são lidos do banco a cada request.

\echo '== 1. Recálculo de perfil_acesso.modulos_sistemas =='

-- mesma lógica da update_modulos_sistemas() nova (0065), só para perfis que têm ao menos 1 perfil_privilegio
WITH calc AS (
    SELECT
        pp.perfil_acesso_id,
        ARRAY_AGG(DISTINCT ms ORDER BY ms) AS modulos
    FROM perfil_privilegio pp
    JOIN privilegio p ON p.id = pp.privilegio_id
    JOIN privilegio_modulo pm ON pm.id = p.modulo_id
    CROSS JOIN LATERAL unnest(pm.modulo_sistema) AS ms
    GROUP BY pp.perfil_acesso_id
),
alvo AS (
    SELECT
        pa.id,
        COALESCE(c.modulos, '{}'::"ModuloSistema"[]) AS modulos
    FROM perfil_acesso pa
    LEFT JOIN calc c ON c.perfil_acesso_id = pa.id
    WHERE EXISTS (SELECT 1 FROM perfil_privilegio x WHERE x.perfil_acesso_id = pa.id)
)
UPDATE perfil_acesso pa
SET modulos_sistemas = alvo.modulos
FROM alvo
WHERE pa.id = alvo.id
AND pa.modulos_sistemas IS DISTINCT FROM alvo.modulos;

\echo '== 2. Diagnóstico: perfis sem nenhum privilégio (não alterados) =='
-- o trigger não dispara sem linhas em perfil_privilegio; se aparecer valor diferente de {} avaliar manualmente
SELECT pa.id, pa.nome, pa.modulos_sistemas, pa.removido_em
FROM perfil_acesso pa
WHERE NOT EXISTS (SELECT 1 FROM perfil_privilegio x WHERE x.perfil_acesso_id = pa.id)
ORDER BY pa.id;

\echo '== 3. Verificação: perfis ainda divergentes (esperado 0 linhas) =='
SELECT pa.id, pa.nome, pa.modulos_sistemas
FROM perfil_acesso pa
WHERE EXISTS (SELECT 1 FROM perfil_privilegio x WHERE x.perfil_acesso_id = pa.id)
AND pa.modulos_sistemas IS DISTINCT FROM COALESCE((
    SELECT ARRAY_AGG(DISTINCT ms ORDER BY ms)
    FROM perfil_privilegio pp
    JOIN privilegio p ON p.id = pp.privilegio_id
    JOIN privilegio_modulo pm ON pm.id = p.modulo_id
    CROSS JOIN LATERAL unnest(pm.modulo_sistema) AS ms
    WHERE pp.perfil_acesso_id = pa.id
), '{}'::"ModuloSistema"[]);
