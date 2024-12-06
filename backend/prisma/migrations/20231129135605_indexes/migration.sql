-- CreateIndex
CREATE INDEX "formula_composta_variavel_variavel_id_idx" ON "formula_composta_variavel"("variavel_id");

-- CreateIndex
CREATE INDEX "indicador_formula_variavel_variavel_id_idx" ON "indicador_formula_variavel"("variavel_id");

create view view_indicador_formula_variavel_e_composta AS
select indicador_id, variavel_id, janela, referencia, usar_serie_acumulada
from indicador_formula_variavel
UNION all
select ifc.indicador_id, fcv.variavel_id, fcv.janela, fcv.referencia, fcv.usar_serie_acumulada
from formula_composta_variavel fcv
join indicador_formula_composta ifc on ifc.formula_composta_id = fcv.formula_composta_id;



