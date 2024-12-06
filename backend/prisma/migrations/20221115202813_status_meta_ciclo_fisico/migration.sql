
truncate status_meta_ciclo_fisico;

ALTER TABLE "status_meta_ciclo_fisico" DROP COLUMN "status_valido",
ADD COLUMN     "pessoa_id" INTEGER NOT NULL;


CREATE OR REPLACE FUNCTION pessoa_acesso_pdm (pPessoa_id int)
    RETURNS varchar
    AS $$
BEGIN
    return 'placeholder';
END
$$
LANGUAGE plpgsql;

CREATE TRIGGER trg_indicador_recalc_pessoa AFTER INSERT OR DELETE OR UPDATE ON indicador
    FOR EACH STATEMENT
    EXECUTE FUNCTION f_recalc_acesso_pessoas();

drop trigger trg_meta_responsavel_recalc_pessoa on meta ;
