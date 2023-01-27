import { ForbiddenException, HttpException, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { DateTime } from "luxon";
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { Date2YMD, DateYMD } from '../common/date2ymd';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { CreatePdmDocumentDto } from './dto/create-pdm-document.dto';
import { CreatePdmDto } from './dto/create-pdm.dto';
import { FilterPdmDto } from './dto/filter-pdm.dto';
import { CicloFisicoDto, OrcamentoConfig } from './dto/list-pdm.dto';
import { Pdm } from './dto/pdm.dto';
import { UpdatePdmOrcamentoConfigDto } from './dto/update-pdm-orcamento-config.dto';
import { UpdatePdmDto } from './dto/update-pdm.dto';
import { ListPdm } from './entities/list-pdm.entity';
import { PdmDocument } from './entities/pdm-document.entity';
const JOB_LOCK_NUMBER = 65656565;

@Injectable()
export class PdmService {
    private readonly logger = new Logger(PdmService.name);
    constructor(
        private readonly prisma: PrismaService,
        private readonly uploadService: UploadService
    ) { }

    async create(createPdmDto: CreatePdmDto, user: PessoaFromJwt) {

        const similarExists = await this.prisma.pdm.count({
            where: {
                descricao: { endsWith: createPdmDto.nome, mode: 'insensitive' },
            }
        });
        if (similarExists > 0)
            throw new HttpException('descricao| Descrição igual ou semelhante já existe em outro registro ativo', 400);

        let arquivo_logo_id: undefined | number;
        if (createPdmDto.upload_logo) {
            arquivo_logo_id = this.uploadService.checkUploadToken(createPdmDto.upload_logo);
        }

        delete createPdmDto.upload_logo;

        if (createPdmDto.possui_atividade && !createPdmDto.possui_iniciativa)
            throw new HttpException('possui_atividade| possui_iniciativa precisa ser True para ativar Atividades', 400);

        const created = await this.prisma.$transaction(async (prisma: Prisma.TransactionClient) => {
            const c = await prisma.pdm.create({
                data: {
                    criado_por: user.id,
                    criado_em: new Date(Date.now()),
                    arquivo_logo_id: arquivo_logo_id,
                    ...createPdmDto as any,
                },
                select: { id: true }
            });

            this.logger.log(`chamando monta_ciclos_pdm...`)
            await prisma.$queryRaw`select monta_ciclos_pdm(${c.id}::int, false)`;

            return c;
        });

        return created;
    }

    async findAll(filters: FilterPdmDto | undefined = undefined): Promise<ListPdm[]> {
        const active = filters?.ativo;

        const listActive = await this.prisma.pdm.findMany({
            where: {
                ativo: active,
            },
            select: {
                id: true,
                nome: true,
                descricao: true,
                ativo: true,
                data_inicio: true,
                data_fim: true,
                equipe_tecnica: true,
                prefeito: true,
                data_publicacao: true,
                periodo_do_ciclo_participativo_inicio: true,
                periodo_do_ciclo_participativo_fim: true,
                rotulo_iniciativa: true,
                rotulo_atividade: true,
                rotulo_macro_tema: true,
                rotulo_tema: true,
                rotulo_sub_tema: true,
                rotulo_contexto_meta: true,
                rotulo_complementacao_meta: true,
                possui_macro_tema: true,
                possui_tema: true,
                possui_sub_tema: true,
                possui_contexto_meta: true,
                possui_complementacao_meta: true,
                possui_atividade: true,
                possui_iniciativa: true,
                arquivo_logo_id: true,
                nivel_orcamento: true
            }
        });

        const listActiveTmp = listActive.map(pdm => {
            let logo = null;
            if (pdm.arquivo_logo_id) {
                logo = this.uploadService.getDownloadToken(pdm.arquivo_logo_id, '30d').download_token
            }

            return {
                ...pdm,
                arquivo_logo_id: undefined,
                logo: logo,
                data_fim: Date2YMD.toStringOrNull(pdm.data_fim),
                data_inicio: Date2YMD.toStringOrNull(pdm.data_inicio),
                data_publicacao: Date2YMD.toStringOrNull(pdm.data_publicacao),
                periodo_do_ciclo_participativo_fim: Date2YMD.toStringOrNull(pdm.periodo_do_ciclo_participativo_fim),
                periodo_do_ciclo_participativo_inicio: Date2YMD.toStringOrNull(pdm.periodo_do_ciclo_participativo_inicio),
            }
        });

        return listActiveTmp;
    }

    async getDetail(id: number, user: PessoaFromJwt): Promise<Pdm> {
        let pdm = await this.prisma.pdm.findFirst({
            where: {
                id: id
            }
        });
        if (!pdm) throw new HttpException('PDM não encontrado', 404)

        if (pdm.arquivo_logo_id) {
            pdm.logo = this.uploadService.getDownloadToken(pdm.arquivo_logo_id, '30d').download_token
        }

        return {
            ...pdm,
            data_fim: Date2YMD.toStringOrNull(pdm.data_fim),
            data_inicio: Date2YMD.toStringOrNull(pdm.data_inicio),
            data_publicacao: Date2YMD.toStringOrNull(pdm.data_publicacao),
            periodo_do_ciclo_participativo_fim: Date2YMD.toStringOrNull(pdm.periodo_do_ciclo_participativo_fim),
            periodo_do_ciclo_participativo_inicio: Date2YMD.toStringOrNull(pdm.periodo_do_ciclo_participativo_inicio),
        };
    }

    private async verificarPrivilegiosEdicao(updatePdmDto: UpdatePdmDto, user: PessoaFromJwt, pdm: { ativo: boolean }) {

        if (
            updatePdmDto.ativo !== pdm.ativo &&
            updatePdmDto.ativo === true &&
            user.hasSomeRoles(['CadastroPdm.ativar']) === false
        ) {
            throw new ForbiddenException(`Você não pode ativar Plano de Metas`);
        } else if (
            updatePdmDto.ativo !== pdm.ativo &&
            updatePdmDto.ativo === false &&
            user.hasSomeRoles(['CadastroPdm.inativar']) === false
        ) {
            throw new ForbiddenException(`Você não pode inativar Plano de Metas`);
        }


    }

    async update(id: number, updatePdmDto: UpdatePdmDto, user: PessoaFromJwt) {
        const pdm = await this.prisma.pdm.findFirstOrThrow({ where: { id: id } });
        await this.verificarPrivilegiosEdicao(updatePdmDto, user, pdm);

        if (updatePdmDto.nome) {
            const similarExists = await this.prisma.pdm.count({
                where: {
                    descricao: { endsWith: updatePdmDto.nome, mode: 'insensitive' },
                    NOT: { id: id }
                }
            });
            if (similarExists > 0)
                throw new HttpException('descricao| Descrição igual ou semelhante já existe em outro registro ativo', 400);
        }

        let arquivo_logo_id: number | undefined | null;
        // se enviar vazio, transformar em null para limpar o logo
        if (updatePdmDto.upload_logo == '') updatePdmDto.upload_logo = null;
        if (updatePdmDto.upload_logo) {
            arquivo_logo_id = this.uploadService.checkUploadToken(updatePdmDto.upload_logo);
        } else if (updatePdmDto.upload_logo === null) {
            arquivo_logo_id = null;
        }
        delete updatePdmDto.upload_logo;

        const now = new Date(Date.now());
        let verificarCiclos = false;
        await this.prisma.$transaction(async (prisma: Prisma.TransactionClient) => {


            let ativo: boolean | undefined = undefined;
            if (updatePdmDto.ativo === true && pdm.ativo == false) {
                ativo = true;

                const pdmAtivo = await prisma.pdm.findFirst({ where: { ativo: true } });
                if (pdmAtivo) {
                    await prisma.cicloFisico.updateMany({
                        where: {
                            pdm_id: pdmAtivo.id,
                            ativo: true,
                        },
                        data: {
                            acordar_ciclo_em: now
                        }
                    });

                    // desativa outros planos
                    await prisma.pdm.update({
                        where: {
                            id: pdmAtivo.id,
                        },
                        data: {
                            ativo: false,
                            desativado_em: now,
                            desativado_por: user.id,
                        }
                    });
                }

                verificarCiclos = true;
            } else if (updatePdmDto.ativo === false && pdm.ativo == true) {
                ativo = false;

                await prisma.pdm.update({
                    where: { id: id },
                    data: {
                        ativo: false,
                        desativado_em: now,
                        desativado_por: user.id,
                    },
                    select: { id: true }
                });

                await prisma.cicloFisico.updateMany({
                    where: {
                        pdm_id: id,
                        ativo: true,
                    },
                    data: {
                        acordar_ciclo_em: now
                    }
                });

                verificarCiclos = true;
            }
            delete updatePdmDto.ativo;

            await prisma.pdm.update({
                where: { id: id },
                data: {
                    atualizado_por: user.id,
                    atualizado_em: new Date(Date.now()),
                    ...updatePdmDto,
                    ativo: ativo,
                    arquivo_logo_id: arquivo_logo_id
                },
                select: { id: true }
            });

            if (verificarCiclos) {
                this.logger.log(`chamando monta_ciclos_pdm...`)
                this.logger.log(JSON.stringify(await prisma.$queryRaw`select monta_ciclos_pdm(${id}::int, false)`));
            }

        });

        if (verificarCiclos) {
            // se esse pdm é pra estar ativado,
            // verificar se há algum item com acordar_ciclo_em, se não existir,
            // precisa encontrar qual é o mes corrente que deve acordar
            if (updatePdmDto.ativo) {
                await this.prisma.$queryRaw`update ciclo_fisico
                set acordar_ciclo_em = now()
                where pdm_id = ${id}::int
                AND data_ciclo = date_trunc('month', now() at time zone 'America/Sao_Paulo')
                and (select count(1) from ciclo_fisico where acordar_ciclo_em is not null and pdm_id = ${id}::int) = 0;`;
            }

            // imediatamente, roda quantas vezes for necessário as evoluções de ciclo
            while (1) {
                const keepGoing = await this.verificaCiclosPendentes(Date2YMD.toString(now));
                if (!keepGoing) break;
            }
        }

        // força o carregamento da tabela pdmOrcamentoConfig
        await this.getOrcamentoConfig(id, true);

        return { id: id };
    }

    async append_document(pdm_id: number, createPdmDocDto: CreatePdmDocumentDto, user: PessoaFromJwt) {
        let pdm = await this.prisma.pdm.count({ where: { id: pdm_id } });
        if (!pdm) throw new HttpException('PDM não encontrado', 404);

        const arquivoId = this.uploadService.checkUploadToken(createPdmDocDto.upload_token);

        const arquivo = await this.prisma.arquivoDocumento.create({
            data: {
                criado_em: new Date(Date.now()),
                criado_por: user.id,
                arquivo_id: arquivoId,
                pdm_id: pdm_id
            },
            select: {
                id: true
            }
        });

        return { id: arquivo.id }
    }

    async list_document(pdm_id: number, user: PessoaFromJwt) {
        let pdm = await this.prisma.pdm.count({ where: { id: pdm_id } });
        if (!pdm) throw new HttpException('PDM não encontrado', 404);

        const arquivos: PdmDocument[] = await this.prisma.arquivoDocumento.findMany({
            where: { pdm_id: pdm_id, removido_em: null },
            select: {
                id: true,
                arquivo: {
                    select: {
                        id: true,
                        tamanho_bytes: true,
                        TipoDocumento: true,
                        descricao: true,
                        nome_original: true
                    }
                }
            }
        });
        for (const item of arquivos) {
            item.arquivo.download_token = this.uploadService.getDownloadToken(item.arquivo.id, '30d').download_token;
        }

        return arquivos
    }

    async remove_document(pdm_id: number, pdmDocId: number, user: PessoaFromJwt) {
        let pdm = await this.prisma.pdm.count({ where: { id: pdm_id } });
        if (!pdm) throw new HttpException('PDM não encontrado', 404);

        await this.prisma.arquivoDocumento.updateMany({
            where: { pdm_id: pdm_id, removido_em: null, id: pdmDocId },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            }
        });
    }

    @Cron('0 * * * * *')
    async handleCron() {
        if (Boolean(process.env['DISABLE_PDM_CRONTAB'])) return;

        await this.prisma.$transaction(async (prisma: Prisma.TransactionClient) => {
            this.logger.debug(`Adquirindo lock para verificação dos ciclos`);
            const locked: {
                locked: boolean,
                now_ymd: DateYMD
            }[] = await prisma.$queryRaw`SELECT
                pg_try_advisory_xact_lock(${JOB_LOCK_NUMBER}) as locked,
                (now() at time zone 'America/Sao_Paulo')::date::text as now_ymd
            `;
            if (!locked[0].locked) {
                this.logger.debug(`Já está em processamento...`);
                return;
            }

            // não passa a TX, ou seja, ele que seja responsável por sua própria $transaction
            while (1) {
                const keepGoing = await this.verificaCiclosPendentes(locked[0].now_ymd);
                if (!keepGoing) break;
            }

        }, {
            maxWait: 30000,
            timeout: 60 * 1000 * 5,
            isolationLevel: 'Serializable',
        });
    }

    private async verificaCiclosPendentes(today: DateYMD) {
        console.log(today)
        this.logger.debug(`Verificando ciclos físicos com tick faltando...`);

        const cf = await this.prisma.cicloFisico.findFirst({
            where: {
                acordar_ciclo_em: {
                    lt: new Date(Date.now())
                },
                OR: [

                    { acordar_ciclo_errmsg: null },
                    {
                        // retry a cada 15 minutos, mesmo que tenha erro
                        acordar_ciclo_executou_em: {
                            lt: DateTime.now().minus({ minutes: 15 }).toJSDate()
                        },
                        acordar_ciclo_errmsg: { not: null }
                    }

                ]
            },
            select: {
                pdm_id: true,
                id: true,
                data_ciclo: true,
                ativo: true,
                ciclo_fase_atual_id: true,
                acordar_ciclo_errmsg: true,
                pdm: {
                    select: { ativo: true }
                }
            },
            orderBy: {
                data_ciclo: 'asc'
            },
            take: 1,
        });
        if (!cf) {
            this.logger.log('Não há Ciclo Físico com processamento pendente');
            return false;
        }

        const mesCorrente = today.substring(0, 8) + '01';
        this.logger.log(`Executando ciclo ${JSON.stringify(cf)} mesCorrente=${mesCorrente}`)

        try {
            if (cf.acordar_ciclo_errmsg) {
                this.logger.warn(`Mensagem de erro anterior: ${cf.acordar_ciclo_errmsg}, limpando mensagem e tentando novamente...`);
                await this.prisma.cicloFisico.update({
                    where: { id: cf.id },
                    data: { acordar_ciclo_errmsg: null }
                });
            }

            if (cf.pdm.ativo) {

                if (Date2YMD.toString(cf.data_ciclo) < mesCorrente && cf.ativo) {
                    await this.inativarCiclo(cf);
                } else if (Date2YMD.toString(cf.data_ciclo) === mesCorrente && !cf.ativo) {
                    await this.ativarCiclo(cf, today);
                } else {
                    await this.verificaFaseAtual(cf, today);
                }
            } else {
                this.logger.warn('PDM foi desativado, não há mais ciclos até a proxima ativação');

                await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient) => {
                    await prismaTxn.cicloFisico.update({
                        where: {
                            id: cf.id
                        },
                        data: {
                            acordar_ciclo_em: null,
                            acordar_ciclo_executou_em: new Date(Date.now()),
                            ciclo_fase_atual_id: null,
                            ativo: false,
                        }
                    });
                });

            }
        } catch (error) {
            this.logger.error(error);
            await this.prisma.cicloFisico.update({
                where: {
                    id: cf.id
                },
                data: {
                    acordar_ciclo_errmsg: `${error}`,
                    acordar_ciclo_executou_em: new Date(Date.now()),
                }
            });
        }

        return true;
    }

    private async verificaFaseAtual(cf: {
        id: number; pdm_id: number; data_ciclo: Date;
        ciclo_fase_atual_id: number | null;
    }, today: string) {

        const proxima_fase = await this.prisma.cicloFisicoFase.findFirst({
            where: {
                ciclo_fisico_id: cf.id,
                data_inicio: {
                    lte: new Date(today)
                }
            },
            orderBy: {
                data_inicio: 'desc'
            },
            take: 1
        });

        if (!proxima_fase) {
            throw new Error(`Faltando próxima fase do ciclo!`);
        } else if (cf.ciclo_fase_atual_id === null) {
            throw new Error(`ciclo_fase_atual_id está null, provavelmente o ciclo não deveria ter sido executado ainda`);
        }

        if (cf.ciclo_fase_atual_id !== proxima_fase.id) {
            this.logger.debug(`Trocando fase do ciclo de ${cf.ciclo_fase_atual_id} para ${proxima_fase.id} (${proxima_fase.ciclo_fase})`);

            await this.prisma.cicloFisico.update({
                where: { id: cf.id },
                data: {
                    acordar_ciclo_em: Date2YMD.tzSp2UTC(Date2YMD.incDaysFromISO(proxima_fase.data_fim, 1)),
                    acordar_ciclo_executou_em: new Date(Date.now()),
                    ciclo_fase_atual_id: proxima_fase.id,
                },
            });

            this.logger.log(`chamando atualiza_fase_meta_pdm(${cf.pdm_id}, ${cf.id})`);
            await this.prisma.$queryRaw`select atualiza_fase_meta_pdm(${cf.pdm_id}::int, ${cf.id}::int)`;
        } else {

            this.logger.log(`Recalculando atualiza_fase_meta_pdm(${cf.pdm_id}, ${cf.id})`);
            await this.prisma.$queryRaw`select atualiza_fase_meta_pdm(${cf.pdm_id}::int, ${cf.id}::int)`;

            await this.prisma.cicloFisico.update({
                where: { id: cf.id },
                data: {
                    acordar_ciclo_em: Date2YMD.tzSp2UTC(Date2YMD.incDaysFromISO(proxima_fase.data_fim, 1)),
                    acordar_ciclo_executou_em: new Date(Date.now()),
                },
            });
        }
    }


    private async inativarCiclo(cf: { id: number; pdm_id: number; data_ciclo: Date; }) {
        this.logger.log(`desativando ciclo ${cf.data_ciclo}`);

        await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient) => {
            await prismaTxn.cicloFisico.update({
                where: { id: cf.id },
                data: {
                    ativo: false,
                    acordar_ciclo_em: null
                }
            });

            const proximoCiclo = await this.prisma.cicloFisico.findFirst({
                where: {
                    pdm_id: cf.pdm_id,
                    data_ciclo: {
                        gt: cf.data_ciclo
                    },
                },
                select: {
                    id: true,
                    data_ciclo: true,
                },
                orderBy: {
                    data_ciclo: 'asc'
                },
                take: 1,
            });

            if (proximoCiclo) {
                this.logger.log(`Marcando proximo ciclo ${proximoCiclo.data_ciclo} para acordar no proximo tick`);
                await prismaTxn.cicloFisico.update({
                    where: { id: proximoCiclo.id },
                    data: {
                        acordar_ciclo_em: new Date(Date.now()),
                        acordar_ciclo_executou_em: new Date(Date.now()),
                    }
                });
            } else {
                this.logger.log(`não há próximos ciclos`);
                await prismaTxn.cicloFisico.update({
                    where: { id: cf.id },
                    data: {
                        acordar_ciclo_em: null,
                        acordar_ciclo_executou_em: new Date(Date.now()),
                    }
                });
            }
        });
    }

    private async ativarCiclo(cf: { id: number; pdm_id: number; data_ciclo: Date; }, today: string) {
        await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient) => {

            const count = await prismaTxn.cicloFisico.count({ where: { ativo: true, pdm_id: cf.pdm_id } });
            if (count) {
                this.logger.error(`Não é possível ativar o ciclo ${cf.data_ciclo} pois ainda há outros ciclos que não foram fechados`);
                return;
            }
            this.logger.log(`ativando ciclo ${cf.data_ciclo}`);

            const proxima_fase = await prismaTxn.cicloFisicoFase.findFirst({
                where: {
                    ciclo_fisico_id: cf.id,
                    data_inicio: {
                        lte: new Date(today)
                    }
                },
                orderBy: {
                    data_inicio: 'desc'
                },
                take: 1
            });
            if (!proxima_fase) {
                throw new Error(`Faltando próxima fase do ciclo!`);
            } else {
                await prismaTxn.cicloFisico.update({
                    where: { id: cf.id },
                    data: {
                        ativo: true,
                        ciclo_fase_atual_id: proxima_fase.id,
                        acordar_ciclo_em: Date2YMD.tzSp2UTC(Date2YMD.incDaysFromISO(proxima_fase.data_fim, 1))
                    }
                });
            }
        });
    }

    async getCicloAtivo(pdm_id: number): Promise<CicloFisicoDto | null> {
        let ciclo: CicloFisicoDto | null = null;
        const found = await this.prisma.cicloFisico.findFirst({
            where: { pdm_id: pdm_id, ativo: true },
            include: {
                fases: true
            }
        });
        if (found) {
            ciclo = {
                id: found.id,
                data_ciclo: Date2YMD.toString(found.data_ciclo),
                fases: [],
                ativo: found.ativo
            };
            for (const fase of found.fases) {
                ciclo.fases.push({
                    id: fase.id,
                    ciclo_fase: fase.ciclo_fase,
                    data_inicio: Date2YMD.toString(fase.data_inicio),
                    data_fim: Date2YMD.toString(fase.data_fim),
                    fase_corrente: found.ciclo_fase_atual_id == fase.id
                });
            }
        }

        return ciclo;
    }



    async getOrcamentoConfig(pdm_id: number, deleteExtraYears: boolean = false): Promise<OrcamentoConfig[] | null> {
        const pdm = await this.prisma.pdm.findFirstOrThrow({
            where: { id: pdm_id },
            select: {
                data_inicio: true,
                data_fim: true,
            }
        });

        const rows: {
            ano_referencia: number
            id: number
            pdm_id: number
            previsao_custo_disponivel: boolean
            planejado_disponivel: boolean
            execucao_disponivel: boolean
        }[] = await this.prisma.$queryRaw`
            select
                extract('year' from x.x)::int as ano_referencia,
                ${pdm_id}::int as pdm_id,
                coalesce(previsao_custo_disponivel, true) as previsao_custo_disponivel,
                coalesce(planejado_disponivel, false) as planejado_disponivel,
                coalesce(execucao_disponivel, false) as execucao_disponivel,
                oc.id as id
            FROM generate_series(${pdm.data_inicio}, ${pdm.data_fim}, '1 year'::interval) x
            LEFT JOIN meta_orcamento_config oc ON oc.pdm_id = ${pdm_id}::int AND oc.ano_referencia = extract('year' from x.x)
        `;

        let anoVistos: number[] = [];
        for (const r of rows) {
            anoVistos.push(r.ano_referencia);
            if (r.id === null) {
                const created_orcamento_config = await this.prisma.$transaction(async (prisma: Prisma.TransactionClient) => {
                    await this.prisma.pdmOrcamentoConfig.deleteMany({
                        where: {
                            ano_referencia: r.ano_referencia,
                            pdm_id: pdm_id
                        }
                    });

                    return await this.prisma.pdmOrcamentoConfig.create({
                        data: {
                            ano_referencia: r.ano_referencia,
                            pdm_id: pdm_id
                        },
                        select: { id: true }
                    });
                }, { isolationLevel: 'Serializable' });

                const row_without_id_idx = rows.findIndex(rwi => rwi.ano_referencia === r.ano_referencia);
                rows[row_without_id_idx].id = created_orcamento_config.id
            }
        }

        if (deleteExtraYears)
            // just in case, apagar anos que estão fora do periodo
            await this.prisma.pdmOrcamentoConfig.deleteMany({
                where: {
                    ano_referencia: { notIn: anoVistos },
                    pdm_id: pdm_id
                }
            });

        return rows;
    }

    async updatePdmOrcamentoConfig(pdm_id: number, updatePdmOrcamentoConfigDto: UpdatePdmOrcamentoConfigDto) {

        return await this.prisma.$transaction(async (prisma: Prisma.TransactionClient) => {
            const operations = [];


            for (const orcamentoConfig of Object.values(updatePdmOrcamentoConfigDto.orcamento_config)) {
                const pdmOrcamentoConfig = await prisma.pdmOrcamentoConfig.findFirst({
                    where: {
                        pdm_id: pdm_id,
                        id: orcamentoConfig.id
                    }
                });
                if (!pdmOrcamentoConfig) continue;

                operations.push(
                    prisma.pdmOrcamentoConfig.update({
                        where: { id: pdmOrcamentoConfig.id },
                        data: {
                            previsao_custo_disponivel: orcamentoConfig.previsao_custo_disponivel,
                            planejado_disponivel: orcamentoConfig.planejado_disponivel,
                            execucao_disponivel: orcamentoConfig.execucao_disponivel
                        },
                        select: { id: true }
                    })
                )
            }

            return await Promise.all(operations);
        });

    }

}
