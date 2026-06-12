-- Backfill de órgãos participantes para iniciativa/atividade em modo Plano Setorial (PS / PDM-v2).
--
-- Contexto: no modo PS as iniciativas/atividades só gravavam as equipes (pdm_perfil),
-- nunca os órgãos (iniciativa_orgao / atividade_orgao). Por isso esses registros antigos
-- retornam "orgaos_participantes" vazio. Este backfill deriva os órgãos a partir dos
-- órgãos das equipes (pdm_perfil.orgao_id), com a mesma semântica de
-- MetaService.calculaOrgaosPelaEquipe (CP e PONTO_FOCAL, dedup por órgão, responsavel = true).
--
-- Só atinge entidades geridas por PS: os registros em pdm_perfil de iniciativa/atividade só
-- existem nesse modo (o fluxo legado _PDM nunca cria pdm_perfil de iniciativa/atividade).
-- É idempotente: insere apenas órgãos que ainda não existem para a entidade.

-- INICIATIVA
INSERT INTO iniciativa_orgao (iniciativa_id, orgao_id, responsavel)
SELECT DISTINCT pp.iniciativa_id, pp.orgao_id, true
FROM pdm_perfil pp
WHERE pp.iniciativa_id IS NOT NULL
  AND pp.removido_em IS NULL
  AND pp.tipo IN ('CP', 'PONTO_FOCAL')
  AND NOT EXISTS (
    SELECT 1
    FROM iniciativa_orgao io
    WHERE io.iniciativa_id = pp.iniciativa_id
      AND io.orgao_id = pp.orgao_id
  );

-- ATIVIDADE
INSERT INTO atividade_orgao (atividade_id, orgao_id, responsavel)
SELECT DISTINCT pp.atividade_id, pp.orgao_id, true
FROM pdm_perfil pp
WHERE pp.atividade_id IS NOT NULL
  AND pp.removido_em IS NULL
  AND pp.tipo IN ('CP', 'PONTO_FOCAL')
  AND NOT EXISTS (
    SELECT 1
    FROM atividade_orgao ao
    WHERE ao.atividade_id = pp.atividade_id
      AND ao.orgao_id = pp.orgao_id
  );
