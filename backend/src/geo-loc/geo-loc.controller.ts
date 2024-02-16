import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { FilterCamadasDto, GeoLocDto, RetornoGeoLoc, RetornoGeoLocCamadaFullDto } from './entities/geo-loc.entity';
import { GeoLocService } from './geo-loc.service';

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

    @Get('camadas')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    async findCamadas(@Query() dto: FilterCamadasDto): Promise<RetornoGeoLocCamadaFullDto> {
        return { linhas: await this.geoService.buscaCamadas(dto) };
    }
}
