import { ApiProperty } from '@nestjs/swagger';
import { CicloFase } from 'src/generated/prisma/client';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional } from 'class-validator';
import { IsDateYMD } from '../../../../auth/decorators/date.decorator';
import { NumberArrayTransformOrUndef } from '../../../../auth/transforms/number-array.transform';
import { IdCodTituloDto } from '../../../../common/dto/IdCodTitulo.dto';
import { IdTituloOrNullDto } from '../../../../common/dto/IdTitulo.dto';
import { MfPerfilDto } from '../../dto/mf-meta.dto';

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
    fase: CicloFase;
}

export class MfMetaAtrasoItemDto {
    @IsDateYMD()
    data: string;
    total: number;
}

export class MfDashMetaAtrasadaDto extends IdCodTituloDto {
    atrasos_variavel: MfMetaAtrasoItemDto[];
    atrasos_orcamento: MfMetaAtrasoItemDto[];
}

export class MfMetaAtrasoDetalheItemDto extends IdCodTituloDto {
    @IsDateYMD({ isArray: true })
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

    /**
     * Por mais que o campos chame filtro_ponto_focal_cronograma, o campo começou a ser usado também para as telas de detalhes
     * de qualquer usuário. Se passado junto com os detalhes, retorna apenas os itens de pendente/atualizado do cronograma
     */
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    filtro_ponto_focal_cronograma?: boolean;

    /**
     * Por mais que o campos chame filtro_ponto_focal_variavel, o campo começou a ser usado também para as telas de detalhes
     * de qualquer usuário. Se passado junto com os detalhes, retorna apenas os itens de pendente/atualizado da variavel
     */
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    filtro_ponto_focal_variavel?: boolean;

    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    @Transform(NumberArrayTransformOrUndef)
    metas?: number[];

    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    @Transform(NumberArrayTransformOrUndef)
    orgaos?: number[];

    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    @Transform(NumberArrayTransformOrUndef)
    coordenadores_cp?: number[];
}

export class FilterMfDashEtapasDto {
    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    @Transform(NumberArrayTransformOrUndef)
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
