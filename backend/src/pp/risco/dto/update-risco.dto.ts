import { ApiProperty, OmitType, PartialType } from "@nestjs/swagger";
import { StatusRisco } from "@prisma/client";
import { IsEnum, IsOptional } from "class-validator";
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
}