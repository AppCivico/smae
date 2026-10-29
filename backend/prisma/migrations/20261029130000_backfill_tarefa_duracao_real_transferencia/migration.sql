-- Alinha duracao_real às datas reais nas tarefas de cronograma de transferência (o workflow gravava as datas sem a duração).
-- Trigger desligada: o rollup do pai reescreveria datas reais e planejadas, e aqui só a duração deve mudar.
ALTER TABLE tarefa DISABLE TRIGGER trg_pp_tarefa_esticar_datas_do_pai_update;

UPDATE tarefa t
SET duracao_real = CASE WHEN t.termino_real >= t.inicio_real THEN t.termino_real - t.inicio_real + 1 END
FROM tarefa_cronograma tc
WHERE tc.id = t.tarefa_cronograma_id
  AND tc.transferencia_id IS NOT NULL
  AND tc.removido_em IS NULL
  AND t.removido_em IS NULL
  AND t.duracao_real IS DISTINCT FROM (
      CASE WHEN t.termino_real >= t.inicio_real THEN t.termino_real - t.inicio_real + 1 END
  );

ALTER TABLE tarefa ENABLE TRIGGER trg_pp_tarefa_esticar_datas_do_pai_update;
