import { Body, Controller, Delete, Get, HttpCode, HttpException, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiExtraModels, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse, refs } from '@nestjs/swagger';
import { plainToClass } from 'class-transformer';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { FindOneParams, FindThreeParams, FindTwoParams } from '../../common/decorators/find-params';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { ListaDePrivilegios } from '../../common/ListaDePrivilegios';
import { ProjetoService } from '../projeto/projeto.service';
import { CreateProjetoRiscoPlanoAcaoDto, CreateProjetoRiscoTarefaDto, CreateRiscoDto } from './dto/create-risco.dto';
import { UpdateRiscoDto } from './dto/update-risco.dto';
import { ListPlanoAcao } from './entities/plano-acao.entity';
import { ListProjetoRiscoDto, ProjetoRiscoDetailDto } from './entities/risco.entity';
import { RiscoService } from './risco.service';

const roles: ListaDePrivilegios[] = ['Projeto.administrador', 'SMAE.gestor_de_projeto', 'SMAE.colaborador_de_projeto'];

@Controller('projeto')
@ApiTags('Projeto - Risco')
export class RiscoController {
    constructor(
        private readonly riscoService: RiscoService,
        private readonly projetoService: ProjetoService,

    ) { }

    @Post(':id/risco')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async create(@Param() params: FindOneParams, @Body() dto: CreateRiscoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        const projeto = await this.projetoService.findOne(params.id, user, false);

        return await this.riscoService.create(projeto.id, dto, user);
    }

    @Get(':id/risco')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async findAll(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<ListProjetoRiscoDto> {
        const projeto = await this.projetoService.findOne(params.id, user, true);
        return {
            linhas: await this.riscoService.findAll(projeto.id, user),
        };
    }

    @Get(':id/risco/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async findOne(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt): Promise<ProjetoRiscoDetailDto> {
        return await this.riscoService.findOne(params.id, params.id2, user);
    }

    @Patch(':id/risco/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Projeto.administrador', 'SMAE.gestor_de_projeto', 'SMAE.colaborador_de_projeto')
    async update(@Param() params: FindTwoParams, @Body() updateRiscoDto: UpdateRiscoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.riscoService.update(params.id2, updateRiscoDto, user);
    }

    @Patch(':id/risco/:id2/tarefa')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async upsertProjetoRiscoTarefa(@Param() params: FindTwoParams, @Body() dto: CreateProjetoRiscoTarefaDto, @CurrentUser() user: PessoaFromJwt) {
        return {created_count: await this.riscoService.upsertProjetoRiscoTarefa(params.id, params.id2, dto, user)};
    }

    @Post(':id/risco/:id2/plano-de-acao')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async createProjetoRiscoTarefaPlanoAcao(@Param() params: FindTwoParams, @Body() dto: CreateProjetoRiscoPlanoAcaoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.riscoService.createProjetoRiscoPlanoAcao(params.id, params.id2, dto, user);
    }

    @Get(':id/risco/:id2/plano-de-acao')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async findAllPlanoAcao(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt): Promise<ListPlanoAcao> {
        return {
            linhas: await this.riscoService.listProjetoRiscoPlanoAcao(params.id, params.id2, user),
        };
    }
}
