import { IsBoolean, IsNumber, IsOptional, ValidateIf } from 'class-validator';

export class UpdatePdmOrcamentoConfigDto {
    @IsNumber()
    id: number

    @IsOptional()
    @IsBoolean({ message: '$property| valor inválido' })
    @ValidateIf((object, value) => value !== null)
    previsao_custo_disponivel?: boolean

    @IsOptional()
    @IsBoolean({ message: '$property| valor inválido' })
    @ValidateIf((object, value) => value !== null)
    planejado_disponivel?: boolean

    @IsOptional()
    @IsBoolean({ message: '$property| valor inválido' })
    @ValidateIf((object, value) => value !== null)
    execucao_disponivel?: boolean
}