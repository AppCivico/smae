export class AcaoDto {
    id: number;
    nome: string;
    ativo: boolean;
}

export class AreaTematicaDto {
    id: number;
    nome: string;
    ativo: boolean;
    acoes: AcaoDto[];
}

export class ListAreaTematicaDto {
    linhas: AreaTematicaDto[];
}
