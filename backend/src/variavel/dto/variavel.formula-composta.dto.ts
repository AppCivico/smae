import { Type } from 'class-transformer';
import { IsOnlyDate } from '../../common/decorators/IsDateOnly';

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
