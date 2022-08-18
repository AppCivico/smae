-- CreateTable
CREATE TABLE "cargo" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "cargo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coordenadoria" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "coordenadoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departamento" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "departamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "divisao_tecnica" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "divisao_tecnica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pessoa" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "nome_exibicao" TEXT NOT NULL,
    "nome_completo" TEXT NOT NULL,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por" INTEGER,
    "qtde_senha_invalida" INTEGER NOT NULL DEFAULT 0,
    "senha_atualizada_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "senha_bloqueada" BOOLEAN NOT NULL DEFAULT false,
    "senha_bloqueada_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "desativado" BOOLEAN NOT NULL DEFAULT false,
    "desativado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "desativado_por" INTEGER,
    "pessoa_fisica_id" INTEGER,

    CONSTRAINT "pessoa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modulo" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR,
    "descricao" VARCHAR,

    CONSTRAINT "modulo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orgao" (
    "id" SERIAL NOT NULL,
    "sigla" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo_orgao_id" INTEGER NOT NULL,

    CONSTRAINT "orgao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfil_acesso" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR NOT NULL,
    "descricao" VARCHAR,

    CONSTRAINT "perfil_acesso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfil_privilegio" (
    "id" SERIAL NOT NULL,
    "perfil_acesso_id" INTEGER NOT NULL,
    "privilegios_id" INTEGER NOT NULL,

    CONSTRAINT "perfil_privilegio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pessoa_fisica" (
    "id" SERIAL NOT NULL,
    "cargo_id" INTEGER NOT NULL,
    "divisao_tecnica_id" INTEGER,
    "departamento_id" INTEGER,
    "coordenadoria_id" INTEGER NOT NULL,
    "orgao_id" INTEGER NOT NULL,

    CONSTRAINT "pessoa_fisica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pessoa_perfil" (
    "id" SERIAL NOT NULL,
    "pessoa_id" INTEGER,
    "perfis_acesso_id" INTEGER,

    CONSTRAINT "pessoa_perfil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pessoa_sessao_ativa" (
    "id" SERIAL NOT NULL,
    "pessoa_id" INTEGER NOT NULL,

    CONSTRAINT "pessoa_sessao_ativa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "privilegio" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR NOT NULL,
    "codigo" VARCHAR NOT NULL,
    "modulo_id" INTEGER NOT NULL,

    CONSTRAINT "privilegio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipo_orgao" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,

    CONSTRAINT "tipo_orgao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cargo_id_key" ON "cargo"("id");

-- CreateIndex
CREATE UNIQUE INDEX "coordenadoria_id_key" ON "coordenadoria"("id");

-- CreateIndex
CREATE UNIQUE INDEX "departamento_id_key" ON "departamento"("id");

-- CreateIndex
CREATE UNIQUE INDEX "divisao_tecnica_id_key" ON "divisao_tecnica"("id");

-- CreateIndex
CREATE UNIQUE INDEX "pessoa_id_key" ON "pessoa"("id");

-- CreateIndex
CREATE UNIQUE INDEX "pessoa_email_key" ON "pessoa"("email");

-- CreateIndex
CREATE UNIQUE INDEX "modulo_codigo_key" ON "modulo"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "orgao_id_key" ON "orgao"("id");

-- CreateIndex
CREATE UNIQUE INDEX "perfil_acesso_id_key" ON "perfil_acesso"("id");

-- CreateIndex
CREATE UNIQUE INDEX "perfil_privilegio_id_key" ON "perfil_privilegio"("id");

-- CreateIndex
CREATE UNIQUE INDEX "perfil_privilegio_perfil_acesso_id_privilegios_id_key" ON "perfil_privilegio"("perfil_acesso_id", "privilegios_id");

-- CreateIndex
CREATE UNIQUE INDEX "pessoa_fisica_id_key" ON "pessoa_fisica"("id");

-- CreateIndex
CREATE UNIQUE INDEX "pessoa_sessao_ativa_id_key" ON "pessoa_sessao_ativa"("id");

-- CreateIndex
CREATE UNIQUE INDEX "privilegio_codigo_key" ON "privilegio"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "tipo_orgao_id_key" ON "tipo_orgao"("id");

-- AddForeignKey
ALTER TABLE "pessoa" ADD CONSTRAINT "pessoa_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoa" ADD CONSTRAINT "pessoa_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoa" ADD CONSTRAINT "pessoa_desativado_por_fkey" FOREIGN KEY ("desativado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoa" ADD CONSTRAINT "pessoa_pessoa_fisica_id_fkey" FOREIGN KEY ("pessoa_fisica_id") REFERENCES "pessoa_fisica"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orgao" ADD CONSTRAINT "orgao_tipo_orgao_id_fkey" FOREIGN KEY ("tipo_orgao_id") REFERENCES "tipo_orgao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perfil_privilegio" ADD CONSTRAINT "perfil_privilegio_perfil_acesso_id_fkey" FOREIGN KEY ("perfil_acesso_id") REFERENCES "perfil_acesso"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "perfil_privilegio" ADD CONSTRAINT "perfil_privilegio_privilegios_id_fkey" FOREIGN KEY ("privilegios_id") REFERENCES "privilegio"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pessoa_fisica" ADD CONSTRAINT "pessoa_fisica_cargo_id_fkey" FOREIGN KEY ("cargo_id") REFERENCES "cargo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoa_fisica" ADD CONSTRAINT "pessoa_fisica_coordenadoria_id_fkey" FOREIGN KEY ("coordenadoria_id") REFERENCES "coordenadoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoa_fisica" ADD CONSTRAINT "pessoa_fisica_departamento_id_fkey" FOREIGN KEY ("departamento_id") REFERENCES "departamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoa_fisica" ADD CONSTRAINT "pessoa_fisica_divisao_tecnica_id_fkey" FOREIGN KEY ("divisao_tecnica_id") REFERENCES "divisao_tecnica"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoa_fisica" ADD CONSTRAINT "pessoa_fisica_orgao_id_fkey" FOREIGN KEY ("orgao_id") REFERENCES "orgao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoa_perfil" ADD CONSTRAINT "pessoa_perfil_perfis_acesso_id_fkey" FOREIGN KEY ("perfis_acesso_id") REFERENCES "perfil_acesso"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pessoa_perfil" ADD CONSTRAINT "pessoa_perfil_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoa"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pessoa_sessao_ativa" ADD CONSTRAINT "pessoa_sessao_ativa_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "privilegio" ADD CONSTRAINT "privilegio_modulo_id_fkey" FOREIGN KEY ("modulo_id") REFERENCES "modulo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
