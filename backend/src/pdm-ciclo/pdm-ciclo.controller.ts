import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Query } from '@nestjs/common';
import { PdmCicloService } from './pdm-ciclo.service';

import { ApiBearerAuth, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { ListPdmCicloDto, ListPdmCicloV2Dto } from './entities/pdm-ciclo.entity';
import { FilterPdmCiclo, UpdatePdmCicloDto } from './dto/update-pdm-ciclo.dto';
import { FindOneParams } from '../common/decorators/find-params';

@Controller('pdm-ciclo')
@ApiTags('PDM - Ciclo físico')
export class PdmCicloController {
    constructor(private readonly pdmCicloService: PdmCicloService) {}

    @Get()
    @ApiBearerAuth('access-token')
    @Roles('CadastroPdm.editar', 'PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal')
    @ApiUnauthorizedResponse()
    async findAll(@Query() params: FilterPdmCiclo): Promise<ListPdmCicloDto> {
        return { linhas: await this.pdmCicloService.findAll(params) };
    }

    @Get('v2')
    @ApiBearerAuth('access-token')
    @Roles('CadastroPdm.editar', 'PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal')
    @ApiUnauthorizedResponse()
    async findAllV2(@Query() params: FilterPdmCiclo): Promise<ListPdmCicloV2Dto> {
        return { linhas: await this.pdmCicloService.findAllV2(params) };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles('CadastroPdm.editar')
    @ApiUnauthorizedResponse()
    @ApiResponse({ description: 'sucesso ao atualizar', status: 204 })
    @HttpCode(HttpStatus.NO_CONTENT)
    async update(@Param() params: FindOneParams, @Body() dto: UpdatePdmCicloDto) {
        await this.pdmCicloService.update(params.id, dto);
        return null;
    }
}
