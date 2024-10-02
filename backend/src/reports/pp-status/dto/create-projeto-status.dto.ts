import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { TipoProjeto } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { IsOnlyDate } from 'src/common/decorators/IsDateOnly';
import { DateTransform } from '../../../auth/transforms/date.transform';

export class CreateRelProjetoStatusDto {
    @IsOptional()
    @IsEnum(TipoProjeto)
    @ApiHideProperty()
    tipo_pdm?: TipoProjeto = 'PP';

    @IsInt()
    @Transform(({ value }: any) => +value)
    portfolio_id: number;

    @IsInt()
    @IsOptional()
    @Transform(({ value }: any) => +value)
    projeto_id?: number;

    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    periodo_inicio?: Date | null;

    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    periodo_fim?: Date | null;
}

export class CreateRelObraStatusDto extends CreateRelProjetoStatusDto {
    @IsInt()
    @IsOptional()
    @Transform(({ value }: any) => +value)
    @ApiProperty({ description: 'Id da obra' })
    projeto_id?: number;
}
