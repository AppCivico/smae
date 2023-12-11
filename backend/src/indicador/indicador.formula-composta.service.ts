import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { BatchRecordWithId, RecordWithId } from '../common/dto/record-with-id.dto';
import { PrismaService } from '../prisma/prisma.service';
import {
    CreateIndicadorFormulaCompostaDto,
    FilterFormulaCompostaFormDto,
    FilterFormulaCompostaReturnDto,
    GeneratorFormulaCompostaFormDto,
    OperacaoPadraoDto,
    OperacaoSuportadaOrdem,
    UpdateIndicadorFormulaCompostaDto,
} from './dto/create-indicador.formula-composta.dto';
import {
    GeneratorFormulaCompostaReturnDto,
    IndicadorFormulaCompostaDto,
} from './entities/indicador.formula-composta.entity';
import { IndicadorService } from './indicador.service';
import { Indicador } from './entities/indicador.entity';

@Injectable()
export class IndicadorFormulaCompostaService {
    private readonly logger = new Logger(IndicadorFormulaCompostaService.name);

    constructor(private readonly prisma: PrismaService, private readonly indicadorService: IndicadorService) {}

    async create(indicador_id: number, dto: CreateIndicadorFormulaCompostaDto, user: PessoaFromJwt) {
        const indicador = await this.indicadorService.findOne(indicador_id, user);
        if (indicador === null) throw new HttpException('Indicador não encontrado', 404);

        this.checkFormulaCompostaRecursion(dto);

        // se alguém apagar durante o create, ta buscando bug
        let formula_compilada = await this.indicadorService.validateVariaveis(
            dto.formula_variaveis,
            indicador.id,
            dto.formula
        );

        const created = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                return await this.performCreate(prismaTx, dto, indicador_id, formula_compilada, user, indicador);
            },
            { isolationLevel: 'Serializable', maxWait: 30000 }
        );

        return created;
    }

    private async performCreate(
        prismaTx: Prisma.TransactionClient,
        dto: CreateIndicadorFormulaCompostaDto,
        indicador_id: number,
        formula_compilada: string,
        user: PessoaFromJwt,
        indicador: Indicador
    ) {
        const sameTitle = await prismaTx.formulaComposta.count({
            where: {
                removido_em: null,
                titulo: {
                    mode: 'insensitive',
                    equals: dto.titulo,
                },
                IndicadorFormulaComposta: {
                    some: {
                        indicador_id: indicador_id,
                    },
                },
            },
        });
        if (sameTitle) throw new HttpException('Já existe uma fórmula composta com o mesmo título', 400);

        const formula_variaveis = dto.formula_variaveis;

        let formula;
        ({ formula, formula_compilada } = await this.indicadorService.trocaReferencias(
            formula_variaveis,
            dto.formula,
            indicador_id,
            formula_compilada,
            prismaTx
        ));

        const ifc = await prismaTx.formulaComposta.create({
            data: {
                titulo: dto.titulo,
                formula: formula,
                formula_compilada: formula_compilada,
                criado_em: new Date(Date.now()),
                criado_por: user.id,
                IndicadorFormulaComposta: {
                    create: {
                        indicador_id: indicador.id,
                    },
                },
                FormulaCompostaVariavel: {
                    createMany: {
                        data: formula_variaveis,
                    },
                },
            },
            select: { id: true },
        });

        await this.resyncFormulaComposta(indicador, ifc.id, prismaTx);

        return ifc;
    }

    private checkFormulaCompostaRecursion(dto: { formula: string }) {
        if (dto.formula.includes('@_'))
            throw new HttpException('Fórmula Composta não pode conter outra Fórmula Composta', 400);
    }

    async findAll(indicador_id: number, user: PessoaFromJwt): Promise<IndicadorFormulaCompostaDto[]> {
        const indicador = await this.indicadorService.findOne(indicador_id, user);
        if (indicador === null) throw new HttpException('Indicador não encontrado', 404);

        const rows = await this.prisma.formulaComposta.findMany({
            where: {
                removido_em: null,
                IndicadorFormulaComposta: {
                    some: {
                        indicador_id: indicador_id,
                    },
                },
            },
            select: {
                id: true,
                titulo: true,
                formula: true,
                FormulaCompostaVariavel: true,
                mostrar_monitoramento: true,
                nivel_regionalizacao: true,
                IndicadorFormulaComposta: {
                    where: {
                        indicador_id: indicador_id,
                    },
                    select: {
                        indicador_origem: {
                            select: {
                                id: true,
                                titulo: true,
                                codigo: true,
                                atividade: {
                                    select: { codigo: true, titulo: true, id: true },
                                },
                                iniciativa: {
                                    select: { codigo: true, titulo: true, id: true },
                                },
                                meta: {
                                    select: { codigo: true, titulo: true, id: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        return rows.map((r) => {
            return {
                id: r.id,
                titulo: r.titulo,
                formula: r.formula,
                mostrar_monitoramento: r.mostrar_monitoramento,
                nivel_regionalizacao: r.nivel_regionalizacao,
                formula_variaveis: r.FormulaCompostaVariavel,
                indicador_origem: r.IndicadorFormulaComposta[0].indicador_origem,
            };
        });
    }

    async update(
        indicador_id: number,
        id: number,
        dto: UpdateIndicadorFormulaCompostaDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const indicador = await this.indicadorService.findOne(indicador_id, user);
        if (indicador === null) throw new HttpException('Indicador não encontrado', 404);

        this.checkFormulaCompostaRecursion(dto);
        let formula_compilada = await this.indicadorService.validateVariaveis(
            dto.formula_variaveis,
            indicador.id,
            dto.formula
        );

        return await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const self = await prismaTx.formulaComposta.findFirstOrThrow({
                    where: {
                        id: id,
                        removido_em: null,
                        IndicadorFormulaComposta: {
                            some: {
                                indicador_id: indicador_id,
                            },
                        },
                    },
                    select: { id: true, formula_compilada: true },
                });

                const sameTitle = await prismaTx.formulaComposta.count({
                    where: {
                        removido_em: null,
                        NOT: { id: self.id },
                        titulo: {
                            mode: 'insensitive',
                            equals: dto.titulo,
                        },
                        IndicadorFormulaComposta: {
                            some: {
                                indicador_id: indicador_id,
                            },
                        },
                    },
                });
                if (sameTitle) throw new HttpException('Já existe uma fórmula composta com o mesmo título', 400);

                await prismaTx.formulaComposta.update({
                    where: { id: self.id },
                    data: {
                        atualizado_em: new Date(Date.now()),
                        atualizado_por: user.id,
                        ...{ ...dto, formula_compilada: undefined, formula: undefined, formula_variaveis: undefined },
                    },
                });

                // pensando bem, isso aqui nem é 100% necessário, nem aqui, nem nas variaveis
                // só é necessário em update do indicador
                await this.resyncFormulaComposta(indicador, self.id, prismaTx);

                if (self.formula_compilada != formula_compilada) {
                    let formula;
                    const formula_variaveis = dto.formula_variaveis;
                    ({ formula, formula_compilada } = await this.indicadorService.trocaReferencias(
                        formula_variaveis,
                        dto.formula,
                        indicador_id,
                        formula_compilada,
                        prismaTx
                    ));

                    // vai precisar atualizar os outros dados em cada indicador
                    // por enquanto, não precisa fazer nada

                    await prismaTx.formulaCompostaVariavel.deleteMany({
                        where: { formula_composta_id: self.id },
                    });

                    await Promise.all([
                        prismaTx.formulaComposta.update({
                            where: { id: self.id },
                            data: { formula, formula_compilada },
                        }),
                        prismaTx.formulaCompostaVariavel.createMany({
                            data: formula_variaveis.map((fv) => {
                                return {
                                    formula_composta_id: self.id,
                                    ...fv,
                                };
                            }),
                        }),
                    ]);
                }

                return self;
            },
            {
                isolationLevel: 'ReadCommitted',
                maxWait: 60 * 1000,
                timeout: 120 * 1000,
            }
        );
    }

    async remove(indicador_id: number, id: number, user: PessoaFromJwt): Promise<void> {
        const indicador = await this.indicadorService.findOne(indicador_id, user);
        if (indicador === null) throw new HttpException('Indicador não encontrado', 404);

        return await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient): Promise<void> => {
            const self = await prismaTx.formulaComposta.findFirstOrThrow({
                where: {
                    id: id,
                    removido_em: null,
                    IndicadorFormulaComposta: {
                        some: {
                            indicador_id: indicador_id,
                        },
                    },
                },
                select: { id: true },
            });

            console.log(self);

            const indicadoresEmUso = await prismaTx.indicadorFormulaCompostaEmUso.findMany({
                where: { formula_composta_id: self.id },
                orderBy: [
                    {
                        indicador: { codigo: 'asc' },
                    },
                ],
                select: {
                    indicador: {
                        select: {
                            codigo: true,
                            titulo: true,
                        },
                    },
                },
            });
            if (indicadoresEmUso.length) {
                throw new HttpException(
                    `Não é possível remover a fórmula composta, está em uso em ${
                        indicadoresEmUso.length
                    } indicadores: ${indicadoresEmUso
                        .map((i) => `${i.indicador.codigo} - ${i.indicador.titulo}`)
                        .join(', ')}`,
                    400
                );
            }

            await prismaTx.formulaComposta.update({
                where: {
                    id: self.id,
                },
                data: {
                    removido_em: new Date(Date.now()),
                    removido_por: user.id,
                },
            });

            await prismaTx.indicadorFormulaComposta.deleteMany({
                where: {
                    formula_composta_id: self.id,
                },
            });
        });
    }

    async resyncFormulaComposta(
        indicador: {
            id: number;
            iniciativa_id: number | null;
            atividade_id: number | null;
            meta_id: number | null;
        },
        formula_composta_id: number,
        prismaTx: Prisma.TransactionClient
    ) {
        await prismaTx.indicadorFormulaComposta.deleteMany({
            where: {
                formula_composta_id,
                NOT: { indicador_origem_id: null },
            },
        });

        this.logger.log(
            `resyncFormulaComposta: formula_composta_id ${formula_composta_id}, indicador: ${JSON.stringify(indicador)}`
        );

        // se o indicador é uma atividade, precisamos testar se essa atividade tem herança para a
        // iniciativa
        if (indicador.atividade_id) {
            const atividade = await prismaTx.atividade.findFirstOrThrow({
                where: {
                    id: indicador.atividade_id,
                },
                select: {
                    compoe_indicador_iniciativa: true,
                    iniciativa: {
                        select: {
                            compoe_indicador_meta: true,
                            meta_id: true,
                            Indicador: {
                                where: {
                                    removido_em: null,
                                },
                                select: {
                                    id: true,
                                },
                            },
                        },
                    },
                },
            });
            this.logger.log(`indicadorFormulaComposta: atividade encontrada ${JSON.stringify(atividade)}`);
            if (atividade.compoe_indicador_iniciativa) {
                const indicadorDaIniciativa = atividade.iniciativa.Indicador[0];

                if (!indicadorDaIniciativa) {
                    this.logger.warn(
                        `indicadorFormulaComposta: Atividade ID=${indicador.atividade_id} compoe_indicador_iniciativa mas não tem indicador ativo`
                    );
                } else {
                    const data = {
                        indicador_id: indicadorDaIniciativa.id,
                        formula_composta_id,
                        indicador_origem_id: indicador.id,
                    };
                    this.logger.log(`indicadorFormulaComposta: criando ${JSON.stringify(data)}`);
                    await prismaTx.indicadorFormulaComposta.create({ data: data });
                }

                // atividade tbm compõe a meta, então precisa levar essa variavel para lá também
                // 'recursão' manual
                if (atividade.iniciativa.compoe_indicador_meta) {
                    this.logger.log(
                        `indicadorFormulaComposta: iniciativa da atividade compoe_indicador_meta, buscando indicador da meta`
                    );
                    const indicadorDaMeta = await this.prisma.indicador.findFirst({
                        where: {
                            removido_em: null,
                            meta_id: atividade.iniciativa.meta_id,
                        },
                        select: {
                            id: true,
                        },
                    });
                    if (!indicadorDaMeta) {
                        this.logger.warn(
                            `indicadorFormulaComposta: indicador da meta ${atividade.iniciativa.meta_id} não foi encontrado!`
                        );
                    } else {
                        const data = {
                            indicador_id: indicadorDaMeta.id,
                            formula_composta_id,
                            indicador_origem_id: indicadorDaIniciativa.id,
                        };
                        this.logger.log(`indicadorFormulaComposta: criando ${JSON.stringify(data)}`);
                        await prismaTx.indicadorFormulaComposta.create({
                            data: data,
                        });
                    }
                }
            }
        } else if (indicador.iniciativa_id) {
            // praticamente a mesma coisa, porém começa já na iniciativa
            const iniciativa = await prismaTx.iniciativa.findFirstOrThrow({
                where: {
                    id: indicador.iniciativa_id,
                },
                select: {
                    compoe_indicador_meta: true,
                    meta: {
                        select: {
                            id: true,
                            indicador: {
                                where: {
                                    removido_em: null,
                                },
                                select: {
                                    id: true,
                                },
                            },
                        },
                    },
                },
            });
            this.logger.log(`indicadorFormulaComposta: iniciativa encontrada ${JSON.stringify(iniciativa)}`);

            if (iniciativa.compoe_indicador_meta) {
                const indicadorDaMeta = iniciativa.meta.indicador[0];

                if (!indicadorDaMeta) {
                    this.logger.warn(
                        `indicadorFormulaComposta: Iniciativa ${indicador.iniciativa_id} compoe_indicador_meta mas não tem indicador ativo na meta`
                    );
                } else {
                    const data = {
                        indicador_id: indicadorDaMeta.id,
                        formula_composta_id,
                        indicador_origem_id: indicador.id,
                    };
                    this.logger.log(`indicadorFormulaComposta: criando ${JSON.stringify(data)}`);
                    await prismaTx.indicadorFormulaComposta.create({ data: data });
                }
            }
        }
    }

    async geradorFormula(
        indicador_id: number,
        dto: GeneratorFormulaCompostaFormDto,
        user: PessoaFromJwt
    ): Promise<BatchRecordWithId> {
        const indicador = await this.indicadorService.findOne(indicador_id, user);
        if (indicador === null) throw new HttpException('Indicador não encontrado', 404);

        const variaveis = await this.extractVariables(dto, indicador_id, null);

        if (variaveis.length == 0)
            throw new HttpException(
                'É necessário pelo menos 1 variável, mas nenhuma foi encontrada com o prefixo informado.',
                400
            );

        const ret: BatchRecordWithId = { ids: [] };

        if (!dto.nivel_regionalizacao) throw new HttpException('É necessário informar o nível de regionalização', 400);

        await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<void> => {
                const todoList: CreateIndicadorFormulaCompostaDto[] = [];
                for (const regiaoId of dto.regioes) {
                    const regiao = await this.prisma.regiao.findFirstOrThrow({
                        where: { id: regiaoId, removido_em: null },
                        select: { id: true, descricao: true, nivel: true },
                    });
                    if (regiao.nivel != dto.nivel_regionalizacao)
                        throw new HttpException(
                            'Todas as regiões informadas precisam ter o nível de regionalização informado.',
                            400
                        );

                    const buscaFilhos: { filho_id: number }[] = await this.buscaFilhosRegiao(
                        prismaTx,
                        regiaoId,
                        indicador
                    );

                    if (!buscaFilhos.length) {
                        throw new HttpException(
                            `Não foi encontrada nenhuma região do nível ${indicador.nivel_regionalizacao} para região ${regiao.descricao} (nível ${regiao.nivel})`,
                            400
                        );
                    }

                    const variaveis = await this.extractVariables(
                        dto,
                        indicador_id,
                        buscaFilhos.map((r) => r.filho_id)
                    );
                    if (!variaveis.length) {
                        throw new HttpException(
                            `Não foi encontrada nenhum variavel com o prefixo no nível ${indicador.nivel_regionalizacao} para região ${regiao.descricao} (nível ${regiao.nivel})`,
                            400
                        );
                    }

                    todoList.push(
                        this.montaFormulaCompostaParaRegioes(
                            {
                                ...dto,
                                titulo: dto.titulo + ' ' + regiao.descricao,
                                regioes: variaveis.filter((r) => r !== null).map((r) => r.regiao!.id),
                            },
                            variaveis
                        )
                    );
                }

                this.logger.verbose(`Criando formula compostas... ${JSON.stringify(todoList)}...`);

                for (const todo of todoList) {
                    const formula_compilada = await this.indicadorService.validateVariaveis(
                        todo.formula_variaveis,
                        indicador.id,
                        todo.formula
                    );

                    const row = await this.performCreate(
                        prismaTx,
                        todo,
                        indicador_id,
                        formula_compilada,
                        user,
                        indicador
                    );

                    ret.ids.push(row);
                }
            },
            { isolationLevel: 'Serializable', maxWait: 30000 * 5 }
        );

        return ret;
    }

    private async buscaFilhosRegiao(
        prismaTx: Prisma.TransactionClient,
        regiaoId: number,
        indicador: Indicador
    ): Promise<{ filho_id: number }[]> {
        return await prismaTx.$queryRaw`
        WITH RECURSIVE regiao_path AS (
                SELECT id, parente_id, nivel::int
                FROM regiao m
                WHERE m.id = ${regiaoId}::int
                and m.removido_em is null
            UNION ALL
                SELECT t.id, t.parente_id, t.nivel
                FROM regiao t
                JOIN regiao_path tp ON tp.id = t.parente_id
                and t.removido_em is null
          )
          SELECT
            a.id as filho_id
          FROM regiao_path a join regiao b on b.id=a.id
          WHERE a.nivel = ${indicador.nivel_regionalizacao}::int;
        `;
    }

    private montaFormulaCompostaParaRegioes(
        dto: GeneratorFormulaCompostaFormDto,
        variaveis: { id: number; codigo: string; regiao: { id: number; descricao: string; nivel: number } | null }[]
    ): CreateIndicadorFormulaCompostaDto {
        const ret: CreateIndicadorFormulaCompostaDto = {
            formula: '',
            formula_variaveis: [],
            mostrar_monitoramento: false,
            titulo: dto.titulo,
            nivel_regionalizacao: dto.nivel_regionalizacao!,
        };

        const operacoes: Record<OperacaoPadraoDto, string> = {
            'Média Aritmética': '+',
            'Divisão': '/',
            'Multiplicação': '*',
            'Soma': '+',
            'Subtração': '-',
        } as const;

        let i = 1;
        for (const variavel of variaveis) {
            ret.formula += '$_' + i + ' ' + operacoes[dto.operacao] + ' ';
            ret.formula_variaveis.push({
                janela: dto.janela,
                referencia: '_' + i,
                usar_serie_acumulada: dto.usar_serie_acumulada,
                variavel_id: variavel.id,
            });
            i++;
        }
        if (ret.formula) ret.formula = ret.formula.substring(0, ret.formula.length - 3); // tira a operação e os espaços

        if (dto.operacao == 'Média Aritmética') {
            ret.formula = '(' + ret.formula + ')' + ' / ' + variaveis.length;
        }
        return ret;
    }

    async contaVariavelPrefixo(
        indicador_id: number,
        dto: FilterFormulaCompostaFormDto,
        user: PessoaFromJwt
    ): Promise<FilterFormulaCompostaReturnDto> {
        const indicador = await this.indicadorService.findOne(indicador_id, user);
        if (indicador === null) throw new HttpException('Indicador não encontrado', 404);

        const rows = await this.extractVariables(dto, indicador_id, null);

        return {
            operacoes: OperacaoSuportadaOrdem,
            variaveis: rows
                .filter((r) => r.regiao !== null)
                .map((r) => {
                    return {
                        id: r.id,
                        codigo: r.codigo,
                        regiao: {
                            descricao: r.regiao!.descricao,
                            nivel: r.regiao!.nivel,
                            id: r.regiao!.id,
                        },
                    };
                }),
            variaveis_sem_regiao: rows
                .filter((r) => r.regiao === null)
                .map((r) => {
                    return {
                        id: r.id,
                        codigo: r.codigo,
                    };
                }),
        };
    }

    private async extractVariables(dto: FilterFormulaCompostaFormDto, indicador_id: number, regioes: number[] | null) {
        return await this.prisma.variavel.findMany({
            where: {
                codigo: { startsWith: dto.codigo, mode: 'insensitive' },
                removido_em: null,
                indicador_variavel: { some: { indicador_id } },
                regiao_id: regioes == null ? undefined : { in: regioes },
            },
            select: { id: true, codigo: true, regiao: { select: { nivel: true, id: true, descricao: true } } },
        });
    }
}
