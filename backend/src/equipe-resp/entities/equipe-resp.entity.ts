import { PerfilResponsavelEquipe } from 'src/generated/prisma/client';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional } from 'class-validator';
import { IdCodTituloDto } from '../../common/dto/IdCodTitulo.dto';
import { IdNomeExibicaoDto } from '../../common/dto/IdNomeExibicao.dto';
import { OrgaoReduzidoDto } from '../../orgao/entities/orgao.entity';

export class EquipeRespItemDto {
    id: number;
    orgao_id: number;
    orgao: OrgaoReduzidoDto;
    titulo: string;
    perfil: PerfilResponsavelEquipe;
    participantes: IdNomeExibicaoDto[];
    colaboradores: IdNomeExibicaoDto[];
    criado_em: Date;
    variaveis: IdCodTituloDto[];
}

export class ListEquipeRespDto {
    linhas: EquipeRespItemDto[];
}

export class FilterEquipeRespDto {
    @IsOptional()
    @IsInt()
    @Transform((a: TransformFnParams) => (a.value === '' ? undefined : +a.value))
    id?: number;

    @IsOptional()
    @IsInt()
    @Transform((a: TransformFnParams) => (a.value === '' ? undefined : +a.value))
    orgao_id?: number;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    retornar_uso?: boolean;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    remover_participantes?: boolean;
}
