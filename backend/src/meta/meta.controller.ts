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
import {
    ApiBearerAuth,
    ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiProduces,
    ApiTags
} from '@nestjs/swagger';
import { TipoPdm } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { CreateMetaDto, ListDadosMetaIniciativaAtividadesDto } from './dto/create-meta.dto';
import { FilterMetaDto, FilterRelacionadosDTO } from './dto/filter-meta.dto';
import { ListMetaDto } from './dto/list-meta.dto';
import { UpdateMetaDto } from './dto/update-meta.dto';
import { Meta, RelacionadosDTO } from './entities/meta.entity';
import { MetaService } from './meta.service';

@ApiTags('Meta')
@Controller('meta')
export class MetaController {
    private tipoPdm: TipoPdm = 'PDM';
    constructor(private readonly metaService: MetaService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['CadastroMeta.inserir'])
    async create(@Body() createMetaDto: CreateMetaDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.metaService.create(this.tipoPdm, createMetaDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    @ApiProduces(
        'application/json',
        'text/csv',
        'text/csv; unwind-all',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    @Roles(['CadastroMeta.listar'])
    async findAll(@Query() filters: FilterMetaDto, @CurrentUser() user: PessoaFromJwt): Promise<ListMetaDto> {
        return { linhas: await this.metaService.findAll(this.tipoPdm, filters, user) };
    }

    @ApiBearerAuth('access-token')
    @Get('iniciativas-atividades')
    @Roles(['CadastroMeta.listar'])
    async buscaMetasIniciativaAtividades(
        @Query('meta_ids', new ParseArrayPipe({ items: Number, separator: ',' })) ids: number[]
    ): Promise<ListDadosMetaIniciativaAtividadesDto> {
        return { linhas: await this.metaService.buscaMetasIniciativaAtividades(this.tipoPdm, ids) };
    }

    @ApiBearerAuth('access-token')
    @ApiNotFoundResponse()
    @Get('relacionados')
    @Roles(['CadastroMeta.listar'])
    async buscaRelacionados(
        @Query() dto: FilterRelacionadosDTO,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RelacionadosDTO> {
        return await this.metaService.buscaRelacionados(this.tipoPdm, dto, user);
    }

    // Precisa ficar depois do método buscaMetasIniciativaAtividades, a ordem da definição afeta como será dado os matching
    @ApiBearerAuth('access-token')
    @ApiNotFoundResponse()
    @Get(':id')
    @Roles(['CadastroMeta.listar'])
    async findOne(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<Meta> {
        const r = await this.metaService.findAll(this.tipoPdm, { id: params.id }, user);
        if (!r.length) throw new HttpException('Meta não encontrada.', 404);
        return r[0];
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroMeta.editar', 'CadastroMeta.inserir'])
    async update(
        @Param() params: FindOneParams,
        @Body() updateMetaDto: UpdateMetaDto,
        @CurrentUser() user: PessoaFromJwt
    ) {
        return await this.metaService.update(this.tipoPdm, +params.id, updateMetaDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroMeta.remover', 'CadastroMeta.inserir'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.metaService.remove(this.tipoPdm, +params.id, user);
        return '';
    }
}

@ApiTags('Meta Para Plano Setorial')
@Controller('meta-setorial')
export class MetaSetorialController {
    private tipoPdm: TipoPdm = 'PS';
    constructor(private readonly metaService: MetaService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['CadastroMetaPS.administrador_orcamento'])
    async create(@Body() createMetaDto: CreateMetaDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.metaService.create(this.tipoPdm, createMetaDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    @ApiProduces(
        'application/json',
        'text/csv',
        'text/csv; unwind-all',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    @Roles(['CadastroMetaPS.listar'])
    async findAll(@Query() filters: FilterMetaDto, @CurrentUser() user: PessoaFromJwt): Promise<ListMetaDto> {
        return { linhas: await this.metaService.findAll(this.tipoPdm, filters, user) };
    }

    @ApiBearerAuth('access-token')
    @Get('iniciativas-atividades')
    @Roles(['CadastroMeta.listar'])
    async buscaMetasIniciativaAtividades(
        @Query('meta_ids', new ParseArrayPipe({ items: Number, separator: ',' })) ids: number[]
    ): Promise<ListDadosMetaIniciativaAtividadesDto> {
        return { linhas: await this.metaService.buscaMetasIniciativaAtividades(this.tipoPdm, ids) };
    }

    @ApiBearerAuth('access-token')
    @ApiNotFoundResponse()
    @Get('relacionados')
    @Roles(['CadastroMetaPS.listar'])
    async buscaRelacionados(
        @Query() dto: FilterRelacionadosDTO,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RelacionadosDTO> {
        return await this.metaService.buscaRelacionados(this.tipoPdm, dto, user);
    }

    // Precisa ficar depois do método buscaMetasIniciativaAtividades, a ordem da definição afeta como será dado os matching
    @ApiBearerAuth('access-token')
    @ApiNotFoundResponse()
    @Get(':id')
    @Roles(['CadastroMetaPS.listar'])
    async findOne(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<Meta> {
        const r = await this.metaService.findAll(this.tipoPdm, { id: params.id }, user);
        if (!r.length) throw new HttpException('Meta não encontrada.', 404);
        return r[0];
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroMetaPS.editar', 'CadastroMetaPS.inserir'])
    async update(
        @Param() params: FindOneParams,
        @Body() updateMetaDto: UpdateMetaDto,
        @CurrentUser() user: PessoaFromJwt
    ) {
        return await this.metaService.update(this.tipoPdm, +params.id, updateMetaDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroMetaPS.remover', 'CadastroMetaPS.inserir'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.metaService.remove(this.tipoPdm, +params.id, user);
        return '';
    }
}
