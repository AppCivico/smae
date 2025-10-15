export class TipoVinculoDto {
    id: number;
    nome: string;
}

export class ListTipoVinculoDto {
    linhas: TipoVinculoDto[];
}
