
ALTER TABLE "variavel_global_ciclo_analise" ADD COLUMN     "fase" "VariavelFase" ;

-- AlterTable
ALTER TABLE "variavel_global_ciclo_documento" ADD COLUMN     "fase" "VariavelFase" ;

update "variavel_global_ciclo_analise" set "fase" = 'Preenchimento' where "fase" is null;
update "variavel_global_ciclo_documento" set "fase" = 'Preenchimento' where "fase" is null;

Alter TABLE "variavel_global_ciclo_analise" ALTER COLUMN "fase" SET NOT NULL;
Alter TABLE "variavel_global_ciclo_documento" ALTER COLUMN "fase" SET NOT NULL;
