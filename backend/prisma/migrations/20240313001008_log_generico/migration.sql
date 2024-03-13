-- CreateTable
CREATE TABLE "log_generico" (
    "id" SERIAL NOT NULL,
    "contexto" TEXT NOT NULL,
    "ip" INET NOT NULL,
    "log" TEXT NOT NULL,
    "pessoa_sessao_id" INTEGER,
    "pessoa_id" INTEGER,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_generico_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "log_generico" ADD CONSTRAINT "log_generico_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_generico" ADD CONSTRAINT "log_generico_pessoa_sessao_id_fkey" FOREIGN KEY ("pessoa_sessao_id") REFERENCES "pessoa_sessao"("id") ON DELETE SET NULL ON UPDATE CASCADE;
