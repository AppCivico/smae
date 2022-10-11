import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateIndicadorDto, FormulaVariaveis } from './dto/create-indicador.dto';
import { FilterIndicadorDto } from './dto/filter-indicador.dto';
import { UpdateIndicadorDto } from './dto/update-indicador.dto';

@Injectable()
export class IndicadorService {

    constructor(private readonly prisma: PrismaService) { }

    async create(createIndicadorDto: CreateIndicadorDto, user: PessoaFromJwt) {
        console.log({ createIndicadorDto });
        if (!createIndicadorDto.meta_id && !createIndicadorDto.iniciativa_id && !createIndicadorDto.atividade_id)
            throw new HttpException('relacionamento| Indicador deve ter no mínimo 1 relacionamento: Meta, Iniciativa ou Atividade', 400);

        const formula_variaveis = createIndicadorDto.formula_variaveis;
        delete createIndicadorDto.formula_variaveis;
        this.#validateVariaveis(formula_variaveis);

        const created = await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {
            const indicador = await prisma.indicador.create({
                data: {
                    criado_por: user.id,
                    criado_em: new Date(Date.now()),
                    ...createIndicadorDto,
                    calcular_acumulado: createIndicadorDto.calcular_acumulado === null ? undefined : createIndicadorDto.calcular_acumulado,
                },
                select: { id: true }
            });

            if (formula_variaveis && formula_variaveis.length > 0) {
                await this.prisma.indicadorFormulaVariavel.createMany({
                    data: formula_variaveis.map((fv) => {
                        return {
                            indicador_id: indicador.id,
                            janela: fv.janela,
                            variavel_id: fv.variavel_id,
                            referencia: fv.referencia,
                        }
                    })
                });
            }

            return indicador;
        });

        return created;
    }

    #validateVariaveis(formula_variaveis: FormulaVariaveis[] | null | undefined) {
        let uniqueRef: Record<string, boolean> = {};

        if (formula_variaveis && formula_variaveis.length > 0) {
            for (const fv of formula_variaveis) {
                if (!uniqueRef[fv.referencia]) {
                    uniqueRef[fv.referencia] = true;
                } else {
                    throw new HttpException(`referencia| ${fv.referencia} duplicada, utilize apenas uma vez!`, 400);
                }
            }
        }
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
        console.log({ updateIndicadorDto });

        const formula_variaveis = updateIndicadorDto.formula_variaveis;
        delete updateIndicadorDto.formula_variaveis;
        this.#validateVariaveis(formula_variaveis);
        console.log({ formula_variaveis });

        await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {

            const indicador = await prisma.indicador.update({
                where: { id: id },
                data: {
                    atualizado_por: user.id,
                    atualizado_em: new Date(Date.now()),
                    ...updateIndicadorDto,

                    calcular_acumulado: updateIndicadorDto.calcular_acumulado === null ? undefined : updateIndicadorDto.calcular_acumulado,
                },
                select: { id: true }
            });

            if (formula_variaveis) {
                await this.prisma.indicadorFormulaVariavel.deleteMany({
                    where: { indicador_id: indicador.id }
                })
                await this.prisma.indicadorFormulaVariavel.createMany({
                    data: formula_variaveis.map((fv) => {
                        return {
                            indicador_id: indicador.id,
                            janela: fv.janela,
                            variavel_id: fv.variavel_id,
                            referencia: fv.referencia,
                        }
                    })
                });
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
