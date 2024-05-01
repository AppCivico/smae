import { Transform } from 'class-transformer';
import { DateTransform } from '../../auth/transforms/date.transform';
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
    @Transform(DateTransform)
    periodo: Date;
}
