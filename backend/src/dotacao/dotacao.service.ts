import { HttpException, Injectable } from '@nestjs/common';
import { DotacaoRealizado, Prisma } from "@prisma/client";
import { DateTime } from 'luxon';
import { PrismaService } from '../prisma/prisma.service';
import { SofApiService, SofError } from '../sof-api/sof-api.service';
import { AnoDotacaoDto } from './dto/dotacao.dto';
import { ValorPlanejadoDto, ValorRealizadoDotacaoDto } from "./entities/dotacao.entity";

@Injectable()
export class DotacaoService {

    constructor(
        private readonly prisma: PrismaService,
        private readonly sof: SofApiService,
    ) { }

    async valorPlanejado(dto: AnoDotacaoDto): Promise<ValorPlanejadoDto> {

        const dotacaoExistente = await this.prisma.dotacaoPlanejado.findUnique({
            where: {
                ano_referencia_dotacao: {
                    ano_referencia: dto.ano,
                    dotacao: dto.dotacao,
                }
            }
        });

        if (dotacaoExistente && dotacaoExistente.informacao_valida) {
            return {
                empenho_liquido: dotacaoExistente.empenho_liquido,
                id: dotacaoExistente.id,
                informacao_valida: dotacaoExistente.informacao_valida,
                smae_soma_valor_planejado: dotacaoExistente.smae_soma_valor_planejado,
            }
        }

        if (dotacaoExistente)
            await this.prisma.dotacaoPlanejado.delete({ where: { id: dotacaoExistente.id } });

        await this.sincronizarDotacaoPlanejado(dto);

        const dotacaoPlanejado = await this.prisma.dotacaoPlanejado.findFirstOrThrow({
            where: {
                ano_referencia: dto.ano,
                dotacao: dto.dotacao,
            }
        });

        return {
            id: dotacaoPlanejado.id,
            empenho_liquido: dotacaoPlanejado.empenho_liquido,
            informacao_valida: dotacaoPlanejado.informacao_valida,
            smae_soma_valor_planejado: dotacaoPlanejado.smae_soma_valor_planejado,
        }
    }


    async valorRealizadoDotacao(dto: AnoDotacaoDto): Promise<ValorRealizadoDotacaoDto[]> {

        const dotacaoRealizadoExistente = await this.prisma.dotacaoRealizado.findUnique({
            where: {
                ano_referencia_dotacao: {
                    ano_referencia: dto.ano,
                    dotacao: dto.dotacao,
                }
            }
        });

        const mesMaisAtual = this.sof.realizadoMesMaisAtual(dto.ano);

        if (dotacaoRealizadoExistente && dotacaoRealizadoExistente.informacao_valida && dotacaoRealizadoExistente.mes_utilizado == mesMaisAtual) {
            return [
                this.renderDotacaoRealizado(dotacaoRealizadoExistente)
            ]
        }

        await this.sincronizarDotacaoRealizado(dto, mesMaisAtual);

        const dotacaoRealizado = await this.prisma.dotacaoRealizado.findUniqueOrThrow({
            where: {
                ano_referencia_dotacao: {
                    ano_referencia: dto.ano,
                    dotacao: dto.dotacao,
                }
            }
        });

        return [
            this.renderDotacaoRealizado(dotacaoRealizado)
        ]
    }

    private renderDotacaoRealizado(dotacao: DotacaoRealizado): ValorRealizadoDotacaoDto {
        return {
            id: dotacao.id,
            dotacao: dotacao.dotacao,
            informacao_valida: dotacao.informacao_valida,
            empenho_liquido: dotacao.empenho_liquido,
            valor_liquidado: dotacao.valor_liquidado,
            mes_utilizado: dotacao.mes_utilizado,

            smae_soma_valor_empenho: dotacao.smae_soma_valor_empenho,
            smae_soma_valor_liquidado: dotacao.smae_soma_valor_liquidado,
        };
    }


    private async sincronizarDotacaoRealizado(dto: AnoDotacaoDto, mes: number) {
        const now = new Date(Date.now());
        try {
            const r = await this.sof.empenhoDotacao({
                dotacao: dto.dotacao,
                ano: dto.ano,
                mes: mes
            });

            for (const dotacao of r.data) {
                await this.prisma.$transaction(async (prisma: Prisma.TransactionClient) => {
                    const jaExiste = await prisma.dotacaoRealizado.findUnique({
                        where: {
                            ano_referencia_dotacao: {
                                ano_referencia: dto.ano,
                                dotacao: dto.dotacao,
                            }
                        }
                    });

                    // se ja existe, atualiza caso estiver com dados inválidos, ou se o valor for diferente no empenho_liquido
                    if (jaExiste && (
                        jaExiste.informacao_valida == false
                        || (jaExiste.valor_liquidado.toFixed(2) != dotacao.val_liquidado.toFixed(2))
                        || (jaExiste.empenho_liquido.toFixed(2) != dotacao.empenho_liquido.toFixed(2))
                        || (jaExiste.mes_utilizado != mes)
                    )) {
                        await prisma.dotacaoRealizado.update({
                            where: {
                                id: jaExiste.id
                            },
                            data: {
                                informacao_valida: true,
                                sincronizado_em: now,
                                mes_utilizado: mes,
                                empenho_liquido: dotacao.empenho_liquido,
                                valor_liquidado: dotacao.val_liquidado
                            }
                        });
                    }

                    if (!jaExiste) {
                        await prisma.dotacaoRealizado.create({
                            data: {
                                informacao_valida: true,
                                sincronizado_em: now,
                                empenho_liquido: dotacao.empenho_liquido,
                                valor_liquidado: dotacao.val_liquidado,
                                mes_utilizado: mes,
                                ano_referencia: dto.ano,
                                dotacao: dto.dotacao,
                                smae_soma_valor_empenho: 0,
                                smae_soma_valor_liquidado: 0,
                            },
                            select: { id: true },
                        });

                    }

                }, {
                    isolationLevel: 'Serializable',
                    maxWait: 15000,
                    timeout: 60000,
                });
            }


        } catch (error) {
            if (error instanceof HttpException)
                throw error;
            if (error instanceof SofError) {

                await this.prisma.$transaction(async (prisma: Prisma.TransactionClient) => {

                    const jaExiste = await prisma.dotacaoRealizado.findUnique({
                        where: {
                            ano_referencia_dotacao: {
                                ano_referencia: dto.ano,
                                dotacao: dto.dotacao,
                            }
                        }
                    });

                    // se ainda não existe (pode ter iniciado já por causa do lock)
                    if (!jaExiste) {

                        await prisma.dotacaoRealizado.create({
                            data: {
                                informacao_valida: false,
                                sincronizado_em: null,
                                empenho_liquido: 0,
                                valor_liquidado: 0,
                                mes_utilizado: mes,
                                ano_referencia: dto.ano,
                                dotacao: dto.dotacao,
                            },
                            select: { id: true },
                        });
                    }
                }, {
                    isolationLevel: 'Serializable'
                });
            }
        }
    }


    private async sincronizarDotacaoPlanejado(dto: AnoDotacaoDto) {
        const now = new Date(Date.now());
        try {
            const r = await this.sof.empenhoDotacao({
                dotacao: dto.dotacao,
                ano: dto.ano,
                mes: 1
            });

            for (const dotacao of r.data) {
                await this.prisma.$transaction(async (prisma: Prisma.TransactionClient) => {
                    const jaExiste = await prisma.dotacaoPlanejado.findUnique({
                        where: {
                            ano_referencia_dotacao: {
                                ano_referencia: dto.ano,
                                dotacao: dto.dotacao,
                            },
                        }
                    });

                    // se ja existe, atualiza caso estiver com dados inválidos, ou se o valor for diferente no empenho_liquido
                    if (jaExiste && (
                        jaExiste.informacao_valida == false
                        || (jaExiste.empenho_liquido.toFixed(2) != dotacao.empenho_liquido.toFixed(2))
                    )) {
                        await prisma.dotacaoPlanejado.update({
                            where: {
                                id: jaExiste.id
                            },
                            data: {
                                informacao_valida: true,
                                sincronizado_em: now,
                                empenho_liquido: dotacao.empenho_liquido,
                                pressao_orcamentaria: jaExiste.smae_soma_valor_planejado > dotacao.empenho_liquido,
                            }
                        });
                    }

                    if (!jaExiste) {
                        await prisma.dotacaoPlanejado.create({
                            data: {
                                informacao_valida: true,
                                sincronizado_em: now,
                                empenho_liquido: Number(dotacao.empenho_liquido),
                                valor_liquidado: Number(dotacao.val_liquidado),
                                mes_utilizado: 1,
                                ano_referencia: dto.ano,
                                dotacao: dto.dotacao,
                                pressao_orcamentaria: false,
                                smae_soma_valor_planejado: 0
                            },
                            select: { id: true },
                        });

                    }

                }, {
                    isolationLevel: 'Serializable',
                    maxWait: 15000,
                    timeout: 60000,
                });
            }


        } catch (error) {
            if (error instanceof HttpException)
                throw error;
            if (error instanceof SofError) {

                await this.prisma.$transaction(async (prisma: Prisma.TransactionClient) => {

                    const jaExiste = await prisma.dotacaoPlanejado.findUnique({
                        where: {
                            ano_referencia_dotacao: {
                                ano_referencia: dto.ano,
                                dotacao: dto.dotacao,
                            }
                        }
                    });

                    // se ainda não existe (pode ter iniciado já por causa do lock)
                    if (!jaExiste) {

                        await prisma.dotacaoPlanejado.create({
                            data: {
                                informacao_valida: false,
                                sincronizado_em: null,
                                empenho_liquido: 0,
                                valor_liquidado: 0,
                                mes_utilizado: 1,
                                ano_referencia: dto.ano,
                                dotacao: dto.dotacao,
                                pressao_orcamentaria: false,
                                smae_soma_valor_planejado: 0,
                            },
                            select: { id: true },
                        });
                    }
                }, {
                    isolationLevel: 'Serializable'
                });
            }
        }
    }

}
