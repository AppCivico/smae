import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import {
    CreateEnderecoDto,
    FilterCamadasDto,
    GeoLocDto,
    GeoLocDtoByLatLong,
    RetornoCreateEnderecoDto,
    RetornoGeoLoc,
    RetornoGeoLocCamadaFullDto,
} from './entities/geo-loc.entity';
import { GeoLocService } from './geo-loc.service';

@Controller('')
@ApiTags('GeoLocation')
export class GeoLocController {
    constructor(private readonly geoService: GeoLocService) {}

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
}
