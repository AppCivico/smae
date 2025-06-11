import { Body, Controller, Delete, forwardRef, Get, HttpCode, HttpStatus, Inject, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { FindOneParams, FindTwoParams } from '../../common/decorators/find-params';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { ListaDePrivilegios } from '../../common/ListaDePrivilegios';
import { ProjetoService } from '../projeto/projeto.service';
import { CreateRiscoDto } from './dto/create-risco.dto';
import { UpdateRiscoDto } from './dto/update-risco.dto';
import { ListProjetoRiscoDto, ProjetoRiscoDetailDto } from './entities/risco.entity';
import { RiscoService } from './risco.service';
import { PROJETO_READONLY_ROLES } from '../projeto/projeto.controller';

const roles: ListaDePrivilegios[] = [
    'Projeto.administrador',
    'Projeto.administrador_no_orgao',
    'SMAE.gestor_de_projeto',
    'SMAE.colaborador_de_projeto',
];

@Controller('projeto')
@ApiTags('Projeto - Risco')
export class RiscoController {
    constructor(
        private readonly riscoService: RiscoService,
        @Inject(forwardRef(() => ProjetoService))
        private readonly projetoService: ProjetoService
    ) {}

    @Post(':id/risco')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    async create(
        @Param() params: FindOneParams,
        @Body() dto: CreateRiscoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const projeto = await this.projetoService.findOne('PP', params.id, user, 'ReadWriteTeam');

        return await this.riscoService.create(projeto.id, dto, user);
    }

    @Get(':id/risco')
    @ApiBearerAuth('access-token')
    @Roles([...roles, ...PROJETO_READONLY_ROLES])
    async findAll(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<ListProjetoRiscoDto> {
        const projeto = await this.projetoService.findOne('PP', params.id, user, 'ReadOnly');
        return {
            linhas: await this.riscoService.findAll(projeto.id, user),
        };
    }

    @Get(':id/risco/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...roles, ...PROJETO_READONLY_ROLES])
    async findOne(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt): Promise<ProjetoRiscoDetailDto> {
        const projeto = await this.projetoService.findOne('PP', params.id, user, 'ReadOnly');
        return await this.riscoService.findOne(projeto.id, params.id2, user);
    }

    @Patch(':id/risco/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    async update(
        @Param() params: FindTwoParams,
        @Body() updateRiscoDto: UpdateRiscoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        await this.projetoService.findOne('PP', params.id, user, 'ReadWriteTeam');
        return await this.riscoService.update(params.id2, updateRiscoDto, user);
    }

    @Delete(':id/risco/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        // Verificar se a equipe vai poder remover o risco (e editar tbm)
        const projeto = await this.projetoService.findOne('PP', params.id, user, 'ReadWriteTeam');
        await this.riscoService.remove(projeto.id, params.id2, user);
        return '';
    }
}
