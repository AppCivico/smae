import { Type } from 'class-transformer';
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsInt,
    IsNumber,
    IsOptional,
    ValidateNested,
} from 'class-validator';

export class UpdatePdmOrcamentoConfigDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PdmOrcamentoConfig)
    orcamento_config: PdmOrcamentoConfig[];
}

export class PdmOrcamentoConfig {
    @IsNumber()
    id: number;

    @IsOptional()
    @IsBoolean({ message: 'valor inválido' })
    previsao_custo_disponivel?: boolean;

    @IsOptional()
    @IsBoolean({ message: 'valor inválido' })
    planejado_disponivel?: boolean;

    @IsOptional()
    @IsBoolean({ message: 'valor inválido' })
    execucao_disponivel?: boolean;

    @IsOptional()
    @ArrayMinSize(1, { message: 'precisa ter pelo menos um item' })
    @ArrayMaxSize(12, { message: 'precisa ter no máximo 12 items' })
    @IsInt({ each: true, message: 'valor inválido' })
    execucao_disponivel_meses?: number[];
}
