import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, HttpCode, Query } from '@nestjs/common';
import { ProjetoService } from './projeto.service';
import { CreateProjetoDocumentDto, CreateProjetoDto } from './dto/create-projeto.dto';
import { UpdateProjetoDto } from './dto/update-projeto.dto';
import { ApiBearerAuth, ApiNoContentResponse, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { ListProjetoDocumento, ListProjetoDto, ProjetoDetailDto } from './entities/projeto.entity';
import { FilterProjetoDto } from './dto/filter-projeto.dto';
import { FindOneParams, FindTwoParams } from '../../common/decorators/find-params';

@ApiTags('Projeto')
@Controller('projeto')
export class ProjetoController {
    constructor(private readonly projetoService: ProjetoService) { }

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Projeto.administrador', 'SMAE.gestor_de_projeto')
    async create(@Body() createProjetoDto: CreateProjetoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.projetoService.create(createProjetoDto, user);
    }

    @Get()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Projeto.administrador', 'SMAE.gestor_de_projeto')
    async findAll(@Query() filters: FilterProjetoDto, @CurrentUser() user: PessoaFromJwt): Promise<ListProjetoDto> {
        return { linhas: await this.projetoService.findAll(filters, user) };
    }

    @Get(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Projeto.administrador', 'SMAE.gestor_de_projeto')
    async findOne(@Param('id') id: string, @CurrentUser() user: PessoaFromJwt): Promise<ProjetoDetailDto> {
        return await this.projetoService.findOne(+id, user);
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Projeto.administrador', 'SMAE.gestor_de_projeto')
    async update(@Param('id') id: string, @Body() updateProjetoDto: UpdateProjetoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.projetoService.update(+id, updateProjetoDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Projeto.administrador', 'SMAE.gestor_de_projeto')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param('id') id: string, @CurrentUser() user: PessoaFromJwt) {
        await this.projetoService.remove(+id, user);
        return '';
    }

    @Post(':id/documento')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Projeto.administrador', 'SMAE.gestor_de_projeto')
    async upload(
        @Param() params: FindOneParams,
        @Body() createPdmDocDto: CreateProjetoDocumentDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {

        return await this.projetoService.append_document(params.id, createPdmDocDto, user);
    }

    @Get(':id/documento')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Projeto.administrador', 'SMAE.gestor_de_projeto')
    async download(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListProjetoDocumento> {

        return { linhas: await this.projetoService.list_document(params.id, user) };
    }

    @Delete(':id/documento/:id2')
    @ApiBearerAuth('access-token')
    @Roles('Projeto.administrador', 'SMAE.gestor_de_projeto')
    @ApiUnauthorizedResponse()
    @ApiResponse({ description: 'sucesso ao remover', status: 204 })
    @HttpCode(HttpStatus.NO_CONTENT)
    async removerDownload(
        @Param() params: FindTwoParams,
        @CurrentUser() user: PessoaFromJwt
    ) {
        await this.projetoService.remove_document(params.id, params.id2, user)
        return null;
    }
}
