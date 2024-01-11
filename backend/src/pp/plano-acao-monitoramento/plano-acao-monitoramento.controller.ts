import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpException,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { FindOneParams, FindTwoParams } from '../../common/decorators/find-params';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { ListaDePrivilegios } from '../../common/ListaDePrivilegios';
import {
    CreatePlanoAcaoMonitoramentoDto,
    FilterPlanoAcaoMonitoramentoDto,
    UpdatePlanoAcaoMonitoramentoDto,
} from './dto/create-plano-acao-monitoramento.dto';
import { ListPlanoAcaoMonitoramentoDto } from './entities/plano-acao-monitoramento.entity';
import { PlanoAcaoMonitoramentoService } from './plano-acao-monitoramento.service';
import { ProjetoService } from '../projeto/projeto.service';

const roles: ListaDePrivilegios[] = [
    'Projeto.administrador',
    'Projeto.administrador_no_orgao',
    'SMAE.gestor_de_projeto',
    'SMAE.colaborador_de_projeto',
];

@Controller('projeto')
@ApiTags('Projeto - Risco')
export class PlanoAcaoMonitoramentoController {
    constructor(
        private readonly planoAcaoMonitoramentoService: PlanoAcaoMonitoramentoService,
        private readonly projetoService: ProjetoService
    ) {}

    @Post(':id/plano-acao-monitoramento')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async create(
        @Param() params: FindOneParams,
        @Body() dto: CreatePlanoAcaoMonitoramentoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const projeto = await this.projetoService.findOne(params.id, user, 'ReadWrite');
        if (projeto.permissoes.apenas_leitura) {
            throw new HttpException('Não é possível criar o monitoramento no modo apenas leitura.', 400);
        }

        return await this.planoAcaoMonitoramentoService.create(params.id, dto, user);
    }

    @Get(':id/plano-acao-monitoramento')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async findAll(
        @Param() params: FindOneParams,
        @Query() filters: FilterPlanoAcaoMonitoramentoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListPlanoAcaoMonitoramentoDto> {
        await this.projetoService.findOne(params.id, user, 'ReadOnly');
        return {
            linhas: await this.planoAcaoMonitoramentoService.findAll(params.id, filters, user),
        };
    }

    @Patch(':id/plano-acao-monitoramento/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async update(
        @Param() params: FindTwoParams,
        @Body() dto: UpdatePlanoAcaoMonitoramentoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const projeto = await this.projetoService.findOne(params.id, user, 'ReadWrite');
        if (projeto.permissoes.apenas_leitura) {
            throw new HttpException('Não é possível editar o monitoramento no modo apenas leitura.', 400);
        }

        return await this.planoAcaoMonitoramentoService.update(params.id, params.id2, dto, user);
    }

    @Delete(':id/plano-acao-monitoramento/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        const projeto = await this.projetoService.findOne(params.id, user, 'ReadWrite');
        if (projeto.permissoes.apenas_leitura) {
            throw new HttpException('Não é possível remover o monitoramento no modo apenas leitura.', 400);
        }

        await this.planoAcaoMonitoramentoService.remove(params.id, params.id2, user);
        return '';
    }
}
