import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseArrayPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiNoContentResponse, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { FindOneParams } from 'src/common/decorators/find-params';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { CreateMetaDto,  ListDadosMetaIniciativaAtividadesDto } from './dto/create-meta.dto';
import { FilterMetaDto } from './dto/filter-meta.dto';
import { ListMetaDto } from './dto/list-meta.dto';
import { UpdateMetaDto } from './dto/update-meta.dto';
import { MetaService } from './meta.service';

@ApiTags('Meta')
@Controller('meta')
export class MetaController {
    constructor(private readonly metaService: MetaService) { }

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroMeta.inserir')
    async create(@Body() createMetaDto: CreateMetaDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.metaService.create(createMetaDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    //@Roles('CadastroMeta.inserir', 'CadastroMeta.editar', 'CadastroMeta.remover')
    async findAll(@Query() filters: FilterMetaDto): Promise<ListMetaDto> {
        // TODO filtrar por apenas painels , se a pessoa nao tiver essas permissoes acima
        return { 'linhas': await this.metaService.findAll(filters) };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroMeta.editar')
    async update(@Param() params: FindOneParams, @Body() updateMetaDto: UpdateMetaDto, @CurrentUser() user: PessoaFromJwt) {
        return await this.metaService.update(+params.id, updateMetaDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroMeta.remover')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.metaService.remove(+params.id, user);
        return '';
    }

    @ApiBearerAuth('access-token')
    @Get('iniciativas-atividades')
    //@Roles('PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal', '')
    async buscaMetasIniciativaAtividades(
        @Query('meta_ids', new ParseArrayPipe({ items: Number, separator: ',' })) ids: number[]
    ): Promise<ListDadosMetaIniciativaAtividadesDto> {
        return { linhas: await this.metaService.buscaMetasIniciativaAtividades(ids) };
    }

}
