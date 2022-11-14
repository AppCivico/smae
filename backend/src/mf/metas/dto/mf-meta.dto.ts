import { ApiProperty, OmitType } from "@nestjs/swagger";
import { Periodicidade, Serie, TipoDocumento } from "@prisma/client";
import { Transform, Type } from "class-transformer";
import { IsBoolean, IsNumber, IsNumberString, IsOptional, IsString, ValidateIf } from "class-validator";
import { IsOnlyDate } from "src/common/decorators/IsDateOnly";
import { SerieValorNomimal } from "src/variavel/entities/variavel.entity";

export class FilterMfMetaDto {
    /**
   * Incluir metas pelas etadas do cronograma
   * @example "true"
    */
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }: any) => value === 'true')
    via_cronograma: boolean;

    /**
   * Incluir metas pelas variaveis dos indicadores
   * @example "true"
    */
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }: any) => value === 'true')
    via_variaveis: boolean;
}


export class MfMetaAgrupadaDto {
    grupo: string
    id: number
    titulo: string
    codigo: string
}

export class CicloAtivoDto {
    id: number;
    data_ciclo: Date;
    pdm: {
        id: number;
    };
}

export class RequestInfoDto {
    requestInfo: {
        queryTook: number
    }
}

export class ListMfMetasAgrupadasDto {
    linhas: MfMetaAgrupadaDto[]
    @ApiProperty({ enum: ['Status', 'Fase'] })
    agrupador: string
    perfil: string
    ciclo_ativo: CicloAtivoDto
}

export class MfMetaDto {
    id: number
    titulo: string
    codigo: string
    fase: string
    cronograma: {
        participante: boolean
        status: string
    }
    coleta: {
        participante: boolean
        status: string
    }
    codigo_organizacoes: string[]
}

export class ListMfMetasDto {
    linhas: MfMetaDto[]
    perfil: string
    ciclo_ativo: CicloAtivoDto
}

export class IdCodTituloDto {
    id: number
    codigo: string
    titulo: string
}

export class IdCodTituloRespDto {
    id: number
    codigo: string
    titulo: string

    orgaos_responsaveis: string[]
    orgaos_participantes: string[]
    responsaveis_na_cp: string[]
}


export class VariavelQtdeDto {
    aguarda_cp: number
    aguarda_complementacao: number
    nao_preenchidas: number
    nao_enviadas: number
}


export type Status = keyof VariavelQtdeDto

export class VariavelComSeries {
    variavel: IdCodTituloDto
    series: MfSeriesAgrupadas[]
}

export class MfSerieValorNomimal extends OmitType(SerieValorNomimal, ['referencia', 'ha_conferencia_pendente']) { }

export class MfSeriesAgrupadas {
    eh_corrente: boolean
    pode_editar: boolean
    aguarda_cp?: boolean
    aguarda_complementacao?: boolean
    nao_preenchida?: boolean
    nao_enviada?: boolean

    /**
     * Data completa do mês de referencia do ciclo
     * @example "2020-01-01"
     */
    periodo: string
    series: MfSerieValorNomimal[]
}

export class AtividadesRetorno {
    indicador: IdCodTituloDto | null
    atividade: IdCodTituloRespDto
    variaveis: VariavelComSeries[]
    totais: VariavelQtdeDto
}

export class IniciativasRetorno {
    indicador: IdCodTituloDto | null
    iniciativa: IdCodTituloRespDto
    atividades: AtividadesRetorno[]
    variaveis: VariavelComSeries[]
    totais: VariavelQtdeDto
}

export class RetornoMetaVariaveisDto {
    perfil: string

    meta: {
        indicador: IdCodTituloDto | null
        iniciativas: IniciativasRetorno[]
        variaveis: VariavelComSeries[]
        totais: VariavelQtdeDto,
        codigo: string
        titulo: string
        id: number
        orgaos_responsaveis: string[]
        orgaos_participantes: string[]
        responsaveis_na_cp: string[]
    }

    /**
     * contextualiza qual a ordem que as séries serão apresentadas dentro das series
    * @example "["Previsto", "PrevistoAcumulado", "Realizado", "RealizadoAcumulado"]"
    */
    ordem_series: Serie[]
}

type ColunasAtualizaveis = 'valor_realizado' | 'valor_realizado_acumulado';
export const CamposRealizado: ColunasAtualizaveis[] = ['valor_realizado', 'valor_realizado_acumulado'];
export const CamposRealizadoParaSerie: Record<ColunasAtualizaveis, Serie> = {
    'valor_realizado': 'Realizado',
    'valor_realizado_acumulado': 'RealizadoAcumulado',
};



export class VariavelComplementacaoDto {

    /**
    * data_valor
    * @example YYYY-MM-DD
    */
    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    data_valor: Date


    /**
    * variavel_id
    * @example "1"
    */
    @IsNumber()
    variavel_id: number

    @IsString()
    pedido: string

}

export class VariavelConferidaDto {

    /**
    * data_valor
    * @example YYYY-MM-DD
    */
    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    data_valor: Date


    /**
    * variavel_id
    * @example "1"
    */
    @IsNumber()
    variavel_id: number

}

export class VariavelAnaliseQualitativaDto {

    /**
    * data_valor
    * @example YYYY-MM-DD
    */
    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    data_valor: Date


    /**
    * variavel_id
    * @example "1"
    */
    @IsNumber()
    variavel_id: number

    @IsOptional()
    @IsNumberString({ maxDecimalPlaces: 30 }, { message: "Precisa ser um número com até 30 dígitos antes do ponto, e até 30 dígitos após, enviado em formato String ou vazio para remover" })
    @ValidateIf((object, value) => value !== '')
    valor_realizado?: string

    @IsOptional()
    @IsNumberString({ maxDecimalPlaces: 30 }, { message: "Precisa ser um número com até 30 dígitos antes do ponto, e até 30 dígitos após, enviado em formato String ou vazio para remover" })
    @ValidateIf((object, value) => value !== '')
    valor_realizado_acumulado?: string

    @IsString()
    analise_qualitativa: string

    @IsOptional()
    @IsBoolean()
    enviar_para_cp?: boolean

    /**
     * válido apenas para CP e técnico CP simular o comportamento do envio como se fosse um ponto_focal
     * ou seja, os dados não serão conferidos automaticamente
     **/
    @IsOptional()
    @IsBoolean()
    simular_ponto_focal: boolean


}

export class FilterVariavelAnaliseQualitativaDto {
    /**
    * data_valor
    * @example YYYY-MM-DD
    */
    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    data_valor: Date

    /**
    * variavel_id
    * @example "1"
    */
    @IsNumber()
    @Transform(({ value }: any) => +value)
    variavel_id: number

    /**
   * trazer apenas a analise mais recente?
   * @example "true"
    */
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }: any) => value === 'true')
    apenas_ultima_revisao?: boolean;

}


export class DetailAnaliseQualitativaDto {
    analise_qualitativa: string
    ultima_revisao: boolean
    criado_em: Date
    criador: {
        nome_exibicao: string
    }
    meta_id: number
    enviado_para_cp: boolean
    id: number
}

export class ArquivoVariavelAnaliseQualitativaDocumentoDto {
    arquivo: {
        id: number;
        descricao: string | null;
        tamanho_bytes: number;
        TipoDocumento: TipoDocumento | null;
        nome_original: string;
        download_token?: string
    }
    id: number
    criado_em: Date
    criador: {
        nome_exibicao: string
    }
}

export class DetailPedidoComplementacaoDto {
    pedido: string
    criado_em: Date
    criador: {
        nome_exibicao: string
    }
    atendido: boolean
    id: number
}


export class MfListVariavelAnaliseQualitativaDto {

    variavel: {
        id: number
        codigo: string
        titulo: string
        unidade_medida: {
            sigla: string
            descricao: string
        }
        regiao: {
            id: number
            descricao: string
        } | null
        casas_decimais: number
        acumulativa: boolean
        periodicidade: Periodicidade
    }

    arquivos: ArquivoVariavelAnaliseQualitativaDocumentoDto[]

    ultimoPedidoComplementacao: DetailPedidoComplementacaoDto | null
    analises: DetailAnaliseQualitativaDto[]

    ordem_series: Serie[]
    series: MfSerieValorNomimal[]

}

export class VariavelAnaliseQualitativaDocumentoDto {

    /**
    * data_valor
    * @example YYYY-MM-DD
    */
    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    data_valor: Date


    /**
    * variavel_id
    * @example "1"
    */
    @IsNumber()
    variavel_id: number

    /**
     * Upload do Documento
     */
    @IsString({ message: '$property| upload_token de um arquivo' })
    upload_token: string

}