export type MonitoramentoFaseDefault = {
    ordem: number;
    rotulo: string;
    aceita_tags: boolean;
    aceita_anexos: boolean;
    blocos: { ordem: number; rotulo: string }[];
};

// Espelha o backfill da migration 20260625133722_pdm_monitoramento_ciclo_config; mantenha em sincronia com aquele SQL.
export const MONITORAMENTO_CONFIG_DEFAULTS: MonitoramentoFaseDefault[] = [
    {
        ordem: 1,
        rotulo: 'Qualificação',
        aceita_tags: false,
        aceita_anexos: true,
        blocos: [{ ordem: 1, rotulo: 'Informações complementares' }],
    },
    {
        ordem: 2,
        rotulo: 'Análise de risco',
        aceita_tags: false,
        aceita_anexos: false,
        blocos: [
            { ordem: 1, rotulo: 'Detalhamento' },
            { ordem: 2, rotulo: 'Ponto de atenção' },
        ],
    },
    {
        ordem: 3,
        rotulo: 'Tags de monitoramento',
        aceita_tags: true,
        aceita_anexos: false,
        blocos: [],
    },
    {
        ordem: 4,
        rotulo: 'Fechamento',
        aceita_tags: false,
        aceita_anexos: false,
        blocos: [{ ordem: 1, rotulo: 'Comentário' }],
    },
];
