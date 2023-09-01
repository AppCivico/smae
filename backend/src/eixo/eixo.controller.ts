import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { CreateEixoDto } from './dto/create-eixo.dto';
import { FilterEixoDto } from './dto/filter-eixo.dto';
import { ListEixoDto } from './dto/list-eixo.dto';
import { UpdateEixoDto } from './dto/update-eixo.dto';
import { EixoService } from './eixo.service';

@ApiTags('Eixo (Acessa via MacroTema)')
@Controller('eixo')
export class EixoController {
    constructor(private readonly eixoService: EixoService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroMacroTema.inserir')
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
    @ApiUnauthorizedResponse()
    @Roles('CadastroMacroTema.editar')
    async update(
        @Param() params: FindOneParams,
        @Body() updateEixoDto: UpdateEixoDto,
        @CurrentUser() user: PessoaFromJwt
    ) {
        return await this.eixoService.update(+params.id, updateEixoDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroMacroTema.remover')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.eixoService.remove(+params.id, user);
        return '';
    }
}

@ApiTags('Macro Tema (Antigo Eixo)')
@Controller('macrotema')
export class EixoController2 {
    constructor(private readonly eixoService: EixoService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroMacroTema.inserir')
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
    @ApiUnauthorizedResponse()
    @Roles('CadastroMacroTema.editar')
    async update(
        @Param() params: FindOneParams,
        @Body() updateEixoDto: UpdateEixoDto,
        @CurrentUser() user: PessoaFromJwt
    ) {
        return await this.eixoService.update(+params.id, updateEixoDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroMacroTema.remover')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.eixoService.remove(+params.id, user);
        return '';
    }
}
