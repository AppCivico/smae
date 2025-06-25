import { BadRequestException, forwardRef, HttpException, Inject, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Cron } from '@nestjs/schedule';
import { Prisma, TipoProjeto } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DateTime } from 'luxon';
import { AuthService } from 'src/auth/auth.service';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaHelpers } from 'src/common/PrismaHelpers';
import { JOB_IMPORTACAO_ORCAMENTO_LOCK } from 'src/common/dto/locks';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { RetryPromise } from 'src/common/retryPromise';
import { DotacaoProcessoNotaService } from 'src/dotacao/dotacao-processo-nota.service';
import { DotacaoProcessoService } from 'src/dotacao/dotacao-processo.service';
import { DotacaoService } from 'src/dotacao/dotacao.service';
import { MetaService } from 'src/meta/meta.service';
import { CreateOrcamentoRealizadoItemDto } from 'src/orcamento-realizado/dto/create-orcamento-realizado.dto';
import { OrcamentoRealizadoService as PdmOrcamentoRealizadoService } from 'src/orcamento-realizado/orcamento-realizado.service';
import { OrcamentoRealizadoService as ProjetoOrcamentoRealizadoService } from 'src/pp/orcamento-realizado/orcamento-realizado.service';
import { ProjetoGetPermissionSet, ProjetoService } from 'src/pp/projeto/projeto.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UploadService } from 'src/upload/upload.service';
import { read, utils, writeXLSX } from 'xlsx';
import { TipoPdmType } from '../common/decorators/current-tipo-pdm';
import { PaginatedDto, PAGINATION_TOKEN_TTL } from '../common/dto/paginated.dto';
import { FormatValidationErrors } from '../common/helpers/FormatValidationErrors';
import { Stream2Buffer } from '../common/helpers/Streaming';
import { PlanoSetorialController } from '../pdm/pdm.controller';
import { PortfolioDto } from '../pp/portfolio/entities/portfolio.entity';
import { ExtraiComplementoDotacao, TrataDotacaoGrande } from '../sof-api/sof-api.service';
import { CreateImportacaoOrcamentoDto, FilterImportacaoOrcamentoDto } from './dto/create-importacao-orcamento.dto';
import { ImportacaoOrcamentoDto, LinhaCsvInputDto } from './entities/importacao-orcamento.entity';
import { ColunasNecessarias, OrcamentoImportacaoHelpers, OutrasColumns } from './importacao-orcamento.common';
import { PDMGetPermissionSet } from '../pdm/pdm.service';
const XLSX_ZAHL_PAYLOAD = require('xlsx/dist/xlsx.zahl');

function Str2NumberOrNull(str: string | null): number | null {
    if (str === null) return null;

    return +str;
}

class NextPageTokenJwtBody {
    offset: number;
    ipp: number;
}

type ProcessaLinhaParams = {
    metasIds: number[];
    iniciativasIds: number[];
    atividadesIds: number[];
    projetosIds: number[];
    metasCodigos2Ids: Record<string, number>;
    projetosCodigos2Ids: Record<string, number>;
    iniciativasCodigos2Ids: Record<string, number>;
    atividadesCodigos2Ids: Record<string, number>;
    eh_projeto: boolean;
    eh_metas: boolean;
    anosPort: number[];
    anosPdm: Record<string, number[]>;
    portfolio_id: number | null;
};

function mapObjectToTypes(obj: Record<string, unknown>): Record<string, string> {
    const keys = Object.keys(obj);

    const newObj: Record<string, string> = {};
    keys.forEach((key) => {
        newObj[key] = typeof obj[key];
    });

    return newObj;
}

function toFixed2ButString(n: number): string {
    const with2Decimals = n.toString().match(/^-?\d+(?:\.\d{0,2})?/);

    if (with2Decimals && with2Decimals[0]) return with2Decimals[0];
    return n.toFixed();
}

@Injectable()
export class ImportacaoOrcamentoService {
    private readonly logger = new Logger(ImportacaoOrcamentoService.name);
    private enabled = true;

    constructor(
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
        private readonly uploadService: UploadService,
        private readonly dotacaoService: DotacaoService,
        private readonly dotacaoProcessoService: DotacaoProcessoService,
        private readonly dotacaoProcessoNotaService: DotacaoProcessoNotaService,

        @Inject(forwardRef(() => ProjetoService)) private readonly projetoService: ProjetoService,
        @Inject(forwardRef(() => AuthService)) private readonly authService: AuthService,
        @Inject(forwardRef(() => MetaService)) private readonly metaService: MetaService,

        @Inject(forwardRef(() => PdmOrcamentoRealizadoService))
        private readonly pdmOrcResService: PdmOrcamentoRealizadoService,
        @Inject(forwardRef(() => ProjetoOrcamentoRealizadoService))
        private readonly ppOrcResService: ProjetoOrcamentoRealizadoService
    ) {
        if (process.env['DISABLE_IMPORTACAO_ORCAMENTO_CRONTAB'] || process.env['DISABLED_CRONTABS'] == 'all') {
            this.enabled = false;
        }
    }

    async create(dto: CreateImportacaoOrcamentoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const arquivo_id = this.uploadService.checkUploadOrDownloadToken(dto.upload);

        const sistema = user.assertOneModuloSistema('criar', 'importações');
        if (!dto.tipo_projeto && !dto.tipo_pdm) {
            if (sistema === 'MDO') {
                dto.tipo_projeto = 'MDO';
            } else if (sistema === 'Projetos') {
                dto.tipo_projeto = 'PP';
            } else if (sistema === 'PDM') {
                dto.tipo_pdm = 'PDM';
            } else if (sistema === 'PlanoSetorial' || sistema === 'ProgramaDeMetas') {
                dto.tipo_pdm = 'PS';
            }
        } else {
            if (dto.tipo_pdm && dto.tipo_projeto) {
                throw new BadRequestException('Você deve informar apenas um tipo, não ambos.');
            }

            if (!dto.tipo_pdm && dto.pdm_id) {
                throw new BadRequestException('Você deve informar o tipo de PDM ou Plano Setorial');
            }

            if (!dto.tipo_projeto && dto.portfolio_id) {
                throw new BadRequestException('Você deve informar o tipo de Projeto ou Obras');
            }
        }

        if (dto.pdm_id !== undefined) {
            if (dto.tipo_pdm === 'PDM' && !user.hasSomeRoles(['CadastroMeta.orcamento'])) {
                throw new BadRequestException('Você não tem permissão para Meta');
            }

            if (dto.tipo_pdm === 'PS' && !user.hasSomeRoles(PlanoSetorialController.OrcamentoWritePerms)) {
                throw new BadRequestException('Você não tem permissão para Meta do Plano Setorial');
            }
        }

        if (dto.portfolio_id !== undefined) {
            if (dto.tipo_projeto === 'PP' && !user.hasSomeRoles(['Projeto.orcamento'])) {
                throw new BadRequestException('Você não tem permissão para Projetos');
            }

            if (dto.tipo_projeto === 'MDO' && !user.hasSomeRoles(['ProjetoMDO.orcamento'])) {
                throw new BadRequestException('Você não tem permissão para Obras');
            }
        }

        if (!dto.portfolio_id && !dto.pdm_id) {
            throw new BadRequestException('Você deve informar um portfolio ou um pdm para importar o orçamento.');
        }

        // TODO verificar quais Metas as pessoa pode ver, e assim por diante em cada um dos casos acima

        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                if (dto.pdm_id && dto.tipo_pdm) {
                    const pdm = await prismaTxn.pdm.findUnique({
                        where: { id: dto.pdm_id },
                        select: { ativo: true, tipo: true },
                    });
                    const tipo = dto.tipo_pdm == 'PDM' ? 'Programa de Metas' : 'Plano Setorial';
                    if (!pdm) throw new BadRequestException(`${tipo} ID ${dto.pdm_id} não encontrado`);

                    if (pdm.ativo === false)
                        throw new BadRequestException(
                            `${tipo} ID ${dto.pdm_id} não está ativo, não é possível importar orçamento`
                        );
                }

                const importacao = await prismaTxn.importacaoOrcamento.create({
                    data: {
                        criado_por: user.id,
                        arquivo_id: arquivo_id,
                        pdm_id: dto.pdm_id,
                        portfolio_id: dto.portfolio_id,
                        modulo_sistema: sistema,
                    },
                    select: { id: true },
                });

                return importacao;
            }
        );

        this.executaImportacaoOrcamento(created.id).catch((err) => {
            this.logger.error(`executaImportacaoOrcamento failed: ${err}`);
        });

        return { id: created.id };
    }

    private decodeNextPageToken(jwt: string | undefined): NextPageTokenJwtBody | null {
        let tmp: NextPageTokenJwtBody | null = null;
        try {
            if (jwt) tmp = this.jwtService.verify(jwt) as NextPageTokenJwtBody;
        } catch {
            throw new HttpException('Param next_page_token is invalid', 400);
        }
        return tmp;
    }

    private encodeNextPageToken(opt: NextPageTokenJwtBody): string {
        return this.jwtService.sign(opt);
    }

    async findAll_portfolio(user: PessoaFromJwt): Promise<PortfolioDto[]> {
        const sistema = user.assertOneModuloSistema('buscar', 'portfólios');
        const filtros: Prisma.Enumerable<Prisma.PortfolioWhereInput> = [];

        if (sistema == 'Projetos' && user.hasSomeRoles(['Projeto.orcamento'])) {
            const projetos = await this.projetoService.findAllIds('PP', user);
            this.logger.warn(`só pode ver os projetos ${projetos.map((r) => r.id).join(',')}`);

            filtros.push({
                OR: [
                    {
                        Projeto: {
                            some: {
                                id: {
                                    in: projetos.map((r) => r.id),
                                },
                            },
                        },
                    },
                ],
            });
        } else if (sistema == 'MDO' && user.hasSomeRoles(['ProjetoMDO.orcamento'])) {
            const projetos = await this.projetoService.findAllIds('MDO', user);
            this.logger.warn(`só pode ver os projetos MDO ${projetos.map((r) => r.id).join(',')}`);

            filtros.push({
                OR: [
                    {
                        Projeto: {
                            some: {
                                id: {
                                    in: projetos.map((r) => r.id),
                                },
                            },
                        },
                    },
                ],
            });
        } else {
            // nao retorna nenhum
            filtros.push({ id: -1 });
        }

        const listActive = await this.prisma.portfolio.findMany({
            where: {
                removido_em: null,
                AND: filtros,
            },
            select: {
                id: true,
                titulo: true,
                nivel_maximo_tarefa: true,
                nivel_regionalizacao: true,
                modelo_clonagem: true,
                orgaos: {
                    select: {
                        orgao: {
                            select: {
                                sigla: true,
                                descricao: true,
                                id: true,
                            },
                        },
                    },
                },
            },
            orderBy: { titulo: 'asc' },
        });

        return listActive.map((r) => {
            return {
                pode_editar: false,
                ...r,
                orgaos: r.orgaos.map((rr) => rr.orgao),
            };
        });
    }

    async findAll(
        filters: FilterImportacaoOrcamentoDto,
        user: PessoaFromJwt
    ): Promise<PaginatedDto<ImportacaoOrcamentoDto>> {
        const sistema = user.assertOneModuloSistema('buscar', 'importações');

        let tem_mais = false;
        let token_proxima_pagina: string | null = null;

        let ipp = filters.ipp ? filters.ipp : 25;
        let offset = 0;
        const decodedPageToken = this.decodeNextPageToken(filters.token_proxima_pagina);

        if (decodedPageToken) {
            offset = decodedPageToken.offset;
            ipp = decodedPageToken.ipp;
        }

        // 1. Vamos construir cláusulas de permissão específicas.
        const permissionOrClauses: Prisma.Enumerable<Prisma.ImportacaoOrcamentoWhereInput> = [];

        // Permissões de Projeto/Portfolio
        const podeVerPP = sistema == 'Projetos' && user.hasSomeRoles(['Projeto.orcamento']);
        const podeVerMDO = sistema == 'MDO' && user.hasSomeRoles(['ProjetoMDO.orcamento']);

        if (podeVerPP || podeVerMDO) {
            const tipoProjeto = podeVerPP ? 'PP' : 'MDO';

            const projetos = await ProjetoGetPermissionSet(tipoProjeto, user);

            permissionOrClauses.push({
                portfolio: {
                    tipo_projeto: tipoProjeto,
                    Projeto: {
                        some: {
                            AND: projetos,
                        },
                    },
                },
            });
        }

        // Permissões de Metas/PDM
        const podeVerPDM = sistema == 'PDM' && user.hasSomeRoles(['CadastroMeta.orcamento']);
        const podeVerPS =
            (sistema == 'PlanoSetorial' || sistema == 'ProgramaDeMetas') &&
            user.hasSomeRoles(PlanoSetorialController.OrcamentoWritePerms);

        if (podeVerPDM || podeVerPS) {
            const tipoMeta = podeVerPDM ? '_PDM' : sistema == 'PlanoSetorial' ? '_PS' : 'PDM_AS_PS';
            const tipoPdm = tipoMeta === '_PS' ? 'PS' : 'PDM';

            const pdm = await PDMGetPermissionSet(tipoMeta, user, this.prisma);
            permissionOrClauses.push({
                pdm: {
                    tipo: tipoPdm,
                    AND: pdm,
                },
            });
        }

        // Se o array de permissões está vazio, o usuário não tem acesso a nada.
        // Prisma trata `OR: []` como "não encontre nada", o que é exatamente o que queremos.
        if (permissionOrClauses.length === 0) {
            this.logger.warn(`Usuário não possui permissão para ver importações de orçamento de Projetos ou Metas.`);
        }

        const where: Prisma.ImportacaoOrcamentoWhereInput = {
            OR: permissionOrClauses,
        };

        const registros = await this.prisma.importacaoOrcamento.findMany({
            where,
            include: {
                arquivo: {
                    select: { tamanho_bytes: true, nome_original: true },
                },
                saida_arquivo: {
                    select: { tamanho_bytes: true, nome_original: true },
                },
                criador: { select: { id: true, nome_exibicao: true } },
                pdm: { select: { id: true, nome: true } },
                portfolio: { select: { id: true, titulo: true } },
            },
            orderBy: [{ criado_em: 'desc' }],
            skip: offset,
            take: ipp + 1,
        });

        const linhas = registros.map((r) => {
            return {
                id: r.id,
                arquivo: {
                    id: r.arquivo_id,
                    tamanho_bytes: r.arquivo.tamanho_bytes,
                    nome_original: r.arquivo.nome_original,
                    token: this.uploadService.getDownloadToken(r.arquivo_id, '1d').download_token,
                },
                saida_arquivo:
                    r.saida_arquivo_id && r.saida_arquivo
                        ? {
                              id: r.saida_arquivo_id,
                              tamanho_bytes: r.saida_arquivo.tamanho_bytes,
                              nome_original: r.saida_arquivo.nome_original,
                              token: this.uploadService.getDownloadToken(r.saida_arquivo_id, '1d').download_token,
                          }
                        : null,
                pdm: r.pdm,
                portfolio: r.portfolio,
                criado_por: r.criador,
                criado_em: r.criado_em,
                processado_em: r.processado_em ?? null,
                processado_errmsg: r.processado_errmsg,
                linhas_importadas: r.linhas_importadas,
                linhas_recusadas: r.linhas_recusadas,
            };
        });

        if (linhas.length > ipp) {
            tem_mais = true;
            linhas.pop();
            token_proxima_pagina = this.encodeNextPageToken({ ipp: ipp, offset: offset + ipp });
        }

        return {
            tem_mais: tem_mais,
            token_ttl: PAGINATION_TOKEN_TTL,
            token_proxima_pagina: token_proxima_pagina,
            linhas,
        };
    }

    @Cron('* * * * *')
    async handleCron() {
        if (!this.enabled) return;

        await this.prisma.$transaction(
            async (prisma: Prisma.TransactionClient) => {
                this.logger.debug(`Adquirindo lock para verificação de upload do orçamento`);
                const locked: {
                    locked: boolean;
                }[] = await prisma.$queryRaw`SELECT
                pg_try_advisory_xact_lock(${JOB_IMPORTACAO_ORCAMENTO_LOCK}) as locked
            `;
                if (!locked[0].locked) {
                    this.logger.debug(`Já está em processamento...`);
                    return;
                }

                await this.verificaImportacaoOrcamento();
            },
            {
                maxWait: 30000,
                timeout: 60 * 1000 * 5,
                isolationLevel: 'Serializable',
            }
        );
    }

    async executaImportacaoOrcamento(filaId: number) {
        try {
            await this.verificaImportacaoOrcamento(filaId);
        } catch (error) {
            this.logger.error(`Falha ao executar verificaImportacaoOrcamento(${filaId}): ${error}`);
        }
    }

    private async verificaImportacaoOrcamento(filtroId?: number | undefined) {
        const pending = await this.prisma.importacaoOrcamento.findMany({
            where: {
                processado_em: null,
                AND: [
                    {
                        OR: [
                            { id: filtroId },
                            { congelado_em: null },
                            {
                                congelado_em: {
                                    lt: DateTime.now().minus({ hour: 1 }).toJSDate(),
                                },
                            },
                        ],
                    },
                ],
            },
            select: {
                id: true,
                congelado_em: true,
            },
        });

        for (const job of pending) {
            if (job.congelado_em && Math.abs(DateTime.fromJSDate(job.congelado_em).diffNow().as('seconds')) < 120) {
                this.logger.warn(`Job ${job.id} já foi congelado há pouco tempo`);
                continue;
            } else if (job.congelado_em === null) {
                const updated = await this.prisma.importacaoOrcamento.updateMany({
                    where: { id: job.id, congelado_em: null },
                    data: {
                        congelado_em: new Date(Date.now()),
                    },
                });

                if (updated.count === 0) {
                    this.logger.warn(`Job ${job.id} já foi iniciado`);
                    continue;
                }
            } else {
                // atualiza o timestamp da ultima vez que foi congelado pra processar
                await this.prisma.importacaoOrcamento.update({
                    where: { id: job.id },
                    data: {
                        congelado_em: new Date(Date.now()),
                    },
                });
            }

            try {
                await this.processaArquivo(job.id);
            } catch (error) {
                console.log(error);
                this.logger.error(error);

                await this.prisma.importacaoOrcamento.update({
                    where: { id: job.id },
                    data: {
                        linhas_importadas: 0,
                        processado_errmsg: `Erro ao processar arquivo: ${error}`,
                        processado_em: new Date(Date.now()),
                    },
                });
            }
        }
    }

    private async processaArquivo(id: number) {
        const job = await this.prisma.importacaoOrcamento.findUniqueOrThrow({
            where: { id: +id },
            include: {
                arquivo: {
                    select: { nome_original: true },
                },
                pdm: {
                    select: { tipo: true },
                },
                portfolio: {
                    select: { tipo_projeto: true },
                },
            },
        });

        const nome_arquivo = job.arquivo.nome_original.replace(/[^A-Za-z0-9.]/g, '-');

        const inputBuffer = await Stream2Buffer(
            (await this.uploadService.getReadableStreamById(job.arquivo_id)).stream
        );

        const inputXLSX = read(inputBuffer, {
            type: 'buffer',
        });

        const sheetName = inputXLSX.SheetNames[0];
        const sheet = inputXLSX.Sheets[sheetName];
        const range = utils.decode_range(sheet['!ref']!);

        const colunaHeaderIndex = OrcamentoImportacaoHelpers.createColumnHeaderIndex(sheet, [
            ...ColunasNecessarias,
            ...OutrasColumns,
        ]);

        const outputXLSX = utils.book_new();
        const row = [];
        [...ColunasNecessarias, ...OutrasColumns].forEach((columnName) => {
            const colIndex = colunaHeaderIndex[columnName];
            if (colIndex >= 0) row.push(columnName);
        });
        row.push('Status');

        const aoaWithHeader = [row];
        const outputSheet = utils.aoa_to_sheet(aoaWithHeader);
        utils.book_append_sheet(outputXLSX, outputSheet, sheetName);

        const projetosIds: number[] = [];
        const metasIds: number[] = [];

        // se foi criado sem dono, pode todos Meta|Projeto, os métodos foram findAllIds
        // foram adaptados pra retornar todos os ids dos items não removidos
        const user = await this.authService.pessoaJwtFromId(job.criado_por);

        let tipo_projeto: TipoProjeto | undefined = undefined;

        const tipo_pdm: TipoPdmType | undefined =
            job.modulo_sistema == 'ProgramaDeMetas'
                ? 'PDM_AS_PS'
                : job.modulo_sistema == 'PlanoSetorial'
                  ? '_PS'
                  : job.modulo_sistema == 'PDM'
                    ? '_PDM'
                    : undefined;
        if (job.portfolio_id) {
            tipo_projeto = job.portfolio!.tipo_projeto;
            const projetosDoUser = await this.projetoService.findAllIds(tipo_projeto, user, job.portfolio_id);
            projetosIds.push(...projetosDoUser.map((r) => r.id));
        } else if (job.pdm_id) {
            if (!tipo_pdm) throw new HttpException('Tipo de PDM não definido', 400);
            const metasDoUser = await this.metaService.findAllIds(tipo_pdm, user, job.pdm_id);

            metasIds.push(...metasDoUser.map((r) => r.id));
        }

        this.logger.log(JSON.stringify({ job, metasIds, projetosIds }));

        const projetosCodigos2Ids = await PrismaHelpers.prismaCodigo2IdMap(
            this.prisma,
            'projeto',
            projetosIds,
            true,
            'portfolio_id',
            job.portfolio_id
        );
        const metasCodigos2Ids = await PrismaHelpers.prismaCodigo2IdMap(
            this.prisma,
            'meta',
            metasIds,
            false,
            'pdm_id',
            job.pdm_id
        );

        const {
            iniciativasIds,
            atividadesIds,
            iniciativasCodigos2Ids,
            atividadesCodigos2Ids,
        }: {
            iniciativasIds: number[];
            atividadesIds: number[];
            iniciativasCodigos2Ids: Record<string, number>;
            atividadesCodigos2Ids: Record<string, number>;
        } = await this.carregaIniciativaAtiv(metasIds);

        let linhas_importadas = 0;
        let linhas_recusadas = 0;

        for (let rowIndex = range.s.r + 1; rowIndex <= range.e.r; rowIndex++) {
            const row: any = [];
            const col2row: any = {};

            [...ColunasNecessarias, ...OutrasColumns].forEach((columnName) => {
                const colIndex = colunaHeaderIndex[columnName];

                if (colIndex >= 0) {
                    const cellAddress = utils.encode_cell({ c: colIndex, r: rowIndex });
                    const cellValue = sheet[cellAddress]?.v;

                    // traduzindo algumas colunas do excel pro DTO
                    if (columnName === 'ano') {
                        col2row['ano_referencia'] = cellValue;
                    } else if (
                        ['valor_empenho', 'valor_liquidado', 'percentual_empenho', 'percentual_liquidado'].includes(
                            columnName
                        )
                    ) {
                        if (cellValue === undefined || String(cellValue).trim() === '') {
                            col2row[columnName] = null;
                        } else {
                            // essas quatro colunas vem como float, e então as vezes vem no excel ta "83242998.52" mas chega aqui "83242998.52000001"
                            // então vamos fazer o toFixed(2)
                            col2row[columnName] = +cellValue;

                            if (typeof col2row[columnName] === 'number') {
                                col2row[columnName] = toFixed2ButString(col2row[columnName]);
                            }
                        }
                    } else if (cellValue !== undefined && cellValue !== '' && columnName === 'processo') {
                        col2row[columnName] = `${cellValue}`;
                    } else if (cellValue !== '') {
                        col2row[columnName] = cellValue;
                    } else {
                        col2row[columnName] = undefined;
                    }

                    row.push(cellValue);
                }
            });

            console.log(rowIndex, row);
            const anosPort: number[] = [];
            const anosPdm: Record<string, typeof anosPort> = {};
            if (job.portfolio_id) {
                anosPort.push(
                    ...(
                        await this.prisma.portfolio.findFirstOrThrow({
                            where: { id: job.portfolio_id },
                            select: { orcamento_execucao_disponivel_meses: true },
                        })
                    ).orcamento_execucao_disponivel_meses
                );
            } else if (job.pdm_id) {
                const anosPdmRows = await this.prisma.pdmOrcamentoConfig.findMany({
                    where: { pdm_id: job.pdm_id },
                    select: { ano_referencia: true, execucao_disponivel_meses: true },
                });

                for (const r of anosPdmRows) {
                    anosPdm[r.ano_referencia] = r.execucao_disponivel_meses;
                }
            }

            let feedback: string;

            try {
                feedback = await this.processaRow(
                    col2row,
                    {
                        metasIds,
                        iniciativasIds,
                        atividadesIds,
                        projetosIds,
                        metasCodigos2Ids,
                        projetosCodigos2Ids,
                        iniciativasCodigos2Ids,
                        atividadesCodigos2Ids,
                        eh_metas: job.pdm_id !== null,
                        eh_projeto: job.portfolio_id !== null,
                        anosPort,
                        anosPdm,
                        portfolio_id: job.portfolio_id,
                    },
                    user,
                    tipo_projeto,
                    tipo_pdm
                );
            } catch (error) {
                feedback = `Erro durante processamento: ${error}`;
            }

            if (feedback) {
                linhas_recusadas++;
            } else {
                feedback = 'Importado com sucesso';
                linhas_importadas++;
            }

            row.push(feedback);

            const newRow = [row];
            utils.sheet_add_aoa(outputSheet, newRow, { origin: 'A' + (rowIndex + 1) });
        }

        const buffer = writeXLSX(outputXLSX, {
            type: 'buffer',
            bookType: 'xlsx',
            numbers: XLSX_ZAHL_PAYLOAD,
            compression: true,
        });

        const upload_id = await RetryPromise(
            () => {
                return this.uploadService.upload(
                    {
                        tipo: 'IMPORTACAO_ORCAMENTO',
                        arquivo: buffer,
                        descricao: `${nome_arquivo}-processado.xlsx`,
                    },
                    user,
                    { buffer },
                    ''
                );
            },
            50,
            1000,
            100
        );

        await RetryPromise(() =>
            this.prisma.importacaoOrcamento.update({
                where: {
                    id: job.id,
                },
                data: {
                    saida_arquivo_id: upload_id,
                    processado_em: new Date(Date.now()),
                    linhas_importadas,
                    linhas_recusadas,
                },
            })
        );
    }

    private async carregaIniciativaAtiv(metasIds: number[]) {
        const iniciativasIds: number[] = [];
        const atividadesIds: number[] = [];
        const iniciativasCodigos2Ids: Record<string, number> = {};
        const atividadesCodigos2Ids: Record<string, number> = {};
        if (metasIds.length > 0) {
            const iniciativas = await this.prisma.iniciativa.findMany({
                where: {
                    meta_id: { in: metasIds },
                    removido_em: null,
                },
                select: {
                    id: true,
                    codigo: true,
                    meta_id: true,
                    atividade: {
                        select: {
                            id: true,
                            codigo: true,
                        },
                        where: { removido_em: null },
                    },
                },
            });

            for (const iniciativa of iniciativas) {
                iniciativasCodigos2Ids[`${iniciativa.meta_id}-${iniciativa.codigo}`.toLowerCase()] = iniciativa.id;
                iniciativasIds.push(iniciativa.id);

                for (const atividade of iniciativa.atividade) {
                    atividadesCodigos2Ids[`${iniciativa.meta_id}-${iniciativa.id}-${atividade.codigo}`.toLowerCase()] =
                        atividade.id;
                    atividadesIds.push(atividade.id);
                }
            }
        }

        return { iniciativasIds, atividadesIds, iniciativasCodigos2Ids, atividadesCodigos2Ids };
    }

    async processaRow(
        col2row: any,
        params: ProcessaLinhaParams,
        user: PessoaFromJwt,
        tipo_projeto: TipoProjeto | undefined,
        tipo_pdm: TipoPdmType | undefined
    ): Promise<string> {
        const row = plainToInstance(LinhaCsvInputDto, col2row);
        console.log({ row, col2row });
        const validations = await validate(row);
        this.logger.verbose(`processing row ${JSON.stringify(row)}: ${JSON.stringify(validations)}`);
        if (validations.length) {
            let response = 'Linha inválida: ' + FormatValidationErrors(validations);

            if (process.env.INCLUDE_IMPORTACAO_ORCAMENTO_DEBUGGER) {
                response +=
                    ': DEBUGGER: ' +
                    JSON.stringify({
                        row,
                        row_types: mapObjectToTypes(row as any),
                        raw: col2row,
                        raw_types: mapObjectToTypes(col2row),
                    });
            }

            return response;
        }

        let projeto_id: number | undefined = undefined;
        let meta_id: number | undefined = undefined;
        let iniciativa_id: number | undefined = undefined;
        let atividade_id: number | undefined = undefined;

        if (row.nota_empenho && row.processo) return 'Linhas inválida: nota empenho ou enviar processo';
        if (row.nota_empenho && row.dotacao) return 'Linhas inválida: nota empenho ou enviar dotação';

        if (!row.dotacao && !row.processo && !row.nota_empenho)
            return 'Linhas inválida: é necessário pelo menos dotação, processo ou nota de empenho';

        if (params.eh_metas) {
            if (row.meta_codigo && row.meta_id) return 'Linha inválida: meta código e meta id são de uso exclusivo';
            if (row.iniciativa_codigo && row.iniciativa_id)
                return 'Linha inválida: iniciativa código e iniciativa id são de uso exclusivo';
            if (row.atividade_codigo && row.atividade_id)
                return 'Linha inválida: atividade código e atividade id são de uso exclusivo';

            if (row.iniciativa_codigo && !(row.meta_codigo || row.meta_id))
                return 'Linha inválida: não há como buscar iniciativa por código sem saber a meta';
            if (row.atividade_codigo && !(row.iniciativa_codigo || row.iniciativa_id))
                return 'Linha inválida: não há como buscar atividade por código sem saber a iniciativa';

            if (row.projeto_codigo && row.projeto_id)
                return 'Linha inválida: projeto não pode ser usado em importações do PDM';

            if (row.meta_id) meta_id = row.meta_id;
            // valida a meta
            if (row.meta_codigo) meta_id = params.metasCodigos2Ids[row.meta_codigo.toLowerCase()];
            if (!meta_id) return `Linha inválida: meta não encontrada, código ${row.meta_codigo}`;

            if (row.iniciativa_id) iniciativa_id = row.iniciativa_id;
            // valida a iniciativa
            if (row.iniciativa_codigo)
                iniciativa_id = params.iniciativasCodigos2Ids[`${meta_id}-${row.iniciativa_codigo}`.toLowerCase()];
            if (row.iniciativa_codigo && !iniciativa_id)
                return `Linha inválida: iniciativa não encontrada, código ${row.iniciativa_codigo} na meta ID ${meta_id}`;

            if (row.atividade_id) atividade_id = row.atividade_id;
            // valida a atividade
            if (row.atividade_codigo)
                atividade_id =
                    params.atividadesCodigos2Ids[`${meta_id}-${iniciativa_id}-${row.atividade_codigo}`.toLowerCase()];
            if (row.atividade_codigo && !atividade_id)
                return `Linha inválida: atividade não encontrada, código ${row.atividade_codigo} na iniciativa ID ${iniciativa_id}}`;

            // valida se tem permissão de fato pra ver tudo
            if (!params.metasIds.includes(meta_id)) return `Linha inválida: sem permissão na meta ID ${meta_id}`;
            if (iniciativa_id && !params.iniciativasIds.includes(iniciativa_id))
                return `Linha inválida: sem permissão na iniciativa ID ${iniciativa_id}`;
            if (atividade_id && !params.atividadesIds.includes(atividade_id))
                return `Linha inválida: sem permissão na atividade ID ${atividade_id}`;

            const mes_ref = params.anosPdm[row.ano_referencia];
            if (!mes_ref) return `Linha inválida: ano ${row.ano_referencia} não está configurado`;

            if (!mes_ref.includes(row.mes))
                return `Linha inválida: mês ${row.mes} não está liberado no ano ${row.ano_referencia}`;
        } else if (params.eh_projeto) {
            if (row.meta_codigo && row.meta_id)
                return 'Linha inválida: meta não pode ser usado em importações de projetos';
            if (row.iniciativa_codigo && row.iniciativa_id)
                return 'Linha inválida: iniciativa não pode ser usado em importações de projetos';
            if (row.atividade_codigo && row.atividade_id)
                return 'Linha inválida: atividade meta não pode ser usado em importações de projetos';

            if (row.projeto_codigo && row.projeto_id)
                return 'Linha inválida: projeto código e projeto id são de uso exclusivo';

            if (row.projeto_id) projeto_id = row.projeto_id;
            if (row.projeto_codigo) projeto_id = params.projetosCodigos2Ids[row.projeto_codigo.toLowerCase()];

            if (!projeto_id) return `Linha inválida: projeto não encontrado, código ${row.projeto_codigo}`;

            if (!params.projetosIds.includes(projeto_id))
                return `Linha inválida: sem permissão no projeto ID ${projeto_id}`;

            if (!params.anosPort.includes(row.mes))
                return `Linha inválida: mês ${row.mes} não está liberado no portfólio`;
        }

        let dotacao: string | undefined = undefined;
        let dotacao_complemento: string | null = null;
        let dotacao_processo: string | undefined = undefined;
        let dotacao_processo_nota: string | undefined = undefined;

        if (row.nota_empenho) {
            try {
                const ano_nota = +row.nota_empenho.split('/')[1];

                const ne = await this.dotacaoProcessoNotaService.valorRealizadoNotaEmpenho({
                    ano: ano_nota,
                    nota_empenho: row.nota_empenho,
                    pdm_id: undefined,
                    portfolio_id: undefined,
                });

                if (ne.length === 0) return 'Linha inválida: nota empenho não encontrada';

                dotacao = ne[0].dotacao;
                // se um dia a gente começar a voltar o tamanho completo no SOF, já ficaria preparado aqui
                dotacao_complemento = ExtraiComplementoDotacao({ dotacao: dotacao, dotacao_complemento: null });

                dotacao_processo = ne[0].processo;
                dotacao_processo_nota = ne[0].nota_empenho;
            } catch (error) {
                if (error instanceof HttpException) return `Linha inválida: ${error.message}`;

                return `Erro no processamento da nota-empenho: ${error}`;
            }
        } else if (row.processo) {
            try {
                const processo = await this.dotacaoProcessoService.valorRealizadoProcesso({
                    ano: row.ano_referencia,
                    processo: row.processo,
                    pdm_id: undefined,
                    portfolio_id: undefined,
                });

                if (processo.length === 0) return 'Linha inválida: processo não encontrado';

                const dotacoes = processo.map((r) => r.dotacao).join(', ');
                this.logger.verbose(`dotações encontradas: ${dotacoes}`);
                if (row.dotacao) {
                    // pega a dotação completa antes de jogar fora
                    dotacao_complemento = ExtraiComplementoDotacao({ dotacao: row.dotacao, dotacao_complemento: null });

                    const rowDotacao = TrataDotacaoGrande(row.dotacao);
                    const rDotacao = processo.filter((r) => TrataDotacaoGrande(r.dotacao) == rowDotacao)[0];
                    if (!rDotacao)
                        return `Linha inválida: dotação informada não foi encontrada. Dotações retornadas: ${dotacoes}`;

                    dotacao = rDotacao.dotacao;
                    dotacao_processo = rDotacao.processo;

                    this.logger.verbose(`match: ${dotacao}`);
                } else if (processo.length == 1) {
                    dotacao = processo[0].dotacao;
                    dotacao_processo = processo[0].processo;
                } else {
                    return `Linha inválida: ${processo.length} dotações encontradas, dotações retornadas: ${dotacoes}`;
                }
            } catch (error) {
                if (error instanceof HttpException) return `Linha inválida: ${error.message}`;

                return `Erro no processamento do processo: ${error}`;
            }
        } else if (row.dotacao) {
            // pega a dotação completa antes de jogar fora
            dotacao_complemento = ExtraiComplementoDotacao({ dotacao: row.dotacao, dotacao_complemento: null });
            try {
                const dotacaoRet = await this.dotacaoService.valorRealizadoDotacao({
                    ano: row.ano_referencia,
                    dotacao: row.dotacao,
                    pdm_id: undefined,
                    portfolio_id: undefined,
                });

                if (dotacaoRet.length === 0) return 'Linha inválida: dotação não encontrada';

                dotacao = dotacaoRet[0].dotacao;
            } catch (error) {
                if (error instanceof HttpException) return `Linha inválida: ${error.message}`;

                return `Erro no processamento do processo: ${error}`;
            }
        } else {
            return 'Linha inválida: código não implementado';
        }

        if (!dotacao) return 'Linha inválida: faltando dotacao';

        console.log(row);
        this.logger.debug(
            JSON.stringify({
                Object: row,
                valor_empenho: isEmpty(row.valor_empenho),
                percentual_empenho: isEmpty(row.percentual_empenho),
                valor_empenho_is_null: row.valor_empenho === null,
                percentual_empenho_is_null: row.percentual_empenho === null,
            })
        );
        if (isEmpty(row.valor_empenho) && isEmpty(row.percentual_empenho))
            return 'Linha inválida: percentual e valor de empenho estão ambos vazios, por favor, preencha um dos campos.';

        if (isEmpty(row.valor_liquidado) && isEmpty(row.percentual_liquidado))
            return 'Linha inválida: percentual e valor liquidado estão ambos vazios, por favor, preencha um dos campos.';

        // joga fora os dígitos extra da dotação
        dotacao = TrataDotacaoGrande(dotacao);

        this.logger.debug(`dotacao_complemento: ${dotacao_complemento}, dotação: ${dotacao}`);

        let id: number | undefined = undefined;
        let itens: CreateOrcamentoRealizadoItemDto[] = [];

        let adicionar_item_mes = true;
        if (params.eh_metas) {
            if (!meta_id) return 'Linha inválida: faltando meta_id';

            const existeNaMetaResult = await this.pdmOrcResService.findAllWithPermissions(
                tipo_pdm!,
                {
                    ano_referencia: row.ano_referencia,
                    meta_id,
                    dotacao,
                    dotacao_complemento,
                    nota_empenho: dotacao_processo_nota !== undefined ? dotacao_processo_nota : null,
                    processo: dotacao_processo !== undefined ? dotacao_processo : null,
                    atividade_id: atividade_id !== undefined ? atividade_id : null,
                    iniciativa_id: iniciativa_id !== undefined ? iniciativa_id : null,
                },
                user
            );
            const existeNaMeta = existeNaMetaResult.linhas;

            const maisRecente = existeNaMeta.at(-1);
            if (maisRecente) {
                id = maisRecente.id;
                itens = maisRecente.itens.map((r) => {
                    return {
                        mes: r.mes,
                        valor_empenho: Str2NumberOrNull(r.valor_empenho),
                        valor_liquidado: Str2NumberOrNull(r.valor_liquidado),
                        percentual_empenho: Str2NumberOrNull(r.percentual_empenho),
                        percentual_liquidado: Str2NumberOrNull(r.percentual_liquidado),
                    };
                });
            }

            for (const item of itens) {
                if (item.mes === row.mes) {
                    adicionar_item_mes = false;
                    item.valor_empenho = row.valor_empenho;
                    item.valor_liquidado = row.valor_liquidado;
                    item.percentual_empenho = row.percentual_empenho;
                    item.percentual_liquidado = row.percentual_liquidado;
                }
            }
        } else if (params.eh_projeto) {
            if (!projeto_id) return 'Linha inválida: faltando projeto_id';

            const existeNaMeta = await this.ppOrcResService.findAll(
                tipo_projeto!,
                {
                    id: projeto_id,
                    portfolio_id: params.portfolio_id!,
                },
                {
                    ano_referencia: row.ano_referencia,
                    dotacao,
                    dotacao_complemento,
                    nota_empenho: dotacao_processo_nota,
                    processo: dotacao_processo,
                },
                user
            );

            const maisRecente = existeNaMeta.at(-1);
            if (maisRecente) {
                id = maisRecente.id;
                itens = maisRecente.itens.map((r) => {
                    return {
                        mes: r.mes,
                        valor_empenho: Str2NumberOrNull(r.valor_empenho),
                        valor_liquidado: Str2NumberOrNull(r.valor_liquidado),
                        percentual_empenho: Str2NumberOrNull(r.percentual_empenho),
                        percentual_liquidado: Str2NumberOrNull(r.percentual_liquidado),
                    };
                });
            }

            for (const item of itens) {
                if (item.mes === row.mes) {
                    adicionar_item_mes = false;
                    item.valor_empenho = row.valor_empenho;
                    item.valor_liquidado = row.valor_liquidado;
                    item.percentual_empenho = row.percentual_empenho;
                    item.percentual_liquidado = row.percentual_liquidado;
                }
            }
        }

        if (adicionar_item_mes)
            itens.push({
                mes: row.mes,
                valor_empenho: row.valor_empenho,
                valor_liquidado: row.valor_liquidado,
                percentual_empenho: row.percentual_empenho,
                percentual_liquidado: row.percentual_liquidado,
            });

        this.logger.verbose(`request: ${JSON.stringify({ adicionar_item_mes, itens })}`);
        try {
            const upsertFunction = async () => {
                if (params.eh_metas) {
                    if (id) {
                        await this.pdmOrcResService.update(
                            tipo_pdm!,
                            id,
                            {
                                itens,
                                meta_id,
                                atividade_id,
                                iniciativa_id,
                            },
                            user
                        );
                    } else {
                        await this.pdmOrcResService.create(
                            tipo_pdm!,
                            {
                                ano_referencia: row.ano_referencia,
                                dotacao: dotacao!,
                                dotacao_complemento,
                                processo: dotacao_processo,
                                nota_empenho: dotacao_processo_nota,
                                itens,
                                meta_id,
                                atividade_id,
                                iniciativa_id,
                            },
                            user
                        );
                    }
                } else if (params.eh_projeto) {
                    if (id) {
                        await this.ppOrcResService.update(
                            tipo_projeto!,
                            {
                                id: projeto_id!,
                                portfolio_id: params.portfolio_id!,
                            },
                            id,
                            {
                                itens,
                            },
                            user
                        );
                    } else {
                        await this.ppOrcResService.create(
                            tipo_projeto!,
                            {
                                id: projeto_id!,
                                portfolio_id: params.portfolio_id!,
                            },
                            {
                                ano_referencia: row.ano_referencia,
                                dotacao: dotacao!,
                                dotacao_complemento,
                                processo: dotacao_processo,
                                nota_empenho: dotacao_processo_nota,
                                itens,
                            },
                            user
                        );
                    }
                }
            };

            await RetryPromise(upsertFunction, 5, 2000, 100);
        } catch (error) {
            if (error instanceof HttpException) return `Linha inválida: ${error}`;

            return `Erro no processamento do processo: ${error}`;
        }

        return '';
    }
}

function isEmpty(n: number | string | null | undefined) {
    if (typeof n == 'number' && isNaN(n)) return false;
    if (typeof n == 'string' && n === '') return true;
    return n === undefined || n === null;
}
