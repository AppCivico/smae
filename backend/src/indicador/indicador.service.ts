import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateIndicadorDto, FormulaVariaveis } from './dto/create-indicador.dto';
import { FilterIndicadorDto } from './dto/filter-indicador.dto';
import { UpdateIndicadorDto } from './dto/update-indicador.dto';
// @ts-ignore
import * as FP from "../../js/formula_parser.js";

@Injectable()
export class IndicadorService {

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

        for (const neededRef of Object.values(neededRefs)) {
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
                indicador_formula_variavel: {
                    select: {
                        referencia: true,
                        variavel_id: true,
                        janela: true
                    }
                },
                formula: true,
                calcular_acumulado: true
            }
        });

        return listActive;
    }

    async update(id: number, updateIndicadorDto: UpdateIndicadorDto, user: PessoaFromJwt) {
        let indicador = await this.prisma.indicador.findFirst({
            where: { id: id },
            select: {
                formula_compilada: true
            }
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
        } else if (!formula && formula_variaveis) {
            throw new HttpException(`É necessário enviar o parâmetro formula quando enviar formula_variaveis`, 400);
        }

        let formula_compilada: string = await this.#validateVariaveis(formula_variaveis, id, formula);
        console.log({ formula_variaveis });

        await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {

            const indicador = await prisma.indicador.update({
                where: { id: id },
                data: {
                    atualizado_por: user.id,
                    atualizado_em: new Date(Date.now()),
                    ...updateIndicadorDto,
                    formula_compilada: formula_compilada,

                    calcular_acumulado: updateIndicadorDto.calcular_acumulado === null ? undefined : updateIndicadorDto.calcular_acumulado,
                },
                select: { id: true }
            });

            if (formula_variaveis) {
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

            if (formula_compilada != antigaFormulaCompilada) {
                // TODO recalcular tudo
            }

            return indicador;
        });

        return { id };
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
}
