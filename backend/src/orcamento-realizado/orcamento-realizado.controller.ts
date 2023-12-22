import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { BatchRecordWithId, RecordWithId } from '../common/dto/record-with-id.dto';
import {
    CreateOrcamentoRealizadoDto,
    FilterOrcamentoRealizadoDto,
    ListOrcamentoRealizadoDto,
    PatchOrcamentoRealizadoConcluidoDto,
    UpdateOrcamentoRealizadoDto,
} from './dto/create-orcamento-realizado.dto';
import { OrcamentoRealizadoService } from './orcamento-realizado.service';

@ApiTags('Orçamento - Realizado')
@Controller('orcamento-realizado')
export class OrcamentoRealizadoController {
    constructor(private readonly orcamentoRealizadoService: OrcamentoRealizadoService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroMeta.orcamento', 'PDM.tecnico_cp', 'PDM.admin_cp')
    async create(
        @Body() createMetaDto: CreateOrcamentoRealizadoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.orcamentoRealizadoService.create(createMetaDto, user);
    }

    @Patch('orcamento-concluido')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroMeta.orcamento', 'PDM.tecnico_cp', 'PDM.admin_cp')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async orcamentoConcluido(@Body() params: PatchOrcamentoRealizadoConcluidoDto, @CurrentUser() user: PessoaFromJwt) {
        await this.orcamentoRealizadoService.orcamentoConcluido(params, user);
        return '';
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroMeta.orcamento', 'PDM.tecnico_cp', 'PDM.admin_cp')
    async update(
        @Param() params: FindOneParams,
        @Body() createMetaDto: UpdateOrcamentoRealizadoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.orcamentoRealizadoService.update(+params.id, createMetaDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    @Roles('CadastroMeta.orcamento', 'PDM.tecnico_cp', 'PDM.admin_cp')
    async findAll(
        @Query() filters: FilterOrcamentoRealizadoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListOrcamentoRealizadoDto> {
        return {
            linhas: await this.orcamentoRealizadoService.findAll(filters, user),
            concluido: await this.orcamentoRealizadoService.statusConcluido(filters.meta_id, filters.ano_referencia, user)
        };
    }

    @Delete('em-lote')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroMeta.orcamento', 'PDM.tecnico_cp', 'PDM.admin_cp')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async removeEmLote(@Body() params: BatchRecordWithId, @CurrentUser() user: PessoaFromJwt) {
        await this.orcamentoRealizadoService.removeEmLote(params, user);
        return '';
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroMeta.orcamento', 'PDM.tecnico_cp', 'PDM.admin_cp')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.orcamentoRealizadoService.remove(+params.id, user);
        return '';
    }
}
