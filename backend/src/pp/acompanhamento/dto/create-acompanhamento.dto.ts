import { Type } from "class-transformer"
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsOptional, IsString, ValidateIf } from "class-validator"
import { IsOnlyDate } from "src/common/decorators/IsDateOnly"

export class CreateProjetoAcompanhamentoDto {
    @IsOnlyDate()
    @Type(() => Date)
    @ValidateIf((object, value) => value !== null)
    data_registro: Date

    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    @ValidateIf((object, value) => value !== null)
    prazo_encaminhamento?: Date

    @IsOptional()
    @IsOnlyDate()
    @Type(() => Date)
    @ValidateIf((object, value) => value !== null)
    prazo_realizado?: Date

    @IsString()
    participantes: string

    @IsOptional()
    @IsString()
    detalhamento?: string

    @IsOptional()
    @IsString()
    encaminhamento?: string

    @IsOptional()
    @IsString()
    responsavel?: string

    @IsOptional()
    @IsString()
    observacao?: string

    @IsOptional()
    @IsString()
    detalhamento_status?: string

    @IsOptional()
    @IsString()
    pontos_atencao?: string

    //@IsOptional()
    //@IsString()
    //risco_tarefa_outros?: string

    /**
     * enviar array dos ids dos projeto-risco-id array vazia ou nulo para remover
     * @example "[]"
    */
    @IsOptional()
    @IsArray({ message: '$property| risco(s): precisa ser uma array ou.' })
    @ArrayMinSize(0, { message: '$property| risco(s): precisa ter pelo menos um item' })
    @ArrayMaxSize(100, { message: '$property| risco(s): precisa ter no máximo 100 items' })
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    @ValidateIf((object, value) => value !== null)
    risco?: number[] | null;

}
