import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ProcessarThumbnailsQueryDto {
    @ApiPropertyOptional({
        description: 'Filtrar por tipo específico (ICONE_TAG, ICONE_PORTFOLIO, LOGO_PDM, FOTO_PARLAMENTAR)',
        type: String,
        required: false,
    })
    @IsOptional()
    @IsString()
    tipo?: string;

    @ApiPropertyOptional({
        description: 'Reprocessar arquivos que já possuem thumbnail (true/false)',
        type: Boolean,
        required: false,
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    reprocessar?: boolean;
}
