import { PerfilResponsavelVariavel } from '@prisma/client';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional } from 'class-validator';
import { IdCodTituloDto } from '../../common/dto/IdCodTitulo.dto';
import { IdNomeExibicaoDto } from '../../common/dto/IdNomeExibicao.dto';

export class GrupoRespVariavelItemDto {
    id: number;
    orgao_id: number;
    titulo: string;
    perfil: PerfilResponsavelVariavel;
    participantes: IdNomeExibicaoDto[];
    criado_em: Date;
    variaveis: IdCodTituloDto[];
}

export class ListGrupoRespVariavelDto {
    linhas: GrupoRespVariavelItemDto[];
}

export class FilterGrupoRespVariavelDto {
    @IsOptional()
    @IsInt()
    @Transform((a: TransformFnParams) => (a.value === '' ? undefined : +a.value))
    id?: number;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    retornar_uso?: boolean;
}
