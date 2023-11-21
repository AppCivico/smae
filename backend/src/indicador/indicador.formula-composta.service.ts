import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { PrismaService } from '../prisma/prisma.service';
import { VariavelService } from '../variavel/variavel.service';
import { CreateIndicadorFormulaCompostaDto } from './dto/create-indicador.formula-composta.dto';
import { UpdateIndicadorDto } from './dto/update-indicador.dto';
import { IndicadorFormulaCompostaDto } from './entities/indicador.formula-composta.entity';
import { IndicadorService } from './indicador.service';

const FP = require('../../public/js/formula_parser.js');

@Injectable()
export class IndicadorFormulaCompostaService {
    private readonly logger = new Logger(IndicadorFormulaCompostaService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly indicadorService: IndicadorService,
        private readonly variavelService: VariavelService
    ) {}

    async create(indicador_id: number, dto: CreateIndicadorFormulaCompostaDto, user: PessoaFromJwt) {
        const indicador = await this.indicadorService.findOne(indicador_id, user);
        if (indicador === null) throw new HttpException('Indicador não encontrado', 404);

        if (dto.formula.includes('@_'))
            throw new HttpException('Fórmula Composta não pode conter outra Fórmula Composta', 400);

        // se alguém apagar durante o create, ta buscando bug
        const formula_compilada = await this.indicadorService.validateVariaveis(
            dto.formula_variaveis,
            indicador.id,
            dto.formula
        );

        const created = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const ifc = await prismaTx.formulaComposta.create({
                    data: {
                        titulo: dto.titulo,
                        formula: dto.formula,
                        formula_compilada: formula_compilada,
                        criado_em: new Date(),
                        criado_por: user.id,
                        IndicadorFormulaComposta: {
                            create: {
                                indicador_id: indicador.id,
                            },
                        },
                    },
                });

                await this.resyncFormulaComposta(indicador, ifc.id, prismaTx);

                return ifc;
            },
            { isolationLevel: 'Serializable', maxWait: 30000 }
        );

        return created;
    }

    async findAll(indicador_id: number, user: PessoaFromJwt): Promise<IndicadorFormulaCompostaDto[]> {
        const indicador = await this.indicadorService.findOne(indicador_id, user);
        if (indicador === null) throw new HttpException('Indicador não encontrado', 404);

        throw '';
    }

    async update(id: number, updateIndicadorDto: UpdateIndicadorDto, user: PessoaFromJwt) {
        throw '';
    }

    async remove(id: number, user: PessoaFromJwt) {
        throw '';
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
}
