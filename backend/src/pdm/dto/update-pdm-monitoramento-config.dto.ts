import { Type } from 'class-transformer';
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsInt,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
    ValidateNested,
} from 'class-validator';
import { MAX_LENGTH_DEFAULT } from 'src/common/consts';

export class MonitoramentoBlocoConfigDto {
    /**
     * Ordem do bloco dentro da fase (1..5). Identidade estável entre edições.
     */
    @IsInt({ message: 'ordem precisa ser um número inteiro' })
    @Min(1, { message: 'ordem precisa ser >= 1' })
    @Max(5, { message: 'ordem precisa ser <= 5' })
    ordem: number;

    @IsBoolean({ message: 'habilitado precisa ser um booleano' })
    habilitado: boolean;

    @IsString({ message: 'rotulo precisa ser uma string' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `rotulo deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    rotulo: string;
}

export class MonitoramentoFaseConfigDto {
    /**
     * Ordem da fase (1..4). Identidade estável entre edições.
     */
    @IsInt({ message: 'ordem precisa ser um número inteiro' })
    @Min(1, { message: 'ordem precisa ser >= 1' })
    @Max(4, { message: 'ordem precisa ser <= 4' })
    ordem: number;

    @IsBoolean({ message: 'habilitada precisa ser um booleano' })
    habilitada: boolean;

    @IsString({ message: 'rotulo precisa ser uma string' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `rotulo deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    rotulo: string;

    /**
     * Quando true, a fase é de tags e NÃO pode ter blocos de texto (validado no servidor).
     * Quando false, a fase é de texto e os blocos abaixo se aplicam.
     */
    @IsBoolean({ message: 'aceita_tags precisa ser um booleano' })
    aceita_tags: boolean;

    @IsBoolean({ message: 'aceita_anexos precisa ser um booleano' })
    aceita_anexos: boolean;

    /**
     * Blocos de texto da fase (até 5). Obrigatório (>= 1) quando aceita_tags=false; vazio quando aceita_tags=true.
     */
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(5, { message: 'uma fase pode ter no máximo 5 blocos' })
    @ValidateNested({ each: true })
    @Type(() => MonitoramentoBlocoConfigDto)
    blocos?: MonitoramentoBlocoConfigDto[];
}

export class UpdatePdmMonitoramentoConfigDto {
    /**
     * Fases do monitoramento do ciclo físico (1 a 4).
     */
    @IsArray()
    @ArrayMinSize(1, { message: 'precisa ter pelo menos uma fase' })
    @ArrayMaxSize(4, { message: 'precisa ter no máximo 4 fases' })
    @ValidateNested({ each: true })
    @Type(() => MonitoramentoFaseConfigDto)
    fases: MonitoramentoFaseConfigDto[];
}
