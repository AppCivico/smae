-- update variavel_categorica_id based on parent if variavel_categorica_id is null
update variavel set variavel_categorica_id = (select variavel_categorica_id from variavel where id = variavel_mae_id)
where variavel_categorica_id is null and variavel_mae_id is not null
and variavel_categorica_id != (select variavel_categorica_id from variavel where id = variavel_mae_id);
