-- CreateTable
CREATE TABLE "iniciativa" (
    "id" SERIAL NOT NULL,
    "meta_id" INTEGER NOT NULL,
    "codigo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "compoe_indicador_meta" BOOLEAN NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "iniciativa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "iniciativa_codigo_key" ON "iniciativa"("codigo");

-- AddForeignKey
ALTER TABLE "iniciativa" ADD CONSTRAINT "iniciativa_meta_id_fkey" FOREIGN KEY ("meta_id") REFERENCES "meta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
