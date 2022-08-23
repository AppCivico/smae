import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { ListDepartamentoDto } from 'src/departamento/dto/list-departamento.dto';
import { DepartamentoService } from './departamento.service';
import { CreateDepartamentoDto } from './dto/create-departamento.dto';
import { UpdateDepartamentoDto } from './dto/update-departamento.dto';

@ApiTags('departamento')
@Controller('departamento')
export class DepartamentoController {
    constructor(private readonly departamentoService: DepartamentoService) { }

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroDepartamento.inserir')
    async create(@Body() createDepartamentoDto: CreateDepartamentoDto, @CurrentUser() user: PessoaFromJwt) {
        return await this.departamentoService.create(createDepartamentoDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(): Promise<ListDepartamentoDto> {
        return { 'linhas': await this.departamentoService.findAll() };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroDepartamento.editar')
    async update(@Param('id') id: string, @Body() updateDepartamentoDto: UpdateDepartamentoDto, @CurrentUser() user: PessoaFromJwt) {
        return await this.departamentoService.update(+id, updateDepartamentoDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroDepartamento.remover')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string, @CurrentUser() user: PessoaFromJwt) {
        await this.departamentoService.remove(+id, user);
        return '';
    }
}
