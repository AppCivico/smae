import { IsInt, IsOptional } from 'class-validator';
import { IdNomeExibicao } from '../../../variavel/entities/variavel.entity';
import { Transform, TransformFnParams } from 'class-transformer';

export class GrupoPortfolioItemDto {
    id: number;
    orgao_id: number;
    titulo: string;
    participantes: IdNomeExibicao[];
    criado_em: Date;
}

export class ListGrupoPortfolioDto {
    linhas: GrupoPortfolioItemDto[];
}

export class FilterGrupoPortfolioDto {
    @IsOptional()
    @IsInt()
    @Transform((a: TransformFnParams) => (a.value === '' ? undefined : +a.value))
    id?: number;
}
