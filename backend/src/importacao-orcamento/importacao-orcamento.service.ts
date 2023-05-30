import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { CreateImportacaoOrcamentoDto, FilterImportacaoOrcamentoDto } from './dto/create-importacao-orcamento.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UploadService } from 'src/upload/upload.service';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { JOB_IMPORTACAO_ORCAMENTO_LOCK } from 'src/common/dto/locks';
import { Cron } from '@nestjs/schedule';
import { DateTime } from 'luxon';
import { SYSTEM_TIMEZONE } from 'src/common/date2ymd';
import { ImportacaoOrcamentoDto, ListImportacaoOrcamentoDto } from './entities/importacao-orcamento.entity';
import { ProjetoService } from 'src/pp/projeto/projeto.service';
import { MetaService } from 'src/meta/meta.service';


@Injectable()
export class ImportacaoOrcamentoService {
    private readonly logger = new Logger(ImportacaoOrcamentoService.name);
    constructor(
        private readonly prisma: PrismaService,
        private readonly uploadService: UploadService,

        @Inject(forwardRef(() => ProjetoService)) private readonly projetoService: ProjetoService,
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

        return { id: created.id }
    }

    async findAll(filters: FilterImportacaoOrcamentoDto, user: PessoaFromJwt): Promise<ImportacaoOrcamentoDto[]> {

        const filtros: Prisma.Enumerable<Prisma.ImportacaoOrcamentoWhereInput> = [];

        if (user.hasSomeRoles(['Projeto.orcamento'])) {
            const projetos = await this.projetoService.findAllIds(user);

            filtros.push({
                portfolio: {
                    Projeto: {
                        some: {
                            id: {
                                in: projetos.map(r => r.id)
                            }
                        }
                    }
                }
            });
        } else {
            filtros.push({ portfolio_id: null })
        }

        if (user.hasSomeRoles(['CadastroMeta.orcamento'])) {
            const metas = await this.metaService.findAllIds(user);

            filtros.push({
                pdm: {
                    Meta: {
                        some: {
                            id: {
                                in: metas.map(r => r.id)
                            }
                        }
                    }
                }
            });
        } else {
            filtros.push({ portfolio_id: null })
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


    @Cron('5 * * * *')
    async handleCron() {
        if (Boolean(process.env['DISABLE_IMPORTACAO_ORCAMENTO_CRONTAB'])) return;

        await this.prisma.$transaction(
            async (prisma: Prisma.TransactionClient) => {
                this.logger.debug(`Adquirindo lock para verificação de relatórios`);
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
            }
        });

        for (const job of pending) {

            await this.prisma.importacaoOrcamento.update({
                where: { id: job.id },
                data: {
                    congelado_em: new Date(Date.now())
                }
            });


        }
    }


}
