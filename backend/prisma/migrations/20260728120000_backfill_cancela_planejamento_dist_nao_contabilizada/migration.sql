-- Backfill: cancela (soft-delete) o planejamento (fases/tarefas/cronograma) de Distribuições de Recurso
-- cujo último Histórico de Status já indica valor_distribuicao_contabilizado = false (cancelada,
-- redistribuída, impedida tecnicamente etc.).
--
-- Alinha dados já existentes em outros ambientes com a nova regra de negócio implementada em
-- DistribuicaoRecursoStatusService.create(): a partir de agora, toda vez que o novo status registrado
-- deixa de contabilizar a distribuição, as tarefas (fases/tarefas/cronograma) dela são canceladas. Este
-- script cobre retroativamente as distribuições cujo status atual já era não-contabilizado antes dessa
-- mudança.
--
-- Para cada distribuição, resolve o registro de histórico de status mais recente não removido
-- (data_troca desc, id desc como desempate) e a config associada (status_base tem precedência sobre
-- status, mesma regra usada no restante do código). Distribuições sem histórico de status não são
-- afetadas (mesmo default "contabilizado" usado pela aplicação).
--
-- Idempotente: só atualiza tarefas com removido_em IS NULL, então rodar de novo não tem efeito.
WITH ultimo_status AS (
    SELECT DISTINCT ON (drs.distribuicao_id)
        drs.distribuicao_id,
        COALESCE(dsb.valor_distribuicao_contabilizado, ds.valor_distribuicao_contabilizado) AS contabilizado
    FROM distribuicao_recurso_status drs
    LEFT JOIN distribuicao_status_base dsb ON dsb.id = drs.status_base_id
    LEFT JOIN distribuicao_status ds ON ds.id = drs.status_id
    WHERE drs.removido_em IS NULL
    ORDER BY drs.distribuicao_id, drs.data_troca DESC, drs.id DESC
)
UPDATE tarefa
SET removido_em = now()
FROM ultimo_status
WHERE tarefa.distribuicao_recurso_id = ultimo_status.distribuicao_id
  AND tarefa.removido_em IS NULL
  AND ultimo_status.contabilizado = false;
