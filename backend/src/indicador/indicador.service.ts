import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Periodicidade, Prisma } from '@prisma/client';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateIndicadorDto, FormulaVariaveis } from './dto/create-indicador.dto';
import { FilterIndicadorDto } from './dto/filter-indicador.dto';
import { UpdateIndicadorDto } from './dto/update-indicador.dto';
// @ts-ignore
import * as FP from "../../public/js/formula_parser.js";
import { SerieIndicadorDto } from 'src/indicador/dto/serie-indicador.dto';
import e from 'express';
import { Date2YMD } from 'src/common/date2ymd';

@Injectable()
export class IndicadorService {
    private readonly logger = new Logger(IndicadorService.name);

    constructor(private readonly prisma: PrismaService) { }

    async create(createIndicadorDto: CreateIndicadorDto, user: PessoaFromJwt) {
        console.log({ createIndicadorDto });
        if (!createIndicadorDto.meta_id && !createIndicadorDto.iniciativa_id && !createIndicadorDto.atividade_id)
            throw new HttpException('relacionamento| Indicador deve ter no mínimo 1 relacionamento: Meta, Iniciativa ou Atividade', 400);


        const created = await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {
            const indicador = await prisma.indicador.create({
                data: {
                    criado_por: user.id,
                    criado_em: new Date(Date.now()),
                    ...createIndicadorDto,
                },
                select: { id: true }
            });

            return indicador;
        });

        return created;
    }

    async #validateVariaveis(formula_variaveis: FormulaVariaveis[] | null | undefined, indicador_id: number, formula: string): Promise<string> {
        let formula_compilada = '';
        let neededRefs: Record<string, number> = {};
        if (formula) {
            try {
                formula_compilada = FP.parse(formula.toLocaleUpperCase());
            } catch (error) {
                throw new HttpException(`formula| formula não foi entendida: ${formula}\n${error}`, 400);
            }

            for (const match of formula_compilada.matchAll(/\$[A-Z]+\b/g)) {
                let referencia = match[0].replace('$', '');
                if (!neededRefs[referencia]) neededRefs[referencia] = 0;
                neededRefs[referencia]++;
            }
        }

        let uniqueRef: Record<string, boolean> = {};
        let variables: number[] = [];

        if (formula_variaveis && formula_variaveis.length > 0) {
            for (const fv of formula_variaveis) {
                if (!uniqueRef[fv.referencia]) {
                    uniqueRef[fv.referencia] = true;
                } else {
                    throw new HttpException(`formula_variaveis| ${fv.referencia} duplicada, utilize apenas uma vez!`, 400);
                }

                if (variables.includes(fv.variavel_id) == false)
                    variables.push(+fv.variavel_id)
            }

            const count = await this.prisma.indicadorVariavel.count({
                where: {
                    desativado: false,
                    indicador_id: indicador_id,
                    variavel_id: {
                        in: variables
                    }
                }
            });

            if (count !== variables.length) {

                const found = await this.prisma.indicadorVariavel.findMany({
                    where: {
                        indicador_id: indicador_id,
                        desativado: false
                    },
                    select: { variavel_id: true }
                });

                throw new HttpException(`formula_variaveis| Uma ou mais variável enviada não faz parte do indicador. Enviadas: ${JSON.stringify(variables)}, Existentes: ${JSON.stringify(found.map(e => e.variavel_id))}`, 400);
            }
        }

        for (const neededRef of Object.keys(neededRefs)) {
            if (!uniqueRef[neededRef]) {
                throw new HttpException(`formula_variaveis| Referencia ${neededRef} enviada na formula não foi declarada nas variáveis.`, 400);
            }
        }

        return formula_compilada;
    }

    async findAll(filters: FilterIndicadorDto | undefined = undefined) {
        let listActive = await this.prisma.indicador.findMany({
            where: {
                removido_em: null,
                id: filters?.id,
                meta_id: filters?.meta_id,
                iniciativa_id: filters?.iniciativa_id,
                atividade_id: filters?.atividade_id,
            },
            select: {
                id: true,
                titulo: true,
                codigo: true,
                polaridade: true,
                periodicidade: true,
                regionalizavel: true,
                nivel_regionalizacao: true,
                inicio_medicao: true,
                fim_medicao: true,
                meta_id: true,
                iniciativa_id: true,
                atividade_id: true,
                contexto: true,
                complemento: true,
                formula_variaveis: {
                    select: {
                        referencia: true,
                        variavel_id: true,
                        janela: true,
                        usar_serie_acumulada: true,
                    }
                },
                formula: true,
                acumulado_usa_formula: true
            }
        });

        return listActive;
    }

    async update(id: number, updateIndicadorDto: UpdateIndicadorDto, user: PessoaFromJwt) {
        const indicadorSelectData = {
            id: true,
            formula_compilada: true,
            inicio_medicao: true,
            fim_medicao: true,
            acumulado_usa_formula: true,
            periodicidade: true,
            formula_variaveis: {
                select: {
                    variavel_id: true,
                    janela: true,
                    referencia: true,
                    usar_serie_acumulada: true
                }
            }
        };
        let indicador = await this.prisma.indicador.findFirst({
            where: { id: id },
            select: indicadorSelectData
        });
        if (!indicador) throw new HttpException('indicador não encontrado', 400);

        console.log('updateIndicadorDto', updateIndicadorDto);

        const formula_variaveis = updateIndicadorDto.formula_variaveis;
        delete updateIndicadorDto.formula_variaveis;
        let formula: string = updateIndicadorDto.formula ? updateIndicadorDto.formula : '';
        let antigaFormulaCompilada = indicador.formula_compilada || '';
        if (updateIndicadorDto.formula_variaveis && !updateIndicadorDto.formula) {
            formula = antigaFormulaCompilada;
        }

        if (formula && !formula_variaveis) {
            throw new HttpException(`É necessário enviar o parâmetro formula_variaveis quando enviar formula`, 400);
        } else if (!formula && formula_variaveis && formula_variaveis.length > 0) {
            throw new HttpException(`É necessário enviar o parâmetro formula quando enviar formula_variaveis`, 400);
        }

        let formula_compilada: string = await this.#validateVariaveis(formula_variaveis, id, formula);
        console.log({ formula_variaveis });

        const oldVersion = IndicadorService.getIndicadorHash(indicador);

        await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {

            const indicador = await prisma.indicador.update({
                where: { id: id },
                data: {
                    atualizado_por: user.id,
                    atualizado_em: new Date(Date.now()),
                    ...updateIndicadorDto as any, // hack pra enganar o TS que quer validar o campo que já apagamos (formula_variaveis)
                    formula_compilada: formula_compilada,
                    acumulado_usa_formula: updateIndicadorDto.acumulado_usa_formula === null ? undefined : updateIndicadorDto.acumulado_usa_formula,
                },
                select: indicadorSelectData
            });

            const newVersion = IndicadorService.getIndicadorHash(indicador);

            if (formula_variaveis && !(oldVersion === newVersion)) {
                await prisma.indicadorFormulaVariavel.deleteMany({
                    where: { indicador_id: indicador.id }
                })
                await prisma.indicadorFormulaVariavel.createMany({
                    data: formula_variaveis.map((fv) => {
                        return {
                            indicador_id: indicador.id,
                            janela: fv.janela === 0 ? 1 : fv.janela,
                            variavel_id: fv.variavel_id,
                            referencia: fv.referencia,
                        }
                    })
                });
            }

            if (!(oldVersion === newVersion)) {
                this.logger.log(`Indicador mudou, recalculando tudo... ${oldVersion} => ${newVersion}`)
                await prisma.$queryRaw`select monta_serie_indicador(${indicador.id}::int, null, null, null)`;
            }

            return indicador;
        });

        return { id };
    }

    static getIndicadorHash(
        indicador: {
            formula_variaveis: {
                variavel_id: number;
                referencia: string;
                janela: number;
                usar_serie_acumulada: boolean;
            }[];
            formula_compilada: string | null;
            acumulado_usa_formula: boolean;
            periodicidade: Periodicidade;
            inicio_medicao: Date;
            fim_medicao: Date;
        }): string {

        let str = [
            indicador.formula_compilada || '(null)',
            Date2YMD.toString(indicador.inicio_medicao),
            Date2YMD.toString(indicador.fim_medicao),
            indicador.periodicidade,
            indicador.acumulado_usa_formula,
            indicador.formula_variaveis.length,
        ].join(',');
        indicador.formula_variaveis.sort((a, b) => ('' + a.referencia).localeCompare(b.referencia));
        for (const fv of indicador.formula_variaveis) {
            str += [fv.referencia, fv.janela, fv.variavel_id, fv.usar_serie_acumulada].join(',')
        }
        return str;
    }

    async remove(id: number, user: PessoaFromJwt) {
        const created = await this.prisma.indicador.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            }
        });

        return created;
    }

    async getSeriesIndicador(id: number, user: PessoaFromJwt): Promise<SerieIndicadorDto[]> {
        const created = await this.prisma.serieIndicador.findMany({
            where: { indicador_id: +id },
            select: {
                serie: true,
                data_valor: true,
                regiao_id: true,
                valor_nominal: true
            },
            orderBy: [
                { serie: 'asc' },
                { data_valor: 'asc' },
            ]
        });

        return created.map((r) => {
            return {
                ...r,
                data_valor: Date2YMD.toString(r.data_valor),
            }
        });
    }

}
