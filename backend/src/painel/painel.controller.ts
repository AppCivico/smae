import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { FindOneParams } from 'src/common/decorators/find-params';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { PainelService } from './painel.service';
import { ListPainelDto } from './dto/list-painel.dto';
import { CreatePainelDto } from './dto/create-painel.dto';
import { UpdatePainelDto } from './dto/update-painel.dto';
import { FilterPainelDto } from './dto/filter-painel.dto';
import { CreatePainelConteudoDto, CreateParamsPainelConteudoDto } from './dto/create-painel-conteudo.dto';

@ApiTags('Painel')
@Controller('painel')
export class PainelController {
    constructor(private readonly painelService: PainelService) { }

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroPainel.inserir')
    async create(@Body() createPainelDto: CreatePainelDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.painelService.create(createPainelDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(@Query() filters: FilterPainelDto): Promise<ListPainelDto> {
        return { 'linhas': await this.painelService.findAll(filters) };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroPainel.editar')
    async update(@Param() params: FindOneParams, @Body() updatePainelDto: UpdatePainelDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.painelService.update(+params.id, updatePainelDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroPainel.remover')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.painelService.remove(+params.id, user);
        return '';
    }

    @Post(':id/conteudo')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroPainel.inserir')
    async createConteudo(@Param() params: FindOneParams, @Body() createConteudoDto: CreateParamsPainelConteudoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId[]> {
        return await this.painelService.createConteudo(+params.id, createConteudoDto, user);
    }

}
