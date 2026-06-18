import {
    BadRequestException,
    ForbiddenException,
    forwardRef,
    HttpException,
    Inject,
    Injectable,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FonteRelatorio, ModuloSistema, Prisma, RelatorioVisibilidade, TipoPdm, TipoRelatorio } from '@prisma/client';
import { ListaDePrivilegios } from '../../common/ListaDePrivilegios';
import { fork } from 'child_process';
import { validate } from 'class-validator';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { DateTime } from 'luxon';
import * as os from 'os';
import { tmpdir } from 'os';
import * as path from 'path';
import { resolve as resolvePath } from 'path';
import { uuidv7 } from 'uuidv7';
import * as XLSX from 'xlsx';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { Date2YMD, SYSTEM_TIMEZONE } from '../../common/date2ymd';
import { PaginatedDto, PAGINATION_TOKEN_TTL } from '../../common/dto/paginated.dto';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { FormatValidationErrors } from '../../common/helpers/FormatValidationErrors';
import { SmaeConfigService } from '../../common/services/smae-config.service';
import { PessoaService } from '../../pessoa/pessoa.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TaskService } from '../../task/task.service';
import { UploadService } from '../../upload/upload.service';
import { CasaCivilAtividadesPendentesService } from '../casa-civil-atividades-pendentes/casa-civil-atividades-pendentes.service';
import { DemandasService } from '../demandas/demandas.service';
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
import { ListVisibilidadeTipoDto, RelatorioDto, RelatorioProcessamentoDto } from './entities/report.entity';
import { ReportContext } from './helpers/reports.contexto';
import { BuildParametrosProcessados, ParseBffParamsProcessados } from './helpers/reports.params-processado';
import { getTemplatesDisponiveis, montarVisibilidade, VisibilidadeTipo } from './helpers/visibilidade-templates';

// Mapa de propriedade fonte → sistema. Fonte de verdade para "esta fonte pertence a qual módulo?".
// Algumas fontes (PS*) são compartilhadas entre PlanoSetorial e ProgramaDeMetas — por isso o
// valor é uma lista, não um único módulo.
const FONTES_POR_SISTEMA: Record<ModuloSistema, readonly FonteRelatorio[]> = {
    SMAE: [],
    PDM: [
        FonteRelatorio.Orcamento,
        FonteRelatorio.PrevisaoCusto,
        FonteRelatorio.Indicadores,
        FonteRelatorio.MonitoramentoMensal,
    ],
    PlanoSetorial: [
        FonteRelatorio.PSOrcamento,
        FonteRelatorio.PSPrevisaoCusto,
        FonteRelatorio.PSIndicadores,
        FonteRelatorio.PSMonitoramentoMensal,
    ],
    ProgramaDeMetas: [
        FonteRelatorio.PSOrcamento,
        FonteRelatorio.PSPrevisaoCusto,
        FonteRelatorio.PSIndicadores,
        FonteRelatorio.PSMonitoramentoMensal,
    ],
    Projetos: [
        FonteRelatorio.Projeto,
        FonteRelatorio.Projetos,
        FonteRelatorio.ProjetoStatus,
        FonteRelatorio.ProjetoOrcamento,
        FonteRelatorio.ProjetoPrevisaoCusto,
    ],
    MDO: [
        FonteRelatorio.Obras,
        FonteRelatorio.ObraStatus,
        FonteRelatorio.ObrasOrcamento,
        FonteRelatorio.ObrasPrevisaoCusto,
    ],
    CasaCivil: [
        FonteRelatorio.Parlamentares,
        FonteRelatorio.TribunalDeContas,
        FonteRelatorio.Transferencias,
        FonteRelatorio.AtvPendentes,
        FonteRelatorio.Demandas,
    ],
};

// Mapas de discriminador da fonte: forçam `parametros.tipo_projeto`/`tipo_pdm` antes do report
// rodar, já que algumas fontes (Orcamento, PSOrcamento, ...) são compartilhadas entre sistemas.
const FONTES_TIPO_PROJETO: Partial<Record<FonteRelatorio, 'MDO' | 'PP'>> = {
    [FonteRelatorio.Obras]: 'MDO',
    [FonteRelatorio.ObraStatus]: 'MDO',
    [FonteRelatorio.ObrasOrcamento]: 'MDO',
    [FonteRelatorio.ObrasPrevisaoCusto]: 'MDO',
    [FonteRelatorio.Projeto]: 'PP',
    [FonteRelatorio.Projetos]: 'PP',
    [FonteRelatorio.ProjetoOrcamento]: 'PP',
    [FonteRelatorio.ProjetoPrevisaoCusto]: 'PP',
};
const FONTES_TIPO_PDM_FIXO: Partial<Record<FonteRelatorio, 'PDM'>> = {
    [FonteRelatorio.Orcamento]: 'PDM',
    [FonteRelatorio.PrevisaoCusto]: 'PDM',
    [FonteRelatorio.Indicadores]: 'PDM',
};
const FONTES_TIPO_PDM_CALC: readonly FonteRelatorio[] = [
    FonteRelatorio.PSOrcamento,
    FonteRelatorio.PSPrevisaoCusto,
    FonteRelatorio.PSIndicadores,
    FonteRelatorio.PSMonitoramentoMensal,
];

// Convenção de privilégio escopado: `Reports.{action}.{sistema}:{fonte}` libera apenas aquela
// fonte específica; o privilégio sem `:` (ex.: `Reports.executar.CasaCivil`) libera todas as
// fontes do sistema.
function hasReportPriv(
    user: PessoaFromJwt,
    action: 'executar' | 'remover',
    sistema: ModuloSistema,
    fonte: FonteRelatorio
): boolean {
    return user.hasSomeRoles([
        `Reports.${action}.${sistema}` as ListaDePrivilegios,
        `Reports.${action}.${sistema}:${fonte}` as ListaDePrivilegios,
    ]);
}

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
        private readonly casaCivilAtividadesPendentesService: CasaCivilAtividadesPendentesService,
        @Inject(forwardRef(() => DemandasService))
        private readonly demandasService: DemandasService,
        private readonly smaeConfigService: SmaeConfigService
    ) {}

    private async runReport(dto: CreateReportDto, user: PessoaFromJwt | null, ctx: ReportContext): Promise<void> {
        // TODO agora que existem vários sistemas, conferir se o privilégio faz sentido com o serviço
        const service: ReportableService | null = this.servicoDaFonte(dto);

        const now = new Date();
        const unparsedParams = structuredClone(dto.parametros);
        // acaba sendo chamado 2x a cada request, pq já rodou 1x na validação, mas blz.
        const parametros = ParseParametrosDaFonte(dto.fonte, dto.parametros);
        const validations = await validate(parametros, {
            whitelist: true,
            forbidNonWhitelisted: true,
        });
        if (validations.length > 0) {
            throw new BadRequestException(
                `Verificação falhou: ${FormatValidationErrors(validations)} - ${JSON.stringify(unparsedParams)}`
            );
        }

        // Força o discriminador da fonte (tipo_projeto / tipo_pdm) — fontes que rodam em mais
        // de um sistema (Orcamento, PSOrcamento, etc.) precisam disso para o service saber qual
        // variante produzir.
        if (FONTES_TIPO_PROJETO[dto.fonte]) {
            parametros.tipo_projeto = FONTES_TIPO_PROJETO[dto.fonte];
        } else if (FONTES_TIPO_PDM_FIXO[dto.fonte]) {
            parametros.tipo_pdm = FONTES_TIPO_PDM_FIXO[dto.fonte];
        } else if (FONTES_TIPO_PDM_CALC.includes(dto.fonte)) {
            parametros.tipo_pdm = await this.calcTipoPdm(ctx, parametros);
        }

        const parametrosOriginal = structuredClone(parametros);

        const files = await service.toFileOutput(parametros, ctx, user);
        let hasInfo = false;
        for (const file of files) {
            ctx.addFile(file);
            if (file.name == 'info.json') hasInfo = true;
        }
        const infoJson = JSON.stringify(
            {
                params: parametrosOriginal,
                unpared_params: unparsedParams,
                horario: Date2YMD.tzSp2UTC(now),
                tipo: dto.fonte,
                file_name: service.getClassFileName(),
            },
            undefined,
            4
        );
        this.logger.verbose(infoJson);
        if (!hasInfo) {
            ctx.addFile({
                name: 'info.json',
                buffer: Buffer.from(infoJson, 'utf8'),
            });
        }
    }

    private async calcTipoPdm(ctx: ReportContext, parametros: any) {
        let sistema: TipoPdm = 'PS';
        if (ctx.sistema == 'SMAE' || ctx.sistema == 'PlanoSetorial') {
            return 'PS';
        } else {
            if (ctx.sistema !== 'ProgramaDeMetas') throw new BadRequestException('Sistema não suportado no relatório');
            const pdm_id = +parametros.pdm_id;

            if (isNaN(pdm_id)) {
                throw new BadRequestException('pdm_id precisa ser um número');
            }

            sistema = 'PDM';
        }
        return sistema;
    }

    /**
     * Detecta se um Buffer contém um arquivo XLSX (assinatura ZIP: PK\x03\x04).
     * Usado em zipFiles para identificar arquivos já gerados como XLSX nativamente.
     */
    private isXlsxBuffer(buf: Buffer): boolean {
        return buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04;
    }

    /**
     * Lê os primeiros 4 bytes de um arquivo em disco para detectar assinatura XLSX.
     */
    private isXlsxLocalFile(filePath: string): boolean {
        try {
            const fd = fs.openSync(filePath, 'r');
            const header = Buffer.alloc(4);
            fs.readSync(fd, header, 0, 4, 0);
            fs.closeSync(fd);
            return this.isXlsxBuffer(header);
        } catch {
            return false;
        }
    }

    /**
     * Converte CSV para XLSX. Usado apenas para arquivos CSV legados (ex: CsvFileHandler).
     * Corrige o padrão ="valor" convertendo-o em células de texto puro.
     */
    private async convertCsvToXlsx(csvContent: string | Buffer): Promise<Buffer> {
        const useDuckDb = await this.smaeConfigService.getConfig('DUCKDB_XLSX');

        if (useDuckDb === 'true') {
            // Use DuckDB approach
            const csvFile = GetTempFileName('csv-file', '.csv');
            const xlsxFile = GetTempFileName('xlsx-file', '.xlsx');

            fs.writeFileSync(csvFile, csvContent);

            let success: boolean = false;
            let error: any | undefined = undefined;

            await new Promise<void>((resolve, reject) => {
                const child = fork(resolvePath(__dirname, '../../../src/bin/') + '/duckdb-csv2xlsx.js', [
                    csvFile,
                    xlsxFile,
                ]);

                child.on('error', (err: any) => {
                    this.logger.error(`error: ${err} converting ${csvFile} to ${xlsxFile}`);
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

            if (!success) throw new InternalServerErrorException(`process did not finished successfully, check logs`);

            const xlsxBuffer = fs.readFileSync(xlsxFile);

            try {
                fs.unlinkSync(csvFile);
                fs.unlinkSync(xlsxFile);
            } catch (err) {
                this.logger.warn(`Failed to clean up temporary files: ${err}`);
            }

            // Post-processa o XLSX gerado pelo DuckDB para corrigir células ="valor"
            return this.fixFormulaStringsInXlsx(xlsxBuffer);
        } else {
            // Analisa o CSV sem interpretar fórmulas para controle explícito dos tipos
            const workbook = XLSX.read(csvContent, {
                type: 'string',
                cellFormula: false,
                cellDates: true,
                dateNF: 'yyyy-mm-dd',
            });

            this.fixFormulaStringsInWorkbook(workbook);

            return XLSX.write(workbook, {
                type: 'buffer',
                bookType: 'xlsx',
                bookSST: false,
                compression: true,
            });
        }
    }

    /**
     * Lê um buffer XLSX, corrige células ="valor" e retorna o buffer corrigido.
     */
    private fixFormulaStringsInXlsx(xlsxBuffer: Buffer): Buffer {
        const workbook = XLSX.read(xlsxBuffer, { type: 'buffer', cellFormula: false });
        this.fixFormulaStringsInWorkbook(workbook);
        return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', bookSST: false, compression: true });
    }

    /**
     * Percorre todas as células do workbook e converte o padrão ="valor" em
     * células de texto puro, eliminando exibição de fórmula no Excel.
     */
    private fixFormulaStringsInWorkbook(workbook: XLSX.WorkBook): void {
        for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName];
            for (const addr of Object.keys(sheet)) {
                if (addr[0] === '!') continue;
                const cell: XLSX.CellObject = sheet[addr];
                if (!cell) continue;

                // Célula com fórmula ="string" (SheetJS armazena a fórmula em .f sem o "=")
                // Ex: ="1234" → cell.f = '"1234"'
                if (typeof cell.f === 'string') {
                    const m = cell.f.match(/^"([\s\S]*)"$/);
                    if (m) {
                        cell.v = m[1].replace(/""/g, '"');
                        cell.t = 's';
                        delete (cell as any).f;
                        delete (cell as any).w;
                    }
                }

                // Célula de texto com valor ="string" → extrai o conteúdo interno
                if (cell.t === 's' && typeof cell.v === 'string') {
                    const m = (cell.v as string).match(/^="([\s\S]*)"$/);
                    if (m) {
                        cell.v = m[1].replace(/""/g, '"');
                        delete cell.w;
                    }
                }
            }
        }
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

        // resolve um problema pra n ficar uma lista em branco no frontend e aqui
        if (dto.fonte === 'Orcamento' || dto.fonte === 'PrevisaoCusto') {
            if (Array.isArray(parametros.orgaos) && parametros.orgaos.length === 0) delete parametros.orgaos;
        }

        // Trava de órgão para o perfil restrito "Gestor(a) de Distribuição de Recurso":
        // força o filtro no momento da criação para que persista na task e no JSON da relatorio.
        if (dto.fonte === 'Demandas' && user?.hasSomeRoles(['SMAE.PerfilGestorDistribuicaoRecurso'])) {
            if (!user.orgao_id) throw new BadRequestException('Usuário sem órgão associado.');
            parametros.orgao_id = user.orgao_id;
        }

        // Garante que a fonte pertence ao sistema da requisição. Sem isso, um usuário multi-módulo
        // poderia mandar uma fonte CasaCivil com X-Sistemas: PDM e contornar o gate por privilégio.
        if (!FONTES_POR_SISTEMA[sistema].includes(dto.fonte)) {
            throw new BadRequestException(`Fonte ${dto.fonte} não pertence ao sistema ${sistema}.`);
        }

        // Garante que o pdm_id/plano_setorial_id informado pertence ao MESMO sistema da requisição
        // (pdm.sistema é a fonte da verdade: legado=PDM, novo=ProgramaDeMetas/PlanoSetorial).
        // Rejeitar aqui na criação evita gerar um relatório vazio/incorreto depois — ex.: um plano
        // legado (sistema=PDM) sendo usado num relatório de ProgramaDeMetas/PlanoSetorial, ou vice-versa.
        const pdmIdInformado =
            pdmId ?? (parametros.plano_setorial_id !== undefined ? Number(parametros.plano_setorial_id) : null);
        if (pdmIdInformado && (['PDM', 'PlanoSetorial', 'ProgramaDeMetas'] as ModuloSistema[]).includes(sistema)) {
            const pdm = await this.prisma.pdm.findFirst({
                where: { id: pdmIdInformado, removido_em: null },
                select: { sistema: true },
            });
            if (!pdm) throw new BadRequestException(`PDM/Plano ${pdmIdInformado} não encontrado.`);
            if (pdm.sistema !== sistema)
                throw new BadRequestException(
                    `PDM/Plano ${pdmIdInformado} pertence ao sistema ${pdm.sistema}, incompatível com o sistema ${sistema} da requisição.`
                );
        }

        // Autorização: aceita o privilégio amplo `Reports.executar.{sistema}` ou o escopado
        // `Reports.executar.{sistema}:{fonte}`.
        if (user && !hasReportPriv(user, 'executar', sistema, dto.fonte)) {
            throw new ForbiddenException('Usuário não tem permissão para executar este relatório.');
        }

        // O `visibilidade_tipo` define o escopo via mapa de templates, resolvendo a `visibilidade`
        // (enum de trabalho do backend) e o `restrito_para`. Fallback para o booleano `eh_publico`
        // depreciado quando o cliente antigo não envia o tipo.
        // Obs.: a trava de órgão do perfil "Gestor de Distribuição de Recurso" continua sendo
        // aplicada apenas na listagem (findAll), filtrando Publico por `parametros.orgao_id`.
        const visibilidadeTipo: VisibilidadeTipo =
            dto.visibilidade_tipo ?? (dto.eh_publico ? 'publico' : 'privado');
        const { visibilidade, restrito_para } = montarVisibilidade(visibilidadeTipo, user, sistema, dto.fonte);

        return await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            const result = await prismaTx.relatorio.create({
                data: {
                    pdm_id: pdmId,
                    fonte: dto.fonte,
                    sistema: sistema,
                    visibilidade: visibilidade,
                    visibilidade_tipo: visibilidadeTipo,
                    restrito_para: restrito_para ?? undefined,
                    tipo: TipoRelatorio[parametros.tipo as TipoRelatorio] ? parametros.tipo : null,
                    parametros: parametros,
                    parametros_processados: await BuildParametrosProcessados(this.prisma, {
                        ...dto,
                        parametros: parametros,
                    }),
                    criado_por: user ? user.id : null,
                    criado_em: new Date(Date.now()),
                },
                select: { id: true, parametros: true, parametros_processados: true },
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
            case 'AtvPendentes':
                service = this.casaCivilAtividadesPendentesService;
                break;
            case 'Demandas':
                service = this.demandasService;
                break;
            default:
                dto.fonte satisfies never;
        }
        if (service === null) throw new HttpException(`Fonte ${dto.fonte} ainda não foi implementada`, 500);
        return service;
    }

    listVisibilidadeTipos(user: PessoaFromJwt): ListVisibilidadeTipoDto {
        const sistema = user.assertOneModuloSistema('buscar', 'Relatórios');
        return { linhas: getTemplatesDisponiveis(sistema) };
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

        // Se o usuário não tem o privilégio amplo `Reports.executar.{sistema}`, restringe a
        // listagem às fontes que ele tem privilégio escopado para executar. Cobre o caso do
        // gestor (só `Reports.executar.CasaCivil:Demandas`) sem hardcodar a fonte.
        const temPrivAmplo = user.hasSomeRoles([`Reports.executar.${sistema}` as ListaDePrivilegios]);
        let fonteFilter: Prisma.RelatorioWhereInput['fonte'] = filters.fonte;
        if (!temPrivAmplo) {
            const fontesEscopadas = FONTES_POR_SISTEMA[sistema].filter((f) =>
                user.hasSomeRoles([`Reports.executar.${sistema}:${f}` as ListaDePrivilegios])
            );
            fonteFilter = filters.fonte
                ? fontesEscopadas.includes(filters.fonte)
                    ? filters.fonte
                    : { in: [] }
                : { in: fontesEscopadas };
        }

        // Gestor de Distribuição de Recurso só vê reports do próprio órgão: enxerga `Publico`
        // apenas quando `parametros.orgao_id` casa com o órgão dele. Demais usuários enxergam
        // qualquer `Publico` sem filtro extra.
        const isGestorDistribuicao = user.hasSomeRoles(['SMAE.PerfilGestorDistribuicaoRecurso']);
        const visibilidadeOR: Prisma.RelatorioWhereInput[] = [
            {
                visibilidade: 'Privado',
                criado_por: user.id,
            },
        ];
        if (isGestorDistribuicao) {
            if (user.orgao_id) {
                visibilidadeOR.push({
                    visibilidade: 'Publico',
                    parametros: {
                        path: ['orgao_id'],
                        equals: user.orgao_id,
                    },
                });
            }
        } else {
            visibilidadeOR.push({ visibilidade: 'Publico' });
        }

        const rows = await this.prisma.relatorio.findMany({
            where: {
                id: filters.id,
                fonte: fonteFilter,
                pdm_id: filters.pdm_id,
                removido_em: null,
                sistema: { in: [sistema, 'SMAE'] },
                AND: [
                    {
                        OR: [
                            ...visibilidadeOR,
                            {
                                visibilidade: 'Restrito',
                                OR: [
                                    // If there's no restriction at all
                                    {
                                        restrito_para: {
                                            equals: Prisma.AnyNull,
                                        },
                                    },
                                    // Escopo "meu_orgao": restrito_para.orgao_id casa com o órgão do
                                    // usuário. O gate por privilégio já é aplicado acima (fonteFilter),
                                    // então basta o match por órgão. Coberto pelo índice de expressão
                                    // relatorio_restrito_orgao_id_idx.
                                    ...(user.orgao_id
                                        ? [
                                              {
                                                  restrito_para: {
                                                      path: ['orgao_id'],
                                                      equals: user.orgao_id,
                                                  },
                                              } satisfies Prisma.RelatorioWhereInput,
                                          ]
                                        : []),
                                    // Check for role-based access (legado: portfolio_orgao_ids/roles)
                                    {
                                        AND: [
                                            {
                                                // Prisma sobre PostgreSQL usa array de chaves no `path`
                                                // (ex.: ['roles']). A sintaxe `$.roles` é do conector
                                                // MySQL e aqui sempre resolveria para NULL — fazendo o
                                                // `equals: AnyNull` virar "sempre verdadeiro" e o filtro
                                                // por órgão vazar todos os relatórios Restrito.
                                                OR: [
                                                    {
                                                        restrito_para: {
                                                            path: ['roles'],
                                                            equals: Prisma.AnyNull,
                                                        },
                                                    },
                                                    {
                                                        restrito_para: {
                                                            path: ['roles'],
                                                            array_contains: user.privilegios as string[],
                                                        },
                                                    },
                                                ],
                                            },
                                            {
                                                OR: [
                                                    {
                                                        restrito_para: {
                                                            path: ['portfolio_orgao_ids'],
                                                            equals: Prisma.AnyNull,
                                                        },
                                                    },
                                                    user.orgao_id
                                                        ? {
                                                              restrito_para: {
                                                                  path: ['portfolio_orgao_ids'],
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
                sistema: true,
                visibilidade: true,
                visibilidade_tipo: true,
                arquivo_id: true,
                parametros: true,
                parametros_processados: true,
                pdm_id: true,
                progresso: true,
                err_msg: true,
                iniciado_em: true,
                processado_em: true,
                resumo_saida: true,
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
                const pode_remover = hasReportPriv(user, 'remover', r.sistema, r.fonte);
                const { sistema: _sistema, visibilidade_tipo, ...rest } = r;

                return {
                    ...rest,
                    visibilidade_tipo: (visibilidade_tipo as VisibilidadeTipo | null) ?? null,
                    progresso: progresso,
                    eh_publico: eh_publico,
                    pode_remover: pode_remover,
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
                    resumo_saida: r.resumo_saida?.valueOf() as object[] | null,
                } satisfies RelatorioDto;
            }),
            tem_mais: tem_mais,
            token_ttl: PAGINATION_TOKEN_TTL,
            token_proxima_pagina: token_proxima_pagina,
        };
    }

    async delete(id: number, user: PessoaFromJwt) {
        const relatorio = await this.prisma.relatorio.findFirst({
            where: { id, removido_em: null },
            select: { fonte: true, sistema: true },
        });
        // Autorização pelo sistema persistido no relatório (fonte de verdade do recurso).
        // Aceita o privilégio amplo `Reports.remover.{sistema}` ou o escopado
        // `Reports.remover.{sistema}:{fonte}`.
        if (relatorio && !hasReportPriv(user, 'remover', relatorio.sistema, relatorio.fonte)) {
            throw new ForbiddenException('Usuário não tem permissão para remover este relatório.');
        }

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

        // Preserva `restrito_para` gravado em saveReport (escopo por órgão para usuário sem
        // privilégio amplo) — sem o merge, o pós-processamento sobrescreveria com null e a
        // listagem voltaria a vazar reports entre órgãos.
        const existing = await prismaTx.relatorio.findUnique({
            where: { id: relatorioId },
            select: { restrito_para: true },
        });
        const merged =
            existing?.restrito_para || obj
                ? { ...((existing?.restrito_para as object) ?? {}), ...(obj ?? {}) }
                : null;

        await prismaTx.relatorio.update({
            where: { id: relatorioId },
            data: {
                arquivo_id: arquivoId,
                processado_em: now,
                restrito_para: merged === null ? null : (merged as any),
            },
        });
    }

    async handleError(taskId: number, error: Error, prismaTx: Prisma.TransactionClient) {
        await prismaTx.relatorio.updateMany({
            where: {
                id: taskId,
            },
            data: {
                err_msg: error.message,
                progresso: -1,
                processado_em: new Date(Date.now()),
            },
        });
    }

    async executaRelatorio(relatorio_id: number) {
        this.logger.log(`iniciando processamento do relatório ID ${relatorio_id}`);

        let contexto: ReportContext | null = null;

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

            contexto = new ReportContext(this.prisma, relatorio.id, relatorio.sistema);

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
            let filename = [relatorio.fonte.toString(), DateTime.local({ zone: SYSTEM_TIMEZONE }).toISO() + '.zip']
                .filter((r) => r)
                .join('-');

            filename = filename.replace('CasaCivil', 'TransfVoluntarias'); // Ajuste para o nome correto do arquivo

            const zipBuffer = await this.zipFiles(contexto.getFiles());

            const arquivoId = await this.uploadService.uploadReport(
                relatorio.fonte,
                filename,
                zipBuffer,
                contentType,
                null
            );

            await this.prisma.$transaction(async (prismaTx) => {
                await this.updateRelatorioMetadata(relatorio.id, arquivoId, now, contexto!, prismaTx);

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
        } finally {
            if (contexto) contexto.cleanupTmpFiles();
        }
    }

    private async sendEmailNotification(
        relatorio: {
            id: number;
            criador: { email: string } | null;
            fonte: FonteRelatorio;
            sistema: ModuloSistema;
            parametros_processados: any;
            criado_em: Date;
        },
        prismaTx: Prisma.TransactionClient
    ) {
        const baseUrl = await this.smaeConfigService.getBaseUrl('URL_LOGIN_SMAE');

        if (!relatorio.criador) return;

        const useDeepLink = await this.smaeConfigService.getConfigBooleanWithDefault(
            'RELATORIO_EMAIL_DEEP_LINK',
            false
        );

        let url: string;
        if (useDeepLink) {
            const frontendPath = this.getReportFrontendPath(relatorio.sistema, relatorio.fonte);
            url = frontendPath
                ? new URL(frontendPath + `?id=${relatorio.id}`, baseUrl).toString()
                : new URL(baseUrl).toString();
        } else {
            url = new URL(baseUrl).toString();
        }

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
                              // O template é renderizado pelo Template Toolkit (Perl). Valores em array viram
                              // arrayref e seriam impressos como "ARRAY(0x...)", então achatamos para string aqui.
                              value: Array.isArray(value) ? value.join(', ') : value,
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

    private getReportFrontendPath(sistema: ModuloSistema, fonte: FonteRelatorio): string | null {
        if (sistema === 'SMAE') return null;

        const map: Partial<Record<ModuloSistema, Partial<Record<FonteRelatorio, string>>>> = {
            PDM: {
                MonitoramentoMensal: '/relatorios/mensal',
                Indicadores: '/relatorios/semestral-ou-anual',
                Orcamento: '/relatorios/orcamentarios-pdm',
                PrevisaoCusto: '/relatorios/previsao-de-custo-pdm',
            },
            PlanoSetorial: {
                PSMonitoramentoMensal: '/plano-setorial/relatorios/mensal',
                PSIndicadores: '/plano-setorial/relatorios/semestral-ou-anual',
                PSPrevisaoCusto: '/plano-setorial/relatorios/previsao-de-custo',
                PSOrcamento: '/plano-setorial/relatorios/orcamentarios',
            },
            ProgramaDeMetas: {
                PSMonitoramentoMensal: '/programa-de-meta/relatorios/mensal',
                PSIndicadores: '/programa-de-meta/relatorios/semestral-ou-anual',
                PSPrevisaoCusto: '/programa-de-meta/relatorios/previsao-de-custo',
                PSOrcamento: '/programa-de-meta/relatorios/orcamentarios',
            },
            Projetos: {
                Projeto: '/relatorios/projeto',
                Projetos: '/relatorios/portfolio',
                ProjetoStatus: '/relatorios/projeto-e-status',
                ProjetoOrcamento: '/relatorios/orcamentarios-portfolio',
                ProjetoPrevisaoCusto: '/relatorios/previsao-de-custo-portfolio',
            },
            MDO: {
                Obras: '/relatorios/portfolio-obras',
                ObraStatus: '/relatorios/obra-e-status',
                ObrasOrcamento: '/relatorios/orcamentarios-portfolio-obras',
                ObrasPrevisaoCusto: '/relatorios/previsao-de-custo-portfolio-obras',
            },
            CasaCivil: {
                Parlamentares: '/relatorios/parlamentares',
                TribunalDeContas: '/relatorios/tribunal-de-contas',
                Transferencias: '/relatorios/transferencias-voluntarias',
                AtvPendentes: '/relatorios/atividades-pendentes',
                Demandas: '/relatorios/demandas',
            },
        };

        return map[sistema]?.[fonte] ?? null;
    }

    private async getRelatorioFonteString(fonte: FonteRelatorio): Promise<string> {
        switch (fonte) {
            case FonteRelatorio.AtvPendentes:
                return 'SERI - Atividades Pendentes';
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
            case FonteRelatorio.Demandas:
                return 'Demandas';
            default:
                return 'Desconhecido';
        }
    }
}
