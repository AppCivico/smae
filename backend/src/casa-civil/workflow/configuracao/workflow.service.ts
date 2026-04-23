import { HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { Prisma } from '@prisma/client';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { DateTime } from 'luxon';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { FilterWorkflowDto } from './dto/filter-workflow.dto';
import { ListWorkflowDto, WorkflowDetailDto, WorkflowDto } from './entities/workflow.entity';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { Date2YMD } from '../../../common/date2ymd';
import { AnyPageTokenJwtBody, PAGINATION_TOKEN_TTL } from 'src/common/dto/paginated.dto';
import { Object2Hash } from 'src/common/object2hash';

@Injectable()
export class WorkflowService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService
    ) {}

    async create(dto: CreateWorkflowDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const transferenciaTipoExiste = await prismaTxn.transferenciaTipo.count({
                    where: {
                        id: dto.transferencia_tipo_id,
                        removido_em: null,
                    },
                });
                if (!transferenciaTipoExiste) throw new HttpException('Tipo de transferência não existe.', 400);

                const similarExists = await prismaTxn.workflow.count({
                    where: {
                        nome: { endsWith: dto.nome, mode: 'insensitive' },
                        removido_em: null,
                    },
                });
                if (similarExists > 0)
                    throw new HttpException('Nome igual ou semelhante já existe em outro registro ativo', 400);

                // Preparing distribution statuses from the DTO.
                const statusesToCreateData: { status_base_id?: number; status_id?: number }[] = [];

                if (dto.distribuicao_statuses_base?.length) {
                    dto.distribuicao_statuses_base.forEach((status_base_id) => {
                        statusesToCreateData.push({ status_base_id });
                    });
                }

                if (dto.distribuicao_statuses_customizados?.length) {
                    dto.distribuicao_statuses_customizados.forEach((status_id) => {
                        statusesToCreateData.push({ status_id });
                    });
                }

                const workflow = await prismaTxn.workflow.create({
                    data: {
                        nome: dto.nome,
                        transferencia_tipo_id: dto.transferencia_tipo_id,
                        ativo: false,
                        inicio: dto.inicio,
                        termino: dto.termino,
                        criado_por: user.id,
                        criado_em: new Date(Date.now()),
                        statusesDistribuicao: {
                            createMany: {
                                data: statusesToCreateData,
                            },
                        },
                    },
                    select: { id: true },
                });

                return workflow;
            }
        );

        return created;
    }

    async update(id: number, dto: UpdateWorkflowDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const updated = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const self = await prismaTxn.workflow.findFirst({
                    where: {
                        id,
                        removido_em: null,
                    },
                    select: {
                        nome: true,
                        ativo: true,
                        inicio: true,
                        termino: true,
                        transferencia_tipo_id: true,

                        statusesDistribuicao: {
                            select: {
                                status_id: true,
                                status_base_id: true,
                            },
                        },
                    },
                });
                if (!self) throw new NotFoundException('Workflow não encontrado');

                // Tratando statuses de distribuição de recurso.
                const currentStatusesBase = self.statusesDistribuicao
                    .filter((e) => e.status_base_id)
                    .sort((a, b) => a.status_base_id! - b.status_base_id!);
                // TODO: comparar mudanças antes de delete e create.
                if (
                    dto.distribuicao_statuses_base != undefined &&
                    dto.distribuicao_statuses_base.length != currentStatusesBase.length
                ) {
                    await prismaTxn.workflowDistribuicaoStatus.deleteMany({
                        where: { workflow_id: id, status_base_id: { not: null } },
                    });
                    await prismaTxn.workflowDistribuicaoStatus.createMany({
                        data: dto.distribuicao_statuses_base.map((status_base_id) => {
                            return {
                                workflow_id: id,
                                status_base_id: status_base_id,
                            };
                        }),
                    });
                }

                const currentStatusesCustomizados = self.statusesDistribuicao
                    .filter((e) => e.status_id)
                    .sort((a, b) => a.status_id! - b.status_id!);
                // TODO: comparar mudanças antes de delete e create.
                if (
                    dto.distribuicao_statuses_customizados != undefined &&
                    dto.distribuicao_statuses_customizados.length != currentStatusesCustomizados.length
                ) {
                    await prismaTxn.workflowDistribuicaoStatus.deleteMany({
                        where: { workflow_id: id, status_id: { not: null } },
                    });
                    await prismaTxn.workflowDistribuicaoStatus.createMany({
                        data: dto.distribuicao_statuses_customizados.map((status_id) => {
                            return {
                                workflow_id: id,
                                status_id: status_id,
                            };
                        }),
                    });
                }

                // Caso o Workflow já possua uma transferência ativa, só algumas colunas podem ser editadas.
                if (
                    (dto.inicio != undefined &&
                        DateTime.fromJSDate(dto.inicio).startOf('day').toMillis() !=
                            DateTime.fromJSDate(self.inicio).startOf('day').toMillis()) ||
                    (dto.transferencia_tipo_id != undefined &&
                        self.transferencia_tipo_id != dto.transferencia_tipo_id) ||
                    (dto.nome != undefined && self.nome != dto.nome)
                ) {
                    await this.verificaEdicao(id, prismaTxn);
                }

                if (dto.ativo != undefined && dto.ativo != self.ativo && dto.ativo == true) {
                    // Verificando se possui etapas e fase.
                    const etapas = await prismaTxn.fluxo.findMany({
                        where: {
                            removido_em: null,
                            workflow_id: id,
                        },
                        select: {
                            id: true,
                            fases: {
                                where: { removido_em: null },
                                select: { id: true },
                            },
                        },
                    });

                    if (!etapas.length) {
                        throw new HttpException('Workflow não possui etapas configuradas.', 400);
                    }

                    if (!etapas.every((e) => e.fases.length)) {
                        throw new HttpException(
                            'ativo| Workflow possui etapa(s), que não possui(em) fase(s) configurada(s).',
                            400
                        );
                    }

                    // Verificando se já não existe workflow ativo.
                    const workflowJaAtivo = await prismaTxn.workflow.count({
                        where: {
                            removido_em: null,
                            ativo: true,
                            transferencia_tipo_id: dto.transferencia_tipo_id
                                ? dto.transferencia_tipo_id
                                : self.transferencia_tipo_id,
                        },
                    });
                    if (workflowJaAtivo)
                        throw new HttpException('Já existe um workflow ativo para este tipo de transferência.', 400);
                }

                // Se for modificada a data de término e estiver ativo.
                // e o término for menor ou igual a "agora".
                // Desativar o workflow.
                const now = DateTime.now().startOf('day');
                if (
                    dto.termino != undefined &&
                    self.termino != null &&
                    self.ativo &&
                    DateTime.fromJSDate(dto.termino).startOf('day').toMillis() <= now.toMillis()
                ) {
                    dto.ativo = false;
                }

                const workflow = await prismaTxn.workflow.update({
                    where: { id },
                    data: {
                        ativo: dto.ativo,
                        inicio: dto.inicio,
                        termino: dto.termino,
                        nome: dto.nome,
                        atualizado_por: user.id,
                        atualizado_em: new Date(Date.now()),
                    },
                    select: { id: true },
                });

                return workflow;
            }
        );

        return updated;
    }

    async findAll(filters: FilterWorkflowDto, user: PessoaFromJwt): Promise<ListWorkflowDto> {
        const ipp = filters.ipp ?? 25;
        const page = filters.pagina ?? 1;
        let total_registros = 0;
        let retToken = filters.token_paginacao;

        if (page > 1 && !filters.token_paginacao) {
            throw new HttpException('Campo token_paginacao é obrigatório para paginação', 400);
        }

        const filterToken = filters.token_paginacao;
        const filtersForHash = { ...filters };
        delete filtersForHash.pagina;
        delete filtersForHash.token_paginacao;

        const where: Prisma.WorkflowWhereInput = {
            ativo: filters.ativo,
            transferencia_tipo_id: filters.transferencia_tipo_id,
            removido_em: null,
            ...(filters.esfera ? { transferencia_tipo: { esfera: filters.esfera } } : {}),
        };

        if (filterToken) {
            const decoded = this.decodeNextPageToken(filterToken, filtersForHash);
            total_registros = decoded.total_rows;
        }

        const offset = (page - 1) * ipp;

        const [countResult, rows] = await this.prisma.$transaction([
            filterToken ? this.prisma.workflow.count({ where: { id: -1 } }) : this.prisma.workflow.count({ where }),
            this.prisma.workflow.findMany({
                where,
                orderBy: [{ ativo: 'desc' }, { id: 'desc' }],
                skip: offset,
                take: ipp,
                select: {
                    id: true,
                    nome: true,
                    ativo: true,
                    inicio: true,
                    termino: true,
                    transferencia_tipo: {
                        select: {
                            id: true,
                            nome: true,
                            esfera: true,
                        },
                    },
                },
            }),
        ]);

        if (!filterToken) {
            total_registros = countResult;
            const body: AnyPageTokenJwtBody = {
                search_hash: Object2Hash(filtersForHash),
                ipp,
                issued_at: Date.now(),
                total_rows: total_registros,
            };
            retToken = this.jwtService.sign(body);
        }

        const tem_mais = offset + rows.length < total_registros;
        const paginas = Math.ceil(total_registros / ipp);

        return {
            linhas: rows.map((r) => {
                return {
                    ...r,
                    inicio: Date2YMD.toString(r.inicio),
                    termino: Date2YMD.toStringOrNull(r.termino),
                };
            }),
            tem_mais,
            total_registros,
            pagina_corrente: page,
            paginas,
            token_paginacao: retToken ?? null,
            token_ttl: PAGINATION_TOKEN_TTL,
        };
    }

    private decodeNextPageToken(jwt: string, filters: Record<string, any>): AnyPageTokenJwtBody {
        let tmp: AnyPageTokenJwtBody | null = null;

        try {
            if (jwt) tmp = this.jwtService.verify(jwt) as AnyPageTokenJwtBody;
        } catch {
            throw new HttpException('token_paginacao inválido', 400);
        }
        if (!tmp) throw new HttpException('token_paginacao inválido ou faltando', 400);

        if (tmp.search_hash !== Object2Hash(filters)) {
            throw new HttpException(
                'Parâmetros da busca não podem ser diferente da busca inicial para avançar na paginação.',
                400
            );
        }
        return tmp;
    }

    async findOne(id: number, user: PessoaFromJwt | undefined): Promise<WorkflowDetailDto> {
        const row = await this.prisma.workflow.findFirst({
            where: {
                id,
                removido_em: null,
            },
            select: {
                id: true,
                nome: true,
                ativo: true,
                inicio: true,
                termino: true,

                transferencia_tipo: {
                    select: {
                        id: true,
                        nome: true,
                    },
                },

                statusesDistribuicao: {
                    select: {
                        id: true,

                        status_base: {
                            select: {
                                id: true,
                                nome: true,
                                tipo: true,
                                valor_distribuicao_contabilizado: true,
                                permite_novos_registros: true,
                            },
                        },

                        status: {
                            select: {
                                id: true,
                                nome: true,
                                tipo: true,
                                valor_distribuicao_contabilizado: true,
                                permite_novos_registros: true,
                            },
                        },
                    },
                },

                etapasFluxo: {
                    where: { removido_em: null },
                    orderBy: { ordem: 'asc' },
                    select: {
                        id: true,
                        ordem: true,

                        fluxo_etapa_de: {
                            select: {
                                id: true,
                                etapa_fluxo: true,
                            },
                        },

                        fluxo_etapa_para: {
                            select: {
                                id: true,
                                etapa_fluxo: true,
                            },
                        },

                        fases: {
                            where: { removido_em: null },
                            orderBy: { ordem: 'asc' },
                            select: {
                                id: true,
                                responsabilidade: true,
                                duracao: true,
                                marco: true,
                                ordem: true,
                                fase: {
                                    select: {
                                        id: true,
                                        fase: true,
                                    },
                                },

                                situacoes: {
                                    select: {
                                        situacao: {
                                            select: {
                                                id: true,
                                                situacao: true,
                                                tipo_situacao: true,
                                            },
                                        },
                                    },
                                },

                                tarefas: {
                                    where: { removido_em: null },
                                    orderBy: { ordem: 'asc' },
                                    select: {
                                        id: true,
                                        responsabilidade: true,
                                        ordem: true,
                                        duracao: true,
                                        marco: true,
                                        workflow_tarefa: {
                                            select: {
                                                id: true,
                                                tarefa_fluxo: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!row) throw new NotFoundException('Workflow não encontrado');

        const emUso = await this.prisma.transferencia.count({
            where: {
                removido_em: null,
                workflow_id: row.id,
            },
        });

        return {
            id: row.id,
            nome: row.nome,
            ativo: row.ativo,
            inicio: Date2YMD.toString(row.inicio),
            termino: Date2YMD.toStringOrNull(row.termino),
            edicao_restrita: emUso ? true : false,
            transferencia_tipo: {
                id: row.transferencia_tipo.id,
                nome: row.transferencia_tipo.nome,
            },

            statuses_distribuicao: row.statusesDistribuicao.map((rowConfigStatus) => {
                return {
                    id: rowConfigStatus.status_base ? rowConfigStatus.status_base.id : rowConfigStatus.status!.id,
                    nome: rowConfigStatus.status_base ? rowConfigStatus.status_base.nome : rowConfigStatus.status!.nome,
                    tipo: rowConfigStatus.status_base ? rowConfigStatus.status_base.tipo : rowConfigStatus.status!.tipo,
                    valor_distribuicao_contabilizado: rowConfigStatus.status_base
                        ? rowConfigStatus.status_base.valor_distribuicao_contabilizado
                        : rowConfigStatus.status!.valor_distribuicao_contabilizado,
                    permite_novos_registros: rowConfigStatus.status_base
                        ? rowConfigStatus.status_base.permite_novos_registros
                        : rowConfigStatus.status!.permite_novos_registros,

                    status_base: rowConfigStatus.status_base ? true : false,
                    pode_editar: rowConfigStatus.status_base ? false : true,
                };
            }),

            fluxo: row.etapasFluxo.map((fluxo) => {
                return {
                    ...fluxo,
                    workflow_etapa_de: {
                        id: fluxo.fluxo_etapa_de.id,
                        descricao: fluxo.fluxo_etapa_de.etapa_fluxo,
                    },

                    workflow_etapa_para: {
                        id: fluxo.fluxo_etapa_para.id,
                        descricao: fluxo.fluxo_etapa_para.etapa_fluxo,
                    },

                    fases: fluxo.fases.map((fase) => {
                        return {
                            ...fase,

                            situacoes: fase.situacoes.map((situacaoRel) => {
                                return {
                                    id: situacaoRel.situacao.id,
                                    situacao: situacaoRel.situacao.situacao,
                                    tipo_situacao: situacaoRel.situacao.tipo_situacao,
                                };
                            }),

                            tarefas: fase.tarefas.map((tarefa) => {
                                return {
                                    ...tarefa,
                                    workflow_tarefa: {
                                        id: tarefa.workflow_tarefa.id,
                                        descricao: tarefa.workflow_tarefa.tarefa_fluxo,
                                    },
                                };
                            }),
                        };
                    }),
                };
            }),
        };
    }

    async remove(id: number, user: PessoaFromJwt) {
        await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient) => {
            // Caso o Workflow já possua uma transferência ativa, não pode ser removido.
            await this.verificaEdicao(id, prismaTxn);

            await prismaTxn.workflow.update({
                where: { id },
                data: {
                    removido_por: user.id,
                    removido_em: new Date(Date.now()),
                },
            });
        });
    }

    async verificaEdicao(id: number, prismaTxn: Prisma.TransactionClient) {
        const transferenciaEmAndamento = await prismaTxn.transferencia.count({
            where: {
                workflow_id: id,
                removido_em: null,
            },
        });
        if (transferenciaEmAndamento)
            throw new HttpException('Workflow não pode ser editado, pois há uma Transferência que o utiliza.', 400);
    }

    async configValida(id: number, prismaTxn?: Prisma.TransactionClient): Promise<boolean> {
        /*
            Esta função verifica se o workflow possui etapas e fases.
            E retorna um boolean para fazer controle de fluxo em outros services (back-end).

            Ela é necessária pois existem operações que dependem de um workflow com etapas e fases configuradas. (por ex: cronograma de workflow)
            e ao mesmo tempo, o workflow não é obrigatório.
        */
        const verifica = async (prismaTxn: Prisma.TransactionClient): Promise<boolean> => {
            const row = await prismaTxn.workflow.findFirst({
                where: {
                    id,
                    removido_em: null,
                },
                select: {
                    ativo: true,
                    etapasFluxo: {
                        where: { removido_em: null },
                        select: {
                            fases: {
                                where: { removido_em: null },
                                select: {
                                    tarefas: {
                                        where: { removido_em: null },
                                        select: { id: true },
                                    },
                                },
                            },
                        },
                    },
                },
            });
            if (!row) throw new InternalServerErrorException('Workflow não encontrado em function configCompleta');
            if (!row.ativo) return false;

            const etapas = row.etapasFluxo;
            const fases = etapas.map((e) => e.fases);

            if (!fases.length) return false;

            return true;
        };

        if (prismaTxn) {
            return verifica(prismaTxn);
        } else {
            return this.prisma.$transaction(verifica);
        }
    }
}
