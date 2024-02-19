-- AlterTable
ALTER TABLE "geo_localizacao_referencia" RENAME CONSTRAINT "geo_localicao_referencia_pkey" TO "geo_localizacao_referencia_pkey";

-- RenameForeignKey
ALTER TABLE "geo_localizacao_referencia" RENAME CONSTRAINT "geo_localicao_referencia_atividade_id_fkey" TO "geo_localizacao_referencia_atividade_id_fkey";

-- RenameForeignKey
ALTER TABLE "geo_localizacao_referencia" RENAME CONSTRAINT "geo_localicao_referencia_criador_por_fkey" TO "geo_localizacao_referencia_criador_por_fkey";

-- RenameForeignKey
ALTER TABLE "geo_localizacao_referencia" RENAME CONSTRAINT "geo_localicao_referencia_etapa_id_fkey" TO "geo_localizacao_referencia_etapa_id_fkey";

-- RenameForeignKey
ALTER TABLE "geo_localizacao_referencia" RENAME CONSTRAINT "geo_localicao_referencia_geo_localizacao_id_fkey" TO "geo_localizacao_referencia_geo_localizacao_id_fkey";

-- RenameForeignKey
ALTER TABLE "geo_localizacao_referencia" RENAME CONSTRAINT "geo_localicao_referencia_iniciativa_id_fkey" TO "geo_localizacao_referencia_iniciativa_id_fkey";

-- RenameForeignKey
ALTER TABLE "geo_localizacao_referencia" RENAME CONSTRAINT "geo_localicao_referencia_meta_id_fkey" TO "geo_localizacao_referencia_meta_id_fkey";

-- RenameForeignKey
ALTER TABLE "geo_localizacao_referencia" RENAME CONSTRAINT "geo_localicao_referencia_projeto_id_fkey" TO "geo_localizacao_referencia_projeto_id_fkey";

-- RenameForeignKey
ALTER TABLE "geo_localizacao_referencia" RENAME CONSTRAINT "geo_localicao_referencia_removido_por_fkey" TO "geo_localizacao_referencia_removido_por_fkey";
