import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { ListaDePrivilegios } from 'src/common/ListaDePrivilegios';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { FindOneParams, FindTwoParams } from '../../common/decorators/find-params';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { ProjetoService } from '../projeto/projeto.service';
import { PROJETO_READONLY_ROLES_MDO } from '../projeto/projeto.controller';
import { CreateContratoDto } from './dto/create-contrato.dto';
import { ContratoDetailDto, ListContratoDto } from './entities/contrato.entity';
import { UpdateContratoDto } from './dto/update-contrato.dto';
import { ContratoService } from './contrato.service';

const rolesMDO: ListaDePrivilegios[] = [
    'ProjetoMDO.administrador',
    'ProjetoMDO.administrador_no_orgao',
    ...PROJETO_READONLY_ROLES_MDO,
];

@Controller('projeto-mdo')
@ApiTags('Projeto - Acompanhamento de Obras')
export class ContratoMDOController {
    constructor(
        private readonly projetoService: ProjetoService,
        private readonly contratoService: ContratoService
    ) {}

    @Post(':id/contrato')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async create(
        @Param() params: FindOneParams,
        @Body() createContratoDto: CreateContratoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        await this.projetoService.findOne('MDO', params.id, user, 'ReadWriteTeam');
        return await this.contratoService.create(+params.id, createContratoDto, user);
    }

    @Get(':id/contrato')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async findAll(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<ListContratoDto> {
        await this.projetoService.findOne('MDO', params.id, user, 'ReadOnly');
        return {
            linhas: await this.contratoService.findAll(+params.id, user),
        };
    }

    @Get(':id/contrato/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async findOne(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt): Promise<ContratoDetailDto> {
        await this.projetoService.findOne('MDO', params.id, user, 'ReadOnly');
        return await this.contratoService.findOne(+params.id, +params.id2, user);
    }

    @Patch(':id/acompanhamento/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async update(
        @Param() params: FindTwoParams,
        @Body() dto: UpdateContratoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        await this.projetoService.findOne('MDO', params.id, user, 'ReadWriteTeam');
        return await this.contratoService.update(+params.id, +params.id2, dto, user);
    }

    @Delete(':id/acompanhamento/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        await this.projetoService.findOne('MDO', params.id, user, 'ReadWriteTeam');
        await this.contratoService.remove(+params.id, +params.id2, user);
        return '';
    }
}
