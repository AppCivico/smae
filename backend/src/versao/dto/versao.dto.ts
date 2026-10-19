export class VersaoServicoDto {
    chave: string;
    nome: string;
    versao: string;
}

export class VersaoDto {
    versao: string;
    /** Data do release, YYYY-MM-DD */
    data: string;
    tag: string;
    servicos: VersaoServicoDto[];
}
