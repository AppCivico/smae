import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class CreateWorkflowfluxoFaseDto {
    @IsInt({ message: '$property| fluxo_id precisa ser um número ou null' })
    @Type(() => Number)
    fluxo_id: number;

    @IsInt({ message: '$property| fase_id precisa ser um número ou null' })
    @Type(() => Number)
    fase_id: number;

    @IsInt({ message: '$property| precisa ser um número' })
    @Max(1000)
    @Min(0)
    @IsOptional()
    ordem: number;

    /**
     * IDs de Workflow Situação
     * @example "[1, 2, 3]"
     */
    @IsArray({
        message: '$property| Situações deve ser um array.',
    })
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    @IsOptional()
    situacao?: number[];

    @IsOptional()
    @IsBoolean({ message: '$property| precisa ser um boolean' })
    marco?: boolean;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    duracao: number;
}
