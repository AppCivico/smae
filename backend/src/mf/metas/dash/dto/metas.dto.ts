import { ApiProperty } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional } from 'class-validator';
import { NumberArrayTransform } from '../../../../auth/transforms/number-array.error';
import { IdCodTituloDto } from '../../../../common/dto/IdCodTitulo.dto';
import { IdTituloOrNullDto } from '../../../../common/dto/IdTitulo.dto';
import { MfPerfilDto } from '../../dto/mf-meta.dto';
import { CicloFase } from '@prisma/client';

export class MfMetaVariavelCount {
    total: number | number[];
    preenchidas: number | number[];
    enviadas: number | number[];
    conferidas: number | number[];
    aguardando_complementacao: number | number[];
    detalhes: IdCodTituloDto[] | null;
}

export class MfMetaCronogramaCount {
    total: number;
    preenchido: number;
    atraso_fim: number | number[] | null;
    atraso_inicio: number | number[] | null;
    detalhes: IdTituloOrNullDto[] | null;
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
    atualizado_em: Date;
    fase: CicloFase
}

export class MfMetaAtrasoItemDto {
    data: Date;
    total: number;
}

export class MfDashMetaAtrasadaDto extends IdCodTituloDto {
    atrasos_variavel: MfMetaAtrasoItemDto[];
    atrasos_orcamento: MfMetaAtrasoItemDto[];
}

export class MfMetaAtrasoDetalheItemDto extends IdCodTituloDto {
    meses: string[];
}

export class MfDashMetaAtrasadaDetalhesDto extends IdCodTituloDto {
    atrasos_variavel: MfMetaAtrasoDetalheItemDto[];
}

export class MfDashMetaAtualizadasDto extends MfDashMetaPendenteDto {}

export class ListMfDashMetasDto {
    pendentes: MfDashMetaPendenteDto[] | null;
    atualizadas: MfDashMetaAtualizadasDto[] | null;
    atrasadas: MfDashMetaAtrasadaDto[] | null;
    atrasadas_detalhes: MfDashMetaAtrasadaDetalhesDto[] | null;
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
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    retornar_detalhes?: boolean;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    filtro_ponto_focal_cronograma?: boolean;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    filtro_ponto_focal_variavel?: boolean;

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

export class FilterMfDashEtapasDto {
    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    @Transform(NumberArrayTransform)
    etapas_ids?: number[];
}

export class MfDashEtapaHierarquiaDto {
    etapa_id: number;
    meta_id: number;
    iniciativa_id: number | null;
    atividade_id: number | null;
}

export class ListMfDashEtapaHierarquiaDto {
    linhas: MfDashEtapaHierarquiaDto[];
}
