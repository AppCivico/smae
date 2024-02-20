import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, Max, Min, ValidateIf } from 'class-validator';
import { IsOnlyDate } from '../../../common/decorators/IsDateOnly';
import { IdCodTituloRespDto } from './mf-meta.dto';

export class MfEtapaDto {
    /**
     * inicio_real
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    inicio_real?: Date;

    /**
     * termino_real
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    termino_real?: Date;

    @IsOptional()
    @IsNumber()
    @ValidateIf((object, value) => value !== null)
    @Min(0, { message: '$property| Percentual de execução precisa ser positivo ou zero' })
    @Max(100, { message: '$property| Percentual de execução máximo é 100' })
    percentual_execucao?: number;

    @IsOptional()
    @IsString({ each: true })
    @IsArray()
    geolocalizacao: string[];
}

export class AtividadesCronoRetorno {
    atividade: IdCodTituloRespDto;
    cronogramas: number[];
}
export class IniciativasCronoRetorno {
    iniciativa: IdCodTituloRespDto;
    atividades: AtividadesCronoRetorno[];
    cronogramas: number[];
}

export class RetornoMetaCronogramaDto {
    meta: {
        iniciativas: IniciativasCronoRetorno[];
        cronogramas: number[];
        codigo: string;
        titulo: string;
        id: number;
        orgaos_responsaveis: string[];
        orgaos_participantes: string[];
        responsaveis_na_cp: string[];
    } | null;
}
