-- CreateTable
CREATE TABLE "meta" (
    "id" SERIAL NOT NULL,
    "pdm_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "contexto" TEXT,
    "complemento" TEXT,
    "macro_tema_id" INTEGER,
    "tema_id" INTEGER,
    "sub_tema_id" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT false,
    "criado_por" INTEGER,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "desativado_por" INTEGER,
    "desativado_em" TIMESTAMPTZ(6),

    CONSTRAINT "meta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meta_orgao" (
    "id" SERIAL NOT NULL,
    "meta_id" INTEGER NOT NULL,
    "responsavel" BOOLEAN NOT NULL,
    "orgao_id" INTEGER NOT NULL,
    "temaId" INTEGER,

    CONSTRAINT "meta_orgao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meta_responsavel" (
    "id" SERIAL NOT NULL,
    "meta_id" INTEGER NOT NULL,
    "pessoa_id" INTEGER NOT NULL,
    "orgao_id" INTEGER NOT NULL,
    "coorderandor_responsavel_cp" BOOLEAN NOT NULL,

    CONSTRAINT "meta_responsavel_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "meta" ADD CONSTRAINT "meta_pdm_id_fkey" FOREIGN KEY ("pdm_id") REFERENCES "pdm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta" ADD CONSTRAINT "meta_macro_tema_id_fkey" FOREIGN KEY ("macro_tema_id") REFERENCES "eixo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta" ADD CONSTRAINT "meta_tema_id_fkey" FOREIGN KEY ("tema_id") REFERENCES "objetivo_estrategico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta" ADD CONSTRAINT "meta_sub_tema_id_fkey" FOREIGN KEY ("sub_tema_id") REFERENCES "subtema"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta" ADD CONSTRAINT "meta_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta" ADD CONSTRAINT "meta_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta" ADD CONSTRAINT "meta_desativado_por_fkey" FOREIGN KEY ("desativado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_orgao" ADD CONSTRAINT "meta_orgao_meta_id_fkey" FOREIGN KEY ("meta_id") REFERENCES "meta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_orgao" ADD CONSTRAINT "meta_orgao_orgao_id_fkey" FOREIGN KEY ("orgao_id") REFERENCES "orgao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_orgao" ADD CONSTRAINT "meta_orgao_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "objetivo_estrategico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_responsavel" ADD CONSTRAINT "meta_responsavel_meta_id_fkey" FOREIGN KEY ("meta_id") REFERENCES "meta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_responsavel" ADD CONSTRAINT "meta_responsavel_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_responsavel" ADD CONSTRAINT "meta_responsavel_orgao_id_fkey" FOREIGN KEY ("orgao_id") REFERENCES "orgao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
