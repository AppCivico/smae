import { ApiHideProperty, ApiProperty, IntersectionType } from '@nestjs/swagger';
import { ProjetoStatus, TipoProjeto } from '@prisma/client';
import { Transform, TransformFnParams } from 'class-transformer';
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';
import {
    NumberArrayTransformOrEmpty,
    NumberArrayTransformOrUndef,
} from '../../../auth/transforms/number-array.transform';
import { NumberTransform } from '../../../auth/transforms/number.transform';
import { StringArrayTransform } from '../../../auth/transforms/string-array.transform';
import { IsOnlyDate } from '../../../common/decorators/IsDateOnly';

export class FilterProjetoDto {
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    eh_prioritario?: boolean;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    arquivado?: boolean;

    @IsOptional()
    @Transform(({ value }: any) => {
        if (!value) return undefined;
        if (Array.isArray(value)) return value;
        return value.split(',');
    })
    @ApiProperty({ enum: ProjetoStatus, enumName: 'ProjetoStatus' })
    @IsArray({ message: '$property| precisa ser uma array.' })
    @ArrayMinSize(0, { message: '$property| precisa ter pelo menos um item' })
    @ArrayMaxSize(100, { message: '$property| precisa ter no máximo 100 items' })
    @IsEnum(ProjetoStatus, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(ProjetoStatus).join(', '),
        each: true,
    })
    status?: ProjetoStatus[];

    /**
     * órgão responsável
     **/
    @IsOptional()
    @IsInt()
    @Transform((a: TransformFnParams) => (a.value === null ? null : +a.value))
    orgao_responsavel_id?: number;

    /**
     * portfolio_id
     **/
    @IsOptional()
    @IsInt()
    @Transform((a: TransformFnParams) => (a.value === null ? null : +a.value))
    portfolio_id?: number;

    @IsOptional()
    @IsEnum(TipoProjeto)
    @ApiHideProperty()
    tipo_projeto?: TipoProjeto;

    @IsOptional()
    @IsInt({ each: true })
    @Transform(NumberArrayTransformOrUndef)
    projeto_id?: number[];
}

export const AscDescEnum = {
    asc: 'asc',
    desc: 'desc',
};
export type AscDescEnum = keyof typeof AscDescEnum;

export const ProjetoMdoOrderEnum = {
    id: 'id',
    nome: 'nome',
    codigo: 'codigo',
    portfolio_titulo: 'portfolio_titulo',
    grupo_tematico_nome: 'grupo_tematico_nome',
    tipo_intervencao_nome: 'tipo_intervencao_nome',
    equipamento_nome: 'equipamento_nome',
    orgao_origem_nome: 'orgao_origem_nome',
    regioes: 'regioes',
    status: 'status',
    registrado_em: 'registrado_em',
    projeto_etapa: 'projeto_etapa',
    projeto_etapa_id: 'projeto_etapa',
    previsao_custo: 'previsao_custo',
    previsao_termino: 'previsao_termino',
};
export type ProjetoMdoOrderEnum = keyof typeof ProjetoMdoOrderEnum;

export class ProjetoMDOOrderByDto {
    @IsEnum(AscDescEnum)
    @ApiProperty({ enum: AscDescEnum, default: 'asc' })
    ordem_direcao: 'asc' | 'desc' = 'asc';

    @IsEnum(ProjetoMdoOrderEnum)
    @ApiProperty({ enum: ProjetoMdoOrderEnum, enumName: 'ProjetoMdoOrderEnum', default: 'codigo' })
    ordem_coluna: string = 'codigo';
}

export class CoreFilterProjetoMDODto extends IntersectionType(FilterProjetoDto) {
    @IsOptional()
    @IsInt({ each: true })
    @Transform(NumberArrayTransformOrEmpty)
    orgao_origem_id?: number[];

    @IsOptional()
    @IsInt({ each: true })
    @Transform(NumberArrayTransformOrEmpty)
    regioes?: number[];

    @IsOptional()
    @IsString({ each: true })
    @Transform(StringArrayTransform)
    nome?: string[];

    @IsOptional()
    @IsString({ each: true })
    @Transform(StringArrayTransform)
    codigo?: string[];

    @IsOptional()
    @IsInt({ each: true })
    @Transform(NumberArrayTransformOrEmpty)
    grupo_tematico_id?: number[];

    @IsOptional()
    @IsInt({ each: true })
    @Transform(NumberArrayTransformOrEmpty)
    tipo_intervencao_id?: number[];

    @IsOptional()
    @IsInt({ each: true })
    @Transform(NumberArrayTransformOrEmpty)
    equipamento_id?: number[];

    @IsOptional()
    @IsInt({ each: true })
    @Transform(NumberArrayTransformOrEmpty)
    projeto_etapa_id?: number[];

    @IsOptional()
    @IsString()
    @MaxLength(250)
    palavra_chave?: string;

    @IsOptional()
    @IsString({ each: true })
    @Transform(StringArrayTransform)
    registros_sei?: string[];

    @IsOptional()
    @IsBoolean({ message: '$property| Precisa ser um boolean' })
    @Transform(({ value }: any) => value === 'true')
    revisado?: boolean;

    @IsOptional()
    @IsOnlyDate()
    @IsString()
    registrado_em?: string;

    @IsOptional()
    @IsOnlyDate()
    @IsString()
    registrado_em_de?: string;

    @IsOptional()
    @IsOnlyDate()
    @IsString()
    registrado_em_ate?: string;
}

export class FilterProjetoMDODto extends IntersectionType(CoreFilterProjetoMDODto, ProjetoMDOOrderByDto) {
    @IsOptional()
    @IsString()
    token_paginacao?: string;

    @IsOptional()
    @IsInt()
    @Transform(NumberTransform)
    ipp?: number = 25;

    @IsOptional()
    @IsInt()
    @Transform(NumberTransform)
    pagina?: number = 1;
}
