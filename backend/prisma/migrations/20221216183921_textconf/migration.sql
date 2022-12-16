-- CreateTable
CREATE TABLE "texto_config" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "bemvindo_email" TEXT NOT NULL,
    "tos" TEXT NOT NULL,

    CONSTRAINT "texto_config_pkey" PRIMARY KEY ("id")
);
