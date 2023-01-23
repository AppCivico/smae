-- DropForeignKey
ALTER TABLE "portfolio" DROP CONSTRAINT "portfolio_atualizado_por_fkey";

-- DropForeignKey
ALTER TABLE "portfolio" DROP CONSTRAINT "portfolio_criado_por_fkey";

-- DropForeignKey
ALTER TABLE "portfolio" DROP CONSTRAINT "portfolio_removido_por_fkey";

-- DropForeignKey
ALTER TABLE "portifolio_orgao" DROP CONSTRAINT "portifolio_orgao_portifolio_id_fkey";

-- DropForeignKey
ALTER TABLE "projeto" DROP CONSTRAINT "projeto_portfolio_id_fkey";

-- DropTable
DROP TABLE "portfolio";

-- CreateTable
CREATE TABLE "Portfolio" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,

    CONSTRAINT "Portfolio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Portfolio_titulo_key" ON "Portfolio"("titulo" ASC);

-- AddForeignKey
ALTER TABLE "portifolio_orgao" ADD CONSTRAINT "portifolio_orgao_portifolio_id_fkey" FOREIGN KEY ("portifolio_id") REFERENCES "Portfolio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "Portfolio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

