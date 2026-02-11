import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { RefreshDemandaCacheType } from './create-refresh-demanda.dto';

export class RefreshCacheDto {
    @ApiPropertyOptional({
        enum: RefreshDemandaCacheType,
        description: 'Tipo específico de cache para atualizar. Se omitido, atualiza todos.',
    })
    @IsOptional()
    @IsEnum(RefreshDemandaCacheType)
    tipo?: RefreshDemandaCacheType;

    @ApiPropertyOptional({
        description: 'Força atualização das geocamadas mesmo se cache existir',
    })
    @IsOptional()
    @IsBoolean()
    force_geocamadas?: boolean;
}
