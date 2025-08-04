import { IsArray, IsEnum, IsOptional, ValidateIf } from 'class-validator';
import { IsOnlyDate } from '../../../common/decorators/IsDateOnly';
import { Transform } from 'class-transformer';
import { DateTransform } from '../../../auth/transforms/date.transform';
import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TransferenciaTipoEsfera } from 'src/generated/prisma/client';

export class CreateCasaCivilAtividadesPendentesFilterDto {
    @IsOptional()
    @IsArray({ message: '$property| tipo_id: precisa ser uma array.' })
    @Expose()
    tipo_id?: number[];

    @IsOptional()
    @Transform(DateTransform)
    @IsOnlyDate()
    @ValidateIf((object, value) => value !== null)
    @Expose()
    data_inicio?: Date;

    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    @Expose()
    data_termino?: Date;

    @Expose()
    @IsOptional()
    @ApiProperty({ enum: TransferenciaTipoEsfera, enumName: 'TransferenciaTipoEsfera' })
    @IsEnum(TransferenciaTipoEsfera, { message: '$property| esfera: valor inválido.' })
    esfera?: TransferenciaTipoEsfera;

    @IsOptional()
    @IsArray({ message: '$property| orgao_id: precisa ser uma array.' })
    @Expose()
    orgao_id?: number[];
}
