import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FonteRelatorio } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class FilterRelatorioModeloDto {
    /** Filtra os modelos de uma fonte específica. */
    @IsOptional()
    @ApiPropertyOptional({ enum: FonteRelatorio, enumName: 'FonteRelatorio' })
    @IsEnum(FonteRelatorio, {
        message: 'fonte precisa ser um dos seguintes valores: ' + Object.values(FonteRelatorio).join(', '),
    })
    fonte?: FonteRelatorio;
}

export class FilterColunasRelatorioDto {
    /** Fonte cujas colunas declaradas serão listadas. */
    @ApiProperty({ enum: FonteRelatorio, enumName: 'FonteRelatorio' })
    @IsEnum(FonteRelatorio, {
        message: 'fonte precisa ser um dos seguintes valores: ' + Object.values(FonteRelatorio).join(', '),
    })
    fonte: FonteRelatorio;
}
