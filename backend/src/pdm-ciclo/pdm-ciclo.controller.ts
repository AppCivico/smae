import { Controller, Get, Query } from '@nestjs/common';
import { PdmCicloService } from './pdm-ciclo.service';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ListPdmCicloDto, ListPdmCicloV2Dto } from 'src/pdm-ciclo/entities/pdm-ciclo.entity';
import { FilterPdmCiclo, UpdatePdmCicloDto } from './dto/update-pdm-ciclo.dto';

@Controller('pdm-ciclo')
@ApiTags('PDM - Ciclo físico')
export class PdmCicloController {
    constructor(private readonly pdmCicloService: PdmCicloService) { }

    @Get()
    @ApiBearerAuth('access-token')
    @Roles('CadastroPdm.editar', 'PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal')
    async findAll(
        @Query() params: FilterPdmCiclo,
    ): Promise<ListPdmCicloDto> {
        return { linhas: await this.pdmCicloService.findAll(params) };
    }

    @Get('v2')
    @ApiBearerAuth('access-token')
    @Roles('CadastroPdm.editar', 'PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal')
    async findAllV2(
        @Query() params: FilterPdmCiclo,
    ): Promise<ListPdmCicloV2Dto> {
        return { linhas: await this.pdmCicloService.findAllV2(params) };
    }


    @ApiBearerAuth('access-token')
    @Roles('CadastroPdm.editar')
    update(id: number, updatePdmCicloDto: UpdatePdmCicloDto) {
        return `This action updates a #${id} pdmCiclo`;
    }

}
