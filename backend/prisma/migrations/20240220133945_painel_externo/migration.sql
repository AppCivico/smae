-- CreateTable
CREATE TABLE "grupo_painel_externo" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),
    "orgao_id" INTEGER NOT NULL,

    CONSTRAINT "grupo_painel_externo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grupo_painel_externo_pessoa" (
    "id" SERIAL NOT NULL,
    "grupo_painel_externo_id" INTEGER NOT NULL,
    "orgao_id" INTEGER NOT NULL,
    "pessoa_id" INTEGER NOT NULL,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "grupo_painel_externo_pessoa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "painel_externo_grupo_painel_externo" (
    "id" SERIAL NOT NULL,
    "painel_externo_id" INTEGER NOT NULL,
    "grupo_painel_externo_id" INTEGER NOT NULL,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "painel_externo_grupo_painel_externo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "painel_externo" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "link" TEXT NOT NULL,
    "link_dominio" TEXT NOT NULL,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "painel_externo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "grupo_painel_externo_titulo_idx" ON "grupo_painel_externo"("titulo");

-- CreateIndex
CREATE INDEX "painel_externo_removido_em_idx" ON "painel_externo"("removido_em");

-- AddForeignKey
ALTER TABLE "grupo_painel_externo" ADD CONSTRAINT "grupo_painel_externo_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupo_painel_externo" ADD CONSTRAINT "grupo_painel_externo_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupo_painel_externo" ADD CONSTRAINT "grupo_painel_externo_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupo_painel_externo" ADD CONSTRAINT "grupo_painel_externo_orgao_id_fkey" FOREIGN KEY ("orgao_id") REFERENCES "orgao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupo_painel_externo_pessoa" ADD CONSTRAINT "grupo_painel_externo_pessoa_grupo_painel_externo_id_fkey" FOREIGN KEY ("grupo_painel_externo_id") REFERENCES "grupo_painel_externo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupo_painel_externo_pessoa" ADD CONSTRAINT "grupo_painel_externo_pessoa_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupo_painel_externo_pessoa" ADD CONSTRAINT "grupo_painel_externo_pessoa_orgao_id_fkey" FOREIGN KEY ("orgao_id") REFERENCES "orgao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "painel_externo_grupo_painel_externo" ADD CONSTRAINT "painel_externo_grupo_painel_externo_painel_externo_id_fkey" FOREIGN KEY ("painel_externo_id") REFERENCES "painel_externo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "painel_externo_grupo_painel_externo" ADD CONSTRAINT "painel_externo_grupo_painel_externo_grupo_painel_externo_i_fkey" FOREIGN KEY ("grupo_painel_externo_id") REFERENCES "grupo_painel_externo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "painel_externo_grupo_painel_externo" ADD CONSTRAINT "painel_externo_grupo_painel_externo_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "painel_externo_grupo_painel_externo" ADD CONSTRAINT "painel_externo_grupo_painel_externo_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "painel_externo" ADD CONSTRAINT "painel_externo_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "painel_externo" ADD CONSTRAINT "painel_externo_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "painel_externo" ADD CONSTRAINT "painel_externo_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE OR REPLACE VIEW view_pessoa_espectador_de_painel_externo AS
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
WHERE px.codigo in ('SMAE.espectador_de_painel_externo' )
AND p.desativado = false
and pf.orgao_id is not null
group by 1, 2;
