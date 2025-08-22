import { PickType } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsInt, IsOptional, ValidateIf } from 'class-validator';
import { DateTransform } from 'src/auth/transforms/date.transform';
import { IsOnlyDate } from 'src/common/decorators/IsDateOnly';
import { FilterProjetoDto } from 'src/pp/projeto/dto/filter-projeto.dto';

export class CreateRelObrasDto extends PickType(FilterProjetoDto, ['projeto_id']) {
    @IsInt()
    @Expose()
    portfolio_id: number;

    @IsOptional()
    @IsInt()
    @Expose()
    grupo_tematico_id?: number;

    @IsOptional()
    @IsInt()
    @Expose()
    orgao_responsavel_id?: number ;

    @IsOptional()
    @IsInt()
    @Expose()
    regiao_id?: number | undefined;

    @IsOptional()
    @IsOnlyDate()
    @ValidateIf((object, value) => value !== null)
    @Transform(DateTransform)
    @Expose()
    periodo?: Date;
}
