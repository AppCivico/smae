-- CreateTable
CREATE TABLE "MetabasePermissao" (
    "id" SERIAL NOT NULL,
    "permissao" TEXT NOT NULL,
    "configuracao" JSON NOT NULL DEFAULT '{}',
    "metabase_url" TEXT NOT NULL,
    "metabase_token" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,

    CONSTRAINT "MetabasePermissao_pkey" PRIMARY KEY ("id")
);
