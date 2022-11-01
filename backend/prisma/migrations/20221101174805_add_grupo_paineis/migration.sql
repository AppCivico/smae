-- CreateTable
CREATE TABLE "grupo_painel" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "grupo_painel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pessoa_grupo_painel" (
    "id" SERIAL NOT NULL,
    "pessoa_id" INTEGER NOT NULL,
    "grupo_painel_id" INTEGER NOT NULL,

    CONSTRAINT "pessoa_grupo_painel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "painel_grupos" (
    "id" SERIAL NOT NULL,
    "painel_id" INTEGER NOT NULL,
    "grupo_painel_id" INTEGER NOT NULL,

    CONSTRAINT "painel_grupos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "grupo_painel_nome_key" ON "grupo_painel"("nome");

-- AddForeignKey
ALTER TABLE "pessoa_grupo_painel" ADD CONSTRAINT "pessoa_grupo_painel_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoa_grupo_painel" ADD CONSTRAINT "pessoa_grupo_painel_grupo_painel_id_fkey" FOREIGN KEY ("grupo_painel_id") REFERENCES "grupo_painel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "painel_grupos" ADD CONSTRAINT "painel_grupos_painel_id_fkey" FOREIGN KEY ("painel_id") REFERENCES "painel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "painel_grupos" ADD CONSTRAINT "painel_grupos_grupo_painel_id_fkey" FOREIGN KEY ("grupo_painel_id") REFERENCES "grupo_painel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
