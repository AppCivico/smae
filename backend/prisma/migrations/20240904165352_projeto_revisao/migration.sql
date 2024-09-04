-- CreateTable
CREATE TABLE "projeto_pessoa_revisao" (
    "id" SERIAL NOT NULL,
    "projeto_id" INTEGER NOT NULL,
    "pessoa_id" INTEGER NOT NULL,
    "projeto_revisado" BOOLEAN NOT NULL,
    "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projeto_pessoa_revisao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "projeto_pessoa_revisao_projeto_id_pessoa_id_key" ON "projeto_pessoa_revisao"("projeto_id", "pessoa_id");

-- AddForeignKey
ALTER TABLE "projeto_pessoa_revisao" ADD CONSTRAINT "projeto_pessoa_revisao_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_pessoa_revisao" ADD CONSTRAINT "projeto_pessoa_revisao_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

WITH pessoas_relevantes AS (
    SELECT
        p.id
    FROM pessoa p
    JOIN pessoa_perfil pp ON pp.pessoa_id = p.id
    JOIN perfil_acesso pa ON pp.perfil_acesso_id = pa.id
    WHERE p.desativado_em IS NULL
        AND pa.nome IN ('Gestor da Obra', 'Administrador do Módulo de Obras', 'Gestor de Obras no Órgão', 'Colaborador de obra no órgão', 'Observador de obra')
), obras AS (
    SELECT id FROM projeto WHERE tipo = 'MDO' AND removido_em IS NULL
)
INSERT INTO projeto_pessoa_revisao (projeto_id, pessoa_id, projeto_revisado)
SELECT
    o.id,
    p.id,
    FALSE
FROM pessoas_relevantes p
CROSS JOIN obras o
ON CONFLICT DO NOTHING;