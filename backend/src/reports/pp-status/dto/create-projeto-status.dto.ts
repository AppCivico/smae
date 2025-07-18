import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { TipoProjeto } from '@prisma/client';
import { Transform } from 'class-transformer';
import { Expose } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { IsOnlyDate } from 'src/common/decorators/IsDateOnly';
import { DateTransform } from '../../../auth/transforms/date.transform';
import { NumberTransformOrUndef } from '../../../auth/transforms/number.transform';

export class CreateRelProjetoStatusDto {
    @IsOptional()
    @IsEnum(TipoProjeto)
    @ApiHideProperty()
    @Expose()
    tipo_pdm?: TipoProjeto = 'PP';

    @IsInt()
    @Transform(NumberTransformOrUndef)
    @Expose()
    portfolio_id: number;

    @IsInt()
    @IsOptional()
    @Transform(NumberTransformOrUndef)
    @Expose()
    projeto_id?: number;

    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @Expose()
    periodo_inicio?: Date | null;

    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @Expose()
    periodo_fim?: Date | null;
}

export class CreateRelObraStatusDto extends CreateRelProjetoStatusDto {
    @IsInt()
    @IsOptional()
    @Transform(({ value }: any) => +value)
    @ApiProperty({ description: 'Id da obra' })
    declare projeto_id?: number; // reaplicado só pra falar que é o id da obra
}
