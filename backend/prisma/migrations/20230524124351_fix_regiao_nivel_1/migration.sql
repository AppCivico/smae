update regiao set removido_em=now() where nivel =1  and descricao != 'São Paulo' and removido_em is not null;

update regiao set removido_em = now() where parente_id in (select id from regiao where removido_em is not null) and removido_em is null;
update regiao set removido_em = now() where parente_id in (select id from regiao where removido_em is not null) and removido_em is null;
update regiao set removido_em = now() where parente_id in (select id from regiao where removido_em is not null) and removido_em is null;
update regiao set removido_em = now() where parente_id in (select id from regiao where removido_em is not null) and removido_em is null;
update regiao set removido_em = now() where parente_id in (select id from regiao where removido_em is not null) and removido_em is null;
