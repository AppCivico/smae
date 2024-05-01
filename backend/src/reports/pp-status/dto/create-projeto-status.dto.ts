import { Transform } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';
import { IsOnlyDate } from 'src/common/decorators/IsDateOnly';
import { DateTransform } from '../../../auth/transforms/date.transform';

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
    @Transform(DateTransform)
    periodo_inicio?: Date | null;

    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    periodo_fim?: Date | null;
}
