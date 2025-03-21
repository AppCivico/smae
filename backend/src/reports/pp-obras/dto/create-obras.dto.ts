import { OmitType, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Expose } from 'class-transformer';
import { IsNumber, IsOptional, ValidateIf } from 'class-validator';
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
    @Expose()
    portfolio_id: number;

    @IsOptional()
    @IsNumber()
    @Expose()
    grupo_tematico_id?: number;

    @IsOptional()
    @IsNumber()
    @Expose()
    orgao_responsavel_id?: number;

    @IsOptional()
    @IsNumber()
    @Transform(NumberTransform)
    @Expose()
    projeto_regiao_id?: number;

    @IsOptional()
    @IsOnlyDate()
    @ValidateIf((object, value) => value !== null)
    @Transform(DateTransform)
    @Expose()
    periodo?: Date;
}
