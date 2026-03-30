-- CreateTable
CREATE TABLE "demanda_email_parlamentar" (
    "id" SERIAL NOT NULL,
    "assunto" VARCHAR NOT NULL,
    "corpo" TEXT NOT NULL,
    "nomes_parlamentares" TEXT NOT NULL,
    "vetores_busca" tsvector DEFAULT '',
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demanda_email_parlamentar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demanda_email_parlamentar_item" (
    "id" SERIAL NOT NULL,
    "demanda_email_parlamentar_id" INTEGER NOT NULL,
    "parlamentar_id" INTEGER NOT NULL,
    "email" VARCHAR NOT NULL,
    "emaildb_queue_id" UUID NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demanda_email_parlamentar_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "demanda_email_parlamentar_criado_em_idx" ON "demanda_email_parlamentar"("criado_em");

-- CreateIndex
CREATE INDEX "demanda_email_parlamentar_item_demanda_email_parlamentar_id_idx" ON "demanda_email_parlamentar_item"("demanda_email_parlamentar_id");

-- CreateIndex
CREATE INDEX "demanda_email_parlamentar_item_parlamentar_id_idx" ON "demanda_email_parlamentar_item"("parlamentar_id");

-- CreateIndex GIN for tsvector search
CREATE INDEX "demanda_email_parlamentar_vetores_busca_idx" ON "demanda_email_parlamentar" USING GIN ("vetores_busca");

-- AddForeignKey
ALTER TABLE "demanda_email_parlamentar" ADD CONSTRAINT "demanda_email_parlamentar_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demanda_email_parlamentar_item" ADD CONSTRAINT "demanda_email_parlamentar_item_demanda_email_parlamentar_id_fkey" FOREIGN KEY ("demanda_email_parlamentar_id") REFERENCES "demanda_email_parlamentar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demanda_email_parlamentar_item" ADD CONSTRAINT "demanda_email_parlamentar_item_parlamentar_id_fkey" FOREIGN KEY ("parlamentar_id") REFERENCES "parlamentar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
