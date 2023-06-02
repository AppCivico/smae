import { HttpException, Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DateTime } from 'luxon';
import { AuthService } from 'src/auth/auth.service';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaHelpers } from 'src/common/PrismaHelpers';
import { JOB_IMPORTACAO_ORCAMENTO_LOCK } from 'src/common/dto/locks';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { Stream2Buffer } from 'src/common/helpers/Stream2Buffer';
import { DotacaoProcessoNotaService } from 'src/dotacao/dotacao-processo-nota.service';
import { DotacaoProcessoService } from 'src/dotacao/dotacao-processo.service';
import { DotacaoService } from 'src/dotacao/dotacao.service';
import { MetaService } from 'src/meta/meta.service';
import { CreateOrcamentoRealizadoItemDto } from 'src/orcamento-realizado/dto/create-orcamento-realizado.dto';
import { OrcamentoRealizadoService as PdmOrcamentoRealizadoService } from 'src/orcamento-realizado/orcamento-realizado.service';
import { OrcamentoRealizadoService as ProjetoOrcamentoRealizadoService } from 'src/pp/orcamento-realizado/orcamento-realizado.service';
import { ProjetoService } from 'src/pp/projeto/projeto.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UploadService } from 'src/upload/upload.service';
import { read, utils, writeXLSX } from "xlsx";
import { CreateImportacaoOrcamentoDto, FilterImportacaoOrcamentoDto } from './dto/create-importacao-orcamento.dto';
import { ImportacaoOrcamentoDto, LinhaCsvInputDto } from './entities/importacao-orcamento.entity';
import { ColunasNecessarias, OrcamentoImportacaoHelpers, OutrasColumns } from './importacao-orcamento.common';
import { RetryPromise } from 'src/common/retryPromise';
const XLSX_ZAHL_PAYLOAD = require('xlsx/dist/xlsx.zahl');

type ProcessaLinhaParams = {
    metasIds: number[]
    iniciativasIds: number[]
    atividadesIds: number[]
    projetosIds: number[]
    metasCodigos2Ids: Record<string, number>
    projetosCodigos2Ids: Record<string, number>
    iniciativasCodigos2Ids: Record<string, number>
    atividadesCodigos2Ids: Record<string, number>
    eh_projeto: boolean
    eh_metas: boolean
    anosPort: number[]
    anosPdm: Record<string, number[]>
    portfolio_id: number | null
};

@Injectable()
export class ImportacaoOrcamentoService {
    private readonly logger = new Logger(ImportacaoOrcamentoService.name);
    constructor(
        private readonly prisma: PrismaService,
        private readonly uploadService: UploadService,
        private readonly dotacaoService: DotacaoService,
        private readonly dotacaoProcessoService: DotacaoProcessoService,
        private readonly dotacaoProcessoNotaService: DotacaoProcessoNotaService,

        @Inject(forwardRef(() => ProjetoService)) private readonly projetoService: ProjetoService,
        @Inject(forwardRef(() => AuthService)) private readonly authService: AuthService,
        @Inject(forwardRef(() => MetaService)) private readonly metaService: MetaService,

        @Inject(forwardRef(() => PdmOrcamentoRealizadoService)) private readonly pdmOrcResService: PdmOrcamentoRealizadoService,
        @Inject(forwardRef(() => ProjetoOrcamentoRealizadoService)) private readonly ppOrcResService: ProjetoOrcamentoRealizadoService,
    ) { }

    async create(dto: CreateImportacaoOrcamentoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const arquivo_id = this.uploadService.checkUploadToken(dto.upload);

        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {

                const importacao = await prismaTxn.importacaoOrcamento.create({
                    data: {
                        criado_por: user.id,
                        arquivo_id: arquivo_id,
                        pdm_id: dto.pdm_id,
                        portfolio_id: dto.portfolio_id,
                    },
                    select: { id: true },
                });

                return importacao;
            }
        );

        this.executaImportacaoOrcamento(created.id);

        return { id: created.id }
    }

    async findAll(filters: FilterImportacaoOrcamentoDto, user: PessoaFromJwt): Promise<ImportacaoOrcamentoDto[]> {

        const filtros: Prisma.Enumerable<Prisma.ImportacaoOrcamentoWhereInput> = [];

        // a logica aqui em baixo é a seguinte
        // se a pessoa tem permissão, então ela pode ver todos os registros onde
        // ela tem acesso OU não é do tipo desse filtro (eg: se é filtro do projeto, esse OR vai trazer todos as linhas de metas)
        // quando chegar no IF da meta, se ela não tiver a permissão, vai entrar outro filtro pra excluir os registros onde a meta é nulo
        // e vice versa para o projeto/portfolio

        if (user.hasSomeRoles(['Projeto.orcamento'])) {
            const projetos = await this.projetoService.findAllIds(user);

            filtros.push({
                OR: [
                    { pdm_id: { not: null } },
                    {
                        portfolio: {
                            Projeto: {
                                some: {
                                    id: {
                                        in: projetos.map(r => r.id)
                                    }
                                }
                            }
                        }
                    }
                ]
            });
        } else {
            filtros.push({ portfolio_id: null })
        }

        if (user.hasSomeRoles(['CadastroMeta.orcamento'])) {
            const metas = await this.metaService.findAllIds(user);

            filtros.push({
                OR: [
                    { portfolio_id: { not: null } },
                    {
                        pdm: {
                            Meta: {
                                some: {
                                    id: {
                                        in: metas.map(r => r.id)
                                    }
                                }
                            }
                        }
                    }
                ]
            });
        } else {
            filtros.push({ pdm_id: null })
        }

        const registros = await this.prisma.importacaoOrcamento.findMany({
            where: {
                portfolio_id: filters.portfolio_id,
                pdm_id: filters.pdm_id,
                AND: [...filtros]
            },
            include: {
                arquivo: {
                    select: { tamanho_bytes: true }
                },
                saida_arquivo: {
                    select: { tamanho_bytes: true }
                },
                criador: { select: { id: true, nome_exibicao: true } },
                pdm: { select: { id: true, nome: true } },
                portfolio: { select: { id: true, titulo: true } },
            },
            orderBy: [
                { criado_em: 'desc' }
            ]
        });

        return registros.map((r) => {

            return {
                id: r.id,
                arquivo: {
                    id: r.arquivo_id,
                    tamanho_bytes: r.arquivo.tamanho_bytes,
                    token: (this.uploadService.getDownloadToken(r.arquivo_id, '1d')).download_token,
                },
                saida_arquivo: r.saida_arquivo_id && r.saida_arquivo ? {
                    id: r.saida_arquivo_id,
                    tamanho_bytes: r.saida_arquivo.tamanho_bytes,
                    token: (this.uploadService.getDownloadToken(r.saida_arquivo_id, '1d')).download_token,
                } : null,
                pdm: r.pdm,
                portfolio: r.portfolio,
                criado_por: r.criador,
                criado_em: r.criado_em,
                processado_em: r.processado_em ?? null,
                processado_errmsg: r.processado_errmsg,
                linhas_importadas: r.linhas_importadas,
                linhas_recusadas: r.linhas_recusadas,
            }

        });

    }


    @Cron('* * * * *')
    async handleCron() {
        if (Boolean(process.env['DISABLE_IMPORTACAO_ORCAMENTO_CRONTAB'])) return;

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
            },
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
                                }
                            },
                        ]
                    }
                ]
            },
            select: {
                id: true
            }
        });

        for (const job of pending) {

            await this.prisma.importacaoOrcamento.update({
                where: { id: job.id },
                data: {
                    congelado_em: new Date(Date.now())
                }
            });

            try {
                await this.processaArquivo(job.id)
            } catch (error) {
                console.log(error);
                this.logger.error(error);

                await this.prisma.importacaoOrcamento.update({
                    where: { id: job.id },
                    data: {
                        linhas_importadas: 0,
                        processado_errmsg: `Erro ao processar arquivo: ${error}`,
                        processado_em: new Date(Date.now())
                    }
                });

            }
        }
    }

    private async processaArquivo(id: number) {

        const job = await this.prisma.importacaoOrcamento.findUniqueOrThrow({
            where: { id: +id }
        });

        const inputBuffer = await Stream2Buffer((await this.uploadService.getReadableStreamById(job.arquivo_id)).stream);

        const inputXLSX = read(inputBuffer, {
            type: 'buffer'

        });

        const sheetName = inputXLSX.SheetNames[0];
        const sheet = inputXLSX.Sheets[sheetName];
        const range = utils.decode_range(sheet['!ref']!);

        const colunaHeaderIndex = OrcamentoImportacaoHelpers.createColumnHeaderIndex(sheet, [...ColunasNecessarias, ...OutrasColumns]);

        const outputXLSX = utils.book_new();
        const outputSheet = utils.aoa_to_sheet([[...ColunasNecessarias, ...OutrasColumns, 'Status']]);
        utils.book_append_sheet(outputXLSX, outputSheet, sheetName);

        let projetosIds: number[] = [];
        let metasIds: number[] = [];

        // se foi criado sem dono, pode todos Meta|Projeto, os metodos foram findAllIds
        // foram adaptados pra retornar todos os ids dos items não removidos
        const user = await this.authService.pessoaJwtFromId(job.criado_por);

        if (job.portfolio_id) {
            const projetosDoUser = await this.projetoService.findAllIds(user);
            projetosIds.push(...projetosDoUser.map(r => r.id));
        } else if (job.pdm_id) {
            const metasDoUser = await this.metaService.findAllIds(user);

            metasIds.push(...metasDoUser.map(r => r.id));
        }

        console.log({ job, metasIds, projetosIds });

        const projetosCodigos2Ids = await PrismaHelpers.prismaCodigo2IdMap(this.prisma, 'projeto', projetosIds, true);
        const metasCodigos2Ids = await PrismaHelpers.prismaCodigo2IdMap(this.prisma, 'meta', metasIds, false);

        let { iniciativasIds, atividadesIds, iniciativasCodigos2Ids, atividadesCodigos2Ids }: { iniciativasIds: number[]; atividadesIds: number[]; iniciativasCodigos2Ids: Record<string, number>; atividadesCodigos2Ids: Record<string, number>; } = await this.carregaIniciativaAtiv(metasIds);

        let linhas_importadas: number = 0;
        let linhas_recusadas: number = 0;

        for (let rowIndex = range.s.r + 1; rowIndex <= range.e.r; rowIndex++) {
            const row = [];
            let col2row: any = {};

            [...ColunasNecessarias, ...OutrasColumns].forEach((columnName) => {

                const colIndex = colunaHeaderIndex[columnName];

                if (colIndex >= 0) {
                    const cellAddress = utils.encode_cell({ c: colIndex, r: rowIndex });
                    const cellValue = sheet[cellAddress]?.v;

                    // traduzindo algumas colunas do excel pro DTO
                    if (columnName === 'ano') {
                        col2row['ano_referencia'] = cellValue;
                    } else {
                        col2row[columnName] = cellValue;
                    }

                    row.push(cellValue);
                } else {
                    row.push(undefined);
                }
            });

            const anosPort: number[] = [];
            const anosPdm: Record<string, typeof anosPort> = {};
            if (job.portfolio_id) {
                anosPort.push(...(await this.prisma.portfolio.findFirstOrThrow({
                    where: { id: job.portfolio_id },
                    select: { orcamento_execucao_disponivel_meses: true }
                })).orcamento_execucao_disponivel_meses);
            } else if (job.pdm_id) {

                const anosPdmRows = await this.prisma.pdmOrcamentoConfig.findMany({
                    where: { pdm_id: job.pdm_id },
                    select: { ano_referencia: true, execucao_disponivel_meses: true }
                });

                for (const r of anosPdmRows) {
                    anosPdm[r.ano_referencia] = r.execucao_disponivel_meses;
                }
            }


            let feedback = await this.processaRow(
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
            );

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

        const upload_id = await RetryPromise(() => {
            return this.uploadService.upload({
                tipo: 'IMPORTACAO_ORCAMENTO',
                arquivo: buffer,
                descricao: `saida-${job.id}.xlsx`
            }, user, { buffer }, '')
        }, 50, 1000, 100);

        await RetryPromise(() => this.prisma.importacaoOrcamento.update({
            where: {
                id: job.id
            },
            data: {
                saida_arquivo_id: upload_id,
                processado_em: new Date(Date.now()),
                linhas_importadas,
                linhas_recusadas,
            }
        }));

    }

    private async carregaIniciativaAtiv(metasIds: number[]) {
        let iniciativasIds: number[] = [];
        let atividadesIds: number[] = [];
        let iniciativasCodigos2Ids: Record<string, number> = {};
        let atividadesCodigos2Ids: Record<string, number> = {};
        if (metasIds.length > 0) {
            const iniciativas = await this.prisma.iniciativa.findMany({
                where: {
                    meta_id: { in: metasIds },
                    removido_em: null
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
                        where: { removido_em: null }
                    }
                },
            });

            for (const iniciativa of iniciativas) {
                iniciativasCodigos2Ids[`${iniciativa.meta_id}-${iniciativa.codigo}`.toLowerCase()] = iniciativa.id;
                iniciativasIds.push(iniciativa.id);

                for (const atividade of iniciativa.atividade) {
                    atividadesCodigos2Ids[`${iniciativa.meta_id}-${iniciativa.id}-${atividade.codigo}`.toLowerCase()] = atividade.id;
                    atividadesIds.push(atividade.id);
                }
            }
        }
        return { iniciativasIds, atividadesIds, iniciativasCodigos2Ids, atividadesCodigos2Ids };
    }


    async processaRow(col2row: any, params: ProcessaLinhaParams, user: PessoaFromJwt): Promise<string> {

        console.log(params)
        const row = plainToInstance(LinhaCsvInputDto, col2row);
        const validations = await validate(row);
        if (validations.length) {
            return 'Linha inválida: ' + validations.reduce((acc, curr) => {
                return [...acc, ...Object.values(curr.constraints as any)];
            }, []);
        }

        let projeto_id: number | undefined = undefined;
        let meta_id: number | undefined = undefined;
        let iniciativa_id: number | undefined = undefined;
        let atividade_id: number | undefined = undefined;

        if (row.nota_empenho && row.processo) return 'Linhas inválida: nota empenho ou enviar processo';
        if (row.nota_empenho && row.dotacao) return 'Linhas inválida: nota empenho ou enviar dotação';
        if (row.processo && row.dotacao) return 'Linhas inválida: enviar processo ou dotação';

        if (!row.dotacao && !row.processo && !row.nota_empenho) return 'Linhas inválida: é necessário pelo menos dotação, processo ou nota de empenho';

        if (params.eh_metas) {
            if (row.meta_codigo && row.meta_id) return 'Linha inválida: meta código e meta id são de uso exclusivo';
            if (row.iniciativa_codigo && row.iniciativa_id) return 'Linha inválida: iniciativa código e iniciativa id são de uso exclusivo';
            if (row.atividade_codigo && row.atividade_id) return 'Linha inválida: atividade código e atividade id são de uso exclusivo';

            if (row.iniciativa_codigo && !(row.meta_codigo || row.meta_id)) return 'Linha inválida: não há como buscar iniciativa por código sem saber a meta';
            if (row.atividade_codigo && !(row.iniciativa_codigo || row.iniciativa_id)) return 'Linha inválida: não há como buscar atividade por código sem saber a iniciativa';

            if (row.projeto_codigo && row.projeto_id) return 'Linha inválida: projeto não pode ser usado em importações do PDM';

            if (row.meta_id) meta_id = row.meta_id;
            // valida a meta
            if (row.meta_codigo) meta_id = params.metasCodigos2Ids[row.meta_codigo.toLowerCase()];
            if (!meta_id) return `Linha inválida: meta não encontrada, código ${row.meta_codigo}`;

            if (row.iniciativa_id) iniciativa_id = row.iniciativa_id;
            // valida a iniciativa
            if (row.iniciativa_codigo) iniciativa_id = params.metasCodigos2Ids[`${meta_id}-${row.iniciativa_codigo}`.toLowerCase()];
            if (row.iniciativa_codigo && !iniciativa_id) return `Linha inválida: iniciativa não encontrada, código ${row.meta_codigo} na meta ID ${meta_id}`;

            if (row.atividade_id) atividade_id = row.atividade_id;
            // valida a atividade
            if (row.atividade_codigo) atividade_id = params.atividadesCodigos2Ids[`${meta_id}-${iniciativa_id}-${row.atividade_codigo}`.toLowerCase()];
            if (row.atividade_codigo && !atividade_id) return `Linha inválida: atividade não encontrada, código ${row.atividade_codigo} na iniciativa ID ${iniciativa_id}}`;

            // valida se tem permissão de fato pra ver tudo
            if (!params.metasIds.includes(meta_id)) return `Linha inválida: sem permissão na meta ID ${meta_id}`;
            if (iniciativa_id && !params.iniciativasIds.includes(iniciativa_id)) return `Linha inválida: sem permissão na iniciativa ID ${iniciativa_id}`;
            if (atividade_id && !params.atividadesIds.includes(atividade_id)) return `Linha inválida: sem permissão na atividade ID ${atividade_id}`;

            const mes_ref = params.anosPdm[row.ano_referencia];
            if (!mes_ref) return `Linha inválida: ano ${row.ano_referencia} não está configurado`;

            if (!mes_ref.includes(row.mes)) return `Linha inválida: mês ${row.mes} não está liberado no ano ${row.ano_referencia}`;

        } else if (params.eh_projeto) {
            if (row.meta_codigo && row.meta_id) return 'Linha inválida: meta não pode ser usado em importações de projetos';
            if (row.iniciativa_codigo && row.iniciativa_id) return 'Linha inválida: iniciativa não pode ser usado em importações de projetos';
            if (row.atividade_codigo && row.atividade_id) return 'Linha inválida: atividade meta não pode ser usado em importações de projetos';

            if (row.projeto_codigo && row.projeto_id) return 'Linha inválida: projeto código e projeto id são de uso exclusivo';

            if (row.projeto_id) projeto_id = row.projeto_id;
            if (row.projeto_codigo) projeto_id = params.projetosCodigos2Ids[row.projeto_codigo.toLowerCase()];

            if (!projeto_id) return `Linha inválida: projeto não encontrado, código ${row.projeto_codigo}`;

            if (!params.projetosIds.includes(projeto_id)) return `Linha inválida: sem permissão no projeto ID ${projeto_id}`;

            if (!params.anosPort.includes(row.mes)) return `Linha inválida: mês ${row.mes} não está liberado no portfólio`;

        }

        let dotacao: string | undefined = undefined;
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
                dotacao_processo = ne[0].processo;
                dotacao_processo_nota = ne[0].nota_empenho;

            } catch (error) {
                if (error instanceof HttpException)
                    return `Linha inválida: ${error}`;

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
                if (processo.length !== 1) return `Linha inválida: ${processo.length} dotações encontradas pelo processo, cadastre pelo sistema`;

                dotacao = processo[0].dotacao;
                dotacao_processo = processo[0].processo;

            } catch (error) {
                if (error instanceof HttpException)
                    return `Linha inválida: ${error}`;

                return `Erro no processamento do processo: ${error}`;
            }
        } else if (row.dotacao) {
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
                if (error instanceof HttpException)
                    return `Linha inválida: ${error}`;

                return `Erro no processamento do processo: ${error}`;
            }
        } else {
            return 'Erro: código não implementado'
        }

        if (!dotacao) return 'Erro: faltando dotacao';

        let id: number | undefined = undefined;
        let itens: CreateOrcamentoRealizadoItemDto[] = [];

        let adicionar_item_mes: boolean = true;
        if (params.eh_metas) {
            if (!meta_id) return 'Linha inválida: faltando meta_id';

            const existeNaMeta = await this.pdmOrcResService.findAll({
                ano_referencia: row.ano_referencia,
                meta_id,
                dotacao,
                nota_empenho: dotacao_processo_nota,
                processo: dotacao_processo,
            }, user);

            const maisRecente = existeNaMeta.at(-1);
            if (maisRecente) {
                id = maisRecente.id;
                itens = maisRecente.itens.map(r => {
                    return {
                        mes: r.mes,
                        valor_empenho: +r.valor_empenho,
                        valor_liquidado: +r.valor_liquidado
                    }
                });
            }

            for (const item of itens) {
                if (item.mes === row.mes) {
                    adicionar_item_mes = false;
                    item.valor_empenho = row.valor_empenho;
                    item.valor_liquidado = row.valor_liquidado;
                }
            }

        } else if (params.eh_projeto) {
            if (!projeto_id) return 'Linha inválida: faltando projeto_id';

            const existeNaMeta = await this.ppOrcResService.findAll(
                {
                    id: projeto_id,
                    portfolio_id: params.portfolio_id!,
                },
                {
                    ano_referencia: row.ano_referencia,
                    dotacao,
                    nota_empenho: dotacao_processo_nota,
                    processo: dotacao_processo,
                }, user);

            const maisRecente = existeNaMeta.at(-1);
            if (maisRecente) {
                id = maisRecente.id;
                itens = maisRecente.itens.map(r => {
                    return {
                        mes: r.mes,
                        valor_empenho: +r.valor_empenho,
                        valor_liquidado: +r.valor_liquidado
                    }
                });
            }

            for (const item of itens) {
                if (item.mes === row.mes) {
                    adicionar_item_mes = false;
                    item.valor_empenho = row.valor_empenho;
                    item.valor_liquidado = row.valor_liquidado;
                }
            }
        }

        if (adicionar_item_mes)
            itens.push({
                mes: row.mes,
                valor_empenho: row.valor_empenho,
                valor_liquidado: row.valor_liquidado,
            })

        try {
            const upsertPromise = new Promise<void>(async (resolve, reject) => {
                if (params.eh_metas) {

                    if (id) {
                        await this.pdmOrcResService.update(id, {
                            itens,
                            meta_id,
                            atividade_id,
                            iniciativa_id
                        }, user);
                    } else {
                        await this.pdmOrcResService.create({
                            ano_referencia: row.ano_referencia,
                            dotacao: dotacao!,
                            processo: dotacao_processo,
                            nota_empenho: dotacao_processo_nota,
                            itens,
                            meta_id,
                            atividade_id,
                            iniciativa_id
                        }, user);
                    }

                } else if (params.eh_projeto) {

                    if (id) {
                        await this.ppOrcResService.update({
                            id: projeto_id!,
                            portfolio_id: params.portfolio_id!,
                        }, id, {
                            itens,


                        }, user);
                    } else {
                        await this.ppOrcResService.create({
                            id: projeto_id!,
                            portfolio_id: params.portfolio_id!,
                        }, {
                            ano_referencia: row.ano_referencia,
                            dotacao: dotacao!,
                            processo: dotacao_processo,
                            nota_empenho: dotacao_processo_nota,
                            itens,
                        }, user);
                    }
                }

                resolve();
            });

            await RetryPromise(() => upsertPromise, 5, 2000, 100);

        } catch (error) {
            if (error instanceof HttpException)
                return `Linha inválida: ${error}`;

            return `Erro no processamento do processo: ${error}`;
        }

        return '';
    }



}
