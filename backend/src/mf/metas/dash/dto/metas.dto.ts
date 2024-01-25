import { Transform, TransformFnParams } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional } from 'class-validator';
import { NumberArrayTransform } from '../../../../auth/transforms/number-array.error';
import { IdCodTituloDto } from '../../../../common/dto/IdCodTitulo.dto';
import { ApiProperty } from '@nestjs/swagger';
import { MfPerfilDto } from '../../dto/mf-meta.dto';

export class MfMetaVariavelCount {
    total: number;
    preenchidas: number;
    enviadas: number;
    conferidas: number;
    aguardando_complementacao: number;
}

export class MfMetaCronogramaCount {
    total: number;
    preenchido: number;
}

export class MfMetaOrcamentoCount {
    total: number;
    preenchido: number;
}

export class MfDashMetaPendenteDto extends IdCodTituloDto {
    variaveis: MfMetaVariavelCount;
    cronograma: MfMetaCronogramaCount;
    orcamento: MfMetaOrcamentoCount;

    /**
     * analise qualitativa no ciclo fisico foi enviada ou não, se nulo é por que não chegou ainda na fase
     */
    analise_qualitativa_enviada: boolean | null;
    /**
     * risco no ciclo fisico foi enviada ou não, se nulo é por que não chegou ainda na fase
     */
    risco_enviado: boolean | null;

    /**
     * fechamento no ciclo fisico foi enviada ou não, se nulo é por que não chegou ainda na fase
     */
    fechamento_enviado: boolean | null;
}

export class MfMetaAtrasoItemDto {
    data: Date;
    total: number;
}

export class MfDashMetaAtrasadaDto extends IdCodTituloDto {
    atrasos_variavel: MfMetaAtrasoItemDto[];
    atrasos_orcamento: MfMetaAtrasoItemDto[];
}

export class MfDashMetaAtualizadasDto extends MfDashMetaPendenteDto {}

export class ListMfDashMetasDto {
    pendentes: MfDashMetaPendenteDto[] | null;
    atualizadas: MfDashMetaAtualizadasDto[] | null;
    atrasadas: MfDashMetaAtrasadaDto[] | null;
    @ApiProperty({ enum: MfPerfilDto, enumName: 'MfPerfilDto' })
    perfil: MfPerfilDto;
}

export class FilterMfDashMetasDto {
    @IsInt()
    @Transform((a: TransformFnParams) => (a.value === '' ? undefined : +a.value))
    pdm_id: number;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    visao_geral?: boolean;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    retornar_pendentes?: boolean;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    retornar_atualizadas?: boolean;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    retornar_atrasadas?: boolean;

    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    @Transform(NumberArrayTransform)
    metas?: number[];

    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    @Transform(NumberArrayTransform)
    orgaos?: number[];

    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    @Transform(NumberArrayTransform)
    coordenadores_cp?: number[];
}
