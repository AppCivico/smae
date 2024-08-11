import { OmitType } from '@nestjs/swagger';
import { Periodicidade } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsString } from 'class-validator';
import { DateTransform } from '../../auth/transforms/date.transform';
import { IsOnlyDate } from '../../common/decorators/IsDateOnly';
import { IdSiglaDescricao } from '../../common/dto/IdSigla.dto';
import { CreateIndicadorFormulaCompostaDto } from '../../indicador/dto/create-indicador.formula-composta.dto';
import { IndicadorFormulaCompostaDto } from '../../indicador/entities/indicador.formula-composta.entity';

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

export class PSFormulaCompostaDto extends OmitType(IndicadorFormulaCompostaDto, ['indicador_origem']) {
    casas_decimais: number;
    periodicidade: Periodicidade | null;
    regionalizavel: boolean;
    inicio_medicao: Date | null;
    fim_medicao: Date | null;
    orgao: IdSiglaDescricao | null;
    codigo: string | null;
}

export class ListaPSFormulaCompostaDto {
    linhas: PSFormulaCompostaDto[];
}

export class CreatePSFormulaCompostaDto extends CreateIndicadorFormulaCompostaDto {
    @IsInt()
    orgao_id: number;

    @IsInt()
    casas_decimais: number;

    @IsString()
    @IsEnum(Periodicidade)
    periodicidade: Periodicidade;

    @IsBoolean()
    regionalizavel: boolean;

    @IsOnlyDate()
    @Transform(DateTransform)
    inicio_medicao: Date;

    @IsOnlyDate()
    @Transform(DateTransform)
    fim_medicao: Date | null;
}
