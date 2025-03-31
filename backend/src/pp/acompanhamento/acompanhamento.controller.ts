import { Body, Controller, Delete, forwardRef, Get, HttpCode, HttpStatus, Inject, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { ListaDePrivilegios } from 'src/common/ListaDePrivilegios';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { FindOneParams, FindTwoParams } from '../../common/decorators/find-params';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { ProjetoService } from '../projeto/projeto.service';
import { AcompanhamentoService } from './acompanhamento.service';
import { CreateProjetoAcompanhamentoDto } from './dto/create-acompanhamento.dto';
import { UpdateProjetoAcompanhamentoDto } from './dto/update-acompanhamento.dto';
import { DetailProjetoAcompanhamentoDto, ListProjetoAcompanhamentoDto } from './entities/acompanhamento.entity';
import { PROJETO_READONLY_ROLES, PROJETO_READONLY_ROLES_MDO } from '../projeto/projeto.controller';

const roles: ListaDePrivilegios[] = [
    'Projeto.administrador',
    'Projeto.administrador_no_orgao',
    ...PROJETO_READONLY_ROLES,
];
const rolesMDO: ListaDePrivilegios[] = [
    'ProjetoMDO.administrador',
    'ProjetoMDO.administrador_no_orgao',
    ...PROJETO_READONLY_ROLES_MDO,
];

@Controller('projeto')
@ApiTags('Projeto - Acompanhamento')
export class AcompanhamentoController {
    constructor(
        private readonly acompanhamentoService: AcompanhamentoService,
        @Inject(forwardRef(() => ProjetoService))
        private readonly projetoService: ProjetoService
    ) {}

    @Post(':id/acompanhamento')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    async create(
        @Param() params: FindOneParams,
        @Body() createAcompanhamentoDto: CreateProjetoAcompanhamentoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        await this.projetoService.findOne('PP', params.id, user, 'ReadWriteTeam');

        return await this.acompanhamentoService.create('PP', params.id, createAcompanhamentoDto, user);
    }

    @Get(':id/acompanhamento')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    async findAll(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListProjetoAcompanhamentoDto> {
        await this.projetoService.findOne('PP', params.id, user, 'ReadOnly');
        return {
            linhas: await this.acompanhamentoService.findAll('PP', params.id, user),
        };
    }

    @Get(':id/acompanhamento/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    async findOne(
        @Param() params: FindTwoParams,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<DetailProjetoAcompanhamentoDto> {
        await this.projetoService.findOne('PP', params.id, user, 'ReadOnly');
        return await this.acompanhamentoService.findOne('PP', params.id, params.id2, user);
    }

    @Patch(':id/acompanhamento/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    async update(
        @Param() params: FindTwoParams,
        @Body() dto: UpdateProjetoAcompanhamentoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        await this.projetoService.findOne('PP', params.id, user, 'ReadWriteTeam');
        return await this.acompanhamentoService.update('PP', params.id, params.id2, dto, user);
    }

    @Delete(':id/acompanhamento/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        await this.projetoService.findOne('PP', params.id, user, 'ReadWriteTeam');
        await this.acompanhamentoService.remove('PP', params.id, params.id2, user);
        return '';
    }
}

@Controller('projeto-mdo')
@ApiTags('Projeto - Acompanhamento de Obras')
export class AcompanhamentoMDOController {
    constructor(
        private readonly acompanhamentoService: AcompanhamentoService,
        private readonly projetoService: ProjetoService
    ) {}

    @Post(':id/acompanhamento')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async create(
        @Param() params: FindOneParams,
        @Body() createAcompanhamentoDto: CreateProjetoAcompanhamentoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        await this.projetoService.findOne('MDO', params.id, user, 'ReadWriteTeam');

        return await this.acompanhamentoService.create('MDO', params.id, createAcompanhamentoDto, user);
    }

    @Get(':id/acompanhamento')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async findAll(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListProjetoAcompanhamentoDto> {
        await this.projetoService.findOne('MDO', params.id, user, 'ReadOnly');
        return {
            linhas: await this.acompanhamentoService.findAll('MDO', params.id, user),
        };
    }

    @Get(':id/acompanhamento/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async findOne(
        @Param() params: FindTwoParams,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<DetailProjetoAcompanhamentoDto> {
        await this.projetoService.findOne('MDO', params.id, user, 'ReadOnly');
        return await this.acompanhamentoService.findOne('MDO', params.id, params.id2, user);
    }

    @Patch(':id/acompanhamento/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async update(
        @Param() params: FindTwoParams,
        @Body() dto: UpdateProjetoAcompanhamentoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        await this.projetoService.findOne('MDO', params.id, user, 'ReadWriteTeam');
        return await this.acompanhamentoService.update('MDO', params.id, params.id2, dto, user);
    }

    @Delete(':id/acompanhamento/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        await this.projetoService.findOne('MDO', params.id, user, 'ReadWriteTeam');
        await this.acompanhamentoService.remove('MDO', params.id, params.id2, user);
        return '';
    }
}
