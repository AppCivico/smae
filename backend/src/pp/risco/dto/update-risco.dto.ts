import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { StatusRisco } from 'src/generated/prisma/client';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { CreateRiscoDto } from './create-risco.dto';

export class UpdateRiscoDto extends OmitType(PartialType(CreateRiscoDto), []) {
    @IsOptional()
    @IsNumber()
    codigo: number | undefined;

    /**
     * StatusRisco
     * @example SemInformacao
     * */
    @ApiProperty({ enum: StatusRisco, enumName: 'StatusRisco' })
    @IsEnum(StatusRisco, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(StatusRisco).join(', '),
    })
    @IsOptional()
    status?: StatusRisco;
}
