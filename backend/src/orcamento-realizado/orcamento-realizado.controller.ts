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

@ApiTags('Orçamento - Realizado')
@Controller('orcamento-realizado')
export class OrcamentoRealizadoController {
    constructor(private readonly orcamentoRealizadoService: OrcamentoRealizadoService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['CadastroMeta.orcamento', 'PDM.tecnico_cp', 'PDM.admin_cp'])
    async create(
        @Body() createMetaDto: CreateOrcamentoRealizadoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.orcamentoRealizadoService.create(createMetaDto, user);
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
        await this.orcamentoRealizadoService.patchOrcamentoConcluidoProprioOrgao(params, user);
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
        await this.orcamentoRealizadoService.patchOrcamentoConcluidoMetaOrgao(params, user);
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
        return await this.orcamentoRealizadoService.update(+params.id, createMetaDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    @Roles(['CadastroMeta.orcamento', 'PDM.tecnico_cp', 'PDM.admin_cp'])
    async findAll(
        @Query() filters: FilterOrcamentoRealizadoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListOrcamentoRealizadoDto> {
        return await this.orcamentoRealizadoService.findAllWithPermissions(filters, user);
    }

    @ApiBearerAuth('access-token')
    @Get('compartilhados-no-pdm')
    @Roles(['CadastroMeta.orcamento', 'PDM.tecnico_cp', 'PDM.admin_cp'])
    async findCompartilhado(
        @Query() filters: FilterOrcamentoRealizadoCompartilhadoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListApenasOrcamentoRealizadoDto> {
        return await this.orcamentoRealizadoService.findCompartilhadosNoPdm(filters, user);
    }

    @Delete('em-lote')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroMeta.orcamento', 'PDM.tecnico_cp', 'PDM.admin_cp'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async removeEmLote(@Body() params: BatchRecordWithId, @CurrentUser() user: PessoaFromJwt) {
        await this.orcamentoRealizadoService.removeEmLote(params, user);
        return '';
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroMeta.orcamento', 'PDM.tecnico_cp', 'PDM.admin_cp'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.orcamentoRealizadoService.remove(+params.id, user);
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
    @Roles([...PlanoSetorialController.OrcamentoWritePerms, ])
    async create(
        @Body() createMetaDto: CreateOrcamentoRealizadoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.orcamentoRealizadoService.create(createMetaDto, user);
    }

    @Patch('orcamento-concluido')
    @ApiBearerAuth('access-token')
    @Roles([...PlanoSetorialController.OrcamentoWritePerms, ])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async patchProprioOrgaoOrcamentoConcluido(
        @Body() params: PatchOrcamentoRealizadoConcluidoDto,
        @CurrentUser() user: PessoaFromJwt
    ) {
        await this.orcamentoRealizadoService.patchOrcamentoConcluidoProprioOrgao(params, user);
        return '';
    }

    @Patch('orcamento-concluido-admin')
    @ApiBearerAuth('access-token')
    @Roles([...PlanoSetorialController.OrcamentoWritePerms, ])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async patchOrcamentoConcluidoAdmin(
        @Body() params: PatchOrcamentoRealizadoConcluidoComOrgaoDto,
        @CurrentUser() user: PessoaFromJwt
    ) {
        await this.orcamentoRealizadoService.patchOrcamentoConcluidoMetaOrgao(params, user);
        return '';
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles([...PlanoSetorialController.OrcamentoWritePerms, ])
    async update(
        @Param() params: FindOneParams,
        @Body() createMetaDto: UpdateOrcamentoRealizadoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.orcamentoRealizadoService.update(+params.id, createMetaDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    @Roles([...PlanoSetorialController.OrcamentoWritePerms, ])
    async findAll(
        @Query() filters: FilterOrcamentoRealizadoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListOrcamentoRealizadoDto> {
        return await this.orcamentoRealizadoService.findAllWithPermissions(filters, user);
    }

    @ApiBearerAuth('access-token')
    @Get('compartilhados-no-pdm')
    @Roles([...PlanoSetorialController.OrcamentoWritePerms, ])
    async findCompartilhado(
        @Query() filters: FilterOrcamentoRealizadoCompartilhadoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListApenasOrcamentoRealizadoDto> {
        return await this.orcamentoRealizadoService.findCompartilhadosNoPdm(filters, user);
    }

    @Delete('em-lote')
    @ApiBearerAuth('access-token')
    @Roles([...PlanoSetorialController.OrcamentoWritePerms, ])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async removeEmLote(@Body() params: BatchRecordWithId, @CurrentUser() user: PessoaFromJwt) {
        await this.orcamentoRealizadoService.removeEmLote(params, user);
        return '';
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles([...PlanoSetorialController.OrcamentoWritePerms, ])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.orcamentoRealizadoService.remove(+params.id, user);
        return '';
    }
}
