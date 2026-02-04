import { Controller, Get, NotFoundException, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsPublic } from '../../auth/decorators/is-public.decorator';
import { CacheKVService } from '../../common/services/cache-kv.service';
import {
    PublicDemandaDetailDto,
    PublicDemandaFullDto,
    PublicDemandaSummaryDto,
    PublicGeocamadasDto,
} from './entities/public-demanda.entity';

@ApiTags('Publico - Demandas')
@Controller('public/demandas')
export class PublicDemandaController {
    constructor(private readonly cacheKvService: CacheKVService) {}

    @Get('geocamadas')
    @IsPublic()
    async getGeocamadas(): Promise<PublicGeocamadasDto> {
        const cached = await this.cacheKvService.get<PublicGeocamadasDto>('demandas:geocamadas');
        if (!cached) {
            throw new NotFoundException('Cache de geocamadas nao disponivel');
        }
        return cached.valor;
    }

    @Get('summary')
    @IsPublic()
    async getSummary(): Promise<PublicDemandaSummaryDto> {
        const cached = await this.cacheKvService.get<PublicDemandaSummaryDto>('demandas:summary');
        if (!cached) {
            throw new NotFoundException('Cache de resumo nao disponivel');
        }
        return cached.valor;
    }

    @Get('all')
    @IsPublic()
    async getAll(): Promise<PublicDemandaFullDto> {
        const cached = await this.cacheKvService.get<PublicDemandaFullDto>('demandas:full');
        if (!cached) {
            throw new NotFoundException('Cache completo nao disponivel');
        }
        return cached.valor;
    }

    @Get(':id')
    @IsPublic()
    async getOne(@Param('id', ParseIntPipe) id: number): Promise<PublicDemandaDetailDto> {
        const cached = await this.cacheKvService.get<PublicDemandaDetailDto | { deleted: boolean }>(`demandas:${id}`);

        if (!cached) {
            throw new NotFoundException('Demanda nao encontrada');
        }

        if ('deleted' in cached.valor && cached.valor.deleted) {
            throw new NotFoundException('Demanda nao esta mais publicada');
        }

        return cached.valor as PublicDemandaDetailDto;
    }
}
