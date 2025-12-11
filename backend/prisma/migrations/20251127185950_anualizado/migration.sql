-- AlterTable
ALTER TABLE "tarefa" ADD COLUMN     "backup_custo_estimado" DOUBLE PRECISION,
ADD COLUMN     "backup_custo_real" DOUBLE PRECISION,
ADD COLUMN     "custo_estimado_anualizado" JSON,
ADD COLUMN     "custo_real_anualizado" JSON;

update tarefa set backup_custo_estimado = custo_estimado WHERE custo_estimado IS NOT NULL;
update tarefa set backup_custo_real = custo_real WHERE custo_real IS NOT NULL;

update tarefa set
    custo_real_anualizado = json_build_object(to_char(inicio_real, 'YYYY'), custo_real)
where
    inicio_real is not null
    and termino_real is not null
    and date_part('year', inicio_real) = date_part('year', termino_real);

update tarefa set
    custo_estimado_anualizado = json_build_object(to_char(inicio_planejado, 'YYYY'), custo_estimado)
where
    inicio_planejado is not null
    and termino_planejado is not null
    and date_part('year', inicio_planejado) = date_part('year', termino_planejado);

-- custo_estimado/custo_real pra null quando os anos não são iguais, assim a trigger vai recalcular quando foram preenchidos corretamente
-- mas ao mesmo isso vai mudar um monte de tarefa_cronograma já no deploy, mas se não rodar isso,
-- o banco fica 'inconsistente' com os novos campos até que a pessoa entre e salve (o campo do backup estaria na tela)
-- pra isso não acontecer, as funções do usam o backup quando o anualizado é null
UPDATE tarefa SET custo_estimado = NULL
WHERE inicio_planejado IS NOT NULL
  AND termino_planejado IS NOT NULL
  AND date_part('year', inicio_planejado) <> date_part('year', termino_planejado)
  AND (custo_estimado IS NOT NULL) AND removido_em is null;

UPDATE tarefa SET custo_real = NULL
WHERE inicio_real IS NOT NULL
  AND termino_real IS NOT NULL
  AND date_part('year', inicio_real) <> date_part('year', termino_real)
  AND (custo_real IS NOT NULL) AND removido_em is null;

