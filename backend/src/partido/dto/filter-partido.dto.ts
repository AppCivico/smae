import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class FilterPartidoDto {
    @IsOptional()
    @IsBoolean({ message: 'Precisa ser um boolean' })
    @Transform(({ value }: any) => value === 'true')
    incluir_removidos?: boolean;
}
