import { ApiProperty, OmitType } from "@nestjs/swagger";
import { Serie } from "@prisma/client";
import { Transform, Type } from "class-transformer";
import { IsBoolean, IsInt, IsNumber, IsNumberString, IsOptional, IsString, ValidateIf } from "class-validator";
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

export class VariavelQtdeDto {
    aguarda_cp: number
    aguarda_complementacao: number
    nao_preenchidas: number
}


export type Status = keyof VariavelQtdeDto

export const ZeroStatuses: Record<Status, number> = { aguarda_complementacao: 0, aguarda_cp: 0, nao_preenchidas: 0 };


export class VariavelComSeries {
    variavel: IdCodTituloDto
    series: MfSeriesAgrupadas[]
}

export class MfSerieValorNomimal extends OmitType(SerieValorNomimal, ['referencia', 'ha_conferencia_pendente']) { }

export class MfSeriesAgrupadas {
    pode_editar: boolean
    aguarda_cp?: boolean
    aguarda_complementacao?: boolean

    /**
     * Data completa do mês de referencia do ciclo
     * @example "2020-01-01"
     */
    periodo: string
    series: MfSerieValorNomimal[]
}

export class AtividadesRetorno {
    indicador: IdCodTituloDto | null
    atividade: IdCodTituloDto
    variaveis: VariavelComSeries[]
    totais: VariavelQtdeDto
}

export class IniciativasRetorno {
    indicador: IdCodTituloDto | null
    iniciativa: IdCodTituloDto
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
        totais: VariavelQtdeDto
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

export class AnaliseQualitativaDto {

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

    @IsBoolean()
    enviar_para_cp: boolean

    @IsInt({ message: 'pdm_id é necessário' })
    pdm_id: number


}