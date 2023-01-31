import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams, FindTwoParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { CreateParamsPainelConteudoDto } from './dto/create-painel-conteudo.dto';
import { PainelConteudoDetalheUpdateRet, PainelConteudoUpsertRet, UpdatePainelConteudoDetalheDto, UpdatePainelConteudoVisualizacaoDto } from './dto/update-painel-conteudo.dto';
import { CreatePainelDto } from './dto/create-painel.dto';
import { DetailPainelVisualizacaoDto, PainelConteudoSerie, PainelConteudoSerieDto } from './dto/detalhe-painel.dto';
import { FilterPainelDto } from './dto/filter-painel.dto';
import { ListPainelDto } from './dto/list-painel.dto';
import { UpdatePainelDto } from './dto/update-painel.dto';
import { PainelDto } from './entities/painel.entity';
import { PainelService } from './painel.service';

@ApiTags('Painel')
@Controller('painel')
export class PainelController {
    constructor(private readonly painelService: PainelService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroPainel.inserir', 'CadastroMeta.inserir')
    async create(@Body() createPainelDto: CreatePainelDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.painelService.create(createPainelDto, user);
    }

    @Get()
    @ApiBearerAuth('access-token')
    @Roles('CadastroPainel.visualizar')
    async findAll(@Query() filters: FilterPainelDto, @CurrentUser() user: PessoaFromJwt): Promise<ListPainelDto> {
        return { linhas: await this.painelService.findAll(filters, user) };
    }

    @ApiBearerAuth('access-token')
    @Get(':id')
    @Roles('CadastroPainel.visualizar')
    async findOne(@Param() params: FindOneParams): Promise<PainelDto> {
        return await this.painelService.getDetail(+params.id);
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroPainel.editar', 'CadastroMeta.inserir')
    async update(@Param() params: FindOneParams, @Body() updatePainelDto: UpdatePainelDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.painelService.update(+params.id, updatePainelDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroPainel.remover', 'CadastroMeta.inserir')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.painelService.remove(+params.id, user);
        return '';
    }

    @Patch(':id/conteudo')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroPainel.inserir', 'CadastroMeta.inserir')
    async createConteudo(
        @Param() params: FindOneParams,
        @Body() createConteudoDto: CreateParamsPainelConteudoDto,
        @CurrentUser() user: PessoaFromJwt,
    ): Promise<PainelConteudoUpsertRet> {
        return await this.painelService.createConteudo(+params.id, createConteudoDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get(':id/conteudo/:id2/visualizacao')
    @Roles('CadastroPainel.visualizar')
    async detailPainelConteudoVisualizacao(@Param() params: FindTwoParams): Promise<DetailPainelVisualizacaoDto> {
        return await this.painelService.getPainelConteudoVisualizacao(+params.id2);
    }

    @ApiBearerAuth('access-token')
    @Patch(':id/conteudo/:id2/visualizacao')
    @Roles('CadastroPainel.editar', 'CadastroMeta.inserir')
    async updateConteudoVisualizacao(@Param() params: FindTwoParams, @Body() updatePainelConteudoDto: UpdatePainelConteudoVisualizacaoDto): Promise<RecordWithId> {
        return await this.painelService.updatePainelConteudoVisualizacao(+params.id, +params.id2, updatePainelConteudoDto);
    }

    @ApiBearerAuth('access-token')
    @Patch(':id/conteudo/:id2/detalhes')
    @Roles('CadastroPainel.editar', 'CadastroMeta.inserir')
    async updateConteudoDetalhe(@Param() params: FindTwoParams, @Body() updatePainelConteudoDetalhesDto: UpdatePainelConteudoDetalheDto): Promise<PainelConteudoDetalheUpdateRet> {
        return await this.painelService.updatePainelConteudoDetalhes(+params.id, +params.id2, updatePainelConteudoDetalhesDto);
    }

    @ApiBearerAuth('access-token')
    @Get(':id/conteudo/:id2/serie')
    @Roles('CadastroPainel.visualizar')
    async getPainelConteudoSerie(@Param() params: FindTwoParams): Promise<PainelConteudoSerie> {
        return await this.painelService.getPainelConteudoSerie(+params.id2);
    }
}
