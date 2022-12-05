import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from "@prisma/client";
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

        const dotacaoExistente = await this.prisma.dotacaoPlanejado.findFirst({
            where: {
                ano_referencia: dto.ano,
                dotacao: dto.dotacao,
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

        await this.sincronizarDotacao(dto);

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

        const dotacaoRealizadoExistente = await this.prisma.dotacaoRealizado.findFirst({
            where: {
                ano_referencia: dto.ano,
                dotacao: dto.dotacao,
            }
        });

        const mes_corrente = this.realizadoMesMaisAtual(dto.ano);

        if (dotacaoRealizadoExistente && dotacaoRealizadoExistente.informacao_valida && dotacaoRealizadoExistente.mes_utilizado == mes_corrente) {
            return [
                {
                    id: dotacaoRealizadoExistente.id,
                    dotacao: dotacaoRealizadoExistente.dotacao,
                    informacao_valida: dotacaoRealizadoExistente.informacao_valida,
                    empenho_liquido: dotacaoRealizadoExistente.empenho_liquido,
                    valor_liquidado: dotacaoRealizadoExistente.valor_liquidado,

                    smae_soma_valor_empenho: dotacaoRealizadoExistente.smae_soma_valor_empenho,
                    smae_soma_valor_liquidado: dotacaoRealizadoExistente.smae_soma_valor_liquidado,
                }
            ]
        }

        throw ''
    }

    realizadoMesMaisAtual(ano: number): number {
        const nowSp = DateTime.local({ zone: "America/Sao_Paulo" });

        const anoCorrente = nowSp.month;
        if (anoCorrente == +ano)
            return nowSp.month;

        if (+ano > anoCorrente)
            throw new HttpException('Não é possível buscar por realizado no futuro', 400);

        return 12; // mes mais recente do ano pesquisado
    }



    private async sincronizarDotacao(dto: AnoDotacaoDto) {
        const now = new Date(Date.now());
        try {
            const r = await this.sof.empenhoDotacao({
                dotacao: dto.dotacao,
                ano: dto.ano,
                mes: 1
            });

            for (const dotacao of r.data) {
                await this.prisma.$transaction(async (prisma: Prisma.TransactionClient) => {
                    const jaExiste = await prisma.dotacaoPlanejado.findFirst({
                        where: {
                            ano_referencia: dto.ano,
                            dotacao: dto.dotacao,
                        }
                    });

                    // se ja existe, atualiza caso estiver com dados inválidos, ou se o valor for diferente no empenho_liquido
                    if (jaExiste && (!jaExiste.informacao_valida || Number(jaExiste.empenho_liquido) != Number(dotacao.empenho_liquido))) {

                        await prisma.dotacaoPlanejado.update({
                            where: {
                                id: jaExiste.id
                            },
                            data: {
                                informacao_valida: true,
                                sincronizado_em: now,
                                empenho_liquido: Number(dotacao.empenho_liquido),
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

                    const jaExiste = await prisma.dotacaoPlanejado.findFirst({
                        where: {
                            ano_referencia: dto.ano,
                            dotacao: dto.dotacao,
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
