import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { FindOneParams, FindTwoParams } from '../../common/decorators/find-params';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { ProjetoService } from '../projeto/projeto.service';
import {
    CreateOrcamentoPrevistoDto,
    FilterOrcamentoPrevistoDto,
    ListOrcamentoPrevistoDto,
    ProjetoUpdateOrcamentoPrevistoZeradoDto,
    UpdateOrcamentoPrevistoDto,
} from './dto/create-orcamento-previsto.dto';
import { OrcamentoPrevistoService } from './orcamento-previsto.service';

@Controller('projeto')
@ApiTags('Projeto - Orçamento (Custeio e Investimento)')
export class OrcamentoPrevistoController {
    private readonly logger = new Logger(OrcamentoPrevistoController.name);

    constructor(
        private readonly metaOrcamentoService: OrcamentoPrevistoService,
        private readonly projetoService: ProjetoService
    ) {}

    @Post(':id/orcamento-previsto')
    @ApiBearerAuth('access-token')
    @Roles(['Projeto.orcamento'])
    async create(
        @Param() params: FindOneParams,
        @Body() createMetaDto: CreateOrcamentoPrevistoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        this.logger.debug('create orçamento previsto projeto');

        await this.projetoService.findOne('PP', params.id, user, 'ReadWriteTeam');

        return await this.metaOrcamentoService.create('PP', +params.id, createMetaDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get(':id/orcamento-previsto')
    @Roles(['Projeto.orcamento'])
    async findAll(
        @Param() params: FindOneParams,
        @Query() filters: FilterOrcamentoPrevistoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListOrcamentoPrevistoDto> {
        this.logger.debug('findAll orçamento previsto projeto');

        await this.projetoService.findOne('PP', params.id, user, 'ReadOnly');

        return {
            linhas: await this.metaOrcamentoService.findAll('PP', params.id, filters, user),
            ...(await this.metaOrcamentoService.orcamento_previsto_zero('PP', +params.id, filters.ano_referencia)),
        };
    }

    @Patch(':id/orcamento-previsto/zerado')
    @ApiBearerAuth('access-token')
    @Roles(['Projeto.orcamento'])
    @HttpCode(HttpStatus.ACCEPTED)
    @ApiNoContentResponse()
    async patchZerado(
        @Param() params: FindOneParams,
        @Body() updateZeradoDto: ProjetoUpdateOrcamentoPrevistoZeradoDto,
        @CurrentUser() user: PessoaFromJwt
    ) {
        this.logger.debug('zerado orçamento previsto projeto');

        await this.projetoService.findOne('PP', +params.id, user, 'ReadWriteTeam');

        await this.metaOrcamentoService.patchZerado('PP', +params.id, updateZeradoDto, user);
        return '';
    }

    @Patch(':id/orcamento-previsto/:id2')
    @ApiBearerAuth('access-token')
    @Roles(['Projeto.orcamento'])
    @HttpCode(HttpStatus.ACCEPTED)
    async patch(
        @Param() params: FindTwoParams,
        @Body() updateMetaDto: UpdateOrcamentoPrevistoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<void> {
        this.logger.debug('patch orçamento previsto projeto');

        await this.projetoService.findOne('PP', +params.id, user, 'ReadWriteTeam');

        await this.metaOrcamentoService.update('PP', +params.id, +params.id2, updateMetaDto, user);
    }

    @Delete(':id/orcamento-previsto/:id2')
    @ApiBearerAuth('access-token')
    @Roles(['Projeto.orcamento'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        this.logger.debug('remove orçamento previsto projeto');

        await this.projetoService.findOne('PP', params.id, user, 'ReadWriteTeam');

        await this.metaOrcamentoService.remove('PP', +params.id, +params.id2, user);
        return '';
    }
}

@Controller('projeto-mdo')
@ApiTags('Projeto - Orçamento (Custeio e Investimento) de Obras')
export class OrcamentoPrevistoMDOController {
    private readonly logger = new Logger(OrcamentoPrevistoController.name);

    constructor(
        private readonly metaOrcamentoService: OrcamentoPrevistoService,
        private readonly projetoService: ProjetoService
    ) {}

    @Post(':id/orcamento-previsto')
    @ApiBearerAuth('access-token')
    @Roles(['ProjetoMDO.orcamento'])
    async create(
        @Param() params: FindOneParams,
        @Body() createMetaDto: CreateOrcamentoPrevistoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        this.logger.debug('create orçamento previsto projeto');

        await this.projetoService.findOne('MDO', params.id, user, 'ReadWriteTeam');

        return await this.metaOrcamentoService.create('MDO', +params.id, createMetaDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get(':id/orcamento-previsto')
    @Roles(['ProjetoMDO.orcamento'])
    async findAll(
        @Param() params: FindOneParams,
        @Query() filters: FilterOrcamentoPrevistoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListOrcamentoPrevistoDto> {
        this.logger.debug('findAll orçamento previsto projeto');

        await this.projetoService.findOne('MDO', params.id, user, 'ReadOnly');

        return {
            linhas: await this.metaOrcamentoService.findAll('MDO', params.id, filters, user),
            ...(await this.metaOrcamentoService.orcamento_previsto_zero('MDO', +params.id, filters.ano_referencia)),
        };
    }

    @Patch(':id/orcamento-previsto/zerado')
    @ApiBearerAuth('access-token')
    @Roles(['ProjetoMDO.orcamento'])
    @HttpCode(HttpStatus.ACCEPTED)
    @ApiNoContentResponse()
    async patchZerado(
        @Param() params: FindOneParams,
        @Body() updateZeradoDto: ProjetoUpdateOrcamentoPrevistoZeradoDto,
        @CurrentUser() user: PessoaFromJwt
    ) {
        this.logger.debug('zerado orçamento previsto projeto');

        await this.projetoService.findOne('MDO', +params.id, user, 'ReadWriteTeam');

        await this.metaOrcamentoService.patchZerado('MDO', +params.id, updateZeradoDto, user);
        return '';
    }

    @Patch(':id/orcamento-previsto/:id2')
    @ApiBearerAuth('access-token')
    @Roles(['ProjetoMDO.orcamento'])
    @HttpCode(HttpStatus.ACCEPTED)
    async patch(
        @Param() params: FindTwoParams,
        @Body() updateMetaDto: UpdateOrcamentoPrevistoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<void> {
        this.logger.debug('patch orçamento previsto projeto');

        await this.projetoService.findOne('MDO', +params.id, user, 'ReadWriteTeam');

        await this.metaOrcamentoService.update('MDO', +params.id, +params.id2, updateMetaDto, user);
    }

    @Delete(':id/orcamento-previsto/:id2')
    @ApiBearerAuth('access-token')
    @Roles(['ProjetoMDO.orcamento'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        this.logger.debug('remove orçamento previsto projeto');

        await this.projetoService.findOne('MDO', params.id, user, 'ReadWriteTeam');

        await this.metaOrcamentoService.remove('MDO', +params.id, +params.id2, user);
        return '';
    }
}
