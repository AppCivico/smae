export class RelatorioDto {
    id: number;
    criado_em: Date;
    criador: { nome_exibicao: string };
    fonte: string;
    arquivo: string;
    parametros: any;
    parametros_processados: any;
    pdm_id: number | null;
}
