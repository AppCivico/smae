-- CreateTable
CREATE TABLE "cronograma" (
    "id" SERIAL NOT NULL,
    "meta_id" INTEGER,
    "inciativa_id" INTEGER,
    "atividade_id" INTEGER,
    "descricao" TEXT,
    "observacao" TEXT,
    "inicio_previsto" DATE NOT NULL,
    "termino_previsto" DATE NOT NULL,
    "inicio_real" DATE,
    "termino_real" DATE,
    "por_regiao" BOOLEAN NOT NULL,
    "tipo_regiao" TEXT NOT NULL,

    CONSTRAINT "cronograma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "etapa" (
    "id" SERIAL NOT NULL,
    "etapa_pai_id" INTEGER,
    "regiao_id" INTEGER,
    "nivel" TEXT,
    "ordem" INTEGER NOT NULL,
    "descricao" TEXT,
    "inicio_previsto" DATE NOT NULL,
    "termino_previsto" DATE NOT NULL,
    "inicio_real" DATE,
    "termino_real" DATE,
    "prazo" DATE NOT NULL,
    "status" TEXT,

    CONSTRAINT "etapa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cronograma_orgao" (
    "id" SERIAL NOT NULL,
    "cronograma_id" INTEGER NOT NULL,
    "orgao_id" INTEGER NOT NULL,
    "pessoa_id" INTEGER NOT NULL,

    CONSTRAINT "cronograma_orgao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cronograma_etapa" (
    "id" SERIAL NOT NULL,
    "cronograma_id" INTEGER NOT NULL,
    "etapa_id" INTEGER NOT NULL,
    "inativo" BOOLEAN NOT NULL DEFAULT false,
    "data_inativacao" TIMESTAMPTZ(6),

    CONSTRAINT "cronograma_etapa_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "cronograma" ADD CONSTRAINT "cronograma_meta_id_fkey" FOREIGN KEY ("meta_id") REFERENCES "meta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cronograma" ADD CONSTRAINT "cronograma_inciativa_id_fkey" FOREIGN KEY ("inciativa_id") REFERENCES "iniciativa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cronograma" ADD CONSTRAINT "cronograma_atividade_id_fkey" FOREIGN KEY ("atividade_id") REFERENCES "atividade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etapa" ADD CONSTRAINT "etapa_etapa_pai_id_fkey" FOREIGN KEY ("etapa_pai_id") REFERENCES "etapa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etapa" ADD CONSTRAINT "etapa_regiao_id_fkey" FOREIGN KEY ("regiao_id") REFERENCES "regiao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cronograma_orgao" ADD CONSTRAINT "cronograma_orgao_cronograma_id_fkey" FOREIGN KEY ("cronograma_id") REFERENCES "cronograma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cronograma_orgao" ADD CONSTRAINT "cronograma_orgao_orgao_id_fkey" FOREIGN KEY ("orgao_id") REFERENCES "orgao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cronograma_orgao" ADD CONSTRAINT "cronograma_orgao_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cronograma_etapa" ADD CONSTRAINT "cronograma_etapa_cronograma_id_fkey" FOREIGN KEY ("cronograma_id") REFERENCES "cronograma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cronograma_etapa" ADD CONSTRAINT "cronograma_etapa_etapa_id_fkey" FOREIGN KEY ("etapa_id") REFERENCES "etapa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
