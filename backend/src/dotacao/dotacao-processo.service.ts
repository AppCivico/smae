import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SofApiService, SofError } from '../sof-api/sof-api.service';
import { DotacaoService } from './dotacao.service';
import { AnoDotacaoProcessoDto } from './dto/dotacao.dto';
import { ValorRealizadoProcessoDto } from './entities/dotacao.entity';

@Injectable()
export class DotacaoProcessoService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly sof: SofApiService,
        private readonly dotacaoService: DotacaoService
    ) {}

    async valorRealizadoProcesso(dto: AnoDotacaoProcessoDto): Promise<ValorRealizadoProcessoDto[]> {
        const mesMaisAtual = this.sof.mesMaisRecenteDoAno(dto.ano, 'realizado');

        // sempre sincroniza, pois pode haver mais de uma dotação no processo e não sabemos
        // quando elas aparecem
        return await this.sincronizarProcessoRealizado(dto, mesMaisAtual);
    }

    private async sincronizarProcessoRealizado(
        dto: AnoDotacaoProcessoDto,
        mes: number
    ): Promise<ValorRealizadoProcessoDto[]> {
        const now = new Date(Date.now());
        dto.processo = dto.processo.replace(/[^0-9]/g, '');

        try {
            const r = await this.sof.empenhoProcesso({
                processo: dto.processo,
                ano: dto.ano,
                mes: mes,
            });

            for (const dotacaoProcesso of r.data) {
                await this.prisma.$transaction(
                    async (prisma: Prisma.TransactionClient) => {
                        const jaExiste = await prisma.dotacaoProcesso.findUnique({
                            where: {
                                ano_referencia_dotacao_dotacao_processo: {
                                    dotacao: dotacaoProcesso.dotacao,
                                    ano_referencia: dto.ano,
                                    dotacao_processo: dto.processo,
                                },
                            },
                        });

                        // se ja existe, atualiza caso estiver com dados inválidos, ou se o valor for diferente no empenho_liquido
                        if (
                            jaExiste &&
                            (jaExiste.informacao_valida == false ||
                                jaExiste.valor_liquidado.toFixed(2) != dotacaoProcesso.val_liquidado.toFixed(2) ||
                                jaExiste.empenho_liquido.toFixed(2) != dotacaoProcesso.empenho_liquido.toFixed(2) ||
                                jaExiste.mes_utilizado != mes)
                        ) {
                            await prisma.dotacaoProcesso.update({
                                where: {
                                    id: jaExiste.id,
                                },
                                data: {
                                    informacao_valida: true,
                                    sincronizado_em: now,
                                    mes_utilizado: mes,
                                    empenho_liquido: dotacaoProcesso.empenho_liquido,
                                    valor_liquidado: dotacaoProcesso.val_liquidado,
                                },
                            });
                        } else if (jaExiste) {
                            // já existe, mas tava tudo igual, ainda precisa atualizar o sincronizado_em
                            // pro crontab n ficar em loop
                            await prisma.dotacaoProcesso.update({
                                where: { id: jaExiste.id },
                                data: { sincronizado_em: now },
                            });
                        }

                        if (!jaExiste) {
                            await prisma.dotacaoProcesso.create({
                                data: {
                                    informacao_valida: true,
                                    sincronizado_em: now,
                                    empenho_liquido: dotacaoProcesso.empenho_liquido,
                                    valor_liquidado: dotacaoProcesso.val_liquidado,
                                    mes_utilizado: mes,
                                    ano_referencia: dto.ano,
                                    dotacao: dotacaoProcesso.dotacao,
                                    dotacao_processo: dto.processo,
                                },
                                select: { id: true },
                            });
                        }

                        // nao se atualiza as tabelas de Dotação aqui, pois os valores são de outro endpoint
                    },
                    {
                        isolationLevel: 'Serializable',
                        maxWait: 15000,
                        timeout: 60000,
                    }
                );
            }
        } catch (error) {
            if (error instanceof SofError)
                throw new HttpException(
                    'No momento, o serviço SOF está indisponível, e não é possível criar um Processo manualmente nesta versão do SMAE.\n\nTente novamente mais tarde',
                    400
                );
            throw error;
        }

        const dbList = await this.prisma.dotacaoProcesso.findMany({
            where: {
                ano_referencia: dto.ano,
                dotacao_processo: dto.processo,
            },
            select: {
                id: true,
                dotacao: true,
                informacao_valida: true,
                empenho_liquido: true,
                valor_liquidado: true,
                mes_utilizado: true,
                ano_referencia: true,
                dotacao_processo: true,
            },
        });

        const pList = dbList.map(async (r) => {
            const smaeResults = await this.get_smae_soma_valor_realizado(r.dotacao, dto);
            return {
                ...r,
                dotacao_processo: undefined,
                processo: r.dotacao_processo,
                ...smaeResults,
                empenho_liquido: r.empenho_liquido.toFixed(2),
                valor_liquidado: r.valor_liquidado.toFixed(2),
                mes_utilizado: r.mes_utilizado,
                ano_referencia: r.ano_referencia,
                projeto_atividade: '',
            };
        });

        const list = await Promise.all(pList);
        await this.dotacaoService.setManyProjetoAtividade(list);

        return list;
    }

    async get_smae_soma_valor_realizado(
        dotacao: string,
        dto: AnoDotacaoProcessoDto
    ): Promise<{
        smae_soma_valor_empenho: string;
        smae_soma_valor_liquidado: string;
    }> {
        let smae_soma_valor_empenho = '0.00';
        let smae_soma_valor_liquidado = '0.00';

        if (dto.pdm_id) {
            const qr = await this.prisma.pdmDotacaoProcesso.findUnique({
                where: {
                    pdm_id_ano_referencia_dotacao_dotacao_processo: {
                        ano_referencia: dto.ano,
                        dotacao: dotacao,
                        dotacao_processo: dto.processo,
                        pdm_id: dto.pdm_id,
                    },
                },
                select: { soma_valor_empenho: true, soma_valor_liquidado: true },
            });
            if (qr) {
                smae_soma_valor_empenho = qr.soma_valor_empenho.toFixed(2);
                smae_soma_valor_liquidado = qr.soma_valor_liquidado.toFixed(2);
            }
        } else if (dto.portfolio_id) {
            const qr = await this.prisma.portfolioDotacaoProcesso.findUnique({
                where: {
                    portfolio_id_ano_referencia_dotacao_dotacao_processo: {
                        ano_referencia: dto.ano,
                        dotacao: dotacao,
                        dotacao_processo: dto.processo,
                        portfolio_id: dto.portfolio_id,
                    },
                },
                select: { soma_valor_empenho: true, soma_valor_liquidado: true },
            });
            if (qr) {
                smae_soma_valor_empenho = qr.soma_valor_empenho.toFixed(2);
                smae_soma_valor_liquidado = qr.soma_valor_liquidado.toFixed(2);
            }
        }

        return {
            smae_soma_valor_empenho,
            smae_soma_valor_liquidado,
        };
    }
}
