import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { Prisma, Variavel } from '@prisma/client';
import { CrontabIsEnabled } from '../common/CrontabIsEnabled';
import { LoggerWithLog } from '../common/LoggerWithLog';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VariavelCalculadaService {
    private enabled: boolean;
    constructor(private readonly prisma: PrismaService) {
        this.enabled = CrontabIsEnabled('variavel_calculada');
    }

    @Interval(1000)
    async variavelCalcCrontab() {
        if (!this.enabled) return;
        const botUser = await this.prisma.pessoa.findUnique({
            where: { id: -1 },
            select: { id: true },
        });
        if (!botUser) return;

        const rows = await this.prisma.formulaComposta.findMany({
            where: {
                //id: 189,
                removido_em: null,
                variavel_calc_id: null,
                criar_variavel: true,
                variavel_calc_erro: null,
            },
            select: {
                id: true,
                titulo: true,
                FormulaCompostaVariavel: {
                    select: {
                        variavel: true,
                    },
                },
            },
        });

        for (const fc of rows) {
            const logger = LoggerWithLog('VariavelCalculadaService');

            logger.log(`Criando variável calculada para formula composta ${fc.titulo}`);

            const variaveis = fc.FormulaCompostaVariavel.map((v) => v.variavel);
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

            const orgaoIds = getUniqueValues('orgao_id');
            const inicioMedicao = variaveis.map((v) => v.inicio_medicao);
            const fimMedicao = variaveis.map((v) => v.fim_medicao);
            const inicioMedicaoMin = inicioMedicao.includes(null)
                ? null
                : new Date(Math.min(...(inicioMedicao as any)));
            const fimMedicaoMax = fimMedicao.includes(null) ? null : new Date(Math.max(...(fimMedicao as any)));

            let erro = uniqueChecks.find((check) => getUniqueValues(check.key).length !== 1)?.label;
            if (!erro) {
                if (orgaoIds.length !== 1) erro = 'Deve ter apenas Órgão: ' + orgaoIds.join(', ');
                if (inicioMedicaoMin === null) erro = 'Início de Medição não pode ser nulo';
                if (!inicioMedicaoMin) erro = 'Faltando início de Medição';
            }
            const codigo = 'CALC.' + fc.titulo;
            const exists = await this.prisma.variavel.findFirst({
                where: { codigo, removido_em: null, tipo: 'Calculada' },
            });
            if (exists) erro = `Variável com código ${codigo} já existente`;

            if (erro) {
                await this.prisma.formulaComposta.update({
                    where: { id: fc.id },
                    data: {
                        variavel_calc_erro: `Campo com erro, mais de um valor entre as variaveis da formula ou valores faltando em: ${erro}`,
                    },
                });
                logger.error(`Erro ao criar variável calculada para formula composta ${fc.titulo}: ${erro}`);
                logger.saveLogs(this.prisma, { pessoa_id: botUser.id });
                continue;
            }

            try {
                const orgao_prop = getUniqueValues('orgao_proprietario_id');
                const dado_aberto = getUniqueValues('dado_aberto');
                const fonte_id = getUniqueValues('fonte_id');

                await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient): Promise<void> => {
                    const variavel = await prismaTx.variavel.create({
                        data: {
                            titulo: codigo,
                            codigo: codigo,
                            criado_em: new Date(),
                            tipo: 'Calculada',
                            casas_decimais: Math.max(...getUniqueValues('casas_decimais')),
                            atraso_meses: 1,
                            ano_base: null,
                            valor_base: 0,
                            acumulativa: getUniqueValues('acumulativa')[0],
                            descricao: getUniqueValues('descricao')[0],
                            metodologia: getUniqueValues('metodologia')[0],
                            periodicidade: getUniqueValues('periodicidade')[0],
                            unidade_medida_id: getUniqueValues('unidade_medida_id')[0],
                            fonte_id: fonte_id.length === 1 ? fonte_id[0] : null,
                            orgao_proprietario_id: orgao_prop.length === 1 ? orgao_prop[0] : null,
                            dado_aberto: dado_aberto.find((v) => v == false) ? false : true,
                            orgao_id: getUniqueValues('orgao_id')[0],
                            inicio_medicao: inicioMedicaoMin,
                            fim_medicao: fimMedicaoMax,
                            criado_por: botUser.id,
                        },
                    });

                    await prismaTx.formulaComposta.update({
                        where: { id: fc.id },
                        data: {
                            variavel_calc_id: variavel.id,
                            variavel_calc_erro: null,
                        },
                    });

                    // a trigger da formula-composta chama o refresh_variavel
                });
            } catch (error) {
                logger.error(`Erro ao criar variável calculada para formula composta ${fc.titulo}: ${error}`);
                throw error;
            } finally {
                logger.saveLogs(this.prisma, { pessoa_id: botUser.id });
            }
        }
    }
}
