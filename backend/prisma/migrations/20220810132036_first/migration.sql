-- CreateTable
CREATE TABLE "funcao" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT NOT NULL,
    "permissoes" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "funcao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secretaria" (
    "id" SERIAL NOT NULL,
    "sigla" TEXT NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "secretaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "time_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pessoa" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "eh_super_admin" BOOLEAN NOT NULL DEFAULT false,
    "nome_exibicao" TEXT NOT NULL,
    "nome_completo" TEXT NOT NULL,

    CONSTRAINT "pessoa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_pessoa" (
    "id" SERIAL NOT NULL,
    "pessoa_id" INTEGER NOT NULL,
    "time_id" INTEGER NOT NULL,
    "secretaria_id" INTEGER NOT NULL,

    CONSTRAINT "time_pessoa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_pessoa_funcao" (
    "id" SERIAL NOT NULL,
    "funcao_id" INTEGER NOT NULL,
    "time_pessoa_id" INTEGER NOT NULL,

    CONSTRAINT "time_pessoa_funcao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "funcao_id_key" ON "funcao"("id");

-- CreateIndex
CREATE UNIQUE INDEX "secretaria_id_key" ON "secretaria"("id");

-- CreateIndex
CREATE UNIQUE INDEX "time_id_key" ON "time"("id");

-- CreateIndex
CREATE UNIQUE INDEX "pessoa_id_key" ON "pessoa"("id");

-- CreateIndex
CREATE UNIQUE INDEX "pessoa_email_key" ON "pessoa"("email");

-- CreateIndex
CREATE UNIQUE INDEX "time_pessoa_id_key" ON "time_pessoa"("id");

-- CreateIndex
CREATE UNIQUE INDEX "time_pessoa_funcao_id_key" ON "time_pessoa_funcao"("id");

-- AddForeignKey
ALTER TABLE "time_pessoa" ADD CONSTRAINT "time_pessoa_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_pessoa" ADD CONSTRAINT "time_pessoa_time_id_fkey" FOREIGN KEY ("time_id") REFERENCES "time"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_pessoa" ADD CONSTRAINT "time_pessoa_secretaria_id_fkey" FOREIGN KEY ("secretaria_id") REFERENCES "secretaria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_pessoa_funcao" ADD CONSTRAINT "time_pessoa_funcao_funcao_id_fkey" FOREIGN KEY ("funcao_id") REFERENCES "funcao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_pessoa_funcao" ADD CONSTRAINT "time_pessoa_funcao_time_pessoa_id_fkey" FOREIGN KEY ("time_pessoa_id") REFERENCES "time_pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
