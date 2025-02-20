import { forwardRef, HttpException, Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Cron } from '@nestjs/schedule';
import { FonteRelatorio, ModuloSistema, Prisma, RelatorioVisibilidade, TipoRelatorio } from '@prisma/client';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { DateTime } from 'luxon';
import * as os from 'os';
import { tmpdir } from 'os';
import * as path from 'path';
import { CrontabIsEnabled } from 'src/common/CrontabIsEnabled';
import { uuidv7 } from 'uuidv7';
import * as XLSX from 'xlsx';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { SYSTEM_TIMEZONE } from '../../common/date2ymd';
import { JOB_PP_REPORT_LOCK, JOB_REPORT_LOCK } from '../../common/dto/locks';
import { PaginatedDto, PAGINATION_TOKEN_TTL } from '../../common/dto/paginated.dto';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { PessoaService } from '../../pessoa/pessoa.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../../upload/upload.service';
import { CasaCivilAtividadesPendentesService } from '../casa-civil-atividades-pendentes/casa-civil-atividades-pendentes.service';
import { IndicadoresService } from '../indicadores/indicadores.service';
import { MonitoramentoMensalService } from '../monitoramento-mensal/monitoramento-mensal.service';
import { OrcamentoService } from '../orcamento/orcamento.service';
import { ParlamentaresService } from '../parlamentares/parlamentares.service';
import { PPObrasService } from '../pp-obras/pp-obras.service';
import { PPProjetoService } from '../pp-projeto/pp-projeto.service';
import { PPProjetosService } from '../pp-projetos/pp-projetos.service';
import { PPStatusService } from '../pp-status/pp-status.service';
import { PrevisaoCustoService } from '../previsao-custo/previsao-custo.service';
import { PSMonitoramentoMensal } from '../ps-monitoramento-mensal/ps-monitoramento-mensal.service';
import { TransferenciasService } from '../transferencias/transferencias.service';
import { TribunalDeContasService } from '../tribunal-de-contas/tribunal-de-contas.service';
import { FileOutput, ParseParametrosDaFonte, ReportableService } from '../utils/utils.service';
import { CreateReportDto } from './dto/create-report.dto';
import { FilterRelatorioDto } from './dto/filter-relatorio.dto';
import { RelatorioDto } from './entities/report.entity';
import { ReportContext } from './helpers/reports.contexto';
import { BuildParametrosProcessados, ParseBffParamsProcessados } from './helpers/reports.params-processado';

export const GetTempFileName = function (prefix?: string, suffix?: string) {
    prefix = typeof prefix !== 'undefined' ? prefix : 'tmp.';
    suffix = typeof suffix !== 'undefined' ? suffix : '';

    return path.join(tmpdir(), prefix + '-' + crypto.randomBytes(16).toString('hex') + suffix);
};

const AdmZip = require('adm-zip');

class NextPageTokenJwtBody {
    offset: number;
    ipp: number;
}

@Injectable()
export class ReportsService {
    private readonly logger = new Logger(ReportsService.name);
    private enabled: boolean;
    baseUrl: string;

    constructor(
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,

        @Inject(forwardRef(() => PessoaService)) private readonly pessoaService: PessoaService,

        @Inject(forwardRef(() => OrcamentoService)) private readonly orcamentoService: OrcamentoService,
        @Inject(forwardRef(() => UploadService)) private readonly uploadService: UploadService,
        @Inject(forwardRef(() => IndicadoresService)) private readonly indicadoresService: IndicadoresService,
        @Inject(forwardRef(() => MonitoramentoMensalService)) private readonly mmService: MonitoramentoMensalService,
        @Inject(forwardRef(() => PrevisaoCustoService)) private readonly previsaoCustoService: PrevisaoCustoService,
        @Inject(forwardRef(() => PPProjetoService)) private readonly ppProjetoService: PPProjetoService,
        @Inject(forwardRef(() => PPProjetosService)) private readonly ppProjetosService: PPProjetosService,
        @Inject(forwardRef(() => PPStatusService)) private readonly ppStatusService: PPStatusService,
        @Inject(forwardRef(() => PPObrasService)) private readonly ppObrasService: PPObrasService,
        @Inject(forwardRef(() => ParlamentaresService)) private readonly parlamentaresService: ParlamentaresService,
        @Inject(forwardRef(() => TransferenciasService)) private readonly transferenciasService: TransferenciasService,
        @Inject(forwardRef(() => TribunalDeContasService))
        private readonly tribunalDeContasService: TribunalDeContasService,
        @Inject(forwardRef(() => PSMonitoramentoMensal))
        private readonly psMonitoramentoMensal: PSMonitoramentoMensal,
        @Inject(forwardRef(() => CasaCivilAtividadesPendentesService))
        private readonly casaCivilAtividadesPendentesService: CasaCivilAtividadesPendentesService
    ) {
        const parsedUrl = new URL(process.env.URL_LOGIN_SMAE || 'http://smae-frontend/');
        this.baseUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}:${parsedUrl.port}`;
        this.enabled = CrontabIsEnabled('reports');
    }

    private async runReport(dto: CreateReportDto, user: PessoaFromJwt | null, ctx: ReportContext): Promise<void> {
        // TODO agora que existem vários sistemas, conferir se o privilégio faz sentido com o serviço
        const service: ReportableService | null = this.servicoDaFonte(dto);

        // acaba sendo chamado 2x a cada request, pq já rodou 1x na validação, mas blz.
        const parametros = ParseParametrosDaFonte(dto.fonte, dto.parametros);

        // Ajusta o tipo de relatório para MDO, se for de status de obra
        if (
            dto.fonte == 'ObraStatus' ||
            dto.fonte === 'Obras' ||
            dto.fonte === 'ObrasOrcamento' ||
            dto.fonte === 'ObrasPrevisaoCusto'
        ) {
            parametros.tipo_projeto = 'MDO';
        } else if (
            dto.fonte === 'ProjetoOrcamento' ||
            dto.fonte === 'ProjetoPrevisaoCusto' ||
            dto.fonte === 'Projetos' ||
            dto.fonte === 'Projeto'
        ) {
            parametros.tipo_projeto = 'PP';
        } else if (dto.fonte === 'Orcamento' || dto.fonte === 'PrevisaoCusto') {
            parametros.tipo_pdm = 'PDM';
        } else if (dto.fonte === 'PSOrcamento' || dto.fonte === 'PSPrevisaoCusto') {
            parametros.tipo_pdm = 'PS';
        } else if (dto.fonte === 'PSIndicadores' || dto.fonte === 'PSMonitoramentoMensal') {
            parametros.tipo_pdm = 'PS';
        } else if (dto.fonte === 'Indicadores') {
            parametros.tipo_pdm = 'PDM';
        }

        const files = await service.toFileOutput(parametros, ctx, user);
        for (const file of files) {
            ctx.addFile(file);
        }
    }

    private async convertCsvToXlsx(csvContent: string | Buffer): Promise<Buffer> {
        // Parse CSV content
        const workbook = XLSX.read(csvContent, {
            type: 'string',
            cellDates: true,
            dateNF: 'yyyy-mm-dd',
        });

        // Write to buffer with proper options
        return XLSX.write(workbook, {
            type: 'buffer',
            bookType: 'xlsx',
            bookSST: false,
            compression: true,
        });
    }

    async zipFiles(files: FileOutput[]) {
        const zip = new AdmZip();

        for (const file of files) {
            try {
                let csvContent: string | undefined = undefined;

                if (file.buffer) {
                    zip.addFile(file.name, file.buffer);

                    if (file.name.endsWith('.csv')) {
                        csvContent = file.buffer.toString('utf-8');
                    }
                } else if (file.localFile) {
                    // move o arquivo para a pasta temporária, renomeia para file.name e adiciona ao zip
                    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'my-tmp-'));
                    const fileName = path.basename(file.name);
                    const tmpFilePath = path.join(tmpDir, fileName);

                    fs.renameSync(file.localFile, tmpFilePath);
                    zip.addLocalFile(tmpFilePath);

                    if (file.name.endsWith('.csv')) {
                        csvContent = fs.readFileSync(tmpFilePath, 'utf-8');
                    }

                    // Cleanup temp dir
                    fs.rmSync(tmpDir, { recursive: true, force: true });
                } else {
                    throw new HttpException(`Falta buffer ou localFile no arquivo ${file.name}`, 500);
                }

                if (file.name.endsWith('.csv') && csvContent) {
                    try {
                        const xlsxBuffer = await this.convertCsvToXlsx(csvContent);
                        const xlsxName = file.name.replace('.csv', '.xlsx');
                        zip.addFile(xlsxName, xlsxBuffer);
                    } catch (error) {
                        this.logger.error(`Erro ao converter CSV para XLSX: ${error}`);
                        throw new InternalServerErrorException('Erro na conversão para XLSX');
                    }
                }
            } catch (error) {
                this.logger.error(`Erro ao processar arquivo ${file.name}: ${error}`);
                throw error;
            }
        }

        return zip.toBuffer();
    }

    async saveReport(
        dto: CreateReportDto,
        arquivoId: number | null,
        user: PessoaFromJwt | null,
        sistema: ModuloSistema = 'SMAE'
    ): Promise<RecordWithId> {
        const parametros = dto.parametros;
        const pdmId = parametros.pdm_id !== undefined ? Number(parametros.pdm_id) : null;
        //if (!pdmId) throw new HttpException('parametros.pdm_id é necessário para salvar um relatório', 400);

        const result = await this.prisma.relatorio.create({
            data: {
                pdm_id: pdmId,
                arquivo_id: arquivoId,
                fonte: dto.fonte,
                sistema: sistema,
                /// here it's easy because the user is saying what he wants
                visibilidade: dto.eh_publico ? 'Publico' : 'Privado',
                tipo: TipoRelatorio[parametros.tipo as TipoRelatorio] ? parametros.tipo : null,
                parametros: parametros,
                parametros_processados: await BuildParametrosProcessados(this.prisma, dto),
                criado_por: user ? user.id : null,
                criado_em: new Date(Date.now()),
            },
            select: { id: true },
        });

        await this.prisma.relatorioFila.create({
            data: {
                relatorio_id: result.id,
            },
        });

        return { id: result.id };
    }

    private servicoDaFonte(dto: CreateReportDto) {
        let service: ReportableService | null = null;
        switch (dto.fonte) {
            case 'Orcamento':
            case 'ProjetoOrcamento':
            case 'ObrasOrcamento':
            case 'PSOrcamento':
                service = this.orcamentoService;
                break;
            case 'Indicadores':
            case 'PSIndicadores':
                service = this.indicadoresService;
                break;
            case 'MonitoramentoMensal':
                service = this.mmService;
                break;
            case 'PrevisaoCusto':
            case 'ProjetoPrevisaoCusto':
            case 'ObrasPrevisaoCusto':
            case 'PSPrevisaoCusto':
                service = this.previsaoCustoService;
                break;
            case 'Projeto':
                service = this.ppProjetoService;
                break;
            case 'Projetos':
                service = this.ppProjetosService;
                break;
            case 'ProjetoStatus':
            case 'ObraStatus':
                service = this.ppStatusService;
                break;
            case 'Obras':
                service = this.ppObrasService;
                break;
            case 'Parlamentares':
                service = this.parlamentaresService;
                break;
            case 'Transferencias':
                service = this.transferenciasService;
                break;
            case 'TribunalDeContas':
                service = this.tribunalDeContasService;
                break;
            case 'PSMonitoramentoMensal':
                service = this.psMonitoramentoMensal;
                break;
            case 'CasaCivilAtvPendentes':
                service = this.casaCivilAtividadesPendentesService;
                break;
            default:
                dto.fonte satisfies never;
        }
        if (service === null) throw new HttpException(`Fonte ${dto.fonte} ainda não foi implementada`, 500);
        return service;
    }

    async findAll(filters: FilterRelatorioDto, user: PessoaFromJwt): Promise<PaginatedDto<RelatorioDto>> {
        let tem_mais = false;
        let token_proxima_pagina: string | null = null;
        const sistema = user.assertOneModuloSistema('buscar', 'Relatórios');

        let ipp = filters.ipp ? filters.ipp : 25;
        let offset = 0;
        const decodedPageToken = this.decodeNextPageToken(filters.token_proxima_pagina);

        if (decodedPageToken) {
            offset = decodedPageToken.offset;
            ipp = decodedPageToken.ipp;
        }

        const rows = await this.prisma.relatorio.findMany({
            where: {
                fonte: filters.fonte,
                pdm_id: filters.pdm_id,
                removido_em: null,
                sistema: { in: [sistema, 'SMAE'] },
                AND: [
                    {
                        OR: [
                            {
                                visibilidade: 'Privado',
                                criado_por: user.id,
                            },
                            {
                                visibilidade: 'Publico',
                            },
                            {
                                visibilidade: 'Restrito',
                                OR: [
                                    // If there's no restriction at all
                                    {
                                        restrito_para: {
                                            equals: Prisma.AnyNull,
                                        },
                                    },
                                    // Check for role-based access
                                    {
                                        AND: [
                                            {
                                                OR: [
                                                    // Either roles doesn't exist in the JSON
                                                    {
                                                        restrito_para: {
                                                            path: ['$.roles'],
                                                            equals: Prisma.AnyNull,
                                                        },
                                                    },
                                                    // Or user has one of the required roles
                                                    {
                                                        restrito_para: {
                                                            path: ['$.roles'],
                                                            array_contains: user.privilegios as string[],
                                                        },
                                                    },
                                                ],
                                            },
                                            {
                                                OR: [
                                                    // Either portfolio_orgao_ids doesn't exist in the JSON
                                                    {
                                                        restrito_para: {
                                                            path: ['$.portfolio_orgao_ids'],
                                                            equals: Prisma.AnyNull,
                                                        },
                                                    },
                                                    // Or user belongs to one of the required orgs
                                                    user.orgao_id
                                                        ? {
                                                              restrito_para: {
                                                                  path: ['$.portfolio_orgao_ids'],
                                                                  array_contains: [user.orgao_id],
                                                              },
                                                          }
                                                        : {},
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
            select: {
                id: true,
                criado_em: true,
                criador: { select: { nome_exibicao: true } },
                fonte: true,
                visibilidade: true,
                arquivo_id: true,
                parametros: true,
                parametros_processados: true,
                pdm_id: true,
                progresso: true,
                processamento: {
                    select: {
                        congelado_em: true,
                        err_msg: true,
                    },
                },
            },
            orderBy: {
                criado_em: 'desc',
            },
            skip: offset,
            take: ipp + 1,
        });

        if (rows.length > ipp) {
            tem_mais = true;
            rows.pop();
            token_proxima_pagina = this.encodeNextPageToken({ ipp: ipp, offset: offset + ipp });
        }

        return {
            linhas: rows.map((r) => {
                const progresso = r.arquivo_id ? 100 : r.progresso == -1 ? null : r.progresso;
                const haErro = r.processamento?.map((p) => p.err_msg).join(' ');

                const eh_publico: boolean = r.visibilidade === RelatorioVisibilidade.Publico ? true : false;

                return {
                    ...r,
                    progresso: progresso,
                    eh_publico: eh_publico,
                    err_msg: r.arquivo_id !== null ? haErro : null,
                    parametros_processados: ParseBffParamsProcessados(r.parametros_processados?.valueOf(), r.fonte),
                    criador: { nome_exibicao: r.criador?.nome_exibicao || '(sistema)' },
                    arquivo: r.arquivo_id
                        ? this.uploadService.getDownloadToken(r.arquivo_id, '1d').download_token
                        : null,
                } satisfies RelatorioDto;
            }),
            tem_mais: tem_mais,
            token_ttl: PAGINATION_TOKEN_TTL,
            token_proxima_pagina: token_proxima_pagina,
        };
    }

    async delete(id: number, user: PessoaFromJwt) {
        await this.prisma.relatorio.updateMany({
            where: {
                id: id,
            },
            data: {
                removido_em: new Date(Date.now()),
                removido_por: user.id,
            },
        });
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

    @Cron('* * * * *')
    async handleCron() {
        //if (process.env['DISABLE_REPORT_CRONTAB']) return;

        await this.prisma.$transaction(
            async (prisma: Prisma.TransactionClient) => {
                this.logger.debug(`Adquirindo lock para verificação de relatórios de Projeto`);
                const locked: {
                    locked: boolean;
                }[] = await prisma.$queryRaw`SELECT
                pg_try_advisory_xact_lock(${JOB_PP_REPORT_LOCK}) as locked
            `;
                if (!locked[0].locked) {
                    this.logger.debug(`Já está em processamento...`);
                    return;
                }

                await this.verificaRelatorioProjetos();
            },
            {
                maxWait: 30000,
                timeout: 60 * 1000 * 5,
                isolationLevel: 'Serializable',
            }
        );
    }

    @Cron('*/2 * * * *')
    async handleRelatorioFilaCron() {
        if (!this.enabled) return;
        if (process.env['DISABLE_REPORT_CRONTAB']) return;

        await this.prisma.$transaction(
            async (prisma: Prisma.TransactionClient) => {
                this.logger.log(`Adquirindo lock para verificação de relatórios`);
                const locked: {
                    locked: boolean;
                }[] = await prisma.$queryRaw`SELECT
                pg_try_advisory_xact_lock(${JOB_REPORT_LOCK}) as locked
            `;
                if (!locked[0].locked) {
                    this.logger.log(`Já está em processamento...`);
                    return;
                }

                await this.verificaRelatorioFila();
            },
            {
                maxWait: 30000,
                timeout: 60 * 1000 * 5,
                isolationLevel: 'Serializable',
            }
        );
    }

    async executaRelatorioProjetos(filaId: number) {
        try {
            await this.verificaRelatorioProjetos(filaId);
        } catch (error) {
            this.logger.error(`Falha ao executar executaRelatorioProjetos(${filaId}): ${error}`);
        }
    }

    async syncRelatoriosParametros(): Promise<void> {
        const rows = await this.prisma.$queryRaw<
            Array<{ id: number }>
        >`SELECT id FROM relatorio WHERE removido_em IS NULL AND parametros_processados IS NULL`;

        for (const row of rows) {
            try {
                const parametros = await BuildParametrosProcessados(this.prisma, undefined, row.id);
                if (!parametros) continue;

                await this.prisma.relatorio.update({
                    where: { id: row.id },
                    data: {
                        parametros_processados: parametros,
                    },
                });
            } catch (error) {
                this.logger.error(`Falha ao sincronizar params de relatório ${row.id}: ${error}`);
            }
        }
    }

    private async verificaRelatorioProjetos(filtroId?: number | undefined) {
        const pending = await this.prisma.projetoRelatorioFila.findMany({
            where: {
                executado_em: null,
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
        });

        for (const job of pending) {
            try {
                const now = new Date(Date.now());
                await this.prisma.projetoRelatorioFila.update({
                    where: { id: job.id },
                    data: {
                        congelado_em: new Date(Date.now()),
                    },
                });

                const contentType = 'application/zip';
                const filename = ['Projeto', DateTime.local({ zone: SYSTEM_TIMEZONE }).toISO() + '.zip']
                    .filter((r) => r)
                    .join('-');

                const relatorio = await this.prisma.relatorio.create({
                    data: {
                        fonte: 'Projeto',
                        parametros: {
                            projeto_id: job.projeto_id,
                        },
                        visibilidade: 'Restrito',
                        progresso: 0,
                    },
                });

                const contexto = new ReportContext(this.prisma, relatorio.id);

                await this.runReport(
                    {
                        fonte: relatorio.fonte,
                        parametros: {
                            projeto_id: job.projeto_id,
                        },
                    },
                    null,
                    contexto
                );
                const zipBuffer = await this.zipFiles(contexto.getFiles());

                const arquivoId = await this.uploadService.uploadReport(
                    relatorio.fonte,
                    filename,
                    zipBuffer,
                    contentType,
                    null
                );
                const relatorioId = relatorio.id;

                await this.updateRelatorioMetadata(relatorioId, arquivoId, now, contexto);

                await this.prisma.projetoRelatorioFila.update({
                    where: { id: job.id },
                    data: {
                        executado_em: new Date(Date.now()),
                        relatorio_id: relatorio.id,
                    },
                });
            } catch (error) {
                console.error(error);

                this.logger.error(`Falha ao processar relatório ID ${job.id}: ${error}`);

                // timeout do lock vai tentar novamente em 1 hr
                continue;
            }
        }
    }

    private async updateRelatorioMetadata(relatorioId: number, arquivoId: number, now: Date, contexto: ReportContext) {
        const obj = contexto.getRestricaoAcesso();

        await this.prisma.relatorio.update({
            where: { id: relatorioId },
            data: {
                arquivo_id: arquivoId,
                processado_em: now,
                restrito_para: obj === null ? null : (obj as any),
            },
        });
    }

    private async verificaRelatorioFila(filtroId?: number | undefined) {
        const pending = await this.prisma.relatorioFila.findMany({
            where: {
                executado_em: null,
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
            take: 1,
            orderBy: { criado_em: 'asc' },
        });

        this.logger.log(pending.length + ' relatórios pendentes');

        for (const job of pending) {
            this.logger.log(`iniciando processamento do relatório ID ${job.relatorio_id}`);

            await this.prisma.relatorioFila.update({
                where: { id: job.id },
                data: {
                    congelado_em: new Date(Date.now()),
                },
            });

            try {
                const now = new Date(Date.now());

                const relatorio = await this.prisma.relatorio.findFirst({
                    where: { id: job.relatorio_id },
                    select: {
                        id: true,
                        fonte: true,
                        parametros: true,
                        parametros_processados: true,
                        sistema: true,
                        criado_em: true,
                        criado_por: true,
                        criador: {
                            select: {
                                email: true,
                            },
                        },
                    },
                });
                if (!relatorio) throw new InternalServerErrorException(`Relatório ${job.relatorio_id} não encontrado`);
                const contexto = new ReportContext(this.prisma, relatorio.id);

                await this.prisma.relatorio.update({
                    where: { id: job.relatorio_id },
                    data: { progresso: 0 },
                });

                const pessoaJwt = relatorio.criado_por
                    ? await this.pessoaService.reportPessoaFromJwt(relatorio.criado_por, relatorio.sistema)
                    : null;

                await this.runReport(
                    {
                        fonte: relatorio.fonte,
                        parametros: relatorio.parametros,
                    },
                    pessoaJwt,
                    contexto
                );

                const contentType = 'application/zip';
                const filename = [
                    relatorio.fonte.toString(),
                    DateTime.local({ zone: SYSTEM_TIMEZONE }).toISO() + '.zip',
                ]
                    .filter((r) => r)
                    .join('-');

                const zipBuffer = await this.zipFiles(contexto.getFiles());

                const arquivoId = await this.uploadService.uploadReport(
                    relatorio.fonte,
                    filename,
                    zipBuffer,
                    contentType,
                    null
                );

                await this.updateRelatorioMetadata(relatorio.id, arquivoId, now, contexto);

                await this.prisma.relatorioFila.update({
                    where: { id: job.id },
                    data: {
                        executado_em: new Date(Date.now()),
                    },
                });

                // Enviando email com o relatório para o usuário.
                await this.sendEmailNotification(relatorio, job);
            } catch (error) {
                this.logger.debug(`Falha ao processar relatório ID ${job.relatorio_id}: ${error}`);

                await this.prisma.relatorioFila.update({
                    where: { id: job.id },
                    data: {
                        err_msg: error.toString().replace(/\s/g, ''),
                        executado_em: new Date(Date.now()),
                        congelado_em: null,
                    },
                });

                continue;
            }
        }
    }

    private async sendEmailNotification(
        relatorio: {
            criador: { email: string } | null;
            fonte: FonteRelatorio;
            parametros_processados: any;
            criado_em: Date;
        },
        job: {
            id: number;
            criado_em: Date;
            relatorio_id: number;
            err_msg: string | null;
            congelado_em: Date | null;
            executado_em: Date | null;
        }
    ) {
        if (!relatorio.criador) return;

        // A fonte precisa ser em slug para construir a URL.
        const fonteSlug = relatorio.fonte.toLowerCase().replace(/ /g, '-');
        const url = new URL([this.baseUrl, 'relatorios', fonteSlug].join('/')).toString();

        await this.prisma.emaildbQueue.create({
            data: {
                id: uuidv7(),
                config_id: 1,
                subject: `Seu relatório ficou pronto!`,
                template: 'report.html',
                to: relatorio.criador.email,
                variables: {
                    id: job.relatorio_id,
                    fonte: await this.getRelatorioFonteString(relatorio.fonte),
                    parametros: relatorio.parametros_processados
                        ? (Object.entries(relatorio.parametros_processados).map(([key, value]) => ({
                              key: key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
                              value: value,
                          })) as Array<{ key: string; value: string }>)
                        : null,
                    data_criacao: relatorio.criado_em.toLocaleString('pt-BR', {
                        timeZone: 'America/Sao_Paulo',
                    }),
                    link: url,
                },
            },
        });
    }

    private async getRelatorioFonteString(fonte: FonteRelatorio): Promise<string> {
        switch (fonte) {
            case FonteRelatorio.CasaCivilAtvPendentes:
                return 'Casa Civil - Atividades Pendentes';
            case FonteRelatorio.Indicadores:
                return 'Indicadores';
            case FonteRelatorio.MonitoramentoMensal:
                return 'Monitoramento Mensal';
            case FonteRelatorio.Obras:
                return 'Obras';
            case FonteRelatorio.ObrasOrcamento:
                return 'Obras - Orçamento';
            case FonteRelatorio.ObrasPrevisaoCusto:
                return 'Obras - Previsão de Custo';
            case FonteRelatorio.ObraStatus:
                return 'Status de Obras';
            case FonteRelatorio.Orcamento:
                return 'Orçamento';
            case FonteRelatorio.Parlamentares:
                return 'Parlamentares';
            case FonteRelatorio.PrevisaoCusto:
                return 'Previsão de Custo';
            case FonteRelatorio.Projeto:
                return 'Projeto';
            case FonteRelatorio.ProjetoOrcamento:
                return 'Projeto - Orçamento';
            case FonteRelatorio.ProjetoPrevisaoCusto:
                return 'Projeto - Previsão de Custo';
            case FonteRelatorio.ProjetoStatus:
                return 'Status de Projetos';
            case FonteRelatorio.Projetos:
                return 'Projetos';
            case FonteRelatorio.Transferencias:
                return 'Transferências';
            case FonteRelatorio.TribunalDeContas:
                return 'Tribunal de Contas';
            case FonteRelatorio.PSMonitoramentoMensal:
                return 'Plano Setorial - Monitoramento Mensal';
            case FonteRelatorio.PSOrcamento:
                return 'Plano Setorial - Orçamento';
            case FonteRelatorio.PSPrevisaoCusto:
                return 'Plano Setorial - Previsão de Custo';
            case FonteRelatorio.PSIndicadores:
                return 'Plano Setorial - Indicadores';
            default:
                return 'Desconhecido';
        }
    }
}
