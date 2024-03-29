-- AlterTable
ALTER TABLE "pdm_orcamento_realizado_config" ALTER COLUMN "ultima_revisao" DROP NOT NULL,
ALTER COLUMN "ultima_revisao" DROP DEFAULT;

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
group by 1, 2
