-- CreateTable
CREATE TABLE "projeto_numero_sequencial" (
    "projeto_id" INTEGER NOT NULL,
    "portfolio_id" INTEGER NOT NULL,
    "ano" INTEGER NOT NULL,
    "valor" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "projeto_numero_sequencial_projeto_id_portfolio_id_key" ON "projeto_numero_sequencial"("projeto_id", "portfolio_id");

-- AddForeignKey
ALTER TABLE "projeto_numero_sequencial" ADD CONSTRAINT "projeto_numero_sequencial_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_numero_sequencial" ADD CONSTRAINT "projeto_numero_sequencial_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "portfolio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "projeto_numero_sequencial" (projeto_id, portfolio_id, ano, valor)
    SELECT
        id projeto_id,
        portfolio_id portfolio_id,
        date_part('year', selecionado_em) ano,
        ROW_NUMBER() OVER (
            PARTITION BY portfolio_id
            ORDER BY id
        )
    FROM projeto
    WHERE selecionado_em IS NOT NULL;