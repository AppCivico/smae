-- AlterTable
ALTER TABLE "variavel" ADD COLUMN     "liberacao_orgao_id" INTEGER,
ADD COLUMN     "medicao_orgao_id" INTEGER,
ADD COLUMN     "possui_variaveis_filhas" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "validacao_orgao_id" INTEGER;

-- AddForeignKey
ALTER TABLE "variavel" ADD CONSTRAINT "variavel_medicao_orgao_id_fkey" FOREIGN KEY ("medicao_orgao_id") REFERENCES "orgao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel" ADD CONSTRAINT "variavel_validacao_orgao_id_fkey" FOREIGN KEY ("validacao_orgao_id") REFERENCES "orgao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel" ADD CONSTRAINT "variavel_liberacao_orgao_id_fkey" FOREIGN KEY ("liberacao_orgao_id") REFERENCES "orgao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

update variavel set medicao_orgao_id = orgao_id, liberacao_orgao_id = orgao_id, validacao_orgao_id = orgao_id where tipo = 'Global';

update variavel set possui_variaveis_filhas = true where id in (
    select variavel_mae_id from variavel where variavel_mae_id is not null
);

-- update variavel_categorica_id based on parent if variavel_categorica_id is null
update variavel set variavel_categorica_id = (select variavel_categorica_id from variavel where id = variavel_mae_id)
where variavel_categorica_id is null and variavel_mae_id is not null;
