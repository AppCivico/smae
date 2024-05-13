-- AlterTable
ALTER TABLE "etapa" ADD COLUMN     "variavel_id" INTEGER;

-- AddForeignKey
ALTER TABLE "etapa" ADD CONSTRAINT "etapa_variavel_id_fkey" FOREIGN KEY ("variavel_id") REFERENCES "variavel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION f_tgr_atualiza_variavel_na_troca_da_etapa()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.variavel_id IS NOT NULL THEN
            UPDATE variavel
            SET regiao_id = NEW.regiao_id
            WHERE id = NEW.variavel_id AND regiao_id IS DISTINCT FROM NEW.regiao_id;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.variavel_id IS DISTINCT FROM NEW.variavel_id THEN
            IF NEW.variavel_id IS NULL THEN
                UPDATE variavel
                SET removido_em = NOW()
                WHERE id = OLD.variavel_id AND removido_em IS NULL;
            ELSE
                UPDATE variavel
                SET regiao_id = NEW.regiao_id
                WHERE id = NEW.variavel_id AND regiao_id IS DISTINCT FROM NEW.regiao_id;
            END IF;
        ELSIF OLD.regiao_id IS DISTINCT FROM NEW.regiao_id THEN
            UPDATE variavel
            SET regiao_id = NEW.regiao_id
            WHERE id = NEW.variavel_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.variavel_id IS NOT NULL THEN
            UPDATE variavel
            SET removido_em = NOW()
            WHERE id = OLD.variavel_id AND removido_em IS NULL;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER etapa_update_variavel
BEFORE INSERT OR UPDATE OR DELETE ON etapa
FOR EACH ROW
EXECUTE PROCEDURE f_tgr_atualiza_variavel_na_troca_da_etapa();

create or replace view view_etapa_rel_meta_indicador AS
select
    v.*,
    ia.id as indicador_id
from view_etapa_rel_meta v
join indicador ia on ia.atividade_id = v.atividade_id or ia.iniciativa_id = v.iniciativa_id or ia.meta_id = v.meta_id;
