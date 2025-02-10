import { Body, Controller, Get, HttpException, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GeoJsonObject } from 'geojson';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { IsPublic } from '../auth/decorators/is-public.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { SmaeConfigService } from '../common/services/smae-config.service';
import {
    CreateEnderecoDto,
    FilterCamadasDto,
    FilterGeoJsonDto,
    GeoLocDto,
    GeoLocDtoByLatLong,
    RetornoCreateEnderecoDto,
    RetornoGeoLoc,
    RetornoGeoLocCamadaFullDto,
} from './entities/geo-loc.entity';
import { GeoLocService } from './geo-loc.service';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('')
@ApiTags('GeoLocation')
export class GeoLocController {
    private secret: string;
    constructor(
        private readonly geoService: GeoLocService,
        private readonly smaeConfig: SmaeConfigService
    ) {}

    async onModuleInit() {
        this.secret = (await this.smaeConfig.getConfig('GEOJSON_SECRET')) ?? '';
    }

    @Post('geolocalizar')
    @ApiBearerAuth('access-token')
    async findGeoLoc(@Body() dto: GeoLocDto): Promise<RetornoGeoLoc> {
        return await this.geoService.geoLoc(dto);
    }

    @Post('geolocalizar-reverso')
    @ApiBearerAuth('access-token')
    async findGeoLocByLatLong(@Body() dto: GeoLocDtoByLatLong): Promise<RetornoGeoLoc> {
        return await this.geoService.findGeoLocByLatLong(dto);
    }

    @Get('camada')
    @ApiBearerAuth('access-token')
    async findCamadas(@Query() dto: FilterCamadasDto): Promise<RetornoGeoLocCamadaFullDto> {
        return { linhas: await this.geoService.buscaCamadas(dto) };
    }

    @Post('geolocalizacao')
    @ApiBearerAuth('access-token')
    async createEndereco(
        @Body() dto: CreateEnderecoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RetornoCreateEnderecoDto> {
        return await this.geoService.createEndereco(dto, user);
    }

    @IsPublic()
    @Get('geojson-collection')
    async geoGeoJsonCollection(
        @Query() filter: FilterGeoJsonDto,
        @Query('secret') secret: string
    ): Promise<GeoJsonObject> {
        if (!secret || !this.secret || secret !== this.secret) {
            throw new HttpException('Invalid Secret', 403);
        }
        return await this.geoService.geoJsonCollection(filter);
    }

    @Patch('camada/simplificar')
    @ApiBearerAuth('access-token')
    @Roles(['SMAE.superadmin'])
    async camadasSimplificar(): Promise<string> {
        await this.geoService.processGeoJsonSimplification();
        return 'OK';
    }
}
