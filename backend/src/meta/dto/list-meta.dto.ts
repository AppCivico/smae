import { MetaItemDto } from '../entities/meta.entity';

export class ListMetaDto {
    linhas: MetaItemDto[];
}

export class MetaSimplesDto {
    id: number;
    codigo: string;
    titulo: string;
    pdm_id: number;
}

export class ListMetaSimplesDto {
    linhas: MetaSimplesDto[];
}
