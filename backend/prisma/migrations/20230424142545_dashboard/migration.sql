-- CreateTable
CREATE TABLE "metabase_permissao" (
    "id" SERIAL NOT NULL,
    "permissao" TEXT NOT NULL,
    "configuracao" JSON NOT NULL DEFAULT '{}',
    "metabase_url" TEXT NOT NULL,
    "metabase_token" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,

    CONSTRAINT "metabase_permissao_pkey" PRIMARY KEY ("id")
);
