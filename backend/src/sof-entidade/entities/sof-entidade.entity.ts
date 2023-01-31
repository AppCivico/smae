class Entidade {
    codigo: string;
    descricao: string;
}

class EntidadeUnidade {
    codigo: string;
    descricao: string;
    cod_orgao: string;
}

class SuccessEntidadesResponse {
    orgaos: Entidade[];
    unidades: EntidadeUnidade[];
    funcoes: Entidade[];
    subfuncoes: Entidade[];
    programas: Entidade[];
    projetos_atividades: Entidade[];
    categorias: Entidade[];
    grupos: Entidade[];
    modalidades: Entidade[];
    elementos: Entidade[];
    fonte_recursos: Entidade[];
}

export class SofEntidadeDto {
    atualizado_em: string;
    dados: SuccessEntidadesResponse;
}
