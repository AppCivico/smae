import { ApiProperty } from '@nestjs/swagger';
import { TransferenciaTipoEsfera } from '@prisma/client';
import { Expose } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';

export class CreateRelTransferenciasOrcamentoDto {
    @IsOptional()
    @ApiProperty({ enum: TransferenciaTipoEsfera, enumName: 'TransferenciaTipoEsfera' })
    @IsEnum(TransferenciaTipoEsfera, {
        message: 'Precisa ser um dos seguintes valores: ' + Object.values(TransferenciaTipoEsfera).join(', '),
    })
    @Expose()
    esfera?: TransferenciaTipoEsfera;

    @IsOptional()
    @IsNumber()
    @Expose()
    tipo_id?: number;

    /** ano de referência da execução orçamentária, inclusivo */
    @IsOptional()
    @IsNumber()
    @Expose()
    ano_inicio?: number;

    /** ano de referência da execução orçamentária, inclusivo */
    @IsOptional()
    @IsNumber()
    @Expose()
    ano_fim?: number;
}
