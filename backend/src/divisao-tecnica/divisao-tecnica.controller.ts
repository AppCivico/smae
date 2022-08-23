import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { ListDivisaoTecnicaDto } from 'src/divisao-tecnica/dto/list-divisao-tecnica.dto';
import { DivisaoTecnicaService } from './divisao-tecnica.service';
import { CreateDivisaoTecnicaDto } from './dto/create-divisao-tecnica.dto';
import { UpdateDivisaoTecnicaDto } from './dto/update-divisao-tecnica.dto';

@ApiTags('divisao-tecnica')
@Controller('divisao-tecnica')
export class DivisaoTecnicaController {
    constructor(private readonly divisaoTecnicaService: DivisaoTecnicaService) { }

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroDivisaoTecnica.inserir')
    async create(@Body() createDivisaoTecnicaDto: CreateDivisaoTecnicaDto, @CurrentUser() user: PessoaFromJwt) {
        return await this.divisaoTecnicaService.create(createDivisaoTecnicaDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(): Promise<ListDivisaoTecnicaDto> {
        return { 'linhas': await this.divisaoTecnicaService.findAll() };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroDivisaoTecnica.editar')
    async update(@Param('id') id: string, @Body() updateDivisaoTecnicaDto: UpdateDivisaoTecnicaDto, @CurrentUser() user: PessoaFromJwt) {
        return await this.divisaoTecnicaService.update(+id, updateDivisaoTecnicaDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroDivisaoTecnica.remover')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string, @CurrentUser() user: PessoaFromJwt) {
        await this.divisaoTecnicaService.remove(+id, user);
        return '';
    }
}
