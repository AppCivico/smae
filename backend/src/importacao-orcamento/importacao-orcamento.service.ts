import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { DateTime } from 'luxon';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { JOB_IMPORTACAO_ORCAMENTO_LOCK } from 'src/common/dto/locks';
import { Stream2Buffer } from 'src/common/helpers/Stream2Buffer';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { MetaService } from 'src/meta/meta.service';
import { ProjetoService } from 'src/pp/projeto/projeto.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UploadService } from 'src/upload/upload.service';
import { CreateImportacaoOrcamentoDto, FilterImportacaoOrcamentoDto } from './dto/create-importacao-orcamento.dto';
import { ImportacaoOrcamentoDto, LinhaCsvInputDto } from './entities/importacao-orcamento.entity';
import { read, utils, writeFile } from "xlsx";
import { ColunasNecessarias, OrcamentoImportacaoHelpers, OutrasColumns } from './importacao-orcamento.common';
import { AuthService } from 'src/auth/auth.service';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PrismaHelpers } from 'src/common/PrismaHelpers';

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
};

@Injectable()
export class ImportacaoOrcamentoService {
    private readonly logger = new Logger(ImportacaoOrcamentoService.name);
    constructor(
        private readonly prisma: PrismaService,
        private readonly uploadService: UploadService,

        @Inject(forwardRef(() => ProjetoService)) private readonly projetoService: ProjetoService,
        @Inject(forwardRef(() => AuthService)) private readonly authService: AuthService,
        @Inject(forwardRef(() => MetaService)) private readonly metaService: MetaService,
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
                criador: { select: { id: true, nome_exibicao: true } },
                pdm: { select: { id: true, nome: true } },
                portfolio: { select: { id: true, titulo: true } },
            }
        });

        return registros.map((r) => {

            return {
                id: r.id,
                arquivo: {
                    id: r.arquivo_id,
                    tamanho_bytes: r.arquivo.tamanho_bytes,
                    token: (this.uploadService.getDownloadToken(r.arquivo_id, '1d')).download_token,
                },
                saida_arquivo: null,
                pdm: r.pdm,
                portfolio: r.portfolio,
                criado_por: r.criador,
                criado_em: r.criado_em,
                processado_em: r.processado_em ?? null,
                processado_errmsg: r.processado_errmsg,
                linhas_importadas: r.linhas_importadas,
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

        console.log(colunaHeaderIndex)

        const outputXLSX = utils.book_new();
        const outputSheet = utils.aoa_to_sheet([[...ColunasNecessarias, ...OutrasColumns, 'feedback']]);
        utils.book_append_sheet(outputXLSX, outputSheet, sheetName);

        let projetosIds: number[] = [];
        let metasIds: number[] = [];

        // se foi criado sem dono, pode todos Meta|Projeto, os metodos foram findAllIds
        // foram adaptados pra retornar todos os ids dos items não removidos
        const user = job.criado_por ? await this.authService.pessoaJwtFromId(job.criado_por) : undefined;

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

        for (let rowIndex = range.s.r + 1; rowIndex <= range.e.r; rowIndex++) {
            const row = [];
            let col2row: any = {};

            [...ColunasNecessarias, ...OutrasColumns].forEach((columnName) => {

                const colIndex = colunaHeaderIndex[columnName];
                console.log(columnName, colIndex)

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


            const feedback = await this.processaRow(
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
                }
            );
            console.log(col2row)

            row.push(feedback);

            const newRow = [row];
            console.log(newRow)
            utils.sheet_add_aoa(outputSheet, newRow, { origin: 'A' + (rowIndex + 1) });
        }


        // Write the output file
        writeFile(outputXLSX, '/tmp/output_file.xlsx');

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
                iniciativasCodigos2Ids[`${iniciativa.meta_id}-${iniciativa.codigo}`] = iniciativa.id;
                iniciativasIds.push(iniciativa.id);

                for (const atividade of iniciativa.atividade) {
                    atividadesCodigos2Ids[`${iniciativa.meta_id}-${iniciativa.id}-${atividade.codigo}`] = atividade.id;
                    atividadesIds.push(atividade.id);
                }
            }
        }
        return { iniciativasIds, atividadesIds, iniciativasCodigos2Ids, atividadesCodigos2Ids };
    }


    async processaRow(col2row: any, params: ProcessaLinhaParams): Promise<string> {

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

        if (!row.dotacao && !row.processo && !row.nota_empenho) return 'Linhas inválida: é necessário pelo menos dotação, processo ou nota de empenho';

        if (params.eh_metas) {
            if (row.meta_codigo && row.meta_id) return 'Linha inválida: meta código e meta id são de uso exclusivo';
            if (row.iniciativa_codigo && row.iniciativa_id) return 'Linha inválida: iniciativa código e iniciativa id são de uso exclusivo';
            if (row.atividade_codigo && row.atividade_id) return 'Linha inválida: atividade código e atividade id são de uso exclusivo';

            if (row.iniciativa_codigo && !(row.meta_codigo || row.meta_id)) return 'Linha inválida: não há como buscar iniciativa por código sem saber a meta';
            if (row.atividade_codigo && !(row.iniciativa_codigo || row.iniciativa_id)) return 'Linha inválida: não há como buscar atividade por código sem saber a iniciativa';

            if (row.projeto_codigo && row.projeto_id) return 'Linha inválida: projeto não pode ser usado em importações do PDM';

            // valida a meta
            if (row.meta_codigo) meta_id = params.metasCodigos2Ids[row.meta_codigo];
            if (!meta_id) return `Linha inválida: meta não encontrada, código ${row.meta_codigo}`;

            // valida a iniciativa
            if (row.iniciativa_codigo) iniciativa_id = params.metasCodigos2Ids[`${meta_id}-${row.iniciativa_codigo}`];
            if (row.iniciativa_codigo && !iniciativa_id) return `Linha inválida: iniciativa não encontrada, código ${row.meta_codigo} na meta ID ${meta_id}`;

            // valida a atividade
            if (row.atividade_codigo) atividade_id = params.atividadesCodigos2Ids[`${meta_id}-${iniciativa_id}-${row.atividade_codigo}`];
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

            if (row.projeto_codigo) projeto_id = params.projetosCodigos2Ids[row.projeto_codigo];

            if (!projeto_id) return `Linha inválida: projeto não encontrado, código ${row.projeto_codigo}`;

            if (!params.projetosIds.includes(projeto_id)) return `Linha inválida: sem permissão no projeto ID ${projeto_id}`;

            if (!params.anosPort.includes(row.mes)) return `Linha inválida: mês ${row.mes} não está liberado no portfólio`;

        }


        if (params.eh_metas) {

            //const existeNaMeta = await

        }

        return '';
    }



}
