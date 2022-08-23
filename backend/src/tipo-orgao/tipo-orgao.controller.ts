import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { TipoOrgaoService } from './tipo-orgao.service';
import { CreateTipoOrgaoDto } from './dto/create-tipo-orgao.dto';
import { UpdateTipoOrgaoDto } from './dto/update-tipo-orgao.dto';
import { ListTipoOrgaoDto } from 'src/tipo-orgao/dto/list-tipo-orgao.dto';

@ApiTags('tipoOrgao')
@Controller('tipo-orgao')
export class TipoOrgaoController {
    constructor(private readonly tipoOrgaoService: TipoOrgaoService) { }

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroTipoOrgao.inserir')
    async create(@Body() createTipoOrgaoDto: CreateTipoOrgaoDto, @CurrentUser() user: PessoaFromJwt) {
        return await this.tipoOrgaoService.create(createTipoOrgaoDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(): Promise<ListTipoOrgaoDto> {
        return { 'linhas': await this.tipoOrgaoService.findAll() };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroTipoOrgao.editar')
    async update(@Param('id') id: string, @Body() updateTipoOrgaoDto: UpdateTipoOrgaoDto, @CurrentUser() user: PessoaFromJwt) {
        return await this.tipoOrgaoService.update(+id, updateTipoOrgaoDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroTipoOrgao.remover')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string, @CurrentUser() user: PessoaFromJwt) {
        await this.tipoOrgaoService.remove(+id, user);
        return '';
    }
}
