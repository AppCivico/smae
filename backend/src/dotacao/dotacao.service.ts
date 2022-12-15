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

    async getOneProjetoAtividade(ano: number, dotacao: string): Promise<string> {
        // código é feito juntando o 6º com o 7º campo da dotação
        // const x = '16.10.12.122.3024.2.100.33903500.00';
        // const a = x.split('.');
        // codigo = [a[5], a[6]].join('');
        const codigo = dotacao.split('.').slice(5, 7).join('');

        const r: {
            descricao: string
        }[] = await this.prisma.$queryRaw`select descricao from sof_entidades_linhas where col = 'projetos_atividades' and ano = ${ano}::int and codigo = ${codigo}`;
        if (r.length > 0) return r[0].descricao;
        return `(projeto/atividade ${codigo} não foi encontrado)`;
    }

    async setManyProjetoAtividade(srcDestList: { dotacao: string, projeto_atividade: string, ano_referencia: number }[]) {
        const byYear: Record<string, Record<string, boolean>> = {};
        for (const r of srcDestList) {
            const codigo = r.dotacao.split('.').slice(5, 7).join('');
            if (!byYear[r.ano_referencia]) byYear[r.ano_referencia] = {};
            if (!byYear[r.ano_referencia][codigo]) byYear[r.ano_referencia][codigo] = true;
        }

        const results: Record<string, Record<string, string>> = {};

        for (const ano in byYear) {
            const codigos = Object.keys(byYear[ano]);
            const rows: {
                codigo: string
                descricao: string
            }[] = await this.prisma.$queryRaw`select codigo, descricao from sof_entidades_linhas where col = 'projetos_atividades'
            and ano = ${ano}::int
            and codigo = ANY(${codigos}::varchar[])`;

            if (!results[ano]) results[ano] = {};
            for (const r of rows) {
                results[ano][r.codigo] = r.descricao;
            }
        }

        for (const r of srcDestList) {
            const codigo = r.dotacao.split('.').slice(5, 7).join('');
            r.projeto_atividade = results[r.ano_referencia] && results[r.ano_referencia][codigo] ? results[r.ano_referencia][codigo] : '';
        }

    }

    async valorPlanejado(dto: AnoDotacaoDto): Promise<ValorPlanejadoDto> {

        const dotacaoExistente = await this.prisma.dotacaoPlanejado.findUnique({
            where: {
                ano_referencia_dotacao: {
                    ano_referencia: dto.ano,
                    dotacao: dto.dotacao,
                }
            }
        });

        const mesMaisAtual = this.sof.mesMaisRecenteDoAno(dto.ano);

        if (dotacaoExistente && dotacaoExistente.informacao_valida && dotacaoExistente.mes_utilizado == mesMaisAtual) {
            return {
                empenho_liquido: dotacaoExistente.empenho_liquido.toFixed(2),
                id: dotacaoExistente.id,
                informacao_valida: dotacaoExistente.informacao_valida,
                smae_soma_valor_planejado: dotacaoExistente.smae_soma_valor_planejado.toFixed(2),
                mes_utilizado: dotacaoExistente.mes_utilizado,
                projeto_atividade: await this.getOneProjetoAtividade(dto.ano, dto.dotacao),
            }
        }

        if (dotacaoExistente)
            await this.prisma.dotacaoPlanejado.delete({ where: { id: dotacaoExistente.id } });

        await this.sincronizarDotacaoPlanejado(dto, mesMaisAtual);

        const dotacaoPlanejado = await this.prisma.dotacaoPlanejado.findFirstOrThrow({
            where: {
                ano_referencia: dto.ano,
                dotacao: dto.dotacao,
            }
        });

        return {
            id: dotacaoPlanejado.id,
            empenho_liquido: dotacaoPlanejado.empenho_liquido.toFixed(2),
            informacao_valida: dotacaoPlanejado.informacao_valida,
            smae_soma_valor_planejado: dotacaoPlanejado.smae_soma_valor_planejado.toFixed(2),
            mes_utilizado: dotacaoPlanejado.mes_utilizado,
            projeto_atividade: await this.getOneProjetoAtividade(dto.ano, dto.dotacao),
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

        const mesMaisAtual = this.sof.mesMaisRecenteDoAno(dto.ano);

        if (dotacaoRealizadoExistente && dotacaoRealizadoExistente.informacao_valida && dotacaoRealizadoExistente.mes_utilizado == mesMaisAtual) {
            return [
                await this.renderDotacaoRealizado(dotacaoRealizadoExistente)
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
            await this.renderDotacaoRealizado(dotacaoRealizado)
        ]
    }

    private async renderDotacaoRealizado(dotacao: DotacaoRealizado): Promise<ValorRealizadoDotacaoDto> {
        return {
            id: dotacao.id,
            dotacao: dotacao.dotacao,
            informacao_valida: dotacao.informacao_valida,
            empenho_liquido: dotacao.empenho_liquido.toFixed(2),
            valor_liquidado: dotacao.valor_liquidado.toFixed(2),
            mes_utilizado: dotacao.mes_utilizado,

            smae_soma_valor_empenho: dotacao.smae_soma_valor_empenho.toFixed(2),
            smae_soma_valor_liquidado: dotacao.smae_soma_valor_liquidado.toFixed(2),

            projeto_atividade: await this.getOneProjetoAtividade(dotacao.ano_referencia, dotacao.dotacao),
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
            if (error instanceof SofError) {
                throw new HttpException('No momento, o serviço SOF está indisponível, e não é possível criar uma dotação de realizado manualmente nesta versão do SMAE.\n\nTente novamente mais tarde', 400);
            }

            throw error;
        }
    }


    private async sincronizarDotacaoPlanejado(dto: AnoDotacaoDto, mes: number) {
        const now = new Date(Date.now());
        try {
            const r = await this.sof.empenhoDotacao({
                dotacao: dto.dotacao,
                ano: dto.ano,
                mes: mes
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
                                pressao_orcamentaria: Math.round(jaExiste.smae_soma_valor_planejado * 100) > Math.round(dotacao.empenho_liquido * 100),
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
                                mes_utilizado: mes,
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
                                mes_utilizado: mes,
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
                return;
            }

            throw error;
        }
    }

}
