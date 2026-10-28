BEGIN;

delete from pessoa_sessao_ativa;

update pessoa
set
    email = 'staging+' || id::text || replace(replace(replace(email, 'sp.gov.br', '.spgovbr'), '@', '__em__'), '.com', '') || '@fgv.br'

where not email like '%fgv.br';

UPDATE pessoa_fisica set cpf=null, registro_funcionario=null;

-- demais endereços que viram destinatário de e-mail
UPDATE orgao SET email = 'staging+orgao' || id::text || '@fgv.br' WHERE email IS NOT NULL AND email <> '' AND email NOT LIKE '%fgv.br';
UPDATE demanda SET email_responsavel = 'staging+demanda' || id::text || '@fgv.br' WHERE email_responsavel NOT LIKE '%fgv.br';
UPDATE parlamentar SET email = 'staging+parlamentar' || id::text || '@fgv.br' WHERE email IS NOT NULL AND email <> '' AND email NOT LIKE '%fgv.br';
UPDATE parlamentar_mandato SET email = 'staging+mandato' || id::text || '@fgv.br' WHERE email IS NOT NULL AND email <> '' AND email NOT LIKE '%fgv.br';
UPDATE parlamentar_equipe SET email = 'staging+equipe' || id::text || '@fgv.br' WHERE email <> '' AND email NOT LIKE '%fgv.br';
UPDATE cronograma_termino_planejado_config SET para = 'staging+cronograma' || id::text || '@fgv.br' WHERE para NOT LIKE '%fgv.br';
UPDATE aviso_email
SET com_copia = (
    SELECT array_agg('staging+aviso' || aviso_email.id::text || '-' || n::text || '@fgv.br')
    FROM generate_subscripts(com_copia, 1) n
)
WHERE cardinality(com_copia) > 0;

-- fila: nada pendente sai, e o histórico perde os destinatários reais
UPDATE emaildb_queue SET sent = false, errmsg = 'cancelado pelo limpar-db' WHERE sent IS NULL;
UPDATE emaildb_queue SET "to" = 'staging+fila@fgv.br';

-- volta para a config do seed (SMTP falso do smtp_web)
UPDATE emaildb_config
SET "from" = '"Teste SMAE" <test.smae@novodomain.com.br>',
    template_resolver_class = 'Shypper::TemplateResolvers::HTTP',
    template_resolver_config = '{"base_url":"http://smae_api:3001/public/email-templates/"}',
    email_transporter_class = 'Email::Sender::Transport::SMTP::Persistent',
    email_transporter_config = '{"sasl_password":"","sasl_username":"apikey","port":"25","host":"smtp_web"}';

delete from smae_config where "key" = 'COMUNICADO_EMAIL_ATIVO';

COMMIT;
