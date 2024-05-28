import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { CreateEixoDto } from './dto/create-macro-tema.dto';
import { FilterEixoDto } from './dto/filter-macro-tema.dto';
import { ListEixoDto } from './dto/list-macro-tema.dto';
import { UpdateEixoDto } from './dto/update-macro-tema.dto';
import { MacroTemaService } from './macro-tema.service';
import { ListaDePrivilegios } from 'src/common/ListaDePrivilegios';

@ApiTags('Eixo (Acessa via MacroTema)')
@Controller('eixo')
export class MacroTemaController {
    constructor(private readonly eixoService: MacroTemaService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['CadastroMacroTema.inserir'])
    async create(@Body() createEixoDto: CreateEixoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.eixoService.create(createEixoDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(@Query() filters: FilterEixoDto): Promise<ListEixoDto> {
        return { linhas: await this.eixoService.findAll(filters) };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroMacroTema.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() updateEixoDto: UpdateEixoDto,
        @CurrentUser() user: PessoaFromJwt
    ) {
        return await this.eixoService.update(+params.id, updateEixoDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroMacroTema.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.eixoService.remove(+params.id, user);
        return '';
    }
}

@ApiTags('Macro Tema (Antigo Eixo)')
@Controller('macrotema')
export class MacroTemaController2 {
    constructor(private readonly eixoService: MacroTemaService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['CadastroMacroTema.inserir'])
    async create(@Body() createEixoDto: CreateEixoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.eixoService.create(createEixoDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(@Query() filters: FilterEixoDto): Promise<ListEixoDto> {
        return { linhas: await this.eixoService.findAll(filters) };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroMacroTema.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() updateEixoDto: UpdateEixoDto,
        @CurrentUser() user: PessoaFromJwt
    ) {
        return await this.eixoService.update(+params.id, updateEixoDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroMacroTema.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.eixoService.remove(+params.id, user);
        return '';
    }
}

const PermsPS: ListaDePrivilegios[] = [
    'CadastroMacroTemaPS.inserir',
    'CadastroMacroTemaPS.editar',
    'CadastroMacroTemaPS.remover',
];

@ApiTags('Plano Setorial - Macro Tema (Antigo Eixo)')
@Controller('plano-setorial-macrotema')
export class PlanoSetorialMacroTemaController {
    constructor(private readonly eixoService: MacroTemaService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(PermsPS)
    async create(@Body() createEixoDto: CreateEixoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.eixoService.create(createEixoDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    @Roles(PermsPS)
    async findAll(@Query() filters: FilterEixoDto): Promise<ListEixoDto> {
        return { linhas: await this.eixoService.findAll(filters) };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(PermsPS)
    async update(
        @Param() params: FindOneParams,
        @Body() updateEixoDto: UpdateEixoDto,
        @CurrentUser() user: PessoaFromJwt
    ) {
        return await this.eixoService.update(+params.id, updateEixoDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(PermsPS)
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.eixoService.remove(+params.id, user);
        return '';
    }
}
