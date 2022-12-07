-- CreateTable
CREATE TABLE "sof_entidade" (
    "ano" INTEGER NOT NULL,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dados" JSON NOT NULL DEFAULT '{}',

    CONSTRAINT "sof_entidade_pkey" PRIMARY KEY ("ano")
);
