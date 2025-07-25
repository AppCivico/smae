import { PickType } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsNumber, IsOptional, ValidateIf } from 'class-validator';
import { DateTransform } from 'src/auth/transforms/date.transform';
import { IsOnlyDate } from 'src/common/decorators/IsDateOnly';
import { FilterProjetoDto } from 'src/pp/projeto/dto/filter-projeto.dto';

export class CreateRelObrasDto extends PickType(FilterProjetoDto, ['orgao_responsavel_id', 'projeto_id']) {
    @IsNumber()
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
    @Expose()
    projeto_regiao_id?: number;

    @IsOptional()
    @IsOnlyDate()
    @ValidateIf((object, value) => value !== null)
    @Transform(DateTransform)
    @Expose()
    periodo?: Date;
}
