import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { FindOneParams, FindTwoParams } from '../../common/decorators/find-params';
import { BatchRecordWithId, RecordWithId } from '../../common/dto/record-with-id.dto';
import { ProjetoService } from '../projeto/projeto.service';
import {
    CreatePPOrcamentoRealizadoDto,
    FilterPPOrcamentoRealizadoDto,
    ListPPOrcamentoRealizadoDto,
    UpdatePPOrcamentoRealizadoDto,
} from './dto/create-orcamento-realizado.dto';
import { OrcamentoRealizadoService } from './orcamento-realizado.service';

@ApiTags('Projeto - Orçamento (Realizado)')
@Controller('projeto')
export class OrcamentoRealizadoController {
    constructor(
        private readonly orcamentoRealizadoService: OrcamentoRealizadoService,
        private readonly projetoService: ProjetoService
    ) {}

    @Post(':id/orcamento-realizado')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Projeto.orcamento')
    async create(
        @Param() params: FindOneParams,
        @Body() createMetaDto: CreatePPOrcamentoRealizadoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const projeto = await this.projetoService.findOne(params.id, user, 'ReadWriteTeam');

        return await this.orcamentoRealizadoService.create(projeto, createMetaDto, user);
    }

    @Get(':id/orcamento-realizado')
    @ApiBearerAuth('access-token')
    @Roles('Projeto.orcamento')
    async findAll(
        @Param() params: FindOneParams,
        @Query() filters: FilterPPOrcamentoRealizadoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListPPOrcamentoRealizadoDto> {
        const projeto = await this.projetoService.findOne(params.id, user, 'ReadOnly');
        return { linhas: await this.orcamentoRealizadoService.findAll(projeto, filters, user) };
    }

    @Patch(':id/orcamento-realizado/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Projeto.orcamento')
    async update(
        @Param() params: FindTwoParams,
        @Body() createMetaDto: UpdatePPOrcamentoRealizadoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const projeto = await this.projetoService.findOne(params.id, user, 'ReadWriteTeam');

        return await this.orcamentoRealizadoService.update(projeto, params.id2, createMetaDto, user);
    }

    @Delete(':id/orcamento-realizado/em-lote')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroMeta.orcamento', 'PDM.tecnico_cp', 'PDM.admin_cp')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async removeEmLote(
        @Param() paramProj: FindOneParams,
        @Body() paramIds: BatchRecordWithId,
        @CurrentUser() user: PessoaFromJwt
    ) {
        await this.projetoService.findOne(paramProj.id, user, 'ReadWriteTeam');

        await this.orcamentoRealizadoService.removeEmLote(paramIds, user);
        return '';
    }

    @Delete(':id/orcamento-realizado/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Projeto.orcamento')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        await this.projetoService.findOne(params.id, user, 'ReadWriteTeam');

        await this.orcamentoRealizadoService.remove(+params.id2, user);
        return '';
    }
}
