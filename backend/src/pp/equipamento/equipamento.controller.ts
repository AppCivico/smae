import { Controller, Post, Body, Get, Param, Patch, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiNoContentResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { FindOneParams, FindTwoParams } from 'src/common/decorators/find-params';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { UpdateProjetoDto } from '../projeto/dto/update-projeto.dto';
import { ProjetoService } from '../projeto/projeto.service';
import { EquipamentoService } from './equipamento.service';
import { CreateEquipamentoDto } from './dto/create-equipamento.dto';
import { ListaDePrivilegios } from 'src/common/ListaDePrivilegios';
import { PROJETO_READONLY_ROLES_MDO } from '../projeto/projeto.controller';
import { Equipamento, ListEquipamentoDto } from './entities/equipamento.entity';

const rolesMDO: ListaDePrivilegios[] = [
    'ProjetoMDO.administrador',
    'ProjetoMDO.administrador_no_orgao',
    ...PROJETO_READONLY_ROLES_MDO,
];

@Controller('mdo')
@ApiTags('Projeto - MdO')
export class EquipamentoController {
    constructor(
        private readonly equipamentoService: EquipamentoService,
        private readonly projetoService: ProjetoService
    ) {}

    @Post(':id/equipamento')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async create(
        @Body() createEquipamentoDto: CreateEquipamentoDto,
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const projeto = await this.projetoService.findOne('MDO', params.id, user, 'ReadWrite');

        return await this.equipamentoService.create(projeto.id, createEquipamentoDto, user);
    }

    @Get(':id/equipamento')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async findAll(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<ListEquipamentoDto> {
        const projeto = await this.projetoService.findOne('MDO', params.id, user, 'ReadWrite');

        return { linhas: await this.equipamentoService.findAll(projeto.id, user) };
    }

    @Get(':id/equipamento/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async findOne(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt): Promise<Equipamento> {
        const projeto = await this.projetoService.findOne('MDO', params.id, user, 'ReadWrite');

        return await this.equipamentoService.findOne(projeto.id, params.id2, user);
    }

    @Patch(':id/equipamento/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async update(
        @Param() params: FindOneParams,
        @Body() updateProjetoDto: UpdateProjetoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const projeto = await this.projetoService.findOne('MDO', params.id, user, 'ReadWrite');

        return await this.equipamentoService.update(projeto.id, updateProjetoDto, user);
    }

    @Delete(':id/equipamento/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        const projeto = await this.projetoService.findOne('MDO', params.id, user, 'ReadWrite');

        await this.equipamentoService.remove(projeto.id, params.id2, user);
        return '';
    }
}
