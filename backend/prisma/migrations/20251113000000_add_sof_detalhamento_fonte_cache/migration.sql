-- CreateTable
CREATE TABLE "sof_detalhamento_fonte" (
    "ano" INTEGER NOT NULL,
    "numero_fonte" INTEGER NOT NULL,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dados" JSON NOT NULL DEFAULT '[]',

    CONSTRAINT "sof_detalhamento_fonte_pkey" PRIMARY KEY ("ano","numero_fonte")
);
