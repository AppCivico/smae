begin;

/*
  Warnings:

  - You are about to drop the column `ano` on the `ciclo_fisico` table. All the data in the column will be lost.
  - You are about to drop the column `atualizado_em` on the `ciclo_fisico` table. All the data in the column will be lost.
  - You are about to drop the column `atualizado_por` on the `ciclo_fisico` table. All the data in the column will be lost.
  - You are about to drop the column `criado_em` on the `ciclo_fisico` table. All the data in the column will be lost.
  - You are about to drop the column `criado_por` on the `ciclo_fisico` table. All the data in the column will be lost.
  - You are about to drop the column `fase_atual` on the `ciclo_fisico` table. All the data in the column will be lost.
  - You are about to drop the column `mes` on the `ciclo_fisico` table. All the data in the column will be lost.
  - You are about to drop the column `removido_em` on the `ciclo_fisico` table. All the data in the column will be lost.
  - You are about to drop the column `removido_por` on the `ciclo_fisico` table. All the data in the column will be lost.
  - You are about to drop the column `ciclo_fisico_id` on the `painel_versao` table. All the data in the column will be lost.
  - You are about to drop the column `regiao_id` on the `serie_indicador` table. All the data in the column will be lost.
  - Added the required column `acordar_ciclo_em` to the `ciclo_fisico` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ciclo_fase_atual` to the `ciclo_fisico` table without a default value. This is not possible if the table is not empty.
  - Added the required column `data_ciclo` to the `ciclo_fisico` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CicloFase" AS ENUM ('Coleta', 'Analise', 'Risco', 'Fechamento');

-- DropForeignKey
ALTER TABLE "ciclo_fisico" DROP CONSTRAINT "ciclo_fisico_atualizado_por_fkey";

-- DropForeignKey
ALTER TABLE "ciclo_fisico" DROP CONSTRAINT "ciclo_fisico_criado_por_fkey";

-- DropForeignKey
ALTER TABLE "ciclo_fisico" DROP CONSTRAINT "ciclo_fisico_removido_por_fkey";

-- DropForeignKey
ALTER TABLE "painel_versao" DROP CONSTRAINT "painel_versao_ciclo_fisico_id_fkey";

-- DropForeignKey
ALTER TABLE "serie_indicador" DROP CONSTRAINT "serie_indicador_regiao_id_fkey";

-- AlterTable
ALTER TABLE "ciclo_fisico" DROP COLUMN "ano",
DROP COLUMN "atualizado_em",
DROP COLUMN "atualizado_por",
DROP COLUMN "criado_em",
DROP COLUMN "criado_por",
DROP COLUMN "fase_atual",
DROP COLUMN "mes",
DROP COLUMN "removido_em",
DROP COLUMN "removido_por",
ADD COLUMN     "acordar_ciclo_em" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "acordar_ciclo_errmsg" TEXT,
ADD COLUMN     "acordar_ciclo_executou_em" TIMESTAMP(3),
ADD COLUMN     "ciclo_fase_atual" "CicloFase" NOT NULL,
ADD COLUMN     "data_ciclo" DATE NOT NULL,
ALTER COLUMN "ativo" SET DEFAULT false;

-- AlterTable
ALTER TABLE "painel_versao" DROP COLUMN "ciclo_fisico_id";

-- AlterTable
ALTER TABLE "serie_indicador" DROP COLUMN "regiao_id";

-- CreateTable
CREATE TABLE "ciclo_fases_base" (
    "id" SERIAL NOT NULL,
    "ciclo_fase" "CicloFase" NOT NULL,
    "n_dias_do_inicio_mes" INTEGER NOT NULL,
    "n_dias_antes_do_fim_do_mes" INTEGER NOT NULL,

    CONSTRAINT "ciclo_fases_base_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ciclo_fases_pdm_config" (
    "id" SERIAL NOT NULL,
    "pdm_id" INTEGER NOT NULL,
    "ciclo_fase" "CicloFase" NOT NULL,
    "n_dias_do_inicio_mes" INTEGER NOT NULL,
    "n_dias_antes_do_fim_do_mes" INTEGER,

    CONSTRAINT "ciclo_fases_pdm_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ciclo_fisico_fase" (
    "id" SERIAL NOT NULL,
    "ciclo_fisico_id" INTEGER NOT NULL,
    "data_inicio" DATE NOT NULL,
    "data_fim" DATE NOT NULL,
    "ciclo_fase" "CicloFase" NOT NULL,

    CONSTRAINT "ciclo_fisico_fase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_serie_indicador_indicador_id_data_valor" ON "serie_indicador"("serie", "indicador_id", "data_valor");

-- AddForeignKey
ALTER TABLE "ciclo_fases_pdm_config" ADD CONSTRAINT "ciclo_fases_pdm_config_pdm_id_fkey" FOREIGN KEY ("pdm_id") REFERENCES "pdm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ciclo_fisico_fase" ADD CONSTRAINT "ciclo_fisico_fase_ciclo_fisico_id_fkey" FOREIGN KEY ("ciclo_fisico_id") REFERENCES "ciclo_fisico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


CREATE OR REPLACE FUNCTION monta_serie_indicador (pIndicador_id int, eh_serie_realizado boolean, pPeriodoStart date, pPeriodoEnd date)
    RETURNS varchar
    AS $$
DECLARE
    r record;
    serieRecord record;
    vInicio date;
    vFim date;
    vTipoSerie "Serie";
    vAcumuladoUsaFormula boolean;
    vPeriodicidade interval;
    vIndicadorBase numeric;
    -- resultado em double precision pq já passou por toda a conta
    resultado double precision;
BEGIN
    --
    SELECT
        periodicidade_intervalo (i.periodicidade),
        least (i.fim_medicao, greatest (coalesce(pPeriodoStart, i.inicio_medicao), i.inicio_medicao)) AS inicio_medicao,
        greatest (i.inicio_medicao, least (coalesce(pPeriodoEnd, i.fim_medicao), i.fim_medicao)) AS fim_medicao,
        case
            when eh_serie_realizado is null then null
            when eh_serie_realizado then 'Realizado'::"Serie" else 'Previsto'::"Serie"
            end as tipo_serie,
            i.acumulado_usa_formula,
            i.acumulado_valor_base
        INTO vPeriodicidade,
        vInicio,
        vFim,
        vTipoSerie,
        vAcumuladoUsaFormula,
        vIndicadorBase
    FROM
        indicador i
    WHERE
        i.id = pIndicador_id;
    IF vInicio IS NULL THEN
        RETURN 'Indicador não encontrado';
    END IF;


    FOR serieRecord IN

        WITH series AS (
            SELECT 'Realizado'::"Serie" as serie
            UNION ALL
            SELECT 'RealizadoAcumulado'::"Serie"
            UNION ALL
            SELECT 'Previsto'::"Serie"
            UNION ALL
            SELECT 'PrevistoAcumulado'::"Serie"
        )
        SELECT s.serie
        FROM series s
        WHERE (
         -- nao é acumulado entao retorna
            s.serie::text NOT like '%Acumulado'
            OR
            -- se é acumulado, só retorna se o indicador deseja usar a formula
            ( s.serie::text like '%Acumulado' AND vAcumuladoUsaFormula )
        )
        AND
        -- filtra apenas as series do tipo escolhido para recalcular, ou todas se for null
        ((vTipoSerie is null) OR ( s.serie::text like vTipoSerie::text || '%' ))
        LOOP
            -- apaga o periodo escolhido
            DELETE FROM serie_indicador
            WHERE indicador_id = pIndicador_id
                AND serie = serieRecord.serie
                AND data_valor >= vInicio
                AND data_valor <= vFim -- aqui acho que precisa virar < e na hora de calcular tbm tirar 1 periodo
                ;

            -- recalcula o periodo
            FOR r IN
                SELECT
                    serieRecord.serie AS serie,
                    gs.gs AS data_serie,
                    monta_formula (pIndicador_id, serieRecord.serie, gs.gs::date) AS formula
                FROM
                    generate_series(vInicio, vFim, vPeriodicidade) gs
                ORDER BY 1 -- não faz diferença, mas fica melhor nos logs
            LOOP
                resultado := NULL;

                IF (r.formula IS NOT NULL) THEN
                    EXECUTE 'SELECT ' || r.formula INTO resultado;
                    INSERT INTO serie_indicador (indicador_id, serie, data_valor, valor_nominal)
                        VALUES (pIndicador_id, r.serie, r.data_serie, resultado);
                END IF;

                RAISE NOTICE 'r %', ROW_TO_JSON(r) || ' => ' || coalesce(resultado::text, '(null)');
            END LOOP; -- loop resultados da periodo da serie

        -- se não é pra usar a formula, entrao vamos recalcular automaticamente a serie acumulada usando os resultados
        IF (vAcumuladoUsaFormula = false) THEN
            -- muito arriscado fazer usando os periodos, entao recaclula tudo
            DELETE FROM serie_indicador
            WHERE indicador_id = pIndicador_id
                AND serie = (serieRecord.serie::text || 'Acumulado')::"Serie"
                ;

            INSERT INTO serie_indicador(indicador_id, serie, data_valor, valor_nominal)
            WITH theData AS (
                WITH indData AS (
                    SELECT
                        periodicidade_intervalo (i.periodicidade) as periodicidade,
                        i.inicio_medicao as inicio_medicao,
                        i.fim_medicao as fim_medicao
                    FROM
                        indicador i
                    WHERE
                        i.id = pIndicador_id
                )
                SELECT
                    pIndicador_id,
                    (serieRecord.serie::text || 'Acumulado')::"Serie",
                    gs.gs as data_serie,
                    coalesce(sum(si.valor_nominal) OVER (order by gs.gs), vIndicadorBase) as valor_acc
                FROM
                    generate_series(
                    (select inicio_medicao from indData),
                    (select fim_medicao from indData),
                    (select periodicidade from indData)
                ) gs
                LEFT JOIN serie_indicador si
                    ON  si.indicador_id = pIndicador_id
                    AND data_valor = gs.gs::date
                    AND si.serie = serieRecord.serie
            ) SELECT * from theData where theData.valor_acc is not null;

        END IF ;
    END LOOP; -- loop resultados das series
    --
    RETURN '';
END
$$
LANGUAGE plpgsql;

insert into ciclo_fases_base (ciclo_fase, n_dias_do_inicio_mes, n_dias_antes_do_fim_do_mes)
values
('Coleta', 5, -5),
('Analise', 10, -5),
('Risco', 15, -5),
('Fechamento', 20, 0)
;

commit;