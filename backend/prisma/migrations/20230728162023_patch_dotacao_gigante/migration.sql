begin;

delete from dotacao_processo_nota where length(dotacao) > 35;
delete from dotacao_processo where length(dotacao) > 35;
delete from dotacao_realizado where length(dotacao) > 35;
delete from dotacao_planejado where length(dotacao) > 35;

commit;
