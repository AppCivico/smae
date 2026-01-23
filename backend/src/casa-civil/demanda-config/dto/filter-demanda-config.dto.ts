import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class FilterDemandaConfigDto {
    @IsOptional()
    @IsBoolean({ message: 'apenas_ativo precisa ser um booleano' })
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    apenas_ativo?: boolean;
}
