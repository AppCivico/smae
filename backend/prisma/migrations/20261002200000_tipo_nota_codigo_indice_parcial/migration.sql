-- Unicidade de tipo_nota.codigo passa a valer só entre registros ativos (e sem diferenciar
-- maiúsculas, como a checagem do service), permitindo reutilizar o código de um tipo removido.
-- Índice parcial: o Prisma não representa no schema, por isso fica só aqui.

-- DropIndex
DROP INDEX "tipo_nota_codigo_key";

-- CreateIndex
CREATE UNIQUE INDEX "tipo_nota_codigo_ativo_uniq" ON "tipo_nota"(lower("codigo")) WHERE "removido_em" IS NULL;
