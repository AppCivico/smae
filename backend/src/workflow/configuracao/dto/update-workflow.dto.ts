import { PartialType } from '@nestjs/swagger';
import { CreateWorkflowDto } from './create-workflow.dto';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsInt, IsOptional } from 'class-validator';

export class UpdateWorkflowDto extends PartialType(CreateWorkflowDto) {
    @IsOptional()
    @IsBoolean()
    ativo?: boolean;

    /**
     * IDs de statuses base de distruibuição.
     * @example "[1, 2, 3]"
     */
    @IsOptional()
    @IsArray({
        message: '$property| responsável(eis) na coordenadoria de projetos: precisa ser uma array, campo obrigatório',
    })
    @ArrayMinSize(1, {
        message: '$property| responsável(eis) na coordenadoria de projetos: precisa ter pelo menos um item',
    })
    @ArrayMaxSize(100, {
        message: '$property| responsável(eis) na coordenadoria de projetos: precisa ter no máximo 100 items',
    })
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    distribuicao_statuses_base?: number[];

    /**
     * IDs de statuses customizados de distruibuição.
     * @example "[1, 2, 3]"
     */
    @IsOptional()
    @IsArray({
        message: '$property| responsável(eis) na coordenadoria de projetos: precisa ser uma array, campo obrigatório',
    })
    @ArrayMinSize(1, {
        message: '$property| responsável(eis) na coordenadoria de projetos: precisa ter pelo menos um item',
    })
    @ArrayMaxSize(100, {
        message: '$property| responsável(eis) na coordenadoria de projetos: precisa ter no máximo 100 items',
    })
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    distribuicao_statuses_customizados?: number[];
}
