import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';
import { IsOnlyDate } from 'src/common/decorators/IsDateOnly';

export class CreateRelProjetoStatusDto {
    @IsInt()
    @Transform(({ value }: any) => +value)
    portfolio_id: number;

    @IsInt()
    @IsOptional()
    @Transform(({ value }: any) => +value)
    projeto_id?: number;

    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    periodo_inicio?: Date;

    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    periodo_fim?: Date;
}
