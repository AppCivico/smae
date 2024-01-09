import { Transform, TransformFnParams } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional } from 'class-validator';
import { IdCodNomeDto } from '../../../common/dto/IdCodNome.dto';
import { IdNomeExibicaoDto } from '../../../common/dto/IdNomeExibicao.dto';
import { IdTituloDto } from '../../../common/dto/IdTitulo.dto';

export class GrupoPortfolioItemDto {
    id: number;
    orgao_id: number;
    titulo: string;
    participantes: IdNomeExibicaoDto[];
    criado_em: Date;
    projetos: IdCodNomeDto[];
    portfolios: IdTituloDto[];
}

export class ListGrupoPortfolioDto {
    linhas: GrupoPortfolioItemDto[];
}

export class FilterGrupoPortfolioDto {
    @IsOptional()
    @IsInt()
    @Transform((a: TransformFnParams) => (a.value === '' ? undefined : +a.value))
    id?: number;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    retornar_uso?: boolean;
}
