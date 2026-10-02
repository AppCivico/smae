CREATE OR REPLACE VIEW view_projeto_custo_categoria AS
SELECT
    'Custo Realizado' AS categoria,
    tc.realizado_custo AS valor,
    p.id
FROM
    projeto p
left join tarefa_cronograma tc ON tc.projeto_id = p.id AND tc.removido_em IS NULL
WHERE
    tc.realizado_custo IS NOT NULL
    AND p.removido_em IS NULL
UNION ALL
SELECT
    'Custo Previsto',
    coalesce(tc.previsao_custo, p.previsao_custo) AS valor,
    p.id
FROM
    projeto p
left join tarefa_cronograma tc ON tc.projeto_id = p.id AND tc.removido_em IS NULL
WHERE
    coalesce(tc.previsao_custo, p.previsao_custo) IS NOT NULL
    AND p.removido_em IS NULL;

CREATE OR REPLACE VIEW view_projeto_custo_categoria_uso_corrente AS
SELECT * from view_projeto_custo_categoria

UNION ALL
SELECT
    'Custo previsto até o momento',
    sum(a.custo_estimado) AS valor,
    b.projeto_id as id
FROM
    tarefa a
    join tarefa_cronograma b on b.id = a.tarefa_cronograma_id
    join projeto p on p.id = b.projeto_id
WHERE
    a.termino_planejado <= now() at time zone 'America/Sao_Paulo'
and a.custo_estimado is not null
and a.tarefa_pai_id is null
and a.removido_em is null
and b.removido_em is null
and p.removido_em is null
group by 1,3;
