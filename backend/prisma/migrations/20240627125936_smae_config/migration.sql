-- AlterTable
ALTER TABLE "projeto" ADD COLUMN     "modalidade_contratacao_id" INTEGER,
ADD COLUMN     "projeto_programa_id" INTEGER,
ADD COLUMN     "tipo_aditivo_id" INTEGER;

-- CreateTable
CREATE TABLE "smae_config" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "smae_config_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "tipo_aditivo" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "habilita_valor" BOOLEAN NOT NULL DEFAULT false,
    "habilita_valor_data_termino" BOOLEAN NOT NULL DEFAULT false,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6),
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "tipo_aditivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modalidade_contratacao" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6),
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "modalidade_contratacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projeto_programa" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6),
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "projeto_programa_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_tipo_aditivo_id_fkey" FOREIGN KEY ("tipo_aditivo_id") REFERENCES "tipo_aditivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_modalidade_contratacao_id_fkey" FOREIGN KEY ("modalidade_contratacao_id") REFERENCES "modalidade_contratacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_projeto_programa_id_fkey" FOREIGN KEY ("projeto_programa_id") REFERENCES "projeto_programa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tipo_aditivo" ADD CONSTRAINT "tipo_aditivo_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tipo_aditivo" ADD CONSTRAINT "tipo_aditivo_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tipo_aditivo" ADD CONSTRAINT "tipo_aditivo_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modalidade_contratacao" ADD CONSTRAINT "modalidade_contratacao_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modalidade_contratacao" ADD CONSTRAINT "modalidade_contratacao_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modalidade_contratacao" ADD CONSTRAINT "modalidade_contratacao_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_programa" ADD CONSTRAINT "projeto_programa_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_programa" ADD CONSTRAINT "projeto_programa_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_programa" ADD CONSTRAINT "projeto_programa_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE OR REPLACE VIEW view_parlamentares_mandatos_part_atual AS
SELECT
    coalesce(p.id::text, '') || 'pm' || coalesce(pm.id::text, '') || 'e' || coalesce(e.id::text, '') AS virtual_id,
    p.id,
    p.nome AS nome_civil,
    p.nome_popular AS nome_parlamentar,
    pa.sigla AS partido_sigla,
    pm.cargo,
    pm.uf,
    CASE WHEN pm.suplencia IS NOT NULL THEN
        'S'
    ELSE
        'T'
    END AS titular_suplente,
    pm.endereco,
    pm.gabinete,
    pm.telefone,
    EXTRACT(DAY FROM p.nascimento) AS dia_aniversario,
    EXTRACT(MONTH FROM p.nascimento) AS mes_aniversario,
    pm.email,
    e.ano AS ano_eleicao,
    e.id AS eleicao_id,
    pm.partido_atual_id AS partido_atual_id
FROM
    parlamentar p
    JOIN parlamentar_mandato pm ON p.id = pm.parlamentar_id
    JOIN partido pa ON pm.partido_atual_id = pa.id
    LEFT JOIN eleicao e ON pm.eleicao_id = e.id
WHERE
    p.removido_em IS NULL
    AND pm.removido_em IS NULL;


