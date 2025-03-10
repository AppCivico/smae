import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import {
    CreateOrcamentoPlanejadoDto,
    FilterOrcamentoPlanejadoDto,
    ListOrcamentoPlanejadoDto,
    UpdateOrcamentoPlanejadoDto,
} from './dto/orcamento-planejado.dto';
import { OrcamentoPlanejadoService } from './orcamento-planejado.service';
import { PlanoSetorialController } from '../pdm/pdm.controller';
import { TipoPDM, TipoPdmType } from '../common/decorators/current-tipo-pdm';

@ApiTags('Orçamento - Planejado')
@Controller('orcamento-planejado')
export class OrcamentoPlanejadoController {
    private readonly tipo: TipoPdmType = '_PDM';
    constructor(private readonly orcamentoPlanejadoService: OrcamentoPlanejadoService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['CadastroMeta.orcamento', 'PDM.tecnico_cp', 'PDM.admin_cp'])
    async create(
        @Body() createMetaDto: CreateOrcamentoPlanejadoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.orcamentoPlanejadoService.create(this.tipo, createMetaDto, user);
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroMeta.orcamento', 'PDM.tecnico_cp', 'PDM.admin_cp'])
    async update(
        @Param() params: FindOneParams,
        @Body() createMetaDto: UpdateOrcamentoPlanejadoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.orcamentoPlanejadoService.update(this.tipo, +params.id, createMetaDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    @Roles(['CadastroMeta.orcamento', 'PDM.tecnico_cp', 'PDM.admin_cp'])
    async findAll(
        @Query() filters: FilterOrcamentoPlanejadoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListOrcamentoPlanejadoDto> {
        return {
            linhas: await this.orcamentoPlanejadoService.findAll(this.tipo, filters, user),
        };
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroMeta.orcamento', 'PDM.tecnico_cp', 'PDM.admin_cp'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.orcamentoPlanejadoService.remove(this.tipo, +params.id, user);
        return '';
    }
}

@ApiTags('Orçamento - Planejado')
@Controller('plano-setorial-orcamento-planejado')
export class OrcamentoPlanejadoPSController {
    constructor(private readonly orcamentoPlanejadoService: OrcamentoPlanejadoService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles([...PlanoSetorialController.OrcamentoWritePerms])
    async create(
        @Body() createMetaDto: CreateOrcamentoPlanejadoDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<RecordWithId> {
        return await this.orcamentoPlanejadoService.create(tipo, createMetaDto, user);
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles([...PlanoSetorialController.OrcamentoWritePerms])
    async update(
        @Param() params: FindOneParams,
        @Body() createMetaDto: UpdateOrcamentoPlanejadoDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<RecordWithId> {
        return await this.orcamentoPlanejadoService.update(tipo, +params.id, createMetaDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    @Roles([...PlanoSetorialController.OrcamentoWritePerms])
    async findAll(
        @Query() filters: FilterOrcamentoPlanejadoDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<ListOrcamentoPlanejadoDto> {
        return {
            linhas: await this.orcamentoPlanejadoService.findAll(tipo, filters, user),
        };
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles([...PlanoSetorialController.OrcamentoWritePerms])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt, @TipoPDM() tipo: TipoPdmType) {
        await this.orcamentoPlanejadoService.remove(tipo, +params.id, user);
        return '';
    }
}
