import { ApiProperty, OmitType, PartialType } from "@nestjs/swagger";
import { StatusRisco } from "@prisma/client";
import { IsArray, IsEnum, IsInt, IsOptional, IsString } from "class-validator";
import { CreateRiscoDto } from "./create-risco.dto";

export class UpdateRiscoDto extends OmitType(PartialType(CreateRiscoDto), []) {
    /**
     * StatusRisco
     * @example SemInformacao
     * */
    @ApiProperty({ enum: StatusRisco, enumName: 'StatusRisco' })
    @IsEnum(StatusRisco, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(StatusRisco).join(', '),
    })
    @IsOptional()
    status?: StatusRisco

    @IsArray()
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    @IsOptional()
    tarefa_id?: number[]

    @IsOptional()
    @IsString()
    risco_tarefa_outros?: string
}