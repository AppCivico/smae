-- CreateTable
CREATE TABLE "projeto_equipe" (
    "id" SERIAL NOT NULL,
    "projeto_id" INTEGER NOT NULL,
    "pessoa_id" INTEGER NOT NULL,
    "orgao_id" INTEGER NOT NULL,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMP(3),

    CONSTRAINT "projeto_equipe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "projeto_equipe_projeto_id_idx" ON "projeto_equipe"("projeto_id");

-- AddForeignKey
ALTER TABLE "projeto_equipe" ADD CONSTRAINT "projeto_equipe_orgao_id_fkey" FOREIGN KEY ("orgao_id") REFERENCES "orgao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_equipe" ADD CONSTRAINT "projeto_equipe_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_equipe" ADD CONSTRAINT "projeto_equipe_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_equipe" ADD CONSTRAINT "projeto_equipe_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_equipe" ADD CONSTRAINT "projeto_equipe_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
