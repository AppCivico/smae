-- AlterTable
ALTER TABLE "parlamentar_equipe" ADD COLUMN     "mandato_id" INTEGER;

-- AlterTable
ALTER TABLE "parlamentar_mandato" ALTER COLUMN "gabinete" DROP NOT NULL;

-- CreateTable
CREATE TABLE "bancada_partido" (
    "id" SERIAL NOT NULL,
    "bancada_id" INTEGER NOT NULL,
    "partido_id" INTEGER NOT NULL,

    CONSTRAINT "bancada_partido_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bancada_partido_bancada_id_partido_id_key" ON "bancada_partido"("bancada_id", "partido_id");

-- AddForeignKey
ALTER TABLE "bancada_partido" ADD CONSTRAINT "bancada_partido_bancada_id_fkey" FOREIGN KEY ("bancada_id") REFERENCES "bancada"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bancada_partido" ADD CONSTRAINT "bancada_partido_partido_id_fkey" FOREIGN KEY ("partido_id") REFERENCES "partido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parlamentar_equipe" ADD CONSTRAINT "parlamentar_equipe_mandato_id_fkey" FOREIGN KEY ("mandato_id") REFERENCES "parlamentar_mandato"("id") ON DELETE SET NULL ON UPDATE CASCADE;
