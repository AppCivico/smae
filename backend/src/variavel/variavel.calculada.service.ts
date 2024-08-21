import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { Prisma, Variavel } from '@prisma/client';

import { CrontabIsEnabled } from '../common/CrontabIsEnabled';
import { LoggerWithLog } from '../common/LoggerWithLog';
import { PrismaService } from '../prisma/prisma.service';
import { CONST_BOT_USER_ID } from '../common/consts';

@Injectable()
export class VariavelCalculadaService {
    private enabled: boolean;
    constructor(private readonly prisma: PrismaService) {
        this.enabled = false;
    }

    async onModuleInit() {
        if (CrontabIsEnabled('variavel_calculada')) {
            // Verifica se o bot existe para habilitar o serviço
            const botUser = await this.prisma.pessoa.findUnique({
                where: { id: CONST_BOT_USER_ID },
                select: { id: true },
            });
            this.enabled = !!botUser;
        }
    }

    @Interval(1000)
    async variavelCalcCrontab() {
        if (!this.enabled) return;

        process.env.INTERNAL_DISABLE_QUERY_LOG = '1';
        const rows = await this.prisma.formulaComposta.findMany({
            where: {
                removido_em: null,
                OR: [{ atualizar_calc: true }, { variavel_calc_id: null }],
                criar_variavel: true,
                variavel_calc_erro: null,
            },
            select: {
                id: true,
                titulo: true,
                calc_casas_decimais: true,
                calc_fim_medicao: true,
                calc_inicio_medicao: true,
                calc_periodicidade: true,
                calc_regionalizavel: true,
                calc_codigo: true,
                calc_orgao_id: true,
                autogerenciavel: true,
                calc_unidade_medida_id: true,
                variavel_calc_id: true,
                FormulaCompostaVariavel: {
                    select: {
                        variavel: true,
                    },
                },
            },
        });
        process.env.INTERNAL_DISABLE_QUERY_LOG = '';

        for (const fc of rows) {
            const logger = LoggerWithLog('VariavelCalculadaService');

            logger.log(`Criando/Atualizando variável calculada para formula composta ${fc.titulo}`);

            const autogerenciavel = fc.autogerenciavel;
            const variaveis = fc.FormulaCompostaVariavel.map((v) => v.variavel);
            console.log(variaveis);
            const getUniqueValues = <K extends keyof Variavel>(key: K) => [...new Set(variaveis.map((v) => v[key]))];

            const uniqueChecks: {
                key: keyof Variavel;
                label: string;
            }[] = [
                { key: 'atraso_meses', label: 'Atraso Meses' },
                { key: 'acumulativa', label: 'Acumulativa' },
                { key: 'descricao', label: 'Descrição' },
                { key: 'metodologia', label: 'Metodologia' },
                { key: 'periodicidade', label: 'Periodicidade' },
                { key: 'unidade_medida_id', label: 'Unidade de Medida' },
            ];

            let orgaoIds = getUniqueValues('orgao_id');
            const inicioMedicao = variaveis.map((v) => v.inicio_medicao);
            const fimMedicao = variaveis.map((v) => v.fim_medicao);
            let inicioMedicaoMinDate = inicioMedicao.includes(null)
                ? null
                : new Date(Math.min(...(inicioMedicao as any)));
            const fimMedicaoMax = Math.max(...(fimMedicao.filter((date) => date !== null) as any));
            let fimMedicaoMaxDate = isNaN(fimMedicaoMax) ? null : new Date(fimMedicaoMax);
            let codigo: string;
            let titulo: string;
            let erro: string | undefined = undefined;
            if (autogerenciavel) {
                titulo = getUniqueValues('titulo')[0];
                erro = uniqueChecks.find((check) => getUniqueValues(check.key).length !== 1)?.label;
                if (!erro) {
                    if (orgaoIds.length !== 1) erro = 'Deve ter apenas Órgão: ' + orgaoIds.join(', ');
                    if (inicioMedicaoMinDate === null) erro = 'Nenhum Início de Medição pode ser nulo';
                    if (!inicioMedicaoMinDate) erro = 'Faltando início de Medição';
                }
                codigo = 'CALC.' + fc.titulo;
                const exists = await this.prisma.variavel.findFirst({
                    where: { codigo, removido_em: null, tipo: 'Calculada' },
                });
                if (exists) erro = `Variável com código ${codigo} já existente`;
            } else {
                if (!fc.calc_codigo) erro = 'Código da variável calculada não informado';
                if (!fc.calc_orgao_id) erro = 'Órgão da variável calculada não informado';
                if (!fc.calc_inicio_medicao) erro = 'Início de Medição da variável calculada não informado';
                if (!fc.calc_fim_medicao) erro = 'Fim de Medição da variável calculada não informado';
                if (!fc.calc_unidade_medida_id) erro = 'Unidade de Medida da variável calculada não informado';
                titulo = 'Calculada ' + fc.titulo;

                if (!erro) {
                    codigo = fc.calc_codigo!;
                    orgaoIds = [fc.calc_orgao_id!];
                    inicioMedicaoMinDate = fc.calc_inicio_medicao;
                    fimMedicaoMaxDate = fc.calc_fim_medicao;
                }
            }

            if (erro) {
                await this.prisma.formulaComposta.update({
                    where: { id: fc.id },
                    data: {
                        variavel_calc_erro: `Campo com erro, mais de um valor entre as variaveis da formula ou valores faltando em: ${erro}`,
                    },
                });
                logger.error(`Erro ao criar variável calculada para formula composta ${fc.titulo}: ${erro}`);
                logger.saveLogs(this.prisma, { pessoa_id: CONST_BOT_USER_ID });
                continue;
            }

            try {
                const orgao_prop = getUniqueValues('orgao_proprietario_id');
                const dado_aberto = getUniqueValues('dado_aberto');
                const fonte_id = getUniqueValues('fonte_id');
                const unidade_medida_id = fc.calc_unidade_medida_id ?? getUniqueValues('unidade_medida_id')[0];
                if (!unidade_medida_id) throw new Error('Unidade de Medida não informada');

                await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient): Promise<void> => {
                    let variavelId: number;

                    const data = {
                        titulo: titulo,
                        codigo: codigo,
                        criado_em: new Date(),
                        tipo: 'Calculada',
                        casas_decimais: fc.calc_casas_decimais ?? Math.max(...getUniqueValues('casas_decimais')),
                        atraso_meses: 1,
                        ano_base: null,
                        valor_base: 0,
                        acumulativa: getUniqueValues('acumulativa')[0],
                        descricao: getUniqueValues('descricao')[0],
                        metodologia: getUniqueValues('metodologia')[0],
                        periodicidade: fc.calc_periodicidade ?? getUniqueValues('periodicidade')[0],
                        unidade_medida_id: unidade_medida_id,
                        fonte_id: fonte_id.length === 1 && fonte_id[0] ? fonte_id[0] : null,
                        orgao_proprietario_id: orgao_prop.length === 1 && orgao_prop[0] ? orgao_prop[0] : null,
                        dado_aberto: dado_aberto.find((v) => v == false) ? false : true,
                        orgao_id: orgaoIds[0],
                        inicio_medicao: inicioMedicaoMinDate,
                        fim_medicao: fimMedicaoMaxDate,
                        criado_por: CONST_BOT_USER_ID,
                        //: fc.calc_regionalizavel ?? getUniqueValues('regionalizavel')[0],
                    } satisfies Prisma.VariavelCreateManyInput;

                    if (fc.variavel_calc_id) {
                        variavelId = fc.variavel_calc_id;
                        await prismaTx.variavel.update({
                            where: { id: variavelId },
                            data: data,
                        });
                    } else {
                        const variavel = await prismaTx.variavel.create({
                            data: data,
                            select: { id: true },
                        });
                        variavelId = variavel.id;
                    }

                    await prismaTx.formulaComposta.update({
                        where: { id: fc.id },
                        data: {
                            variavel_calc_id: variavelId,
                            variavel_calc_erro: null,
                            atualizar_calc: false,
                        },
                    });

                    // a trigger da formula-composta chama o refresh_variavel
                });
            } catch (error) {
                logger.error(`Erro ao criar variável calculada para formula composta ${fc.titulo}: ${error}`);

                await this.prisma.formulaComposta.update({
                    where: { id: fc.id },
                    data: {
                        variavel_calc_erro: `Erro ao criar variável calculada: ${error.message}`,
                    },
                });
            } finally {
                logger.saveLogs(this.prisma, { pessoa_id: CONST_BOT_USER_ID });
            }
        }
    }
}
