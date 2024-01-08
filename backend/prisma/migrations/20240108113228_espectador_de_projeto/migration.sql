-- CreateTable
CREATE TABLE "grupo_portfolio" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),
    "orgao_id" INTEGER NOT NULL,

    CONSTRAINT "grupo_portfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grupo_portfolio_pessoa" (
    "id" SERIAL NOT NULL,
    "grupo_portfolio_id" INTEGER NOT NULL,
    "orgao_id" INTEGER NOT NULL,
    "pessoa_id" INTEGER NOT NULL,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "grupo_portfolio_pessoa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projeto_grupo_portfolio" (
    "id" SERIAL NOT NULL,
    "projeto_id" INTEGER NOT NULL,
    "grupo_portfolio_id" INTEGER NOT NULL,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "projeto_grupo_portfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_grupo_portfolio" (
    "id" SERIAL NOT NULL,
    "portfolio_id" INTEGER NOT NULL,
    "grupo_portfolio_id" INTEGER NOT NULL,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "portfolio_grupo_portfolio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "grupo_portfolio_titulo_idx" ON "grupo_portfolio"("titulo");

-- AddForeignKey
ALTER TABLE "grupo_portfolio" ADD CONSTRAINT "grupo_portfolio_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupo_portfolio" ADD CONSTRAINT "grupo_portfolio_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupo_portfolio" ADD CONSTRAINT "grupo_portfolio_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupo_portfolio" ADD CONSTRAINT "grupo_portfolio_orgao_id_fkey" FOREIGN KEY ("orgao_id") REFERENCES "orgao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupo_portfolio_pessoa" ADD CONSTRAINT "grupo_portfolio_pessoa_grupo_portfolio_id_fkey" FOREIGN KEY ("grupo_portfolio_id") REFERENCES "grupo_portfolio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupo_portfolio_pessoa" ADD CONSTRAINT "grupo_portfolio_pessoa_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupo_portfolio_pessoa" ADD CONSTRAINT "grupo_portfolio_pessoa_orgao_id_fkey" FOREIGN KEY ("orgao_id") REFERENCES "orgao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_grupo_portfolio" ADD CONSTRAINT "projeto_grupo_portfolio_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_grupo_portfolio" ADD CONSTRAINT "projeto_grupo_portfolio_grupo_portfolio_id_fkey" FOREIGN KEY ("grupo_portfolio_id") REFERENCES "grupo_portfolio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_grupo_portfolio" ADD CONSTRAINT "projeto_grupo_portfolio_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_grupo_portfolio" ADD CONSTRAINT "projeto_grupo_portfolio_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_grupo_portfolio" ADD CONSTRAINT "portfolio_grupo_portfolio_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_grupo_portfolio" ADD CONSTRAINT "portfolio_grupo_portfolio_grupo_portfolio_id_fkey" FOREIGN KEY ("grupo_portfolio_id") REFERENCES "grupo_portfolio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_grupo_portfolio" ADD CONSTRAINT "portfolio_grupo_portfolio_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_grupo_portfolio" ADD CONSTRAINT "portfolio_grupo_portfolio_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
