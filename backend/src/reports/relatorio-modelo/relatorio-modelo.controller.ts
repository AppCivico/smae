import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { ListaDePrivilegios } from '../../common/ListaDePrivilegios';
import { FindOneParams } from '../../common/decorators/find-params';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { CreateRelatorioModeloDto } from './dto/create-relatorio-modelo.dto';
import {
    ColunasDoModeloDto,
    ColunasParametrizadasDto,
    FilterColunasRelatorioDto,
    FilterFontesRelatorioDto,
    FilterRelatorioModeloDto,
} from './dto/filter-relatorio-modelo.dto';
import { UpdateRelatorioModeloDto } from './dto/update-relatorio-modelo.dto';
import {
    ListRelatorioColunasDto,
    ListRelatorioFontesDto,
    ListRelatorioModeloDto,
    RelatorioModeloColunasDto,
    RelatorioModeloDetailDto,
} from './entities/relatorio-modelo.entity';
import { RelatorioModeloService } from './relatorio-modelo.service';

/**
 * Ler e **usar** um modelo exige o mesmo privilégio de executar o relatório da fonte — inclusive na
 * variante escopada por fonte, para atender perfis restritos (ex.: "Gestor(a) Transferências
 * Voluntárias", que tem só `Reports.executar.CasaCivil` ou `...:Transferencias`). O gate fino
 * (fonte × sistema da requisição) é aplicado no service; aqui é só o filtro grosso do guard.
 */
const PRIV_EXECUTAR: ListaDePrivilegios[] = [
    'Reports.executar.CasaCivil',
    'Reports.executar.CasaCivil:Demandas',
    'Reports.executar.PDM',
    'Reports.executar.Projetos',
    'Reports.executar.MDO',
    'Reports.executar.PlanoSetorial',
    'Reports.executar.ProgramaDeMetas',
];

/**
 * Escrever (criar/editar/remover) é um eixo **separado** de executar: quem roda relatórios usa
 * modelos, quem os mantém precisa de `Reports.modelo_admin.{sistema}`. Um por módulo, seguindo a
 * convenção de `Reports.executar.{sistema}`.
 *
 * Como em `PRIV_EXECUTAR`, aqui é só o filtro grosso do guard — aceita o privilégio de qualquer
 * sistema. O gate fino é do service: `podeEditar` confere o do **sistema da requisição**, e
 * `assertPodeEscrever` exige, além disso, `Reports.executar.{sistema}` da fonte. Dentro disso
 * valem as regras de sempre: o criador mexe no que é seu, e quem tem `Reports.remover.{sistema}`
 * faz a faxina de modelos de terceiros.
 */
const PRIV_MODELO_ADMIN: ListaDePrivilegios[] = [
    'Reports.modelo_admin.CasaCivil',
    'Reports.modelo_admin.PDM',
    'Reports.modelo_admin.Projetos',
    'Reports.modelo_admin.MDO',
    'Reports.modelo_admin.PlanoSetorial',
    'Reports.modelo_admin.ProgramaDeMetas',
];

@ApiTags('Relatórios - Modelos')
@Controller('relatorio-modelo')
export class RelatorioModeloController {
    constructor(private readonly relatorioModeloService: RelatorioModeloService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(PRIV_MODELO_ADMIN, 'Criar modelo de relatório')
    async create(@Body() dto: CreateRelatorioModeloDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.relatorioModeloService.create(dto, user);
    }

    /**
     * Fontes que aceitam modelo no sistema da requisição, com as colunas de cada uma — é a primeira
     * chamada da tela de modelos, já que `GET colunas` exige `fonte`.
     * Rota declarada antes de `:id` para não ser capturada por ela.
     */
    @Get('fontes')
    @ApiBearerAuth('access-token')
    @Roles(PRIV_EXECUTAR, 'Listar fontes disponíveis para modelos')
    @ApiOkResponse({ type: ListRelatorioFontesDto })
    async fontes(
        @Query() filters: FilterFontesRelatorioDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListRelatorioFontesDto> {
        return this.relatorioModeloService.listFontes(filters, user);
    }

    /**
     * União das colunas que a fonte declara, com os rótulos padrão — **é a lista para montar
     * um modelo**.
     *
     * O modelo é criado antes de se saber com que parâmetros vai rodar, e é reusado em
     * execuções diferentes; por isso ele cita a união das variantes. Quem recorta é a
     * execução: o pós-processamento fica com a interseção entre o modelo e o schema daquela
     * execução, preservando a ordem escolhida (ver `resolverColunas`).
     *
     * A resposta traz `parametrizado: false`. Para pré-visualizar o recorte de uma combinação
     * específica existe `POST /relatorio-modelo/colunas`.
     *
     * Rota declarada antes de `:id` para não ser capturada por ela.
     */
    @Get('colunas')
    @ApiBearerAuth('access-token')
    @Roles(PRIV_EXECUTAR, 'Listar colunas disponíveis de uma fonte')
    @ApiOkResponse({ type: ListRelatorioColunasDto })
    async colunas(
        @Query() filters: FilterColunasRelatorioDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListRelatorioColunasDto> {
        return await this.relatorioModeloService.listColunas(filters.fonte, undefined, user);
    }

    /**
     * Pré-visualização: colunas de uma fonte **para uma combinação de parâmetros**.
     *
     * Recebe os mesmos `parametros` que irão para `POST /relatorios` e devolve o schema que
     * aquela execução produz — sem as colunas das variantes que não se aplicam (as de
     * meta/iniciativa/atividade num orçamento de projeto, por exemplo) e já com os rótulos
     * configurados no PDM ("Ação estratégica" no lugar de "Iniciativa").
     *
     * **Opcional.** Montar modelo não depende disto: a lista para montar é a união
     * (`GET /colunas`), e o recorte acontece na execução. Serve para responder "com estes
     * parâmetros, o que este modelo vai me dar?" antes de rodar.
     *
     * É `POST` por causa do corpo: `parametros` é um objeto aninhado, que não cabe bem numa
     * query string. Não escreve nada.
     */
    @Post('colunas')
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth('access-token')
    @Roles(PRIV_EXECUTAR, 'Listar colunas de uma fonte para os parâmetros informados')
    @ApiOkResponse({ type: ListRelatorioColunasDto })
    async colunasParametrizadas(
        @Body() dto: ColunasParametrizadasDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListRelatorioColunasDto> {
        return await this.relatorioModeloService.listColunas(dto.fonte, dto.parametros ?? {}, user);
    }

    @Get()
    @ApiBearerAuth('access-token')
    @Roles(PRIV_EXECUTAR, 'Listar modelos de relatório')
    @ApiOkResponse({ type: ListRelatorioModeloDto })
    async findAll(
        @Query() filters: FilterRelatorioModeloDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListRelatorioModeloDto> {
        return { linhas: await this.relatorioModeloService.findAll(filters, user) };
    }

    @Get(':id')
    @ApiBearerAuth('access-token')
    @Roles(PRIV_EXECUTAR, 'Detalhe de um modelo de relatório')
    @ApiOkResponse({ type: RelatorioModeloDetailDto })
    async findOne(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RelatorioModeloDetailDto> {
        return await this.relatorioModeloService.findOne(params.id, user);
    }

    /**
     * Colunas que **este modelo entrega**, por arquivo, na ordem e com os rótulos que ele define.
     *
     * É a rota de quem vai *rodar* o relatório: `GET /relatorio-modelo/colunas` responde "o que
     * posso escolher" (união da fonte, para montar um modelo), esta responde "o que este modelo
     * vai me dar". Exige só o privilégio de executar a fonte — usar um modelo não exige poder
     * administrá-lo.
     *
     * Sem parâmetros o recorte é contra a união das variantes, ou seja, o superconjunto do que
     * sairá. Para o recorte exato de uma execução use `POST /relatorio-modelo/:id/colunas`.
     */
    @Get(':id/colunas')
    @ApiBearerAuth('access-token')
    @Roles(PRIV_EXECUTAR, 'Colunas entregues por um modelo de relatório')
    @ApiOkResponse({ type: RelatorioModeloColunasDto })
    async colunasDoModelo(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RelatorioModeloColunasDto> {
        return await this.relatorioModeloService.listColunasDoModelo(params.id, undefined, user);
    }

    /**
     * Igual ao `GET`, mas recortado para **uma combinação de parâmetros**: devolve exatamente as
     * colunas e os rótulos que o relatório rodado com este modelo e estes parâmetros vai produzir.
     *
     * É `POST` por causa do corpo (`parametros` é um objeto aninhado, que não cabe bem numa query
     * string). Não escreve nada.
     */
    @Post(':id/colunas')
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth('access-token')
    @Roles(PRIV_EXECUTAR, 'Colunas entregues por um modelo para os parâmetros informados')
    @ApiOkResponse({ type: RelatorioModeloColunasDto })
    async colunasDoModeloParametrizadas(
        @Param() params: FindOneParams,
        @Body() dto: ColunasDoModeloDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RelatorioModeloColunasDto> {
        return await this.relatorioModeloService.listColunasDoModelo(params.id, dto.parametros ?? {}, user);
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(PRIV_MODELO_ADMIN, 'Editar modelo de relatório')
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdateRelatorioModeloDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.relatorioModeloService.update(params.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(PRIV_MODELO_ADMIN, 'Remover modelo de relatório')
    @ApiResponse({ description: 'sucesso ao remover', status: 204 })
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.relatorioModeloService.remove(params.id, user);
        return null;
    }
}
