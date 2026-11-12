import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { TipoPDM, TipoPdmType } from '../common/decorators/current-tipo-pdm';
import { FindOneParams, FindTwoParams } from '../common/decorators/find-params';
import { MetaSetorialController } from '../meta/meta.controller';
import { FilterPdmCiclo, FilterPsCiclo, ReaberturaDto, UpdatePdmCicloDto } from './dto/update-pdm-ciclo.dto';
import { ListPdmCicloDto, ListPdmCicloV2Dto, ListPSCicloDto } from './entities/pdm-ciclo.entity';
import { PdmCicloService } from './pdm-ciclo.service';
import { PsCicloFaseService } from './ps-ciclo-fase.service';

@Controller('pdm-ciclo')
@ApiTags('PDM - Ciclo físico')
export class PdmCicloController {
    constructor(private readonly pdmCicloService: PdmCicloService) {}

    @Get()
    @ApiBearerAuth('access-token')
    @Roles(['CadastroPdm.editar', 'PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal'])
    async findAll(@Query() params: FilterPdmCiclo): Promise<ListPdmCicloDto> {
        return { linhas: await this.pdmCicloService.findAll(params) };
    }

    @Get('v2')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroPdm.editar', 'PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal'])
    async findAllV2(@Query() params: FilterPdmCiclo): Promise<ListPdmCicloV2Dto> {
        return { linhas: await this.pdmCicloService.findAllV2(params) };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroPdm.editar'])
    @ApiResponse({ description: 'sucesso ao atualizar', status: 204 })
    @HttpCode(HttpStatus.NO_CONTENT)
    async update(@Param() params: FindOneParams, @Body() dto: UpdatePdmCicloDto) {
        await this.pdmCicloService.update(params.id, dto);
        return null;
    }
}

@Controller('plano-setorial')
@ApiTags('Plano Setorial / Programa de Metas - Ciclo físico')
export class PsCicloController {
    constructor(private readonly psCicloFaseService: PsCicloFaseService) {}

    @Get(':id/ciclo')
    @ApiBearerAuth('access-token')
    @Roles(MetaSetorialController.ReadPerm)
    async findAll(
        @Param() params: FindOneParams,
        @Query() dto: FilterPsCiclo,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<ListPSCicloDto> {
        return await this.psCicloFaseService.listaCiclos(tipo, params.id, { ...dto }, user);
    }

    @Post(':id/ciclo/:id2/reabrir')
    @ApiBearerAuth('access-token')
    @Roles(MetaSetorialController.WritePerm)
    async reabrirMetaFechamento(
        @Param() params: FindTwoParams,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType,
        @Body() dto: ReaberturaDto
    ): Promise<void> {
        return await this.psCicloFaseService.reabre(tipo, +params.id, +params.id2, dto.meta_id, user);
    }
}
