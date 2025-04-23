import {
    BadRequestException,
    forwardRef,
    HttpException,
    Inject,
    Injectable,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FonteRelatorio, ModuloSistema, Prisma, RelatorioVisibilidade, TipoRelatorio } from '@prisma/client';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { DateTime } from 'luxon';
import * as os from 'os';
import { tmpdir } from 'os';
import * as path from 'path';
import { uuidv7 } from 'uuidv7';
import * as XLSX from 'xlsx';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { SYSTEM_TIMEZONE } from '../../common/date2ymd';
import { PaginatedDto, PAGINATION_TOKEN_TTL } from '../../common/dto/paginated.dto';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { PessoaService } from '../../pessoa/pessoa.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TaskService } from '../../task/task.service';
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
import { RelatorioDto, RelatorioProcessamentoDto } from './entities/report.entity';
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
        @Inject(forwardRef(() => TaskService)) private readonly taskService: TaskService,
        @Inject(forwardRef(() => CasaCivilAtividadesPendentesService))
        private readonly casaCivilAtividadesPendentesService: CasaCivilAtividadesPendentesService
    ) {
        const parsedUrl = new URL(process.env.URL_LOGIN_SMAE || 'http://smae-frontend/');
        this.baseUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}:${parsedUrl.port}`;
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
            // legado sempre assume que é PS
            if (ctx.sistema == 'SMAE' || ctx.sistema == 'PlanoSetorial') {
                parametros.tipo_pdm = 'PS';
            } else {
                if (ctx.sistema !== 'ProgramaDeMetas')
                    throw new BadRequestException('Sistema não suportado no relatório');
                const pdm_id = +parametros.pdm_id;

                if (isNaN(pdm_id)) {
                    throw new BadRequestException('pdm_id precisa ser um número');
                }

                const pdmInfo = await this.prisma.pdm.findUnique({
                    where: { id: pdm_id },
                    select: { sistema: true },
                });

                // se foi criado pelo sistema antigo (pdm 11)
                // Usa o tipo_pdm=PDM assim o relatório irá agir como se fosse PDM
                parametros.tipo_pdm = pdmInfo?.sistema == 'PDM' ? 'PDM' : 'PS';
            }
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
        user: PessoaFromJwt | null,
        sistema: ModuloSistema = 'SMAE'
    ): Promise<RecordWithId> {
        const parametros = dto.parametros;
        const pdmId = parametros.pdm_id !== undefined ? Number(parametros.pdm_id) : null;

        return await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            const result = await prismaTx.relatorio.create({
                data: {
                    pdm_id: pdmId,
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

            await this.taskService.create(
                {
                    type: 'run_report',
                    params: {
                        relatorio_id: result.id,
                    },
                },
                user,
                prismaTx
            );
            return { id: result.id };
        });
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
                err_msg: true,
                iniciado_em: true,
                processado_em: true,
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

                const eh_publico: boolean = r.visibilidade === RelatorioVisibilidade.Publico ? true : false;

                return {
                    ...r,
                    progresso: progresso,
                    eh_publico: eh_publico,
                    parametros_processados: ParseBffParamsProcessados(r.parametros_processados?.valueOf(), r.fonte),
                    criador: { nome_exibicao: r.criador?.nome_exibicao || '(sistema)' },
                    arquivo: r.arquivo_id
                        ? this.uploadService.getDownloadToken(r.arquivo_id, '1d').download_token
                        : null,
                    processamento: {
                        id: 0,
                        congelado_em: r.iniciado_em,
                        executado_em: r.processado_em,
                        err_msg: r.err_msg,
                    } satisfies RelatorioProcessamentoDto,
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

    async criaRelatorioProjeto(
        projeto_id: number,
        motivo: string,
        user: PessoaFromJwt,
        prismaTx: Prisma.TransactionClient
    ) {
        const result = await prismaTx.relatorio.create({
            data: {
                fonte: 'Projeto',
                parametros: {
                    projeto_id: projeto_id,
                    motivo,
                },
                visibilidade: 'Restrito',
                progresso: 0,
                sistema: 'Projetos',
            },
            select: { id: true },
        });

        await this.taskService.create(
            {
                type: 'run_report',
                params: {
                    relatorio_id: result.id,
                },
            },
            user,
            prismaTx
        );
        return { id: result.id };
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

    private async updateRelatorioMetadata(
        relatorioId: number,
        arquivoId: number,
        now: Date,
        contexto: ReportContext,
        prismaTx: Prisma.TransactionClient
    ) {
        const obj = contexto.getRestricaoAcesso();

        await prismaTx.relatorio.update({
            where: { id: relatorioId },
            data: {
                arquivo_id: arquivoId,
                processado_em: now,
                restrito_para: obj === null ? null : (obj as any),
            },
        });
    }

    async executaRelatorio(relatorio_id: number) {
        this.logger.log(`iniciando processamento do relatório ID ${relatorio_id}`);

        try {
            const now = new Date(Date.now());

            const relatorio = await this.prisma.relatorio.findFirst({
                where: { id: relatorio_id },
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
            if (!relatorio) {
                this.logger.warn(`Relatório ${relatorio_id} não encontrado, completando job.`);
                return;
            }
            await this.prisma.relatorio.update({
                where: { id: relatorio_id },
                data: {
                    iniciado_em: new Date(Date.now()),
                    err_msg: null,
                    progresso: 0,
                },
            });

            const contexto = new ReportContext(this.prisma, relatorio.id, relatorio.sistema);

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
            const filename = [relatorio.fonte.toString(), DateTime.local({ zone: SYSTEM_TIMEZONE }).toISO() + '.zip']
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

            await this.prisma.$transaction(async (prismaTx) => {
                await this.updateRelatorioMetadata(relatorio.id, arquivoId, now, contexto, prismaTx);

                await prismaTx.relatorio.update({
                    where: { id: relatorio_id },
                    data: {
                        progresso: 100,
                        err_msg: null,
                        processado_em: new Date(Date.now()),
                    },
                });

                // Enviando email com o relatório para o usuário.
                await this.sendEmailNotification(relatorio, prismaTx);
            });
        } catch (error) {
            this.logger.error(`Falha ao processar relatório ID ${relatorio_id}: ${error}`);

            await this.prisma.$transaction(async (prisma) => {
                await prisma.relatorio.updateMany({
                    where: { id: relatorio_id },
                    data: {
                        err_msg: error.message,
                        progresso: -1,
                        processado_em: new Date(Date.now()),
                    },
                });
            });
        }
    }

    private async sendEmailNotification(
        relatorio: {
            id: number;
            criador: { email: string } | null;
            fonte: FonteRelatorio;
            parametros_processados: any;
            criado_em: Date;
        },
        prismaTx: Prisma.TransactionClient
    ) {
        if (!relatorio.criador) return;

        // A fonte precisa ser em slug para construir a URL.
        const fonteSlug = relatorio.fonte.toLowerCase().replace(/ /g, '-');
        const url = new URL([this.baseUrl, 'relatorios', fonteSlug].join('/')).toString();

        await prismaTx.emaildbQueue.create({
            data: {
                id: uuidv7(),
                config_id: 1,
                subject: `Seu relatório ficou pronto!`,
                template: 'report.html',
                to: relatorio.criador.email,
                variables: {
                    id: relatorio.id,
                    fonte: await this.getRelatorioFonteString(relatorio.fonte),
                    parametros: relatorio.parametros_processados
                        ? (Object.entries(relatorio.parametros_processados).map(([key, value]) => ({
                              key: key
                                  .replace(/_/g, ' ')
                                  .split(' ')
                                  .map((word) => word.charAt(0).toLocaleUpperCase('pt-BR') + word.slice(1))
                                  .join(' '),
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
