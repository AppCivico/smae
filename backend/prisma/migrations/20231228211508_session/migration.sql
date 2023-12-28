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

-- AddForeignKey
ALTER TABLE "pessoa_sessao_ativa" ADD CONSTRAINT "pessoa_sessao_ativa_id_fkey" FOREIGN KEY ("id") REFERENCES "pessoa_sessao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoa_sessao" ADD CONSTRAINT "pessoa_sessao_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoa_atividade_log" ADD CONSTRAINT "pessoa_atividade_log_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pessoa_atividade_log" ADD CONSTRAINT "pessoa_atividade_log_pessoa_sessao_id_fkey" FOREIGN KEY ("pessoa_sessao_id") REFERENCES "pessoa_sessao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

insert into pessoa_sessao (id, pessoa_id, criado_em, criado_ip)
select id, pessoa_id, now(), '0.0.0.0' from pessoa_sessao_ativa;

CREATE OR REPLACE FUNCTION f_insere_log_atividade(
    p_pessoa_id INTEGER,
    p_ip INET,
    p_pessoa_sessao_id INTEGER
)
RETURNS VOID AS $$
DECLARE
    v_existing_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO v_existing_count
    FROM pessoa_atividade_log
    WHERE pessoa_sessao_id = p_pessoa_sessao_id
      AND criado_em > (NOW() - INTERVAL '1 minute');

    IF v_existing_count = 0 THEN
        INSERT INTO pessoa_atividade_log (pessoa_id, ip, pessoa_sessao_id, criado_em)
        VALUES (p_pessoa_id, p_ip, p_pessoa_sessao_id, NOW());
    END IF;
END;
$$ LANGUAGE plpgsql;
