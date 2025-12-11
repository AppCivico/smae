-- AddForeignKey
ALTER TABLE "indicador" ADD CONSTRAINT "indicador_variavel_categoria_id_fkey" FOREIGN KEY ("variavel_categoria_id") REFERENCES "variavel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
