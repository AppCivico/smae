import { ApiProperty, OmitType, PickType } from '@nestjs/swagger';
import { CicloFase, Periodicidade, Serie } from 'src/generated/prisma/client';
import { Transform, Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsNumber,
    IsNumberString,
    IsOptional,
    IsString,
    MaxLength,
    ValidateIf,
    ValidateNested,
} from 'class-validator';
import { IsOnlyDate } from '../../../common/decorators/IsDateOnly';

import { IdTituloDto } from 'src/common/dto/IdTitulo.dto';
import { DateTransform } from '../../../auth/transforms/date.transform';
import { DateYMD } from '../../../common/date2ymd';
import { IdCodTituloDto } from '../../../common/dto/IdCodTitulo.dto';
import { ArquivoBaseDto } from '../../../upload/dto/create-upload.dto';
import { SerieValorNomimal } from '../../../variavel/entities/variavel.entity';
import { MAX_LENGTH_DEFAULT, MAX_LENGTH_HTML } from 'src/common/consts';

export const MfPerfilDto = {
    'ponto_focal': 'ponto_focal',
    'tecnico_cp': 'tecnico_cp',
    'admin_cp': 'admin_cp',
} as const;

export type MfPerfilDto = (typeof MfPerfilDto)[keyof typeof MfPerfilDto];

export class FilterMfMetasDto {
    /**
     * Qual ciclo usar para calcular o status (exceto Coleta, que o status é sempre em branco)
     * @example "Fechamento"
     */
    @IsOptional()
    @ApiProperty({ enum: CicloFase })
    ciclo_fase?: CicloFase;
}

export class FilterMfVariaveis {
    /**
     * válido apenas para CP e técnico CP simular o comportamento do envio como se fosse um ponto_focal
     * ou seja, os dados não serão conferidos automaticamente
     **/
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    simular_ponto_focal?: boolean;

    /**
     * se deve retornar o mes anterior ou apenas o mês corrente
     **/
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    mes_anterior?: boolean;
}

export class MfMetaAgrupadaDto {
    grupo: string;
    id: number;
    titulo: string;
    codigo: string;
}

export class CicloAtivoDto {
    id: number;
    data_ciclo: string;
    pdm: {
        id: number;
    };
}

export class RequestInfoDto {
    requestInfo: {
        queryTook: number;
    };
}

export class ListMfMetasAgrupadasDto {
    linhas: MfMetaAgrupadaDto[];
    @ApiProperty({ enum: ['Status', 'Fase'] })
    agrupador: string;
    @ApiProperty({ enum: MfPerfilDto, enumName: 'MfPerfilDto' })
    perfil: MfPerfilDto;
    ciclo_ativo: CicloAtivoDto;
}

export class MfMetaDto {
    id: number;
    titulo: string;
    codigo: string;
    fase: string;
    cronograma: {
        participante: boolean;
        status: string;
    };
    coleta: {
        participante: boolean;
        status: string;
    };
    codigo_organizacoes: string[];
    /**
     * Só aparece quando filtrado por algum ciclo-fase em especial
     */
    status_ciclo_fase?: string;
}

export class ListMfMetasDto {
    linhas: MfMetaDto[];
    @ApiProperty({ enum: MfPerfilDto, enumName: 'MfPerfilDto' })
    perfil: MfPerfilDto;
    ciclo_ativo: CicloAtivoDto;
}

export class IdCodTituloRespDto {
    id: number;
    codigo: string;
    titulo: string;

    orgaos_responsaveis: string[];
    orgaos_participantes: string[];
    responsaveis_na_cp: string[];
}

export class VariavelQtdeDto {
    aguarda_cp: number;
    aguarda_complementacao: number;
    nao_preenchidas: number;
    nao_enviadas: number;
}

export type Status = keyof VariavelQtdeDto;

export class VariavelUmPoucoDetalhesDto extends IdCodTituloDto {
    variavel_categorica_id: number | null;
    acumulativa: boolean;
    casas_decimais: number;
}

export class VariavelComSeries {
    variavel: VariavelUmPoucoDetalhesDto;
    variavel_formula_composta: IdTituloDto[] | null;
    series: MfSeriesAgrupadas[];
}

export class MfSerieValorNomimal extends OmitType(SerieValorNomimal, ['referencia', 'ha_conferencia_pendente']) {}

export class MfSeriesAgrupadas {
    eh_corrente: boolean;
    pode_editar: boolean;
    aguarda_cp?: boolean;
    aguarda_complementacao?: boolean;
    nao_preenchida?: boolean;
    nao_enviada?: boolean;

    /**
     * Data completa do mês de referencia do ciclo
     * @example "2020-01-01"
     */
    periodo: string;
    series: MfSerieValorNomimal[];
}

export class AtividadesRetorno {
    indicador: IdCodTituloDto | null;
    atividade: IdCodTituloRespDto;
    variaveis: VariavelComSeries[];
    totais: VariavelQtdeDto;
}

export class IniciativasRetorno {
    indicador: IdCodTituloDto | null;
    iniciativa: IdCodTituloRespDto;
    atividades: AtividadesRetorno[];
    variaveis: VariavelComSeries[];
    totais: VariavelQtdeDto;
}
export class MfFasesPermissoesDto {
    fechamento: boolean;
    risco: boolean;
    analiseQualitativa: boolean;
}

export type MfAvancarFasesDto = CicloFase[];

export class RetornoMetaVariaveisDto {
    @ApiProperty({ enum: MfPerfilDto, enumName: 'MfPerfilDto' })
    perfil: MfPerfilDto;
    data_ciclo: DateYMD;

    meta: {
        indicador: IdCodTituloDto | null;
        iniciativas: IniciativasRetorno[];
        variaveis: VariavelComSeries[];
        totais: VariavelQtdeDto;
        codigo: string;
        titulo: string;
        id: number;
        ciclo_fase: string;
        orgaos_responsaveis: string[];
        orgaos_participantes: string[];
        responsaveis_na_cp: string[];
    };

    permissoes: MfFasesPermissoesDto;
    avancarFases: MfAvancarFasesDto;
    botao_enviar_cp: boolean;

    /**
     * contextualiza qual a ordem que as séries serão apresentadas dentro das series
     * @example "["Previsto", "PrevistoAcumulado", "Realizado", "RealizadoAcumulado"]"
     */
    ordem_series: Serie[];
}

type ColunasAtualizaveis = 'valor_realizado' | 'valor_realizado_acumulado';
export const CamposAcumulado: ColunasAtualizaveis[] = ['valor_realizado_acumulado'] as const;
export const CamposRealizado: ColunasAtualizaveis[] = ['valor_realizado', 'valor_realizado_acumulado'] as const;
export const CamposRealizadoParaSerie: Record<ColunasAtualizaveis, Serie> = {
    valor_realizado: 'Realizado',
    valor_realizado_acumulado: 'RealizadoAcumulado',
} as const;

export class CicloFaseDto {
    /**
     * ciclo_fase_id -- precisa ser uma fase mais avançada que a atual
     * @example "1"
     */
    @IsNumber()
    ciclo_fase_id: number;
}

export class VariavelComplementacaoDto {
    /**
     * data_valor
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    data_valor: Date;

    /**
     * variavel_id
     * @example "1"
     */
    @IsNumber()
    variavel_id: number;

    @IsString()
    pedido: string;
}

export class VariavelConferidaDto {
    /**
     * data_valor
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    data_valor: Date;

    /**
     * variavel_id
     * @example "1"
     */
    @IsNumber()
    variavel_id: number;
}

export class VariavelAnaliseQualitativaDto {
    /**
     * data_valor
     * @example YYYY-MM-DD
     */
    @IsOnlyDate()
    @Transform(DateTransform)
    data_valor: Date;

    /**
     * variavel_id
     * @example "1"
     */
    @IsNumber()
    variavel_id: number;

    @IsOptional()
    // maxDecimalPlaces: 30 nao existe isso nesse cara, só tem no IsNumber, mas se usar o transform,
    // o javascript vai perder a precisao na hora do casting pra float
    @IsNumberString(
        {},
        {
            message:
                'Precisa ser um número com até 30 dígitos antes do ponto, e até 30 dígitos após, enviado em formato String ou vazio para remover',
        }
    )
    @ValidateIf((object, value) => value !== '')
    @Type(() => String)
    valor_realizado?: string;

    @IsOptional()
    // maxDecimalPlaces: 30 nao existe isso nesse cara, só tem no IsNumber, mas se usar o transform,
    // o javascript vai perder a precisao na hora do casting pra float
    @IsNumberString(
        {},
        {
            message:
                'Precisa ser um número com até 30 dígitos antes do ponto, e até 30 dígitos após, enviado em formato String ou vazio para remover',
        }
    )
    @ValidateIf((object, value) => value !== '')
    @Type(() => String)
    valor_realizado_acumulado?: string;

    @IsOptional()
    @IsString()
    @MaxLength(MAX_LENGTH_HTML, {
        message: `O campo 'Análise Qualitativa' deve ter no máximo ${MAX_LENGTH_HTML} caracteres`,
    })
    analise_qualitativa?: string;

    @IsOptional()
    @IsBoolean()
    enviar_para_cp?: boolean;

    /**
     * válido apenas para CP e técnico CP simular o comportamento do envio como se fosse um ponto_focal
     * ou seja, os dados não serão conferidos automaticamente
     **/
    @IsOptional()
    @IsBoolean()
    simular_ponto_focal?: boolean;
}

export class FormulaCompostaAnaliseQualitativaDto extends OmitType(VariavelAnaliseQualitativaDto, [
    'variavel_id',
    'simular_ponto_focal',
    'valor_realizado',
    'valor_realizado_acumulado',
    'data_valor',
]) {
    /**
     * data_ciclo do ciclo, apenas pra conferencia que é o mesmo que foi carregado na tela
     * @example YYYY-MM-DD
     */
    @IsOnlyDate()
    @Transform(DateTransform)
    data_ciclo: Date;

    /**
     * formula_composta_id
     * @example "1"
     */
    @IsNumber()
    formula_composta_id: number;
}

export class VariavelAnaliseQualitativaParaLoteDto extends OmitType(VariavelAnaliseQualitativaDto, [
    'simular_ponto_focal',
]) {}

export class VariavelAnaliseQualitativaEmLoteDto extends PickType(VariavelAnaliseQualitativaDto, [
    'simular_ponto_focal',
]) {
    @ValidateNested({ each: true })
    @Type(() => VariavelAnaliseQualitativaParaLoteDto)
    @IsArray()
    linhas: VariavelAnaliseQualitativaParaLoteDto[];
}

export class VariavelPedidoComplementacaoEmLoteDto {
    @ValidateNested({ each: true })
    @Type(() => VariavelComplementacaoDto)
    @IsArray()
    linhas: VariavelComplementacaoDto[];
}

export class FilterVariavelAnaliseQualitativaDto {
    /**
     * data_valor
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    data_valor: Date;

    /**
     * variavel_id
     * @example "1"
     */
    @IsNumber()
    @Transform(({ value }: any) => +value)
    variavel_id: number;

    /**
     * trazer apenas a analise mais recente?
     * @example "true"
     */
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }: any) => value === 'true')
    apenas_ultima_revisao?: boolean;
}

export class FilterVariavelAnaliseQualitativaUltimaRevisaoDto extends PickType(FilterVariavelAnaliseQualitativaDto, [
    'variavel_id',
]) {
    /**
     * data_valor (required)
     * @example YYYY-MM-DD
     */
    @IsOnlyDate()
    @Transform(DateTransform)
    data_valor: Date;
}

export class FilterVariavelAnaliseQualitativaEmLoteDto {
    @ValidateNested({ each: true })
    @Type(() => FilterVariavelAnaliseQualitativaUltimaRevisaoDto)
    @IsArray()
    linhas: FilterVariavelAnaliseQualitativaUltimaRevisaoDto[];
}

export class DetailAnaliseQualitativaDto {
    analise_qualitativa: string;
    ultima_revisao: boolean;
    criado_em: Date;
    criador: {
        nome_exibicao: string;
    };
    meta_id: number;
    enviado_para_cp: boolean;
    id: number;
}

export class ArquivoVariavelOuFcAnaliseQualitativaDocumentoDto {
    arquivo: ArquivoBaseDto;
    id: number;
    criado_em: Date;
    criador: {
        nome_exibicao: string;
    };
}

export class DetailPedidoComplementacaoDto {
    pedido: string;
    criado_em: Date;
    criador: {
        nome_exibicao: string;
    };
    atendido: boolean;
    id: number;
}

export class MfListVariavelAnaliseQualitativaDto {
    variavel: {
        id: number;
        codigo: string;
        titulo: string;
        unidade_medida: {
            sigla: string;
            descricao: string;
        };
        regiao: {
            id: number;
            descricao: string;
        } | null;
        casas_decimais: number;
        acumulativa: boolean;
        periodicidade: Periodicidade;
    };

    arquivos: ArquivoVariavelOuFcAnaliseQualitativaDocumentoDto[];

    ultimoPedidoComplementacao: DetailPedidoComplementacaoDto | null;
    analises: DetailAnaliseQualitativaDto[];

    ordem_series: Serie[];
    series: MfSerieValorNomimal[];
}

export class MfListVariavelAnaliseQualitativaReducedDto extends OmitType(MfListVariavelAnaliseQualitativaDto, [
    'ordem_series',
    'series',
]) {}

export class MfListVariavelAnaliseQualitativaEmLoteDto {
    linhas: MfListVariavelAnaliseQualitativaReducedDto[];
}

export class VariavelAnaliseQualitativaDocumentoDto {
    /**
     * data_valor
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    data_valor: Date;

    /**
     * variavel_id
     * @example "1"
     */
    @IsNumber()
    variavel_id: number;

    /**
     * Upload do Documento
     */
    @IsString({ message: '$property| upload_token de um arquivo' })
    upload_token: string;
}

export class FilterFormulaCompostaAnaliseQualitativaDto {
    /**
     * data_valor
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    data_ciclo: Date;

    /**
     * formula_composta_id
     * @example "1"
     */
    @IsNumber()
    @Transform(({ value }: any) => +value)
    formula_composta_id: number;

    /**
     * trazer apenas a analise mais recente?
     * @example "true"
     */
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }: any) => value === 'true')
    apenas_ultima_revisao?: boolean;
}

export class MfListFormulaCompostaAnaliseQualitativaDto {
    formula_composta: {
        id: number;
        titulo: string;
    };

    arquivos: ArquivoVariavelOuFcAnaliseQualitativaDocumentoDto[];

    analises: DetailAnaliseQualitativaDto[];
}

export class FormulaCompostaAnaliseQualitativaDocumentoDto {
    /**
     * data_valor
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    data_ciclo: Date;

    /**
     * formula_composta_id
     * @example "1"
     */
    @IsNumber()
    formula_composta_id: number;

    /**
     * Upload do Documento
     */
    @IsString({ message: '$property| upload_token de um arquivo' })
    upload_token: string;
}
