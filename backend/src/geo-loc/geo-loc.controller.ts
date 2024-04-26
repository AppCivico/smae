import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import {
    CreateEnderecoDto,
    FilterCamadasDto,
    GeoLocDto,
    GeoLocDtoByLotLong,
    RetornoCreateEnderecoDto,
    RetornoGeoLoc,
    RetornoGeoLocCamadaFullDto,
} from './entities/geo-loc.entity';
import { GeoLocService } from './geo-loc.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { IsPublic } from '../auth/decorators/is-public.decorator';

@Controller('')
@ApiTags('GeoLocation')
export class GeoLocController {
    constructor(private readonly geoService: GeoLocService) {}

    @Post('geolocalizar')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    async findGeoLoc(@Body() dto: GeoLocDto): Promise<RetornoGeoLoc> {
        return await this.geoService.geoLoc(dto);
    }

    @Post('geolocalizar-reverso')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    async findGeoLocByLotLong(@Body() dto: GeoLocDtoByLotLong): Promise<RetornoGeoLoc> {
        return await this.geoService.findGeoLocByLotLong(dto);
    }

    @Get('camada')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    async findCamadas(@Query() dto: FilterCamadasDto): Promise<RetornoGeoLocCamadaFullDto> {
        return { linhas: await this.geoService.buscaCamadas(dto) };
    }

    @Post('geolocalizacao')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    async createEndereco(
        @Body() dto: CreateEnderecoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RetornoCreateEnderecoDto> {
        return await this.geoService.createEndereco(dto, user);
    }
}
