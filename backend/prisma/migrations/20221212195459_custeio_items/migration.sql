/*
  Warnings:

  - You are about to drop the column `custeio_previsto` on the `meta_orcamento` table. All the data in the column will be lost.
  - You are about to drop the column `investimento_previsto` on the `meta_orcamento` table. All the data in the column will be lost.
  - You are about to drop the column `parte_dotacao` on the `meta_orcamento` table. All the data in the column will be lost.
  - Added the required column `soma_custeio_previsto` to the `meta_orcamento` table without a default value. This is not possible if the table is not empty.
  - Added the required column `soma_investimento_previsto` to the `meta_orcamento` table without a default value. This is not possible if the table is not empty.

*/

begin;

-- CreateTable
CREATE TABLE "meta_orcamento_item" (
    "id" SERIAL NOT NULL,
    "custeio_previsto" DOUBLE PRECISION NOT NULL,
    "investimento_previsto" DOUBLE PRECISION NOT NULL,
    "parte_dotacao" TEXT NOT NULL DEFAULT '',
    "meta_orcamento_id" INTEGER NOT NULL,

    CONSTRAINT "meta_orcamento_item_pkey" PRIMARY KEY ("id")
);

insert into meta_orcamento_item(custeio_previsto, investimento_previsto, parte_dotacao , meta_orcamento_id)
select custeio_previsto, investimento_previsto, parte_dotacao , id from meta_orcamento;

ALTER TABLE "meta_orcamento" ADD COLUMN     "soma_custeio_previsto" DOUBLE PRECISION ,
ADD COLUMN     "soma_investimento_previsto" DOUBLE PRECISION ;

update meta_orcamento set
soma_custeio_previsto  = custeio_previsto,
soma_investimento_previsto  = investimento_previsto;


ALTER TABLE "meta_orcamento" alter  COLUMN     "soma_custeio_previsto" set not null,
alter  COLUMN     "soma_investimento_previsto" set not null;


-- AlterTable
ALTER TABLE "meta_orcamento" DROP COLUMN "custeio_previsto",
DROP COLUMN "investimento_previsto",
DROP COLUMN "parte_dotacao";

-- AddForeignKey
ALTER TABLE "meta_orcamento_item" ADD CONSTRAINT "meta_orcamento_item_meta_orcamento_id_fkey" FOREIGN KEY ("meta_orcamento_id") REFERENCES "meta_orcamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

commit;