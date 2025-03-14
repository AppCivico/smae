WITH parlamentar_max_ano AS (
    SELECT 
        pm.parlamentar_id,
        MAX(e.ano) AS max_ano
    FROM parlamentar_mandato pm
    JOIN eleicao e ON pm.eleicao_id = e.id AND e.removido_em IS NULL
    WHERE e.removido_em is null
    GROUP BY pm.parlamentar_id
),
mandatos_recentes AS (
    SELECT 
        pm.parlamentar_id,
        pm.cargo,
        pa.sigla,
        pm.id,
        ROW_NUMBER() OVER (
            PARTITION BY pm.parlamentar_id 
            ORDER BY pm.id DESC
        ) AS rn
    FROM parlamentar_mandato pm
    JOIN eleicao e ON pm.eleicao_id = e.id AND e.removido_em IS NULL
    JOIN partido pa ON pm.partido_atual_id = pa.id
    INNER JOIN parlamentar_max_ano pma 
        ON pm.parlamentar_id = pma.parlamentar_id 
        AND e.ano = pma.max_ano
    WHERE pm.removido_em IS NULL
),
latest_mandatos AS (
    SELECT 
        parlamentar_id,
        cargo,
        sigla
    FROM mandatos_recentes
    WHERE rn = 1
)
UPDATE parlamentar p
SET 
    cargo_mais_recente = lm.cargo,
    partido_mais_recente = lm.sigla
FROM latest_mandatos lm
WHERE p.id = lm.parlamentar_id;

UPDATE parlamentar SET tem_mandato = TRUE WHERE EXISTS (SELECT 1 FROM parlamentar_mandato WHERE parlamentar_id = parlamentar.id);