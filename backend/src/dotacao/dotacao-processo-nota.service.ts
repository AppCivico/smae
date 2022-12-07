import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from "@prisma/client";
import { PrismaService } from '../prisma/prisma.service';
import { SofApiService, SofError } from '../sof-api/sof-api.service';
import { AnoDotacaoNotaEmpenhoDto } from './dto/dotacao.dto';
import { ValorRealizadoNotaEmpenhoDto } from "./entities/dotacao.entity";

@Injectable()
export class DotacaoProcessoNotaService {

    constructor(
        private readonly prisma: PrismaService,
        private readonly sof: SofApiService,
    ) { }

    async valorRealizadoNotaEmpenho(dto: AnoDotacaoNotaEmpenhoDto): Promise<ValorRealizadoNotaEmpenhoDto[]> {

        const mesMaisAtual = this.sof.realizadoMesMaisAtual(dto.ano);

        // sempre sincroniza, pois pode haver mais de uma dotação no processo e não sabemos
        // quando elas aparecem
        const list = await this.sincronizarNotaEmpenhoRealizado(dto, mesMaisAtual);
        if (list.length > 1) throw new HttpException('Era esperado apenas um retorno de Dotação na busca por Nota de Empenho. Necessária atualização do SMAE', 400);
        return list;
    }

    private async sincronizarNotaEmpenhoRealizado(dto: AnoDotacaoNotaEmpenhoDto, mes: number): Promise<ValorRealizadoNotaEmpenhoDto[]> {
        const now = new Date(Date.now());
        dto.nota_empenho = dto.nota_empenho.replace(/[^0-9]/g, '');

        try {
            const r = await this.sof.empenhoNotaEmpenho({
                nota_empenho: dto.nota_empenho,
                ano: dto.ano,
                mes: mes
            });

            for (const dotacaoProcesso of r.data) {
                console.log({ dotacaoProcesso });

                await this.prisma.$transaction(async (prisma: Prisma.TransactionClient) => {
                    const jaExiste = await prisma.dotacaoProcessoNota.findUnique({
                        where: {
                            ano_referencia_dotacao_dotacao_processo_dotacao_processo_nota: {
                                dotacao: dotacaoProcesso.dotacao,
                                dotacao_processo: dotacaoProcesso.processo,
                                dotacao_processo_nota: dto.nota_empenho,
                                ano_referencia: dto.ano,
                            }
                        }
                    });

                    // se ja existe, atualiza caso estiver com dados inválidos, ou se o valor for diferente no empenho_liquido
                    if (jaExiste && (
                        jaExiste.informacao_valida == false
                        || (jaExiste.valor_liquidado.toFixed(2) != dotacaoProcesso.val_liquidado.toFixed(2))
                        || (jaExiste.empenho_liquido.toFixed(2) != dotacaoProcesso.empenho_liquido.toFixed(2))
                        || (jaExiste.mes_utilizado != mes)
                    )) {
                        await prisma.dotacaoProcessoNota.update({
                            where: {
                                id: jaExiste.id
                            },
                            data: {
                                informacao_valida: true,
                                sincronizado_em: now,
                                mes_utilizado: mes,
                                empenho_liquido: dotacaoProcesso.empenho_liquido,
                                valor_liquidado: dotacaoProcesso.val_liquidado
                            }
                        });
                    }

                    if (!jaExiste) {
                        await prisma.dotacaoProcessoNota.create({
                            data: {
                                informacao_valida: true,
                                sincronizado_em: now,
                                empenho_liquido: dotacaoProcesso.empenho_liquido,
                                valor_liquidado: dotacaoProcesso.val_liquidado,
                                mes_utilizado: mes,
                                ano_referencia: dto.ano,
                                dotacao: dotacaoProcesso.dotacao,
                                dotacao_processo: dotacaoProcesso.processo,
                                dotacao_processo_nota: dto.nota_empenho,
                                smae_soma_valor_empenho: 0,
                                smae_soma_valor_liquidado: 0,
                            },
                            select: { id: true },
                        });
                    }

                    // nao se atualiza as tabelas de Dotação ou Processo aqui, pois os valores são de outro endpoint

                }, {
                    isolationLevel: 'Serializable',
                    maxWait: 15000,
                    timeout: 60000,
                });
            }


        } catch (error) {
            if (error instanceof SofError)
                throw new HttpException('No momento, o serviço SOF está indisponível, e não é possível criar um Processo manualmente nesta versão do SMAE. Tente novamente mais tarde', 400);
            throw error;
        }

        const list = (await this.prisma.dotacaoProcessoNota.findMany({
            where: {
                ano_referencia: dto.ano,
                dotacao_processo_nota: dto.nota_empenho,
            },
            select: {
                id: true,
                dotacao: true,
                informacao_valida: true,
                empenho_liquido: true,
                valor_liquidado: true,
                mes_utilizado: true,
                smae_soma_valor_empenho: true,
                smae_soma_valor_liquidado: true,
                dotacao_processo: true,
                dotacao_processo_nota: true,
            }
        })).map((r) => {
            return {
                ...r,
                dotacao_processo: undefined,
                dotacao_processo_nota: undefined,
                processo: r.dotacao_processo,
                nota_empenho: r.dotacao_processo_nota,
                smae_soma_valor_empenho: r.smae_soma_valor_empenho.toFixed(2),
                smae_soma_valor_liquidado: r.smae_soma_valor_liquidado.toFixed(2),
                empenho_liquido: r.empenho_liquido.toFixed(2),
                valor_liquidado: r.valor_liquidado.toFixed(2),
            }
        });

        return list;
    }


}
