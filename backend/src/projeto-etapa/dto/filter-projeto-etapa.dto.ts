import { Transform } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';
import { NumberTransformOrUndef } from 'src/auth/transforms/number.transform';

export class FilterProjetoEtapaDto {
    @IsOptional()
    @IsNumber()
    @Transform(NumberTransformOrUndef)
    portfolio_id?: number;
}
