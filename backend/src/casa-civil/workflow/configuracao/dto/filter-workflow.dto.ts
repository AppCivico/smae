import { Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class FilterWorkflowDto {
    @IsOptional()
    @IsBoolean({ message: '$property| Precisa ser um boolean' })
    @Transform(({ value }: any) => value === 'true')
    ativo?: boolean;

    @IsOptional()
    @IsNumber()
    transferencia_tipo_id?: number;
}

export class FilterWorkflowEtapaDto {
    @IsOptional()
    @IsBoolean({ message: '$property| Precisa ser um boolean' })
    @Transform(({ value }: any) => value === 'true')
    incluir_removidas?: boolean;
}
