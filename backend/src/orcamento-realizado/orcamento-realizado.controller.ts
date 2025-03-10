import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { BatchRecordWithId, RecordWithId } from '../common/dto/record-with-id.dto';
import {
    CreateOrcamentoRealizadoDto,
    FilterOrcamentoRealizadoCompartilhadoDto,
    FilterOrcamentoRealizadoDto,
    ListApenasOrcamentoRealizadoDto,
    ListOrcamentoRealizadoDto,
    PatchOrcamentoRealizadoConcluidoComOrgaoDto,
    PatchOrcamentoRealizadoConcluidoDto,
    UpdateOrcamentoRealizadoDto,
} from './dto/create-orcamento-realizado.dto';
import { OrcamentoRealizadoService } from './orcamento-realizado.service';
import { PlanoSetorialController } from '../pdm/pdm.controller';
import { TipoPDM, TipoPdmType } from '../common/decorators/current-tipo-pdm';

@ApiTags('Orçamento - Realizado')
@Controller('orcamento-realizado')
export class OrcamentoRealizadoController {
    private readonly tipo: TipoPdmType = '_PDM';
    constructor(private readonly orcamentoRealizadoService: OrcamentoRealizadoService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['CadastroMeta.orcamento', 'PDM.tecnico_cp', 'PDM.admin_cp'])
    async create(
        @Body() createMetaDto: CreateOrcamentoRealizadoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.orcamentoRealizadoService.create(this.tipo, createMetaDto, user);
    }

    @Patch('orcamento-concluido')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroMeta.orcamento', 'PDM.tecnico_cp', 'PDM.admin_cp'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async patchProprioOrgaoOrcamentoConcluido(
        @Body() params: PatchOrcamentoRealizadoConcluidoDto,
        @CurrentUser() user: PessoaFromJwt
    ) {
        await this.orcamentoRealizadoService.patchOrcamentoConcluidoProprioOrgao(this.tipo, params, user);
        return '';
    }

    @Patch('orcamento-concluido-admin')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroMeta.orcamento', 'PDM.tecnico_cp', 'PDM.admin_cp'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async patchOrcamentoConcluidoAdmin(
        @Body() params: PatchOrcamentoRealizadoConcluidoComOrgaoDto,
        @CurrentUser() user: PessoaFromJwt
    ) {
        await this.orcamentoRealizadoService.patchOrcamentoConcluidoMetaOrgao(this.tipo, params, user);
        return '';
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroMeta.orcamento', 'PDM.tecnico_cp', 'PDM.admin_cp'])
    async update(
        @Param() params: FindOneParams,
        @Body() createMetaDto: UpdateOrcamentoRealizadoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.orcamentoRealizadoService.update(this.tipo, +params.id, createMetaDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    @Roles(['CadastroMeta.orcamento', 'PDM.tecnico_cp', 'PDM.admin_cp'])
    async findAll(
        @Query() filters: FilterOrcamentoRealizadoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListOrcamentoRealizadoDto> {
        return await this.orcamentoRealizadoService.findAllWithPermissions(this.tipo, filters, user);
    }

    @ApiBearerAuth('access-token')
    @Get('compartilhados-no-pdm')
    @Roles(['CadastroMeta.orcamento', 'PDM.tecnico_cp', 'PDM.admin_cp'])
    async findCompartilhado(
        @Query() filters: FilterOrcamentoRealizadoCompartilhadoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListApenasOrcamentoRealizadoDto> {
        return await this.orcamentoRealizadoService.findCompartilhadosNoPdm(this.tipo, filters, user);
    }

    @Delete('em-lote')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroMeta.orcamento', 'PDM.tecnico_cp', 'PDM.admin_cp'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async removeEmLote(@Body() params: BatchRecordWithId, @CurrentUser() user: PessoaFromJwt) {
        await this.orcamentoRealizadoService.removeEmLote(this.tipo, params, user);
        return '';
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroMeta.orcamento', 'PDM.tecnico_cp', 'PDM.admin_cp'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.orcamentoRealizadoService.remove(this.tipo, +params.id, user);
        return '';
    }
}

@ApiTags('Orçamento - Realizado')
@Controller('plano-setorial-orcamento-realizado')
export class OrcamentoRealizadoPSController {
    // TODO fechar pra só ver o que realmente é PS
    constructor(private readonly orcamentoRealizadoService: OrcamentoRealizadoService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles([...PlanoSetorialController.OrcamentoWritePerms])
    async create(
        @Body() createMetaDto: CreateOrcamentoRealizadoDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<RecordWithId> {
        return await this.orcamentoRealizadoService.create(tipo, createMetaDto, user);
    }

    @Patch('orcamento-concluido')
    @ApiBearerAuth('access-token')
    @Roles([...PlanoSetorialController.OrcamentoWritePerms])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async patchProprioOrgaoOrcamentoConcluido(
        @Body() params: PatchOrcamentoRealizadoConcluidoDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ) {
        await this.orcamentoRealizadoService.patchOrcamentoConcluidoProprioOrgao(tipo, params, user);
        return '';
    }

    @Patch('orcamento-concluido-admin')
    @ApiBearerAuth('access-token')
    @Roles([...PlanoSetorialController.OrcamentoWritePerms])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async patchOrcamentoConcluidoAdmin(
        @Body() params: PatchOrcamentoRealizadoConcluidoComOrgaoDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ) {
        await this.orcamentoRealizadoService.patchOrcamentoConcluidoMetaOrgao(tipo, params, user);
        return '';
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles([...PlanoSetorialController.OrcamentoWritePerms])
    async update(
        @Param() params: FindOneParams,
        @Body() createMetaDto: UpdateOrcamentoRealizadoDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<RecordWithId> {
        return await this.orcamentoRealizadoService.update(tipo, +params.id, createMetaDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    @Roles([...PlanoSetorialController.OrcamentoWritePerms])
    async findAll(
        @Query() filters: FilterOrcamentoRealizadoDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<ListOrcamentoRealizadoDto> {
        return await this.orcamentoRealizadoService.findAllWithPermissions(tipo, filters, user);
    }

    @ApiBearerAuth('access-token')
    @Get('compartilhados-no-pdm')
    @Roles([...PlanoSetorialController.OrcamentoWritePerms])
    async findCompartilhado(
        @Query() filters: FilterOrcamentoRealizadoCompartilhadoDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<ListApenasOrcamentoRealizadoDto> {
        return await this.orcamentoRealizadoService.findCompartilhadosNoPdm(tipo, filters, user);
    }

    @Delete('em-lote')
    @ApiBearerAuth('access-token')
    @Roles([...PlanoSetorialController.OrcamentoWritePerms])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async removeEmLote(
        @Body() params: BatchRecordWithId,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ) {
        await this.orcamentoRealizadoService.removeEmLote(tipo, params, user);
        return '';
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles([...PlanoSetorialController.OrcamentoWritePerms])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt, @TipoPDM() tipo: TipoPdmType) {
        await this.orcamentoRealizadoService.remove(tipo, +params.id, user);
        return '';
    }
}
