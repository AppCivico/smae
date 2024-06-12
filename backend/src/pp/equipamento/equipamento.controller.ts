import { Controller, Post, Body, Get, Param, Patch, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiNoContentResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { FindOneParams } from 'src/common/decorators/find-params';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { UpdateProjetoDto } from '../projeto/dto/update-projeto.dto';
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

@Controller('equipamento')
@ApiTags('Monitoramento de Obras, Cadastro Básico, Equipamento')
export class EquipamentoController {
    constructor(private readonly equipamentoService: EquipamentoService) {}

    @Post('')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async create(
        @Body() createEquipamentoDto: CreateEquipamentoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.equipamentoService.create(createEquipamentoDto, user);
    }

    @Get('')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async findAll(@CurrentUser() user: PessoaFromJwt): Promise<ListEquipamentoDto> {
        return { linhas: await this.equipamentoService.findAll(user) };
    }

    @Get(':id')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async findOne(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<Equipamento> {
        return await this.equipamentoService.findOne(params.id, user);
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async update(
        @Param() params: FindOneParams,
        @Body() updateProjetoDto: UpdateProjetoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.equipamentoService.update(params.id, updateProjetoDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.equipamentoService.remove(params.id, user);
        return '';
    }
}
