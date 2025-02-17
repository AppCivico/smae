import { OmitType, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';
import { FilterProjetoDto } from 'src/pp/projeto/dto/filter-projeto.dto';
import { NumberTransform } from '../../../auth/transforms/number.transform';
import { IsOnlyDate } from 'src/common/decorators/IsDateOnly';
import { DateTransform } from 'src/auth/transforms/date.transform';

export class CreateRelObrasDto extends OmitType(PartialType(FilterProjetoDto), [
    'eh_prioritario',
    'arquivado',
    'status',
    'portfolio_id',
]) {
    @IsNumber()
    @Transform(NumberTransform)
    portfolio_id: number;

    @IsOptional()
    @IsNumber()
    grupo_tematico_id?: number;

    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    data_termino?: Date;

    @IsOptional()
    @IsNumber()
    orgao_responsavel_id?: number;

    @IsOptional()
    @IsNumber()
    @Transform(NumberTransform)
    projeto_regiao_id?: number;

    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    periodo?: Date;
}
