import { ApiProperty } from '@nestjs/swagger';
import { TransferenciaTipoEsfera } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';

export class CreateRelTribunalDeContasDto {
    @IsOptional()
    @ApiProperty({ enum: TransferenciaTipoEsfera, enumName: 'TransferenciaTipoEsfera' })
    @IsEnum(TransferenciaTipoEsfera, {
        message:
            '$property| Precisa ser um dos seguintes valores: ' + Object.values(TransferenciaTipoEsfera).join(', '),
    })
    esfera?: TransferenciaTipoEsfera;

    @IsOptional()
    @IsNumber()
    ano_inicio?: number;

    @IsOptional()
    @IsNumber()
    ano_fim?: number;

    @IsOptional()
    @IsNumber()
    tipo_id?: number;
}
