-- CreateTable
CREATE TABLE "iniciativa_orgao" (
    "id" SERIAL NOT NULL,
    "iniciativa_id" INTEGER NOT NULL,
    "responsavel" BOOLEAN NOT NULL,
    "orgao_id" INTEGER NOT NULL,

    CONSTRAINT "iniciativa_orgao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "iniciativa_responsavel" (
    "id" SERIAL NOT NULL,
    "iniciativa_id" INTEGER NOT NULL,
    "pessoa_id" INTEGER NOT NULL,
    "orgao_id" INTEGER NOT NULL,
    "coordenador_responsavel_cp" BOOLEAN NOT NULL,

    CONSTRAINT "iniciativa_responsavel_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "iniciativa_orgao" ADD CONSTRAINT "iniciativa_orgao_iniciativa_id_fkey" FOREIGN KEY ("iniciativa_id") REFERENCES "iniciativa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iniciativa_orgao" ADD CONSTRAINT "iniciativa_orgao_orgao_id_fkey" FOREIGN KEY ("orgao_id") REFERENCES "orgao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iniciativa_responsavel" ADD CONSTRAINT "iniciativa_responsavel_iniciativa_id_fkey" FOREIGN KEY ("iniciativa_id") REFERENCES "iniciativa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iniciativa_responsavel" ADD CONSTRAINT "iniciativa_responsavel_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "iniciativa_responsavel" ADD CONSTRAINT "iniciativa_responsavel_orgao_id_fkey" FOREIGN KEY ("orgao_id") REFERENCES "orgao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
