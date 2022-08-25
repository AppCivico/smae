-- CreateTable
CREATE TABLE "ods" (
    "id" INTEGER NOT NULL,
    "numero" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,

    CONSTRAINT "ods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ods_numero_key" ON "ods"("numero");
