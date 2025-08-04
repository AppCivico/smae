import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { DotacaoRealizado, Prisma } from 'src/generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SofApiService, SofError, TrataDotacaoGrande } from '../sof-api/sof-api.service';
import { AnoDotacaoDto } from './dto/dotacao.dto';
import { ValorPlanejadoDto, ValorRealizadoDotacaoDto } from './entities/dotacao.entity';

type TipoAcaoOrcamentaria = 'custeio' | 'investimento' | '';

@Injectable()
export class DotacaoService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly sof: SofApiService
    ) {}

    // 11.13.08.091.*.1.278.*.00 => 11.13.08.091.****.1.278.********.00
    // 11.*.08.091.*.1.278.*.00 => 11.**.08.091.****.1.278.********.00
    expandirParteDotacao(parte_dotacao: string): string {
        const partes = parte_dotacao.split('.');
        if (partes[1] == '*') partes[1] = '**';
        if (partes[4] == '*') partes[4] = '****';
        if (partes[7] == '*') partes[7] = '********';
        return partes.join('.');
    }

    /**
     * Recebe a dotação, extrai o quinto (parte do projeto/atividade)
     * Se for par, é investimento, se for impar, é custeio
     * Ex: 30.10.08.605.3016.[4].470.33903900.00 => projeto/atividade = 4.470 -> custeio
     * Ex: 84.11.10.302.3003.[5].204.44905200.00 => projeto/atividade = 5.204 -> investimento
     *
     * @param dotacao
     */
    getAcaoOrcamentaria(dotacao: string | null): TipoAcaoOrcamentaria {
        let acao_orcamentaria: TipoAcaoOrcamentaria = '';
        if (dotacao) {
            const parts = dotacao.split('.');
            if (parts.length > 6) {
                const antesDoPonto = +parts[5];
                acao_orcamentaria = antesDoPonto % 2 == 0 ? 'custeio' : 'investimento';
            }
        }
        return acao_orcamentaria;
    }

    async getOneProjetoAtividade(ano: number, dotacao: string): Promise<string> {
        // código é feito juntando o 6º com o 7º campo da dotação
        // const x = '16.10.12.122.3024.2.100.33903500.00';
        // const a = x.split('.');
        // codigo = [a[5], a[6]].join('');
        const codigo = dotacao.split('.').slice(5, 7).join('');

        const r: {
            descricao: string;
        }[] = await this.prisma
            .$queryRaw`select descricao from sof_entidades_linhas where col = 'projetos_atividades' and ano = ${ano}::int and codigo = ${codigo}`;
        if (r.length > 0) return r[0].descricao;
        return `(projeto/atividade ${codigo} não foi encontrado)`;
    }

    async setManyProjetoAtividade(
        srcDestList:
            | { dotacao: string; projeto_atividade: string; ano_referencia: number }[]
            | { parte_dotacao: string; projeto_atividade: string; ano_referencia: number }[]
    ) {
        const byYear: Record<string, Record<string, boolean>> = {};
        for (const r of srcDestList) {
            let codigo: string;
            if ('dotacao' in r && r.dotacao.length >= 35) {
                codigo = r.dotacao.split('.').slice(5, 7).join('');
            } else if ('parte_dotacao' in r && r.parte_dotacao) {
                const split = r.parte_dotacao.split('.');
                const joined = [split[5], split[6]].join('');

                // se ficou com 4 dígitos, então é válido ir buscar
                if (joined.length == 4) {
                    codigo = joined;
                } else {
                    continue;
                }
            } else {
                continue;
            }
            (r as any).__codigo = codigo;

            if (!byYear[r.ano_referencia]) byYear[r.ano_referencia] = {};
            if (!byYear[r.ano_referencia][codigo]) byYear[r.ano_referencia][codigo] = true;
        }

        const results: Record<string, Record<string, string>> = {};

        for (const ano in byYear) {
            const codigos = Object.keys(byYear[ano]);
            const rows: {
                codigo: string;
                descricao: string;
            }[] = await this.prisma
                .$queryRaw`select codigo, descricao from sof_entidades_linhas where col = 'projetos_atividades'
            and ano = ${ano}::int
            and codigo = ANY(${codigos}::varchar[])`;

            if (!results[ano]) results[ano] = {};
            for (const r of rows) {
                results[ano][r.codigo] = r.descricao;
            }
        }

        for (const r of srcDestList) {
            const codigo = (r as any).__codigo as string | undefined;
            if (codigo !== undefined) {
                delete (r as any).__codigo;
                r.projeto_atividade =
                    results[r.ano_referencia] && results[r.ano_referencia][codigo]
                        ? results[r.ano_referencia][codigo]
                        : '';
            } else {
                r.projeto_atividade = '';
            }
        }
    }

    async setManyOrgaoUnidadeFonte(
        srcDestList:
            | { dotacao: string; dotacao_ano_utilizado: string }[]
            | { dotacao: string; plan_dotacao_ano_utilizado: string }[]
    ) {
        const byYearOrgao: Record<string, Record<string, boolean>> = {};
        const byYearUnidade: Record<string, Record<string, boolean>> = {};
        const byYearFonte: Record<string, Record<string, boolean>> = {};
        for (const r of srcDestList) {
            const ano: string =
                'plan_dotacao_ano_utilizado' in r && r.plan_dotacao_ano_utilizado
                    ? r.plan_dotacao_ano_utilizado
                    : (r as any).dotacao_ano_utilizado;
            if (!ano) continue;

            const orgao = r.dotacao.substring(0, 2);
            const unidade = r.dotacao.substring(3, 5);
            const fonte = r.dotacao.substring(33, 35);

            (r as any).__orgao = orgao;
            (r as any).__unidade = unidade;
            (r as any).__fonte = fonte;

            if (!byYearOrgao[ano]) byYearOrgao[ano] = {};
            if (!byYearOrgao[ano][orgao]) byYearOrgao[ano][orgao] = true;

            if (!byYearUnidade[ano]) byYearUnidade[ano] = {};
            if (!byYearUnidade[ano][unidade]) byYearUnidade[ano][unidade] = true;

            if (!byYearFonte[ano]) byYearFonte[ano] = {};
            if (!byYearFonte[ano][fonte]) byYearFonte[ano][fonte] = true;
        }

        const resultsFonte: Record<string, Record<string, string>> = {};
        const resultsOrgao: Record<string, Record<string, string>> = {};
        const resultsUnidade: Record<string, Record<string, string>> = {};

        for (const ano in byYearFonte) {
            const codigos = Object.keys(byYearFonte[ano]);
            const rows: {
                codigo: string;
                descricao: string;
            }[] = await this.prisma
                .$queryRaw`select codigo, descricao from sof_entidades_linhas where col = 'fonte_recursos'
            and ano = ${ano}::int
            and codigo = ANY(${codigos}::varchar[])`;

            if (!resultsFonte[ano]) resultsFonte[ano] = {};
            for (const r of rows) {
                resultsFonte[ano][r.codigo] = r.descricao;
            }
        }

        for (const ano in byYearOrgao) {
            const codigos = Object.keys(byYearOrgao[ano]);
            const rows: {
                codigo: string;
                descricao: string;
            }[] = await this.prisma.$queryRaw`select codigo, descricao from sof_entidades_linhas where col = 'orgaos'
            and ano = ${ano}::int
            and codigo = ANY(${codigos}::varchar[])`;

            if (!resultsOrgao[ano]) resultsOrgao[ano] = {};
            for (const r of rows) {
                resultsOrgao[ano][r.codigo] = r.descricao;
            }
        }

        for (const ano in byYearUnidade) {
            const codigos = Object.keys(byYearUnidade[ano]);
            const rows: {
                codigo: string;
                descricao: string;
                cod_orgao: string;
            }[] = await this.prisma
                .$queryRaw`select codigo, cod_orgao, descricao from sof_entidades_linhas where col = 'unidades'
            and ano = ${ano}::int
            and codigo = ANY(${codigos}::varchar[])`;

            if (!resultsUnidade[ano]) resultsUnidade[ano] = {};
            for (const r of rows) {
                resultsUnidade[ano][r.cod_orgao + '-' + r.codigo] = r.descricao;
            }
        }

        for (let i = 0; i < srcDestList.length; i++) {
            const r = srcDestList[i];

            const ano: string =
                'plan_dotacao_ano_utilizado' in r && r.plan_dotacao_ano_utilizado
                    ? r.plan_dotacao_ano_utilizado
                    : (r as any).dotacao_ano_utilizado;
            if (!ano) continue;

            const orgao = (r as any).__orgao as string | undefined;
            const unidade = (r as any).__unidade as string | undefined;
            const fonte = (r as any).__fonte as string | undefined;
            delete (r as any).__orgao;
            delete (r as any).__unidade;
            delete (r as any).__fonte;

            if (orgao !== undefined && resultsOrgao[ano] && resultsOrgao[ano][orgao]) {
                (r as any).orgao = {
                    codigo: orgao,
                    nome: resultsOrgao[ano] && resultsOrgao[ano][orgao],
                };
            } else {
                (r as any).orgao = {
                    codigo: orgao || '',
                    nome: '',
                };
            }

            if (
                unidade !== undefined &&
                orgao !== undefined &&
                resultsUnidade[ano] &&
                resultsUnidade[ano][orgao + '-' + unidade]
            ) {
                (r as any).unidade = {
                    codigo: unidade,
                    nome: resultsUnidade[ano] && resultsUnidade[ano][orgao + '-' + unidade],
                };
            } else {
                (r as any).unidade = {
                    codigo: unidade || '',
                    nome: '',
                };
            }

            if (fonte !== undefined && resultsFonte[ano] && resultsFonte[ano][fonte]) {
                (r as any).fonte = {
                    codigo: fonte,
                    nome: resultsFonte[ano] && resultsFonte[ano][fonte],
                };
            } else {
                (r as any).fonte = {
                    codigo: fonte || '',
                    nome: '',
                };
            }
        }
    }

    async valorPlanejado(dto: AnoDotacaoDto): Promise<ValorPlanejadoDto> {
        const dotacao = TrataDotacaoGrande(dto.dotacao);

        const dotacaoExistente = await this.prisma.dotacaoPlanejado.findUnique({
            where: {
                ano_referencia_dotacao: {
                    ano_referencia: dto.ano,
                    dotacao: dotacao,
                },
            },
        });

        const mesMaisAtual = this.sof.mesMaisRecenteDoAno(dto.ano, 'planejado');

        if (dotacaoExistente && dotacaoExistente.informacao_valida && dotacaoExistente.mes_utilizado == mesMaisAtual) {
            return {
                val_orcado_atualizado: dotacaoExistente.val_orcado_atualizado.toFixed(2),
                val_orcado_inicial: dotacaoExistente.val_orcado_inicial.toFixed(2),
                saldo_disponivel: dotacaoExistente.saldo_disponivel.toFixed(2),

                id: dotacaoExistente.id,
                informacao_valida: dotacaoExistente.informacao_valida,
                smae_soma_valor_planejado: await this.get_smae_soma_valor_planejado(dto),
                mes_utilizado: dotacaoExistente.mes_utilizado,
                projeto_atividade: await this.getOneProjetoAtividade(dto.ano, dotacao),
            };
        }

        if (dotacaoExistente) await this.prisma.dotacaoPlanejado.delete({ where: { id: dotacaoExistente.id } });

        await this.sincronizarDotacaoPlanejado(dto, mesMaisAtual);

        const dotacaoPlanejado = await this.prisma.dotacaoPlanejado.findFirstOrThrow({
            where: {
                ano_referencia: dto.ano,
                dotacao: dotacao,
            },
        });

        return {
            id: dotacaoPlanejado.id,
            val_orcado_atualizado: dotacaoPlanejado.val_orcado_atualizado.toFixed(2),
            val_orcado_inicial: dotacaoPlanejado.val_orcado_inicial.toFixed(2),
            saldo_disponivel: dotacaoPlanejado.saldo_disponivel.toFixed(2),
            informacao_valida: dotacaoPlanejado.informacao_valida,
            smae_soma_valor_planejado: await this.get_smae_soma_valor_planejado({ ...dto, dotacao: dotacao }),
            mes_utilizado: dotacaoPlanejado.mes_utilizado,
            projeto_atividade: await this.getOneProjetoAtividade(dto.ano, dotacao),
        };
    }

    async get_smae_soma_valor_planejado(dto: AnoDotacaoDto): Promise<string> {
        if (dto.dotacao.length > 35)
            throw new BadRequestException('Método get_smae_soma_valor_planejado espera dotação curta!');

        let valor = '0.00';
        if (dto.pdm_id) {
            const qr = await this.prisma.pdmDotacaoPlanejado.findUnique({
                where: {
                    pdm_id_ano_referencia_dotacao: {
                        ano_referencia: dto.ano,
                        dotacao: dto.dotacao,
                        pdm_id: dto.pdm_id,
                    },
                },
                select: { soma_valor_planejado: true },
            });
            if (qr) valor = qr.soma_valor_planejado.toFixed(2);
        } else if (dto.portfolio_id) {
            const qr = await this.prisma.portfolioDotacaoPlanejado.findUnique({
                where: {
                    portfolio_id_ano_referencia_dotacao: {
                        ano_referencia: dto.ano,
                        dotacao: dto.dotacao,
                        portfolio_id: dto.portfolio_id,
                    },
                },
                select: { soma_valor_planejado: true },
            });
            if (qr) valor = qr.soma_valor_planejado.toFixed(2);
        }

        return valor;
    }

    async valorRealizadoDotacao(dto: AnoDotacaoDto): Promise<ValorRealizadoDotacaoDto[]> {
        const mesMaisAtual = this.sof.mesMaisRecenteDoAno(dto.ano, 'realizado');

        const dotacao = TrataDotacaoGrande(dto.dotacao);

        // desativando temporariamente o cache da busca do empenho, apos a alteração que faz a busca + soma
        //        const dotacaoRealizadoExistente = await this.prisma.dotacaoRealizado.findUnique({
        //            where: {
        //                ano_referencia_dotacao: {
        //                    ano_referencia: dto.ano,
        //                    dotacao: dto.dotacao,
        //                },
        //            },
        //        });
        //
        //
        //        if (
        //            dotacaoRealizadoExistente &&
        //            dotacaoRealizadoExistente.informacao_valida &&
        //            dotacaoRealizadoExistente.mes_utilizado == mesMaisAtual
        //        ) {
        //            return [await this.renderDotacaoRealizado(dotacaoRealizadoExistente, dto)];
        //        }

        await this.sincronizarDotacaoRealizado({ ...dto, dotacao: dotacao }, mesMaisAtual);

        const dotacaoRealizado = await this.prisma.dotacaoRealizado.findUniqueOrThrow({
            where: {
                ano_referencia_dotacao: {
                    ano_referencia: dto.ano,
                    dotacao: dotacao,
                },
            },
        });

        return [await this.renderDotacaoRealizado(dotacaoRealizado, { ...dto, dotacao: dotacao })];
    }

    private async renderDotacaoRealizado(
        dotacao: DotacaoRealizado,
        dto: AnoDotacaoDto
    ): Promise<ValorRealizadoDotacaoDto> {
        return {
            id: dotacao.id,
            dotacao: dotacao.dotacao,
            informacao_valida: dotacao.informacao_valida,
            empenho_liquido: dotacao.empenho_liquido.toFixed(2),
            valor_liquidado: dotacao.valor_liquidado.toFixed(2),
            mes_utilizado: dotacao.mes_utilizado,

            ...(await this.get_smae_soma_valor_realizado(dto)),

            projeto_atividade: await this.getOneProjetoAtividade(dotacao.ano_referencia, dotacao.dotacao),
        };
    }

    async get_smae_soma_valor_realizado(dto: AnoDotacaoDto): Promise<{
        smae_soma_valor_empenho: string;
        smae_soma_valor_liquidado: string;
    }> {
        if (dto.dotacao.length > 35)
            throw new BadRequestException('Método get_smae_soma_valor_realizado espera dotação curta!');

        let smae_soma_valor_empenho = '0.00';
        let smae_soma_valor_liquidado = '0.00';

        if (dto.pdm_id) {
            const qr = await this.prisma.pdmDotacaoRealizado.findUnique({
                where: {
                    pdm_id_ano_referencia_dotacao: {
                        ano_referencia: dto.ano,
                        dotacao: dto.dotacao,
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
            const qr = await this.prisma.portfolioDotacaoRealizado.findUnique({
                where: {
                    portfolio_id_ano_referencia_dotacao: {
                        ano_referencia: dto.ano,
                        dotacao: dto.dotacao,
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

    async sincronizarDotacaoRealizado(dto: AnoDotacaoDto, mes: number) {
        if (dto.dotacao.length > 35)
            throw new BadRequestException('Método sincronizarDotacaoRealizado espera dotação curta!');

        const now = new Date(Date.now());
        try {
            const r = await this.sof.empenhoDotacao({
                dotacao: dto.dotacao,
                ano: dto.ano,
                mes: mes,
            });

            for (const dotacao of r.data) {
                await this.prisma.$transaction(
                    async (prisma: Prisma.TransactionClient) => {
                        const jaExiste = await prisma.dotacaoRealizado.findUnique({
                            where: {
                                ano_referencia_dotacao: {
                                    ano_referencia: dto.ano,
                                    dotacao: dto.dotacao,
                                },
                            },
                        });

                        // se ja existe, atualiza caso estiver com dados inválidos, ou se o valor for diferente no empenho_liquido
                        if (
                            jaExiste &&
                            (jaExiste.informacao_valida == false ||
                                jaExiste.valor_liquidado.toFixed(2) != dotacao.val_liquidado.toFixed(2) ||
                                jaExiste.empenho_liquido.toFixed(2) != dotacao.empenho_liquido.toFixed(2) ||
                                jaExiste.mes_utilizado != mes)
                        ) {
                            await prisma.dotacaoRealizado.update({
                                where: {
                                    id: jaExiste.id,
                                },
                                data: {
                                    informacao_valida: true,
                                    sincronizado_em: now,
                                    mes_utilizado: mes,
                                    empenho_liquido: dotacao.empenho_liquido,
                                    valor_liquidado: dotacao.val_liquidado,
                                },
                            });
                        } else if (jaExiste) {
                            // já existe, mas tava tudo igual, ainda precisa atualizar o sincronizado_em
                            // pro crontab n ficar em loop
                            await prisma.dotacaoRealizado.update({
                                where: { id: jaExiste.id },
                                data: { sincronizado_em: now },
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
                                },
                                select: { id: true },
                            });
                        }
                    },
                    {
                        isolationLevel: 'Serializable',
                        maxWait: 15000,
                        timeout: 60000,
                    }
                );
            }
        } catch (error) {
            if (error instanceof SofError) {
                throw new HttpException(
                    'No momento, o serviço SOF está indisponível, e não é possível criar uma dotação de realizado manualmente nesta versão do SMAE.\n\nTente novamente mais tarde',
                    400
                );
            }

            throw error;
        }
    }

    async sincronizarDotacaoPlanejado(dto: AnoDotacaoDto, mes: number) {
        if (dto.dotacao.length > 35)
            throw new BadRequestException('Método sincronizarDotacaoPlanejado espera dotação curta!');

        const now = new Date(Date.now());
        try {
            const r = await this.sof.orcadoDotacao({
                ano: dto.ano,
                mes: mes,
                dotacao: dto.dotacao,
            });

            // na teoria só volta 1 item
            for (const dotacao of r.data) {
                await this.prisma.$transaction(
                    async (prisma: Prisma.TransactionClient) => {
                        const jaExiste = await prisma.dotacaoPlanejado.findUnique({
                            where: {
                                ano_referencia_dotacao: {
                                    ano_referencia: dto.ano,
                                    dotacao: dto.dotacao,
                                },
                            },
                        });

                        // se ja existe, atualiza caso estiver com dados inválidos, ou se o valor for diferente no empenho_liquido
                        if (
                            jaExiste &&
                            (jaExiste.informacao_valida == false ||
                                jaExiste.val_orcado_atualizado.toFixed(2) != dotacao.val_orcado_atualizado.toFixed(2) ||
                                jaExiste.val_orcado_inicial.toFixed(2) != dotacao.val_orcado_inicial.toFixed(2))
                        ) {
                            await prisma.dotacaoPlanejado.update({
                                where: {
                                    id: jaExiste.id,
                                },
                                data: {
                                    informacao_valida: true,
                                    sincronizado_em: now,
                                    val_orcado_atualizado: dotacao.val_orcado_atualizado,
                                    val_orcado_inicial: dotacao.val_orcado_inicial,
                                    saldo_disponivel: dotacao.saldo_disponivel,
                                },
                            });
                        } else if (jaExiste) {
                            // já existe, mas tava tudo igual, ainda precisa atualizar o sincronizado_em
                            // pro crontab n ficar em loop
                            await prisma.dotacaoPlanejado.update({
                                where: { id: jaExiste.id },
                                data: { sincronizado_em: now },
                            });
                        }

                        if (!jaExiste) {
                            await prisma.dotacaoPlanejado.create({
                                data: {
                                    informacao_valida: true,
                                    sincronizado_em: now,
                                    val_orcado_atualizado: dotacao.val_orcado_atualizado,
                                    val_orcado_inicial: dotacao.val_orcado_inicial,
                                    saldo_disponivel: dotacao.saldo_disponivel,
                                    mes_utilizado: mes,
                                    ano_referencia: dto.ano,
                                    dotacao: dto.dotacao,
                                },
                                select: { id: true },
                            });
                        }
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
                    'No momento, o serviço SOF está indisponível, e não é possível criar uma Dotação de Planejamento manualmente nesta versão do SMAE.\n\nTente novamente mais tarde',
                    400
                );

            throw error;
        }
    }
}
