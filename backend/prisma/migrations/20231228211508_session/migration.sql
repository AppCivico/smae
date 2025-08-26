-- CreateTable
CREATE TABLE "pessoa_sessao" (
    "id" SERIAL NOT NULL,
    "pessoa_id" INTEGER NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL,
    "criado_ip" INET NOT NULL,
    "removido_em" TIMESTAMP(3),
    "removido_ip" INET,

    CONSTRAINT "pessoa_sessao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pessoa_atividade_log" (
    "id" SERIAL NOT NULL,
    "pessoa_id" INTEGER NOT NULL,
    "ip" INET NOT NULL,
    "pessoa_sessao_id" INTEGER NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pessoa_atividade_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pessoa_sessao_pessoa_id_idx" ON "pessoa_sessao"("pessoa_id");

-- CreateIndex
CREATE INDEX "pessoa_atividade_log_criado_em_idx" ON "pessoa_atividade_log"("criado_em");

insert into pessoa_sessao (id, pessoa_id, criado_em, criado_ip)
select id, pessoa_id, now(), '0.0.0.0' from pessoa_sessao_ativa;

-- sincroniza o ID da pessoa_sessao com o pessoa_sessao_ativa (que não vai mais usar a sequencia dela)
SELECT setval('pessoa_sessao_id_seq', nextval('pessoa_sessao_ativa_id_seq') + 10000, false);

-- AddForeignKey
ALTER TABLE "pessoa_sessao_ativa" ADD CONSTRAINT "pessoa_sessao_ativa_id_fkey" FOREIGN KEY ("id") REFERENCES "pessoa_sessao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoa_sessao" ADD CONSTRAINT "pessoa_sessao_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoa_atividade_log" ADD CONSTRAINT "pessoa_atividade_log_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoa_atividade_log" ADD CONSTRAINT "pessoa_atividade_log_pessoa_sessao_id_fkey" FOREIGN KEY ("pessoa_sessao_id") REFERENCES "pessoa_sessao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
