-- Filhas regionais de variável Global não recebiam as trocas de equipe da mãe.
-- Após o deploy, rodar PATCH /api/pessoa/recalc-equipe para recalcular perfis_equipe_pdm/ps.

UPDATE variavel_grupo_responsavel_equipe f
SET removido_em = now()
FROM variavel filha
JOIN variavel mae ON mae.id = filha.variavel_mae_id
WHERE f.variavel_id = filha.id
  AND f.removido_em IS NULL
  AND filha.tipo = 'Global' AND filha.removido_em IS NULL
  AND mae.tipo = 'Global' AND mae.removido_em IS NULL
  AND NOT EXISTS (
      SELECT 1
      FROM variavel_grupo_responsavel_equipe m
      WHERE m.variavel_id = mae.id
        AND m.removido_em IS NULL
        AND m.grupo_responsavel_equipe_id = f.grupo_responsavel_equipe_id
  );

INSERT INTO variavel_grupo_responsavel_equipe (variavel_id, grupo_responsavel_equipe_id)
SELECT DISTINCT filha.id, m.grupo_responsavel_equipe_id
FROM variavel filha
JOIN variavel mae ON mae.id = filha.variavel_mae_id AND mae.tipo = 'Global' AND mae.removido_em IS NULL
JOIN variavel_grupo_responsavel_equipe m ON m.variavel_id = mae.id AND m.removido_em IS NULL
WHERE filha.tipo = 'Global' AND filha.removido_em IS NULL
  AND NOT EXISTS (
      SELECT 1
      FROM variavel_grupo_responsavel_equipe f
      WHERE f.variavel_id = filha.id
        AND f.removido_em IS NULL
        AND f.grupo_responsavel_equipe_id = m.grupo_responsavel_equipe_id
  );

UPDATE variavel filha
SET equipes_configuradas = mae.equipes_configuradas,
    medicao_orgao_id = mae.medicao_orgao_id,
    validacao_orgao_id = mae.validacao_orgao_id,
    liberacao_orgao_id = mae.liberacao_orgao_id
FROM variavel mae
WHERE mae.id = filha.variavel_mae_id
  AND mae.tipo = 'Global' AND mae.removido_em IS NULL
  AND filha.tipo = 'Global' AND filha.removido_em IS NULL
  AND (filha.equipes_configuradas, filha.medicao_orgao_id, filha.validacao_orgao_id, filha.liberacao_orgao_id)
      IS DISTINCT FROM
      (mae.equipes_configuradas, mae.medicao_orgao_id, mae.validacao_orgao_id, mae.liberacao_orgao_id);
