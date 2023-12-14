import { IsString } from 'class-validator';
import { IsOnlyDate } from '../../common/decorators/IsDateOnly';
import { Type } from 'class-transformer';

export class PeriodoFormulaCompostaDto {
    periodo: string;
    /**
     * número de variaveis nesse periodo
     ***/
    variaveis: number;
}

export class ListaPeriodoFormulaCompostaDto {
    linhas: PeriodoFormulaCompostaDto[];
}

export class FilterPeriodoFormulaCompostaDto {
    @IsOnlyDate()
    @Type(() => Date)
    periodo: Date;
}
