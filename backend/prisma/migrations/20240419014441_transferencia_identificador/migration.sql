WITH gen_identificador AS (
    SELECT
        id,
        ano,
        ROW_NUMBER() OVER (
            PARTITION BY ano
            ORDER BY id
        ) as id_identificador
    FROM transferencia
)
UPDATE transferencia SET identificador = gen_identificador.id_identificador|| '/' ||gen_identificador.ano
FROM gen_identificador
WHERE transferencia.id = gen_identificador.id