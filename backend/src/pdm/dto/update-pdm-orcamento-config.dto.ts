import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsOptional, ValidateIf, ValidateNested } from 'class-validator';

export class UpdatePdmOrcamentoConfigDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PdmOrcamentoConfig)
    orcamento_config: PdmOrcamentoConfig[]
}

export class PdmOrcamentoConfig {
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