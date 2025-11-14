/*
  Warnings:

  - You are about to drop the column `pessoa_id` on the `pdm_perfil` table. All the data in the column will be lost.
  - Added the required column `equipe_id` to the `pdm_perfil` table without a default value. This is not possible if the table is not empty.

*/

DELETE FROM pdm_perfil;

-- DropForeignKey
ALTER TABLE "pdm_perfil" DROP CONSTRAINT "pdm_perfil_pessoa_id_fkey";

-- AlterTable
ALTER TABLE "pdm_perfil" DROP COLUMN "pessoa_id",
ADD COLUMN     "equipe_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "pdm_perfil" ADD CONSTRAINT "pdm_perfil_equipe_id_fkey" FOREIGN KEY ("equipe_id") REFERENCES "grupo_responsavel_equipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION f_regiao_filha_ate_nivel(p_regiao_id INT, p_max_nivel INT)
RETURNS TABLE (
    id INT,
    parent INT,
    nivel INT
)
AS $$
BEGIN
    RETURN QUERY


    WITH RECURSIVE RegionHierarchy AS (
        SELECT
            me.id,
            me.parente_id, me.nivel
        FROM
            regiao me
        WHERE
            me.id = p_regiao_id
        UNION ALL
        SELECT
            r.id,
            r.parente_id , r.nivel
        FROM
            regiao r
        INNER JOIN
            RegionHierarchy h ON r.parente_id = h.id
    )
    select me.*
    from RegionHierarchy me where me.nivel = p_max_nivel;

END;
$$ LANGUAGE plpgsql;

