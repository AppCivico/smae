-- Alinha duracao_real às datas reais nas tarefas de cronograma de transferência (o workflow gravava as datas sem a duração).
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
