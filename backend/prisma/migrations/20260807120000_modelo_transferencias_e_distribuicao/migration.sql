-- O relatório de Transferências passou a entregar duas granularidades em arquivos separados, e
-- o nome `transferencias.csv` mudou de dono:
--
--   antes: transferencias.csv = uma linha por DISTRIBUIÇÃO de recurso (colunas das duas entidades)
--   agora: transferencias.csv                   = uma linha por transferência
--          transferencias_e_distribuicao.csv    = uma linha por distribuição (o arquivo de antes)
--
-- Os modelos salvos referenciam o arquivo pelo nome (`config.arquivos[].arquivo`). Sem esta
-- migration, um modelo criado antes passaria a ser aplicado ao arquivo enxuto: toda seleção de
-- coluna `distribuicao_recurso__*` viraria "referência ignorada" e o arquivo detalhado sairia no
-- padrão. Não quebraria a execução — o pós-processamento é tolerante de propósito —, e é
-- justamente isso que torna o estrago silencioso.
--
-- O critério é o conteúdo, não o nome: quem escolheu aquelas colunas escolheu a granularidade de
-- distribuição, então o modelo segue apontando para o mesmo dado, agora sob o nome novo. Modelo
-- que só pegava colunas de transferência continua com as linhas repetidas (comportamento de hoje,
-- preservado) e pode ser reapontado à mão para o `transferencias.csv` novo.
--
-- Efeito colateral aceito: um modelo com `{"arquivo": "transferencias.csv", "incluir": false}`
-- passa a excluir o arquivo detalhado, e o novo `transferencias.csv` entra no zip pelo padrão.
--
-- `config` é `json` (não `jsonb`): o cast de ida e volta é o que dá acesso aos operadores. A
-- reescrita é por elemento do array, com `WITH ORDINALITY` para preservar a ordem escolhida no
-- modelo — a ordem dos arquivos é do usuário, não do banco.
--
-- O `@>` do WHERE não é só otimização: `jsonb_agg` sobre conjunto vazio devolve NULL, então uma
-- linha com `arquivos: []` sairia daqui com `arquivos: null` — config inválida gravada por uma
-- migration que deveria ser inócua para ela. Só entram linhas que de fato têm o arquivo antigo.
UPDATE relatorio_modelo
SET config = jsonb_set(
        config::jsonb,
        '{arquivos}',
        (
            SELECT jsonb_agg(
                       CASE
                           WHEN a ->> 'arquivo' = 'transferencias.csv'
                               THEN jsonb_set(a, '{arquivo}', '"transferencias_e_distribuicao.csv"'::jsonb)
                           ELSE a
                       END
                       ORDER BY ord
                   )
            FROM jsonb_array_elements(config::jsonb -> 'arquivos') WITH ORDINALITY AS t(a, ord)
        )
    )::json
WHERE fonte = 'Transferencias'
  AND jsonb_typeof(config::jsonb -> 'arquivos') = 'array'
  AND config::jsonb -> 'arquivos' @> '[{"arquivo": "transferencias.csv"}]'::jsonb;
