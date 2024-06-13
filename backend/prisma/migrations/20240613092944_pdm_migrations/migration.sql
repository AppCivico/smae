
CREATE OR REPLACE VIEW view_pessoa_ps_admin_cp AS
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
WHERE px.codigo in ('PS.admin_cp' )
AND p.desativado = false
and pf.orgao_id is not null
group by 1, 2;

CREATE OR REPLACE VIEW view_pessoa_ps_tecnico_cp AS
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
WHERE px.codigo in ('PS.tecnico_cp' )
AND p.desativado = false
and pf.orgao_id is not null
group by 1, 2;

-- AlterTable
ALTER TABLE "pdm" ADD COLUMN     "legislacao_de_instituicao" TEXT,
ADD COLUMN     "monitoramento_orcamento" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "orgao_admin_id" INTEGER,
ADD COLUMN     "pdm_anteriores" INTEGER[] DEFAULT ARRAY[]::INTEGER[];

-- AlterTable
ALTER TABLE "pdm_perfil" ALTER COLUMN "removido_em" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "pdm" ADD CONSTRAINT "pdm_orgao_admin_id_fkey" FOREIGN KEY ("orgao_admin_id") REFERENCES "orgao"("id") ON DELETE SET NULL ON UPDATE CASCADE;
