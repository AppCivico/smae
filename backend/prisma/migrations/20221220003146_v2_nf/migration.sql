begin;

-- permitir que a nota seja de um ano diferente do ano de referencia
update orcamento_realizado set nota_empenho=nota_empenho||'/'||ano_referencia;

update dotacao_processo_nota set dotacao_processo_nota=dotacao_processo_nota||'/'||ano_referencia;

commit;

