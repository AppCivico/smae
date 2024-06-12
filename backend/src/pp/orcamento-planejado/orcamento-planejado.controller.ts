import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { FindOneParams, FindTwoParams } from '../../common/decorators/find-params';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { ProjetoService } from '../projeto/projeto.service';
import {
    CreatePPOrcamentoPlanejadoDto,
    FilterPPOrcamentoPlanejadoDto,
    ListPPOrcamentoPlanejadoDto,
    UpdatePPOrcamentoPlanejadoDto,
} from './dto/create-orcamento-planejado.dto';
import { OrcamentoPlanejadoService } from './orcamento-planejado.service';

@ApiTags('Projeto - Orçamento (Planejado)')
@Controller('projeto')
export class OrcamentoPlanejadoController {
    constructor(
        private readonly orcamentoPlanejadoService: OrcamentoPlanejadoService,
        private readonly projetoService: ProjetoService
    ) {}

    @Post(':id/orcamento-planejado')
    @ApiBearerAuth('access-token')
    @Roles(['Projeto.orcamento'])
    async create(
        @Param() params: FindOneParams,
        @Body() createMetaDto: CreatePPOrcamentoPlanejadoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        await this.projetoService.findOne('PP', params.id, user, 'ReadWriteTeam');
        return await this.orcamentoPlanejadoService.create('PP', +params.id, createMetaDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get(':id/orcamento-planejado')
    @Roles(['Projeto.orcamento'])
    async findAll(
        @Param() params: FindOneParams,
        @Query() filters: FilterPPOrcamentoPlanejadoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListPPOrcamentoPlanejadoDto> {
        const projeto = await this.projetoService.findOne('PP', +params.id, user, 'ReadOnly');

        return {
            linhas: await this.orcamentoPlanejadoService.findAll('PP', projeto, filters, user),
        };
    }

    @Patch(':id/orcamento-planejado/:id2')
    @ApiBearerAuth('access-token')
    @Roles(['Projeto.orcamento'])
    async update(
        @Param() params: FindTwoParams,
        @Body() createMetaDto: UpdatePPOrcamentoPlanejadoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        await this.projetoService.findOne('PP', +params.id, user, 'ReadWriteTeam');

        return await this.orcamentoPlanejadoService.update('PP', +params.id, +params.id2, createMetaDto, user);
    }

    @Delete(':id/orcamento-planejado/:id2')
    @ApiBearerAuth('access-token')
    @Roles(['Projeto.orcamento'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        await this.projetoService.findOne('PP', params.id, user, 'ReadWriteTeam');

        await this.orcamentoPlanejadoService.remove('PP', +params.id, +params.id2, user);
        return '';
    }
}

@ApiTags('Projeto - Orçamento (Planejado) de Obras')
@Controller('projeto-mdo')
export class OrcamentoPlanejadoMDOController {
    constructor(
        private readonly orcamentoPlanejadoService: OrcamentoPlanejadoService,
        private readonly projetoService: ProjetoService
    ) {}

    @Post(':id/orcamento-planejado')
    @ApiBearerAuth('access-token')
    @Roles(['ProjetoMDO.orcamento'])
    async create(
        @Param() params: FindOneParams,
        @Body() createMetaDto: CreatePPOrcamentoPlanejadoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        await this.projetoService.findOne('MDO', params.id, user, 'ReadWriteTeam');
        return await this.orcamentoPlanejadoService.create('MDO', +params.id, createMetaDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get(':id/orcamento-planejado')
    @Roles(['ProjetoMDO.orcamento'])
    async findAll(
        @Param() params: FindOneParams,
        @Query() filters: FilterPPOrcamentoPlanejadoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListPPOrcamentoPlanejadoDto> {
        const projeto = await this.projetoService.findOne('MDO', +params.id, user, 'ReadOnly');

        return {
            linhas: await this.orcamentoPlanejadoService.findAll('MDO', projeto, filters, user),
        };
    }

    @Patch(':id/orcamento-planejado/:id2')
    @ApiBearerAuth('access-token')
    @Roles(['ProjetoMDO.orcamento'])
    async update(
        @Param() params: FindTwoParams,
        @Body() createMetaDto: UpdatePPOrcamentoPlanejadoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        await this.projetoService.findOne('MDO', +params.id, user, 'ReadWriteTeam');

        return await this.orcamentoPlanejadoService.update('MDO', +params.id, +params.id2, createMetaDto, user);
    }

    @Delete(':id/orcamento-planejado/:id2')
    @ApiBearerAuth('access-token')
    @Roles(['ProjetoMDO.orcamento'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        await this.projetoService.findOne('MDO', params.id, user, 'ReadWriteTeam');

        await this.orcamentoPlanejadoService.remove('MDO', +params.id, +params.id2, user);
        return '';
    }
}
