/*
  Warnings:

  - A unique constraint covering the columns `[pessoa_id,etapa_id]` on the table `etapa_responsavel` will be added. If there are existing duplicate values, this will fail.

*/

DELETE   FROM etapa_responsavel T1
  USING       etapa_responsavel T2
WHERE  T1.id    < T2.id
  AND  T1.pessoa_id    = T2.pessoa_id
  AND  T1.etapa_id = T2.etapa_id;

-- CreateIndex
CREATE UNIQUE INDEX "etapa_responsavel_pessoa_id_etapa_id_key" ON "etapa_responsavel"("pessoa_id", "etapa_id");
