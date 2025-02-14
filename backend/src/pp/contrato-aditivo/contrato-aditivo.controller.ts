import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { ListaDePrivilegios } from 'src/common/ListaDePrivilegios';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { FindOneParams, FindTwoParams } from '../../common/decorators/find-params';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { PROJETO_READONLY_ROLES, PROJETO_READONLY_ROLES_MDO } from '../projeto/projeto.controller';
import { CreateContratoAditivoDto } from './dto/create-contrato-aditivo.dto';
import { ListContratoAditivoDto } from './entities/contrato-aditivo.entity';
import { UpdateContratoAditivoDto } from './dto/update-contrato-aditivo.dto';
import { ContratoAditivoService } from './contrato-aditivo.service';
import { ProjetoService } from '../projeto/projeto.service';

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

@Controller('contrato-pp')
@ApiTags('Projeto - Contrato Aditivo PP')
export class ContratoAditivoPPController {
    constructor(
        private readonly projetoService: ProjetoService,
        private readonly contratoAditivoService: ContratoAditivoService
    ) {}

    @Post(':id/aditivo')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    async create(
        @Param() params: FindOneParams,
        @Body() createContratoAditivoDto: CreateContratoAditivoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        await this.projetoService.findOne('PP', params.id, user, 'ReadWriteTeam');
        return await this.contratoAditivoService.create(+params.id, createContratoAditivoDto, user);
    }

    @Get(':id/aditivo')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    async findAll(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<ListContratoAditivoDto> {
        await this.projetoService.findOne('PP', params.id, user, 'ReadOnly');
        return {
            linhas: await this.contratoAditivoService.findAll(+params.id, user),
        };
    }

    @Patch(':id/aditivo/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    async update(
        @Param() params: FindTwoParams,
        @Body() dto: UpdateContratoAditivoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        await this.projetoService.findOne('PP', params.id, user, 'ReadWriteTeam');
        return await this.contratoAditivoService.update(+params.id, +params.id2, dto, user);
    }

    @Delete(':id/aditivo/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        await this.projetoService.findOne('PP', params.id, user, 'ReadWriteTeam');
        await this.contratoAditivoService.remove(+params.id, +params.id2, user);
        return '';
    }
}

@Controller('contrato-mdo')
@ApiTags('Projeto - Contrato Aditivo MDO')
export class ContratoAditivoMDOController {
    constructor(
        private readonly projetoService: ProjetoService,
        private readonly contratoAditivoService: ContratoAditivoService
    ) {}

    @Post(':id/aditivo')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async create(
        @Param() params: FindOneParams,
        @Body() createContratoAditivoDto: CreateContratoAditivoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        await this.projetoService.findOne('MDO', params.id, user, 'ReadWriteTeam');
        return await this.contratoAditivoService.create(+params.id, createContratoAditivoDto, user);
    }

    @Get(':id/aditivo')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async findAll(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<ListContratoAditivoDto> {
        await this.projetoService.findOne('MDO', params.id, user, 'ReadOnly');
        return {
            linhas: await this.contratoAditivoService.findAll(+params.id, user),
        };
    }

    @Patch(':id/aditivo/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async update(
        @Param() params: FindTwoParams,
        @Body() dto: UpdateContratoAditivoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        await this.projetoService.findOne('MDO', params.id, user, 'ReadWriteTeam');
        return await this.contratoAditivoService.update(+params.id, +params.id2, dto, user);
    }

    @Delete(':id/aditivo/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        await this.projetoService.findOne('MDO', params.id, user, 'ReadWriteTeam');
        await this.contratoAditivoService.remove(+params.id, +params.id2, user);
        return '';
    }
}
