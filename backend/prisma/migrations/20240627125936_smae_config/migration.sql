-- CreateTable
CREATE TABLE "smae_config" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "smae_config_pkey" PRIMARY KEY ("key")
);
