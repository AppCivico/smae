CREATE OR REPLACE VIEW view_meta_pessoa_responsavel AS
SELECT
    mr.*
FROM
    meta_responsavel mr
    JOIN meta_orgao mo ON mo.orgao_id = mr.orgao_id
        AND mr.meta_id = mo.meta_id
WHERE
    mo.responsavel;

CREATE OR REPLACE VIEW view_meta_pessoa_responsavel_na_cp AS
SELECT
    mr.*
FROM
    meta_responsavel mr
    JOIN meta_orgao mo ON mo.orgao_id = mr.orgao_id
        AND mr.meta_id = mo.meta_id
WHERE
    mr.coordenador_responsavel_cp;


-- TODO rever essas views, pois existem tbm os relacionamentos de iniciativa e atividade
CREATE OR REPLACE VIEW view_meta_responsavel_orcamento AS
SELECT
    mr.meta_id, mr.pessoa_id
FROM
    meta_responsavel mr
    JOIN meta_orgao mo ON mo.orgao_id = mr.orgao_id AND mr.meta_id = mo.meta_id
    join pessoa_perfil pp on pp.pessoa_id = mr.pessoa_id
    join perfil_acesso pa on pp.perfil_acesso_id = pa.id
    join perfil_privilegio priv on priv.perfil_acesso_id = pa.id
    join privilegio p on p.id = priv.privilegio_id
    join public.pessoa pessoa on pessoa.id = pp.pessoa_id AND pessoa.desativado = false
WHERE mo.responsavel AND p.codigo in ('CadastroMeta.orcamento', 'CadastroMeta.administrador_orcamento' )
group by 1, 2;

CREATE OR REPLACE VIEW view_pessoa_espectador_de_projeto AS
SELECT
    p.id as pessoa_id,
    pf.orgao_id
FROM
    pessoa p
    join pessoa_fisica pf on pf.id = p.pessoa_fisica_id
    join pessoa_perfil pp on pp.pessoa_id = p.id
    join perfil_acesso pa on pp.perfil_acesso_id = pa.id
    join perfil_privilegio priv on priv.perfil_acesso_id = pa.id
    join privilegio px on px.id = priv.privilegio_id
WHERE px.codigo in ('SMAE.espectador_de_projeto' )
AND p.desativado = false
and pf.orgao_id is not null
group by 1, 2;

CREATE OR REPLACE VIEW view_pessoa_gestor_de_projeto AS
SELECT
    p.id as pessoa_id,
    pf.orgao_id
FROM
    pessoa p
    join pessoa_fisica pf on pf.id = p.pessoa_fisica_id
    join pessoa_perfil pp on pp.pessoa_id = p.id
    join perfil_acesso pa on pp.perfil_acesso_id = pa.id
    join perfil_privilegio priv on priv.perfil_acesso_id = pa.id
    join privilegio px on px.id = priv.privilegio_id
WHERE px.codigo in ('SMAE.gestor_de_projeto' )
AND p.desativado = false
and pf.orgao_id is not null
group by 1, 2;

CREATE OR REPLACE VIEW view_pessoa_colaborador_de_projeto AS
SELECT
    p.id as pessoa_id,
    pf.orgao_id
FROM
    pessoa p
    join pessoa_fisica pf on pf.id = p.pessoa_fisica_id
    join pessoa_perfil pp on pp.pessoa_id = p.id
    join perfil_acesso pa on pp.perfil_acesso_id = pa.id
    join perfil_privilegio priv on priv.perfil_acesso_id = pa.id
    join privilegio px on px.id = priv.privilegio_id
WHERE px.codigo in ('SMAE.colaborador_de_projeto' )
AND p.desativado = false
and pf.orgao_id is not null
group by 1, 2;
