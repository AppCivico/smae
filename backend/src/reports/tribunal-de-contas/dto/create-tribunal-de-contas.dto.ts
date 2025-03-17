import { ApiProperty } from '@nestjs/swagger';
import { TransferenciaTipoEsfera } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { Expose } from 'class-transformer';

export class CreateRelTribunalDeContasDto {
    @IsOptional()
    @ApiProperty({ enum: TransferenciaTipoEsfera, enumName: 'TransferenciaTipoEsfera' })
    @IsEnum(TransferenciaTipoEsfera, {
        message:
            '$property| Precisa ser um dos seguintes valores: ' + Object.values(TransferenciaTipoEsfera).join(', '),
    })
    @Expose()
    esfera?: TransferenciaTipoEsfera;

    @IsOptional()
    @IsNumber()
    @Expose()
    ano_inicio?: number;

    @IsOptional()
    @IsNumber()
    @Expose()
    ano_fim?: number;

    @IsOptional()
    @IsNumber()
    @Expose()
    tipo_id?: number;
}
