import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { THUMBNAIL_TYPES, ThumbnailTypeConfig } from '../../upload/thumbnail-config';
import { SmaeConfigService } from './smae-config.service';
import { SmaeConfigDto } from './smae-config-dto/smae-config.dto';

interface ThumbnailConfigDto {
    tipo: string;
    width: number;
    height: number;
    quality: number;
    fit: string;
    allowSvg: boolean;
    configKeys: {
        width: string;
        height: string;
        quality: string;
    };
}

interface ThumbnailConfigResponseDto {
    configs: ThumbnailConfigDto[];
}

interface UpdateThumbnailConfigDto {
    width?: number;
    height?: number;
    quality?: number;
}

@ApiTags('Configurações de Thumbnail')
@Controller('smae-config/thumbnail')
export class ThumbnailConfigController {
    constructor(private readonly smaeConfigService: SmaeConfigService) {}

    @Get()
    @ApiBearerAuth('access-token')
    @Roles(['SMAE.sysadmin'])
    async findAll(): Promise<ThumbnailConfigResponseDto> {
        const configs: ThumbnailConfigDto[] = [];

        for (const [tipo, config] of Object.entries(THUMBNAIL_TYPES)) {
            const width = await this.smaeConfigService.getConfigNumberWithDefault(
                config.configKeys.width,
                config.defaultWidth
            );
            const height = await this.smaeConfigService.getConfigNumberWithDefault(
                config.configKeys.height,
                config.defaultHeight
            );
            const quality = await this.smaeConfigService.getConfigNumberWithDefault(
                config.configKeys.quality,
                config.defaultQuality
            );

            configs.push({
                tipo,
                width,
                height,
                quality,
                fit: config.fit,
                allowSvg: config.allowSvg,
                configKeys: config.configKeys,
            });
        }

        return { configs };
    }

    @Get(':tipo')
    @ApiBearerAuth('access-token')
    @Roles(['SMAE.sysadmin'])
    async findOne(@Param('tipo') tipo: string): Promise<ThumbnailConfigDto> {
        const config = THUMBNAIL_TYPES[tipo];
        if (!config) {
            throw new Error(`Tipo de thumbnail inválido: ${tipo}`);
        }

        const width = await this.smaeConfigService.getConfigNumberWithDefault(
            config.configKeys.width,
            config.defaultWidth
        );
        const height = await this.smaeConfigService.getConfigNumberWithDefault(
            config.configKeys.height,
            config.defaultHeight
        );
        const quality = await this.smaeConfigService.getConfigNumberWithDefault(
            config.configKeys.quality,
            config.defaultQuality
        );

        return {
            tipo,
            width,
            height,
            quality,
            fit: config.fit,
            allowSvg: config.allowSvg,
            configKeys: config.configKeys,
        };
    }

    @Patch(':tipo')
    @ApiBearerAuth('access-token')
    @Roles(['SMAE.sysadmin'])
    async update(@Param('tipo') tipo: string, @Body() dto: UpdateThumbnailConfigDto): Promise<SmaeConfigDto[]> {
        const config = THUMBNAIL_TYPES[tipo];
        if (!config) {
            throw new Error(`Tipo de thumbnail inválido: ${tipo}`);
        }

        const results: SmaeConfigDto[] = [];

        if (dto.width !== undefined) {
            const result = await this.smaeConfigService.upsert(config.configKeys.width, String(dto.width));
            results.push(result);
        }

        if (dto.height !== undefined) {
            const result = await this.smaeConfigService.upsert(config.configKeys.height, String(dto.height));
            results.push(result);
        }

        if (dto.quality !== undefined) {
            const result = await this.smaeConfigService.upsert(config.configKeys.quality, String(dto.quality));
            results.push(result);
        }

        return results;
    }
}
