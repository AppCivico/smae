import { Body, Controller, Delete, Get, HttpCode, HttpException, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { FindOneParams, FindTwoParams } from '../../common/decorators/find-params';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { ListaDePrivilegios } from '../../common/ListaDePrivilegios';
import { ListPlanoAcaoDto, PlanoAcaoDetailDto } from '../plano-de-acao/entities/plano-acao.entity';
import { ProjetoService } from '../projeto/projeto.service';
import { CreatePlanoAcaoDto } from './dto/create-plano-acao.dto';
import { FilterPlanoAcaoDto } from './dto/filter-plano-acao.dto';
import { UpdatePlanoAcaoDto } from './dto/update-plano-acao.dto';
import { PlanoAcaoService } from './plano-de-acao.service';

const roles: ListaDePrivilegios[] = ['Projeto.administrador', 'Projeto.administrador_no_orgao', 'SMAE.gestor_de_projeto', 'SMAE.colaborador_de_projeto'];

@Controller('projeto')
@ApiTags('Projeto - Risco')
export class PlanoAcaoController {
    constructor(
        private readonly planoAcaoService: PlanoAcaoService,
        private readonly projetoService: ProjetoService,
    ) { }

    @Post(':id/plano-de-acao')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async create(@Param() params: FindOneParams, @Body() dto: CreatePlanoAcaoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        const projeto = await this.projetoService.findOne(params.id, user, 'ReadWrite');
        if (projeto.permissoes.apenas_leitura_planejamento) {
            throw new HttpException("Não é possível criar plano de ação em modo de leitura", 400);
        }

        return await this.planoAcaoService.create(params.id, dto, user);
    }

    @Get(':id/plano-de-acao')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async findAll(@Param() params: FindOneParams, @Body() dto: FilterPlanoAcaoDto, @CurrentUser() user: PessoaFromJwt): Promise<ListPlanoAcaoDto> {
        const projeto = await this.projetoService.findOne(params.id, user, 'ReadOnly');
        return {
            linhas: await this.planoAcaoService.findAll(projeto.id, dto, user),
        };
    }

    @Get(':id/plano-de-acao/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async findOne(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt): Promise<PlanoAcaoDetailDto> {
        await this.projetoService.findOne(params.id, user, 'ReadOnly');
        return await this.planoAcaoService.findOne(params.id, params.id2, user);
    }

    @Patch(':id/plano-de-acao/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async update(@Param() params: FindTwoParams, @Body() updatePlanoAcaoDto: UpdatePlanoAcaoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        const projeto = await this.projetoService.findOne(params.id, user, 'ReadWrite');
        if (projeto.permissoes.apenas_leitura_planejamento) {
            throw new HttpException("Não é possível editar plano de ação em modo de leitura", 400);
        }

        return await this.planoAcaoService.update(params.id2, updatePlanoAcaoDto, user);
    }

    @Delete(':id/plano-de-acao/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        const projeto = await this.projetoService.findOne(params.id, user, 'ReadWrite');
        if (projeto.permissoes.apenas_leitura_planejamento) {
            throw new HttpException("Não é possível remover plano de ação em modo de leitura", 400);
        }

        await this.planoAcaoService.remove(params.id2, user);
        return '';
    }
}
