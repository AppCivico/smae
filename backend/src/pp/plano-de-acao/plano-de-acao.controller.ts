import { Body, Controller, Delete, forwardRef, Get, HttpCode, HttpStatus, Inject, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { ListaDePrivilegios } from '../../common/ListaDePrivilegios';
import { FindOneParams, FindTwoParams } from '../../common/decorators/find-params';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { ListPlanoAcaoDto, PlanoAcaoDetailDto } from '../plano-de-acao/entities/plano-acao.entity';
import { ProjetoService } from '../projeto/projeto.service';
import { CreatePlanoAcaoDto } from './dto/create-plano-acao.dto';
import { FilterPlanoAcaoDto } from './dto/filter-plano-acao.dto';
import { UpdatePlanoAcaoDto } from './dto/update-plano-acao.dto';
import { PlanoAcaoService } from './plano-de-acao.service';
import { PROJETO_READONLY_ROLES } from '../projeto/projeto.controller';

const roles: ListaDePrivilegios[] = [
    'Projeto.administrador',
    'Projeto.administrador_no_orgao',
    ...PROJETO_READONLY_ROLES,
];

@Controller('projeto')
@ApiTags('Projeto - Risco')
export class PlanoAcaoController {
    constructor(
        private readonly planoAcaoService: PlanoAcaoService,
        @Inject(forwardRef(() => ProjetoService))
        private readonly projetoService: ProjetoService
    ) {}

    @Post(':id/plano-de-acao')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    async create(
        @Param() params: FindOneParams,
        @Body() dto: CreatePlanoAcaoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        await this.projetoService.findOne('PP', params.id, user, 'ReadWriteTeam');

        return await this.planoAcaoService.create(params.id, dto, user);
    }

    @Get(':id/plano-de-acao')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    async findAll(
        @Param() params: FindOneParams,
        @Body() dto: FilterPlanoAcaoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListPlanoAcaoDto> {
        const projeto = await this.projetoService.findOne('PP', params.id, user, 'ReadOnly');
        return {
            linhas: await this.planoAcaoService.findAll(projeto.id, dto, user),
        };
    }

    @Get(':id/plano-de-acao/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    async findOne(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt): Promise<PlanoAcaoDetailDto> {
        await this.projetoService.findOne('PP', params.id, user, 'ReadOnly');
        return await this.planoAcaoService.findOne(params.id, params.id2, user);
    }

    @Patch(':id/plano-de-acao/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    async update(
        @Param() params: FindTwoParams,
        @Body() updatePlanoAcaoDto: UpdatePlanoAcaoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        await this.projetoService.findOne('PP', params.id, user, 'ReadWriteTeam');

        return await this.planoAcaoService.update(params.id2, updatePlanoAcaoDto, user);
    }

    @Delete(':id/plano-de-acao/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        await this.projetoService.findOne('PP', params.id, user, 'ReadWriteTeam');

        await this.planoAcaoService.remove(params.id2, user);
        return '';
    }
}
