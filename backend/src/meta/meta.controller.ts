import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpException,
    HttpStatus,
    Param,
    ParseArrayPipe,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiNoContentResponse, ApiNotFoundResponse, ApiTags } from '@nestjs/swagger';
import { TipoPdm } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { ListaDePrivilegios } from '../common/ListaDePrivilegios';
import { TipoPDM, TipoPdmType } from '../common/decorators/current-tipo-pdm';
import { FindOneParams } from '../common/decorators/find-params';
import { DetalheOrigensDto, ResumoOrigensMetasItemDto } from '../common/dto/origem-pdm.dto';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { CreateMetaDto, ListDadosMetaIniciativaAtividadesDto } from './dto/create-meta.dto';
import { FilterMetaDto, FilterRelacionadosDTO } from './dto/filter-meta.dto';
import { ListMetaDto } from './dto/list-meta.dto';
import { UpdateMetaDto } from './dto/update-meta.dto';
import { MetaItemDto, RelacionadosDTO } from './entities/meta.entity';
import { MetaService } from './meta.service';

@ApiTags('Meta')
@Controller('meta')
export class MetaController {
    public static WritePerm: ListaDePrivilegios[] = ['CadastroMeta.administrador_no_pdm'];
    public static ReadPerm: ListaDePrivilegios[] = [
        ...MetaController.WritePerm,
        'CadastroMeta.listar',
        'PDM.admin_cp',
        'PDM.coordenador_responsavel_cp',
        'PDM.ponto_focal',
    ];
    private tipoPdm: TipoPdm = 'PDM';
    constructor(private readonly metaService: MetaService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(MetaController.WritePerm)
    async create(@Body() createMetaDto: CreateMetaDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.metaService.create(this.tipoPdm, createMetaDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    @Roles(MetaController.ReadPerm)
    async findAll(@Query() filters: FilterMetaDto, @CurrentUser() user: PessoaFromJwt): Promise<ListMetaDto> {
        return { linhas: await this.metaService.findAll(this.tipoPdm, filters, user) };
    }

    @ApiBearerAuth('access-token')
    @Get('iniciativas-atividades')
    @Roles(MetaController.ReadPerm)
    async buscaMetasIniciativaAtividades(
        @Query('meta_ids', new ParseArrayPipe({ items: Number, separator: ',' })) ids: number[]
    ): Promise<ListDadosMetaIniciativaAtividadesDto> {
        return { linhas: await this.metaService.buscaMetasIniciativaAtividades(this.tipoPdm, ids) };
    }

    @ApiBearerAuth('access-token')
    @ApiNotFoundResponse()
    @Get('relacionados')
    @Roles(MetaController.ReadPerm)
    async buscaRelacionados(
        @Query() dto: FilterRelacionadosDTO,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RelacionadosDTO> {
        return await this.metaService.buscaRelacionados(this.tipoPdm, dto, user);
    }

    @ApiBearerAuth('access-token')
    @ApiNotFoundResponse()
    @Get(':id')
    @ApiExtraModels(ResumoOrigensMetasItemDto, DetalheOrigensDto)
    @Roles(MetaController.ReadPerm)
    async findOne(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<MetaItemDto> {
        const r = await this.metaService.findAll(this.tipoPdm, { id: params.id }, user);
        if (!r.length) throw new HttpException('Meta não encontrada.', 404);
        return r[0];
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(MetaController.WritePerm)
    async update(
        @Param() params: FindOneParams,
        @Body() updateMetaDto: UpdateMetaDto,
        @CurrentUser() user: PessoaFromJwt
    ) {
        return await this.metaService.update(this.tipoPdm, +params.id, updateMetaDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(MetaController.WritePerm)
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.metaService.remove(this.tipoPdm, +params.id, user);
        return '';
    }
}

@ApiTags('Meta Para Plano Setorial')
@Controller('plano-setorial-meta')
export class MetaSetorialController {
    public static WritePerm: ListaDePrivilegios[] = [
        'CadastroMetaPS.administrador_no_pdm', // sṍ pode editar de acordo com o perfil
        'CadastroPS.administrador', // edita qualquer item
        'CadastroPS.administrador_no_orgao', // edita qualquer meta onde o órgão é responsavel? SIM

        'CadastroMetaPDM.administrador_no_pdm',
        'CadastroPDM.administrador',
        'CadastroPDM.administrador_no_orgao',

    ];
    public static ReadPerm: ListaDePrivilegios[] = [...MetaSetorialController.WritePerm, 'CadastroMetaPS.listar'];
    constructor(private readonly metaService: MetaService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(MetaSetorialController.WritePerm)
    async create(
        @Body() createMetaDto: CreateMetaDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<RecordWithId> {
        return await this.metaService.create(tipo, createMetaDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    @Roles(MetaSetorialController.ReadPerm)
    async findAll(
        @Query() filters: FilterMetaDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<ListMetaDto> {
        return { linhas: await this.metaService.findAll(tipo, filters, user) };
    }

    @ApiBearerAuth('access-token')
    @Get('iniciativas-atividades')
    @Roles(MetaSetorialController.ReadPerm)
    async buscaMetasIniciativaAtividades(
        @Query('meta_ids', new ParseArrayPipe({ items: Number, separator: ',' })) ids: number[],
        @TipoPDM() tipo: TipoPdmType
    ): Promise<ListDadosMetaIniciativaAtividadesDto> {
        return { linhas: await this.metaService.buscaMetasIniciativaAtividades(tipo, ids) };
    }

    @ApiBearerAuth('access-token')
    @ApiNotFoundResponse()
    @Get('relacionados')
    @Roles(MetaSetorialController.ReadPerm)
    async buscaRelacionados(
        @Query() dto: FilterRelacionadosDTO,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<RelacionadosDTO> {
        return await this.metaService.buscaRelacionados(tipo, dto, user);
    }

    @ApiBearerAuth('access-token')
    @ApiNotFoundResponse()
    @Get(':id')
    @Roles(MetaSetorialController.ReadPerm)
    async findOne(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<MetaItemDto> {
        const r = await this.metaService.findAll(tipo, { id: params.id }, user);
        if (!r.length) throw new HttpException('Meta não encontrada.', 404);
        return r[0];
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(MetaSetorialController.WritePerm)
    async update(
        @Param() params: FindOneParams,
        @Body() updateMetaDto: UpdateMetaDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ) {
        return await this.metaService.update(tipo, +params.id, updateMetaDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(MetaSetorialController.WritePerm)
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt, @TipoPDM() tipo: TipoPdmType) {
        await this.metaService.remove(tipo, +params.id, user);
        return '';
    }
}
