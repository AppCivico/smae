import { forwardRef, HttpException, Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Cron } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { fork } from 'child_process';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { createWriteStream, WriteStream } from 'fs';
import { DateTime } from 'luxon';
import * as os from 'os';
import { tmpdir } from 'os';
import * as path from 'path';
import { resolve as resolvePath } from 'path';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { SYSTEM_TIMEZONE } from '../../common/date2ymd';
import { JOB_PP_REPORT_LOCK } from '../../common/dto/locks';
import { PaginatedDto } from '../../common/dto/paginated.dto';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../../upload/upload.service';
import { IndicadoresService } from '../indicadores/indicadores.service';
import { MonitoramentoMensalService } from '../monitoramento-mensal/monitoramento-mensal.service';
import { OrcamentoService } from '../orcamento/orcamento.service';
import { ParlamentaresService } from '../parlamentares/parlamentares.service';
import { PPObrasService } from '../pp-obras/pp-obras.service';
import { CreateRelProjetoDto } from '../pp-projeto/dto/create-previsao-custo.dto';
import { PPProjetoService } from '../pp-projeto/pp-projeto.service';
import { PPProjetosService } from '../pp-projetos/pp-projetos.service';
import { PPStatusService } from '../pp-status/pp-status.service';
import { PrevisaoCustoService } from '../previsao-custo/previsao-custo.service';
import { TransferenciasService } from '../transferencias/transferencias.service';
import { FileOutput, ParseParametrosDaFonte, ReportableService, ReportContext } from '../utils/utils.service';
import { CreateReportDto } from './dto/create-report.dto';
import { FilterRelatorioDto } from './dto/filter-relatorio.dto';
import { RelatorioDto } from './entities/report.entity';
import { TribunalDeContasService } from '../tribunal-de-contas/tribunal-de-contas.service';

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
    constructor(
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,

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
        private readonly tribunalDeContasService: TribunalDeContasService
    ) {}

    async runReport(dto: CreateReportDto): Promise<FileOutput[]> {
        // TODO agora que existem vários sistemas, conferir se o privilégio faz sentido com o serviço
        const service: ReportableService | null = this.servicoDaFonte(dto);

        // acaba sendo chamado 2x a cada request, pq já rodou 1x na validação, mas blz.
        const parametros = ParseParametrosDaFonte(dto.fonte, dto.parametros);

        // Ajusta o tipo de relatório para MDO, se for de status de obra
        if (dto.fonte == 'ObraStatus') {
            parametros.tipo = 'MDO';
        }

        const mockContext: ReportContext = {
            cancel: () => {},
            isCancelled: () => false,
            progress: async () => {},
            getTmpFile: (prefix: string): { path: string; stream: WriteStream } => {
                const path = GetTempFileName(prefix);
                const stream = createWriteStream(path);
                return { path, stream };
            },
        };

        return await service.toFileOutput(parametros, mockContext);
    }

    async zipFiles(files: FileOutput[]) {
        const zip = new AdmZip();

        for (const file of files) {
            let csvFile: string | undefined = undefined;
            let tmpDir: string | undefined = undefined;

            if (file.buffer) {
                zip.addFile(file.name, file.buffer);

                // write buffer to a temporary file
                const tmpFilePath = GetTempFileName(file.name);
                fs.writeFileSync(tmpFilePath, file.buffer);
                csvFile = tmpFilePath;
            } else if (file.localFile) {
                // move o arquivo para a pasta temporária, renomeia para file.name e adiciona ao zip (bug conhecido)
                // se não o nome do arquivo no zip será o nome do arquivo temporário e o file.name sera um diretório
                tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'my-tmp-'));

                const fileName = path.basename(file.name);
                const tmpFilePath = path.join(tmpDir, fileName);

                fs.renameSync(file.localFile, tmpFilePath);
                zip.addLocalFile(tmpFilePath);
                csvFile = tmpFilePath;
            } else {
                throw new HttpException(`Falta buffer ou localFile no arquivo ${file.name}`, 500);
            }

            if (file.name.endsWith('.csv') && csvFile) {
                const xlsx = GetTempFileName(file.name, '.xlsx');

                let success: boolean = false;
                let error: any | undefined = undefined;
                await new Promise<void>((resolve, reject) => {
                    const child = fork(resolvePath(__dirname, '../../../src/bin/') + '/duckdb-csv2xlsx.js', [
                        csvFile,
                        xlsx,
                    ]);

                    child.on('error', (err: any) => {
                        this.logger.error(`error: ${err} converting ${csvFile} to ${xlsx}`);
                    });

                    child.on('message', (msg: any) => {
                        if (msg.event == 'success') {
                            success = true;
                        } else if (msg.event == 'error') {
                            error = msg.error;
                        }
                    });

                    child.on('exit', (code: number, signal: string) => {
                        if (error) reject(error);
                        if (success) resolve();

                        if (code !== null) reject(`process exited with code ${code}`);
                        if (signal !== null) reject(`process was killed with signal ${signal}`);
                    });
                });

                if (!success)
                    throw new InternalServerErrorException(`process did not finished successfully, check logs`);

                // já pode apagar o do csv
                if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });

                tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'my-tmp-'));

                const fileName = path.basename(xlsx);
                const tmpFilePath = path.join(tmpDir, fileName);

                fs.renameSync(xlsx, tmpFilePath);
                zip.addLocalFile(tmpFilePath);
            }

            if (tmpDir) fs.rmSync(tmpDir, { recursive: true });
        }
        const zipBuffer = zip.toBuffer();
        return zipBuffer;
    }

    async saveReport(dto: CreateReportDto, arquivoId: number, user: PessoaFromJwt | null): Promise<RecordWithId> {
        const parametros = dto.parametros;
        const pdmId = parametros.pdm_id !== undefined ? Number(parametros.pdm_id) : null;
        //if (!pdmId) throw new HttpException('parametros.pdm_id é necessário para salvar um relatório', 400);

        const tipo = parametros.tipo === 'MDO' ? null : parametros.tipo;

        const result = await this.prisma.relatorio.create({
            data: {
                pdm_id: pdmId,
                arquivo_id: arquivoId,
                fonte: dto.fonte,
                tipo: tipo && tipo.length ? tipo : null,
                parametros: parametros,
                criado_por: user ? user.id : null,
                criado_em: new Date(Date.now()),
            },
            select: { id: true },
        });
        this.logger.log(`persistido arquivo ${arquivoId} no relatório ${result.id}`);
        return { id: result.id };
    }

    private servicoDaFonte(dto: CreateReportDto) {
        let service: ReportableService | null = null;
        switch (dto.fonte) {
            case 'Orcamento':
            case 'ProjetoOrcamento':
            case 'ObrasOrcamento':
                service = this.orcamentoService;
                break;
            case 'Indicadores':
                service = this.indicadoresService;
                break;
            case 'MonitoramentoMensal':
                service = this.mmService;
                break;
            case 'PrevisaoCusto':
            case 'ProjetoPrevisaoCusto':
            case 'ObrasPrevisaoCusto':
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
            default:
                dto.fonte satisfies never;
        }
        if (service === null) throw new HttpException(`Fonte ${dto.fonte} ainda não foi implementada`, 500);
        return service;
    }

    async findAll(filters: FilterRelatorioDto): Promise<PaginatedDto<RelatorioDto>> {
        let tem_mais = false;
        let token_proxima_pagina: string | null = null;

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
            },
            select: {
                id: true,
                criado_em: true,
                criador: { select: { nome_exibicao: true } },
                fonte: true,
                arquivo_id: true,
                parametros: true,
                pdm_id: true,
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
                return {
                    ...r,
                    criador: { nome_exibicao: r.criador?.nome_exibicao || '(sistema)' },
                    arquivo: this.uploadService.getDownloadToken(r.arquivo_id, '1d').download_token,
                };
            }),
            tem_mais: tem_mais,
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

    @Cron('0 * * * *')
    async handleCron() {
        if (process.env['DISABLE_REPORT_CRONTAB']) return;

        await this.prisma.$transaction(
            async (prisma: Prisma.TransactionClient) => {
                this.logger.debug(`Adquirindo lock para verificação de relatórios`);
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

    async executaRelatorioProjetos(filaId: number) {
        try {
            await this.verificaRelatorioProjetos(filaId);
        } catch (error) {
            this.logger.error(`Falha ao executar executaRelatorioProjetos(${filaId}): ${error}`);
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

            const dto: CreateReportDto = {
                fonte: 'Projeto',
                parametros: {
                    projeto_id: job.projeto_id,
                } satisfies CreateRelProjetoDto,
            };
            const files = await this.runReport(dto);
            const zipBuffer = await this.zipFiles(files);

            const arquivoId = await this.uploadService.uploadReport(dto.fonte, filename, zipBuffer, contentType, null);

            const report = await this.saveReport(dto, arquivoId, null);
            await this.prisma.projetoRelatorioFila.update({
                where: { id: job.id },
                data: {
                    executado_em: new Date(Date.now()),
                    relatorio_id: report.id,
                },
            });
        }
    }
}
