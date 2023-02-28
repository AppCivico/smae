/*
  Warnings:

  - You are about to drop the column `duracao_real_calculado` on the `tarefa` table. All the data in the column will be lost.
  - You are about to drop the column `inicio_real_calculado` on the `tarefa` table. All the data in the column will be lost.
  - You are about to drop the column `termino_real_calculado` on the `tarefa` table. All the data in the column will be lost.

*/
-- AlterTable

-- precisa apagar as triggers e recriar pois o tipo da coluna ta mudando
drop trigger trg_pp_tarefa_esticar_datas_do_pai_update on tarefa;
drop trigger trg_pp_tarefa_esticar_datas_do_pai_insert on tarefa;



ALTER TABLE "tarefa" DROP COLUMN "duracao_real_calculado",
DROP COLUMN "inicio_real_calculado",
DROP COLUMN "termino_real_calculado",
ALTER COLUMN "inicio_planejado" SET DATA TYPE DATE,
ALTER COLUMN "termino_planejado" SET DATA TYPE DATE,
ALTER COLUMN "inicio_real" SET DATA TYPE DATE,
ALTER COLUMN "termino_real" SET DATA TYPE DATE;

CREATE TRIGGER trg_pp_tarefa_esticar_datas_do_pai_update AFTER UPDATE ON tarefa
    FOR EACH ROW
    WHEN (
        (OLD.inicio_planejado IS DISTINCT FROM NEW.inicio_planejado)
        OR
        (OLD.termino_planejado IS DISTINCT FROM NEW.termino_planejado)
        OR
        (OLD.duracao_planejado IS DISTINCT FROM NEW.duracao_planejado)
        OR
        (OLD.inicio_real IS DISTINCT FROM NEW.inicio_real)
        OR
        (OLD.termino_real IS DISTINCT FROM NEW.termino_real)
        OR
        (OLD.duracao_real IS DISTINCT FROM NEW.duracao_real)
        OR
        (OLD.tarefa_pai_id IS DISTINCT FROM NEW.tarefa_pai_id)
        OR
        (OLD.removido_em IS DISTINCT FROM NEW.removido_em)
        OR
        (OLD.percentual_concluido IS DISTINCT FROM NEW.percentual_concluido)
        OR
        (OLD.custo_estimado IS DISTINCT FROM NEW.custo_estimado)
        OR
        (OLD.custo_real IS DISTINCT FROM NEW.custo_real)
    )
    EXECUTE FUNCTION f_trg_pp_tarefa_esticar_datas_do_pai();


CREATE TRIGGER trg_pp_tarefa_esticar_datas_do_pai_insert AFTER INSERT ON tarefa
    FOR EACH ROW
    EXECUTE FUNCTION f_trg_pp_tarefa_esticar_datas_do_pai();