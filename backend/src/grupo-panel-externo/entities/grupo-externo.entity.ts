import { Transform, TransformFnParams } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional } from 'class-validator';
import { IdCodTituloDto } from '../../common/dto/IdCodTitulo.dto';
import { IdNomeExibicaoDto } from '../../common/dto/IdNomeExibicao.dto';

export class GrupoPainelExternoItemDto {
    id: number;
    orgao_id: number;
    titulo: string;
    participantes: IdNomeExibicaoDto[];
    criado_em: Date;
    paineis: IdCodTituloDto[];
}

export class ListGrupoPainelExternoDto {
    linhas: GrupoPainelExternoItemDto[];
}

export class FilterGrupoPainelExternoDto {
    @IsOptional()
    @IsInt()
    @Transform((a: TransformFnParams) => (a.value === '' ? undefined : +a.value))
    id?: number;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    retornar_uso?: boolean;
}
