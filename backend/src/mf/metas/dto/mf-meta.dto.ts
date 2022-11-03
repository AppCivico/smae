import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsOptional } from "class-validator";

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

export class AtividadesRetorno {

    indicador: IdCodTituloDto | null
    atividade: IdCodTituloDto
}

export class IniciativasRetorno {

    indicador: IdCodTituloDto | null
    iniciativa: IdCodTituloDto
    atividades: AtividadesRetorno[]
}

export type Niveis = 'meta' | 'iniciativa' | 'atividade'
export type Status = keyof VariavelQtdeDto

export const ZeroStatuses: Record<Status, number> = { aguarda_complementacao: 0, aguarda_cp: 0, nao_preenchidas: 0 };

export type StatusPorNivel = Record<Niveis, VariavelQtdeDto>

export class RetornoMetaVariaveisDto {
    perfil: string

    variaveis: {
        indicador: IdCodTituloDto | null
        iniciativas: IniciativasRetorno[]
    }

    status_por_nivel: StatusPorNivel
}