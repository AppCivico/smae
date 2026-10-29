import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TipoProjeto } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { BatchSimpleIds, RecordWithId } from 'src/common/dto/record-with-id.dto';

import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { PrismaService } from '../../prisma/prisma.service';
import { HtmlSanitizer } from '../../common/html-sanitizer';
import { formataSEI } from '../../common/formata-sei';
import { garanteCoberturaSeiContratos } from './contrato-sei-cobertura';

import { CreateContratoDto } from './dto/create-contrato.dto';
import {
    ContratoCompartilhadoDisponivelDto,
    ContratoDetailDto,
    ContratoItemDto,
    ContratoProcessoSeiDisponivelDto,
} from './entities/contrato.entity';
import { UpdateContratoDto } from './dto/update-contrato.dto';
import { Date2YMD } from '../../common/date2ymd';
import { ContratoAditivoItemDto } from '../contrato-aditivo/entities/contrato-aditivo.entity';

@Injectable()
export class ContratoService {
    constructor(private readonly prisma: PrismaService) {}

    async create(projeto_id: number, dto: CreateContratoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const now = new Date(Date.now());
        dto.objeto_detalhado = HtmlSanitizer(dto.objeto_detalhado);
        const created = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const ctx = await this.getProjetoCtx(prismaTx, projeto_id);
                await this.assertNumeroUnicoNoPortfolio(prismaTx, ctx.portfolio_id, dto.numero);
                const processosSei = await this.validaProcessosSei(prismaTx, [projeto_id], dto.processos_sei);

                const contrato = await prismaTx.contrato.create({
                    data: {
                        numero: dto.numero,
                        contrato_exclusivo: dto.contrato_exclusivo,
                        status: dto.status,
                        modalidade_contratacao_id: dto.modalidade_contratacao_id,
                        orgao_id: dto.orgao_id,
                        objeto_resumo: dto.objeto_resumo,
                        objeto_detalhado: dto.objeto_detalhado,
                        contratante: dto.contratante,
                        empresa_contratada: dto.empresa_contratada,
                        cnpj_contratada: dto.cnpj_contratada,
                        observacoes: dto.observacoes,
                        data_assinatura: dto.data_assinatura,
                        data_inicio: dto.data_inicio,
                        data_termino: dto.data_termino,
                        prazo_numero: dto.prazo_numero,
                        prazo_unidade: dto.prazo_unidade,
                        data_base_mes: dto.data_base_mes,
                        data_base_ano: dto.data_base_ano,
                        valor: dto.valor,
                        fontesRecurso: {
                            createMany: {
                                data: (dto.fontes_recurso ?? []).map((fonte_recurso) => {
                                    return {
                                        cod_sof: fonte_recurso.fonte_recurso_cod_sof,
                                        ano: fonte_recurso.fonte_recurso_ano,
                                    };
                                }),
                            },
                        },
                        processosSei: {
                            createMany: {
                                data: processosSei.map((processo_sei) => {
                                    return {
                                        numero_sei: processo_sei,
                                    };
                                }),
                            },
                        },
                        ContratoProjeto: {
                            create: {
                                projeto_id: projeto_id,
                                criado_em: now,
                                criado_por: user.id,
                            },
                        },

                        criado_em: now,
                        criado_por: user.id,
                    },
                    select: { id: true },
                });

                return { id: contrato.id };
            }
        );

        return { id: created.id };
    }

    async findAll(projeto_id: number, user: PessoaFromJwt): Promise<ContratoItemDto[]> {
        const linhasContrato = await this.prisma.contrato.findMany({
            where: {
                removido_em: null,
                ContratoProjeto: { some: { projeto_id: projeto_id, removido_em: null } },
            },
            orderBy: [{ numero: 'asc' }],
            select: {
                id: true,
                numero: true,
                contrato_exclusivo: true,
                status: true,
                objeto_resumo: true,
                data_inicio: true,
                data_termino: true,
                valor: true,
                aditivos: {
                    where: { removido_em: null },
                    orderBy: { data: 'desc' },
                    select: {
                        id: true,
                        data: true,
                        data_termino_atualizada: true,
                        valor: true,
                        tipo_aditivo: {
                            select: { tipo: true },
                        },
                    },
                },
                processosSei: {
                    select: {
                        numero_sei: true,
                    },
                },
            },
        });

        return linhasContrato.map((contrato) => {
            const linhaComDatas = contrato.aditivos.find((aditivo) => aditivo.data_termino_atualizada != null);
            const dataMaisAtual = linhaComDatas?.data_termino_atualizada ?? contrato.data_termino;

            const totais = this.calcularTotaisAditivos(contrato.aditivos, contrato.valor);

            return {
                id: contrato.id,
                // projeto_id de contexto (a obra/projeto da rota). O contrato pode ser compartilhado
                // entre vários projetos, mas o front continua operando sobre o projeto que está visualizando.
                projeto_id: projeto_id,
                objeto_resumo: contrato.objeto_resumo,
                numero: contrato.numero,
                contrato_exclusivo: contrato.contrato_exclusivo,
                status: contrato.status,
                valor: contrato.valor,
                processos_sei: contrato.processosSei.map((processo) => processo.numero_sei),
                ...totais,
                data_termino_atual: Date2YMD.toStringOrNull(dataMaisAtual),
                data_termino_inicial: Date2YMD.toStringOrNull(contrato.data_termino),
            };
        });
    }

    async findOne(projeto_id: number, id: number, user: PessoaFromJwt): Promise<ContratoDetailDto> {
        const contrato = await this.prisma.contrato.findFirst({
            where: {
                id,
                removido_em: null,
                ContratoProjeto: { some: { projeto_id: projeto_id, removido_em: null } },
            },
            select: {
                id: true,
                numero: true,
                contrato_exclusivo: true,
                status: true,
                objeto_resumo: true,
                objeto_detalhado: true,
                contratante: true,
                empresa_contratada: true,
                cnpj_contratada: true,
                observacoes: true,
                data_assinatura: true,
                data_inicio: true,
                data_termino: true,
                prazo_numero: true,
                prazo_unidade: true,
                data_base_mes: true,
                data_base_ano: true,
                valor: true,
                orgao: {
                    select: {
                        id: true,
                        sigla: true,
                        descricao: true,
                    },
                },
                modalidade_contratacao: {
                    select: {
                        id: true,
                        nome: true,
                    },
                },
                fontesRecurso: {
                    select: {
                        cod_sof: true,
                        ano: true,
                    },
                },
                processosSei: {
                    select: {
                        numero_sei: true,
                    },
                },
                aditivos: {
                    where: { removido_em: null },
                    orderBy: { numero: 'asc' },
                    select: {
                        id: true,
                        numero: true,
                        data: true,
                        data_termino_atualizada: true,
                        valor: true,
                        percentual_medido: true,
                        tipo_aditivo: {
                            select: {
                                id: true,
                                nome: true,
                                tipo: true,
                                habilita_valor: true,
                                habilita_valor_data_termino: true,
                            },
                        },
                    },
                },
            },
        });
        if (!contrato) throw new NotFoundException('Contrato não encontrado');

        const totais = this.calcularTotaisAditivos(contrato.aditivos, contrato.valor);

        return {
            id: contrato.id,
            // projeto_id de contexto (a obra/projeto da rota). Mantido para o front continuar operando
            // por projeto, mesmo que o contrato seja compartilhado entre vários projetos/obras.
            projeto_id: projeto_id,
            orgao: contrato.orgao,
            numero: contrato.numero,
            contrato_exclusivo: contrato.contrato_exclusivo,
            status: contrato.status,
            objeto_resumo: contrato.objeto_resumo,
            objeto_detalhado: contrato.objeto_detalhado,
            contratante: contrato.contratante,
            empresa_contratada: contrato.empresa_contratada,
            cnpj_contratada: contrato.cnpj_contratada,
            observacoes: contrato.observacoes,
            data_assinatura: Date2YMD.toStringOrNull(contrato.data_assinatura),
            data_inicio: Date2YMD.toStringOrNull(contrato.data_inicio),
            data_termino: Date2YMD.toStringOrNull(contrato.data_termino),
            prazo_numero: contrato.prazo_numero,
            prazo_unidade: contrato.prazo_unidade,
            data_base_mes: contrato.data_base_mes,
            data_base_ano: contrato.data_base_ano,
            valor: contrato.valor,
            ...totais,
            modalidade_contratacao: contrato.modalidade_contratacao
                ? { id: contrato.modalidade_contratacao.id, nome: contrato.modalidade_contratacao.nome }
                : null,
            fontes_recurso: contrato.fontesRecurso.map((fonte) => {
                return {
                    fonte_recurso_cod_sof: fonte.cod_sof,
                    fonte_recurso_ano: fonte.ano,
                };
            }),
            processos_sei: contrato.processosSei.map((processo) => processo.numero_sei),
            aditivos: contrato.aditivos.map((aditivo) => {
                return {
                    id: aditivo.id,
                    numero: aditivo.numero,
                    data: Date2YMD.toStringOrNull(aditivo.data),
                    data_termino_atualizada: Date2YMD.toStringOrNull(aditivo.data_termino_atualizada),
                    valor: aditivo.valor,
                    percentual_medido: aditivo.percentual_medido,
                    tipo: {
                        id: aditivo.tipo_aditivo.id,
                        nome: aditivo.tipo_aditivo.nome,
                        tipo: aditivo.tipo_aditivo.tipo,
                        habilita_valor: aditivo.tipo_aditivo.habilita_valor,
                        habilita_valor_data_termino: aditivo.tipo_aditivo.habilita_valor_data_termino,
                    },
                } satisfies ContratoAditivoItemDto;
            }),
        };
    }

    async update(projeto_id: number, id: number, dto: UpdateContratoDto, user: PessoaFromJwt) {
        const now = new Date(Date.now());
        if (dto.objeto_detalhado) dto.objeto_detalhado = HtmlSanitizer(dto.objeto_detalhado);
        const updated = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const self = await this.findOne(projeto_id, id, user);
                const ctx = await this.getProjetoCtx(prismaTx, projeto_id);

                if (dto.numero != undefined && dto.numero != self.numero) {
                    await this.assertNumeroUnicoNoPortfolio(prismaTx, ctx.portfolio_id, dto.numero, id);
                }

                // Mudança de compartilhado -> exclusivo só é permitida se não houver outra
                // obra/projeto (ativo) associado ao contrato.
                // O filtro `projeto.removido_em: null` ignora vínculos órfãos: obras que foram
                // excluídas mas cujo contrato_projeto não foi baixado junto (o projeto.remove não
                // faz cascata). Sem esse filtro, um contrato "compartilhado" apenas com uma obra
                // já deletada — invisível para o usuário — bloqueia indevidamente a mudança para
                // exclusivo.
                if (dto.contrato_exclusivo === true && self.contrato_exclusivo === false) {
                    const vinculos = await prismaTx.contratoProjeto.count({
                        where: { contrato_id: id, removido_em: null, projeto: { removido_em: null } },
                    });
                    if (vinculos > 1)
                        throw new HttpException(
                            'Não é possível tornar o contrato exclusivo: ele está associado a outras obras/projetos',
                            400
                        );
                }

                if (dto.processos_sei != undefined) {
                    const vinculos = await prismaTx.contratoProjeto.findMany({
                        where: { contrato_id: id, removido_em: null, projeto: { removido_em: null } },
                        select: { projeto_id: true },
                    });
                    const processosSei = await this.validaProcessosSei(
                        prismaTx,
                        vinculos.map((v) => v.projeto_id),
                        dto.processos_sei
                    );

                    await prismaTx.contratoSei.deleteMany({
                        where: {
                            contrato_id: id,
                        },
                    });

                    await prismaTx.contratoSei.createMany({
                        data: processosSei.map((processo_sei) => {
                            return {
                                contrato_id: id,
                                numero_sei: processo_sei,
                            };
                        }),
                    });
                }

                if (dto.fontes_recurso != undefined) {
                    await prismaTx.contratoFonteRecurso.deleteMany({
                        where: {
                            contrato_id: id,
                        },
                    });

                    await prismaTx.contratoFonteRecurso.createMany({
                        data: dto.fontes_recurso.map((fonte_recurso) => {
                            return {
                                contrato_id: id,
                                cod_sof: fonte_recurso.fonte_recurso_cod_sof,
                                ano: fonte_recurso.fonte_recurso_ano,
                            };
                        }),
                    });
                }

                return await prismaTx.contrato.update({
                    where: {
                        id,
                    },
                    data: {
                        numero: dto.numero,
                        contrato_exclusivo: dto.contrato_exclusivo,
                        status: dto.status,
                        modalidade_contratacao_id: dto.modalidade_contratacao_id,
                        orgao_id: dto.orgao_id,
                        objeto_resumo: dto.objeto_resumo,
                        objeto_detalhado: dto.objeto_detalhado,
                        contratante: dto.contratante,
                        empresa_contratada: dto.empresa_contratada,
                        cnpj_contratada: dto.cnpj_contratada,
                        observacoes: dto.observacoes,
                        data_assinatura: dto.data_assinatura,
                        data_inicio: dto.data_inicio,
                        data_termino: dto.data_termino,
                        prazo_numero: dto.prazo_numero,
                        prazo_unidade: dto.prazo_unidade,
                        data_base_mes: dto.data_base_mes,
                        data_base_ano: dto.data_base_ano,
                        valor: dto.valor,

                        atualizado_em: now,
                        atualizado_por: user.id,
                    },
                    select: { id: true },
                });
            }
        );

        return updated;
    }

    /**
     * Remove o contrato da ótica de uma obra/projeto.
     * - Desvincula o contrato deste projeto (soft-delete do vínculo contrato_projeto).
     * - Se não restar nenhuma associação ativa, marca o contrato como excluído.
     *   (Contratos exclusivos têm um único vínculo, portanto são removidos por completo.)
     */
    async remove(projeto_id: number, id: number, user: PessoaFromJwt): Promise<void> {
        const now = new Date(Date.now());
        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient): Promise<void> => {
            // Trava a linha do contrato até o fim da transação, serializando remoções/associações
            // concorrentes do mesmo contrato. Sem isso, duas remoções simultâneas poderiam ambas
            // contar "ainda há vínculos" e deixar o contrato órfão sem ser excluído (ou vice-versa).
            await prismaTx.$queryRaw`SELECT id FROM contrato WHERE id = ${id} FOR UPDATE`;

            const vinculo = await prismaTx.contratoProjeto.findFirst({
                where: {
                    contrato_id: id,
                    projeto_id: projeto_id,
                    removido_em: null,
                    contrato: { removido_em: null },
                },
                select: { id: true },
            });
            if (!vinculo) throw new NotFoundException('Contrato não encontrado');

            await prismaTx.contratoProjeto.update({
                where: { id: vinculo.id },
                data: {
                    removido_em: now,
                    removido_por: user.id,
                },
            });

            // Considera apenas vínculos com obras ativas: vínculos órfãos (obra já excluída, mas
            // contrato_projeto não baixado) não devem manter o contrato "vivo" indefinidamente.
            const restantes = await prismaTx.contratoProjeto.count({
                where: { contrato_id: id, removido_em: null, projeto: { removido_em: null } },
            });

            if (restantes === 0) {
                await prismaTx.contrato.update({
                    where: { id },
                    data: {
                        removido_em: now,
                        removido_por: user.id,
                    },
                });
            } else {
                await garanteCoberturaSeiContratos(prismaTx, [id], user.id, projeto_id);
            }
        });
    }

    /**
     * Lista os contratos compartilhados do mesmo portfólio (e mesmo tipo) que ainda não estão
     * vinculados a este projeto/obra — usados na tela de vinculação com contrato compartilhado.
     */
    async listAvailableShared(
        projeto_id: number,
        user: PessoaFromJwt
    ): Promise<ContratoCompartilhadoDisponivelDto[]> {
        const ctx = await this.getProjetoCtx(this.prisma, projeto_id);

        const linhas = await this.prisma.contrato.findMany({
            where: {
                removido_em: null,
                contrato_exclusivo: false,
                ContratoProjeto: {
                    some: {
                        removido_em: null,
                        projeto: { removido_em: null, portfolio_id: ctx.portfolio_id, tipo: ctx.tipo },
                    },
                },
                NOT: {
                    ContratoProjeto: { some: { projeto_id: projeto_id, removido_em: null } },
                },
            },
            orderBy: [{ numero: 'asc' }],
            select: {
                id: true,
                numero: true,
                contrato_exclusivo: true,
                status: true,
                objeto_resumo: true,
                empresa_contratada: true,
                valor: true,
            },
        });

        return linhas.map((contrato) => {
            return {
                id: contrato.id,
                numero: contrato.numero,
                contrato_exclusivo: contrato.contrato_exclusivo,
                status: contrato.status,
                objeto_resumo: contrato.objeto_resumo,
                empresa_contratada: contrato.empresa_contratada,
                valor: contrato.valor,
            };
        });
    }

    /**
     * Processos SEI que podem compor o contrato: os cadastrados em qualquer obra/projeto ativo vinculado a ele
     * (mesmo universo de `validaProcessosSei`). Repetidos ficam com o registro da obra da rota, se houver.
     */
    async listProcessosSeiDisponiveis(
        projeto_id: number,
        id: number,
        user: PessoaFromJwt
    ): Promise<ContratoProcessoSeiDisponivelDto[]> {
        const contrato = await this.prisma.contrato.findFirst({
            where: {
                id,
                removido_em: null,
                ContratoProjeto: { some: { projeto_id: projeto_id, removido_em: null } },
            },
            select: { id: true },
        });
        if (!contrato) throw new NotFoundException('Contrato não encontrado');

        const registros = await this.prisma.projetoRegistroSei.findMany({
            where: {
                removido_em: null,
                projeto: {
                    removido_em: null,
                    ContratoProjeto: { some: { contrato_id: id, removido_em: null } },
                },
            },
            orderBy: [{ processo_sei: 'asc' }, { id: 'asc' }],
            select: {
                processo_sei: true,
                descricao: true,
                projeto: { select: { id: true, nome: true } },
            },
        });

        const porProcesso = new Map<string, ContratoProcessoSeiDisponivelDto>();
        for (const r of registros) {
            const atual = porProcesso.get(r.processo_sei);
            if (atual && (atual.projeto.id === projeto_id || r.projeto.id !== projeto_id)) continue;
            porProcesso.set(r.processo_sei, {
                processo_sei: r.processo_sei,
                descricao: r.descricao,
                projeto: r.projeto,
            });
        }
        return [...porProcesso.values()];
    }

    /**
     * Vincula um ou mais contratos compartilhados existentes a este projeto/obra (tabela contrato_projeto).
     * Cada contrato precisa ser compartilhado, ativo, do mesmo portfólio/tipo e ainda não vinculado.
     * A operação é atômica: se qualquer contrato falhar na validação, nenhuma associação é gravada.
     */
    async associar(projeto_id: number, contrato_ids: number[], user: PessoaFromJwt): Promise<BatchSimpleIds> {
        const now = new Date(Date.now());
        const ids = [...new Set(contrato_ids)];

        return await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<BatchSimpleIds> => {
                const ctx = await this.getProjetoCtx(prismaTx, projeto_id);

                for (const contrato_id of ids) {
                    // Mesma trava usada em remove(): serializa associação x remoção do mesmo contrato,
                    // garantindo que a checagem de "já vinculado"/órfão seja consistente.
                    await prismaTx.$queryRaw`SELECT id FROM contrato WHERE id = ${contrato_id} FOR UPDATE`;

                    const contrato = await prismaTx.contrato.findFirst({
                        where: {
                            id: contrato_id,
                            removido_em: null,
                            contrato_exclusivo: false,
                            ContratoProjeto: {
                                some: {
                                    removido_em: null,
                                    projeto: { removido_em: null, portfolio_id: ctx.portfolio_id, tipo: ctx.tipo },
                                },
                            },
                        },
                        select: { id: true },
                    });
                    if (!contrato)
                        throw new HttpException(
                            `Contrato compartilhado (id ${contrato_id}) não encontrado neste portfólio`,
                            400
                        );

                    const jaVinculado = await prismaTx.contratoProjeto.count({
                        where: { contrato_id: contrato_id, projeto_id: projeto_id, removido_em: null },
                    });
                    if (jaVinculado > 0)
                        throw new HttpException(
                            `Contrato (id ${contrato_id}) já está associado a esta obra/projeto`,
                            400
                        );

                    await prismaTx.contratoProjeto.create({
                        data: {
                            contrato_id: contrato_id,
                            projeto_id: projeto_id,
                            criado_em: now,
                            criado_por: user.id,
                        },
                    });
                }

                return { ids };
            }
        );
    }

    private async getProjetoCtx(
        prismaTx: Prisma.TransactionClient,
        projeto_id: number
    ): Promise<{ portfolio_id: number; tipo: TipoProjeto }> {
        const projeto = await prismaTx.projeto.findFirst({
            where: { id: projeto_id, removido_em: null },
            select: { portfolio_id: true, tipo: true },
        });
        if (!projeto) throw new NotFoundException('Projeto não encontrado');
        return projeto;
    }

    /**
     * Todo processo SEI do contrato precisa estar cadastrado (ativo) em alguma obra/projeto vinculado a ele
     * — em contrato compartilhado, vale o cadastro de qualquer uma das obras. `contrato_sei.numero_sei` não
     * tem FK para `projeto_registro_sei`, então a referência é garantida aqui.
     *
     * Devolve os números só com dígitos (mesmo formato de `projeto_registro_sei.processo_sei`), sem repetidos.
     */
    private async validaProcessosSei(
        prismaTx: Prisma.TransactionClient,
        projeto_ids: number[],
        processos_sei: string[]
    ): Promise<string[]> {
        const processos = [...new Set(processos_sei.map((p) => p.replace(/[^0-9]/g, '')))];
        if (processos.some((p) => p === ''))
            throw new HttpException('Processos SEI: informe apenas números de processo válidos', 400);

        const cadastrados = await prismaTx.projetoRegistroSei.findMany({
            where: {
                projeto_id: { in: projeto_ids },
                projeto: { removido_em: null },
                removido_em: null,
                processo_sei: { in: processos },
            },
            select: { processo_sei: true },
        });
        const cadastradosSet = new Set(cadastrados.map((r) => r.processo_sei));

        const faltantes = processos.filter((p) => !cadastradosSet.has(p));
        if (faltantes.length)
            throw new HttpException(
                `Processo(s) SEI não cadastrado(s) na obra/projeto: ${faltantes.map((p) => (p.length === 16 ? formataSEI(p) : p)).join(', ')}. ` +
                    'Cadastre-o(s) em "Processos SEI" ou remova-o(s) do contrato.',
                400
            );

        return processos;
    }

    private async assertNumeroUnicoNoPortfolio(
        prismaTx: Prisma.TransactionClient,
        portfolio_id: number,
        numero: string,
        ignorarContratoId?: number
    ): Promise<void> {
        const similarExiste = await prismaTx.contrato.count({
            where: {
                id: ignorarContratoId ? { not: ignorarContratoId } : undefined,
                numero: { equals: numero, mode: 'insensitive' },
                removido_em: null,
                ContratoProjeto: {
                    some: {
                        removido_em: null,
                        projeto: { removido_em: null, portfolio_id: portfolio_id },
                    },
                },
            },
        });
        if (similarExiste > 0)
            throw new HttpException(
                'Número igual ou semelhante já existe em outro contrato ativo do portfólio',
                400
            );
    }

    private calcularTotaisAditivos(
        aditivos: { valor: Decimal | null; tipo_aditivo: { tipo: string } }[],
        contratoValor: Decimal | null
    ) {
        const total_aditivos = aditivos
            .filter((a) => a.tipo_aditivo.tipo === 'Aditivo' && a.valor != null)
            .reduce((sum, a) => sum.plus(a.valor!), new Decimal(0));

        const total_reajustes = aditivos
            .filter((a) => a.tipo_aditivo.tipo === 'Reajuste' && a.valor != null)
            .reduce((sum, a) => sum.plus(a.valor!), new Decimal(0));

        const valor_reajustado = new Decimal(contratoValor ?? 0).plus(total_aditivos).plus(total_reajustes);

        return {
            quantidade_aditivos: aditivos.filter((a) => a.tipo_aditivo.tipo === 'Aditivo').length,
            quantidade_reajustes: aditivos.filter((a) => a.tipo_aditivo.tipo === 'Reajuste').length,
            total_aditivos,
            total_reajustes,
            valor_reajustado,
        };
    }
}
