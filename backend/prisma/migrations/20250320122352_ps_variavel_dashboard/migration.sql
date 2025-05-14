-- CreateTable
CREATE TABLE "ps_dashboard_variavel" (
    "variavel_id" INTEGER NOT NULL,
    "pdm_id" INTEGER[],
    "orgaos" INTEGER[],
    "equipes" INTEGER[],
    "equipes_orgaos" INTEGER[],

    CONSTRAINT "ps_dashboard_variavel_pkey" PRIMARY KEY ("variavel_id")
);

-- CreateIndex
CREATE INDEX "ps_dashboard_variavel_pdm_id_idx" ON "ps_dashboard_variavel"("pdm_id");

-- AddForeignKey
ALTER TABLE "ps_dashboard_variavel" ADD CONSTRAINT "ps_dashboard_variavel_variavel_id_fkey" FOREIGN KEY ("variavel_id") REFERENCES "variavel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
