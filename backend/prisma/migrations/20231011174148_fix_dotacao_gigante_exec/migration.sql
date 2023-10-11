-- após esse update, pode ser que fique itens duplicados, e itens faltando a "fk" na outra table,
-- então precisa clicar no botão "validar via sof" para ajustar novamente antes de apagar/salvar
update orcamento_realizado set dotacao = substr(dotacao, 1,35) where length(dotacao) > 35;
update orcamento_planejado set dotacao = substr(dotacao, 1,35) where length(dotacao) > 35;
