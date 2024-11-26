delete from pessoa_sessao_ativa;

update pessoa
set
    email = 'staging+' || id::text || replace(replace(replace(email, 'sp.gov.br', '.spgovbr'), '@', '__em__'), '.com', '') || '@fgv.br'

where not email like '%fgv.br';

UPDATE pessoa_fisica set cpf=null, registro_funcionario=null;

-- se for pra desativar todos os e-mails
-- update emaildb_config set email_transporter_config='{"sasl_password":"...","sasl_username":"..","port":"587","host":".."}';

UPDATE emaildb_config
SET "from"  = '"Teste SMAE" <test.smae@novodomain.com.br>';

delete from smae_config where "key" = 'COMUNICADO_EMAIL_ATIVO';