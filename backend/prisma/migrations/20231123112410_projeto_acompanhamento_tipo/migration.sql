-- AlterTable
ALTER TABLE "projeto" ADD COLUMN     "acompanhanmento_tipo_id" INTEGER;

-- CreateTable
CREATE TABLE "acompanhamento_tipo" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "acompanhamento_tipo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "acompanhamento_tipo_nome_key" ON "acompanhamento_tipo"("nome");

-- AddForeignKey
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_acompanhanmento_tipo_id_fkey" FOREIGN KEY ("acompanhanmento_tipo_id") REFERENCES "acompanhamento_tipo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "acompanhamento_tipo" (nome) VALUES ('visíta técnica'), ('reunião'), ('processo SEI');

