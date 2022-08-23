import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { ListCoordenadoriaDto } from 'src/coordenadoria/dto/list-coordenadoria.dto';
import { CoordenadoriaService } from './coordenadoria.service';
import { CreateCoordenadoriaDto } from './dto/create-coordenadoria.dto';
import { UpdateCoordenadoriaDto } from './dto/update-coordenadoria.dto';

@ApiTags('coordenadoria')
@Controller('coordenadoria')
export class CoordenadoriaController {
    constructor(private readonly coordenadoriaService: CoordenadoriaService) { }

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroCoordenadoria.inserir')
    async create(@Body() createCoordenadoriaDto: CreateCoordenadoriaDto, @CurrentUser() user: PessoaFromJwt) {
        return await this.coordenadoriaService.create(createCoordenadoriaDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(): Promise<ListCoordenadoriaDto> {
        return { 'linhas': await this.coordenadoriaService.findAll() };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroCoordenadoria.editar')
    async update(@Param('id') id: string, @Body() updateCoordenadoriaDto: UpdateCoordenadoriaDto, @CurrentUser() user: PessoaFromJwt) {
        return await this.coordenadoriaService.update(+id, updateCoordenadoriaDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroCoordenadoria.remover')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string, @CurrentUser() user: PessoaFromJwt) {
        await this.coordenadoriaService.remove(+id, user);
        return '';
    }
}
