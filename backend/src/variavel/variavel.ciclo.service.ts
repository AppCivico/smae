import { BadRequestException, Inject, Injectable, forwardRef } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PerfilResponsavelEquipe, Prisma, VariavelCicloCorrente, VariavelFase } from '@prisma/client';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { CrontabIsEnabled } from '../common/CrontabIsEnabled';
import { LoggerWithLog } from '../common/LoggerWithLog';
import { CONST_BOT_USER_ID } from '../common/consts';
import { Date2YMD, SYSTEM_TIMEZONE } from '../common/date2ymd';
import { JOB_CICLO_VARIAVEL } from '../common/dto/locks';
import { TEMPO_EXPIRACAO_ARQUIVO } from '../mf/metas/metas.service';
import { PdmService } from '../pdm/pdm.service';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { VariavelResumo, VariavelResumoInput } from './dto/list-variavel.dto';
import {
    AnaliseQualitativaDto,
    BatchAnaliseQualitativaDto,
    FilterVariavelAnaliseQualitativaGetDto,
    FilterVariavelGlobalCicloDto,
    PSPedidoComplementacaoDto,
    UpsertVariavelGlobalCicloDocumentoDto,
    VariavelAnaliseDocumento,
    VariavelAnaliseQualitativaResponseDto,
    VariavelGlobalAnaliseItemDto,
    VariavelGlobalCicloDto,
    VariavelValorDto,
} from './dto/variavel.ciclo.dto';
import { VariavelComCategorica, VariavelService } from './variavel.service';
import { VariavelUtilService } from './variavel.util.service';
import { IdTituloDto } from '../common/dto/IdTitulo.dto';
import { DateTime } from 'luxon';

interface ICicloCorrente {
    variavel: {
        id: number;
        titulo: string;
        variaveis_filhas: {
            id: number;
            titulo?: string;
        }[];
    };
    fase: VariavelFase;
    proximo_periodo_abertura: Date;
    ultimo_periodo_valido: Date;
}

interface ValorSerieInterface {
    variavel_id: number;
    serie: string;
    valor_nominal: { toString: () => string };
}

interface UploadArquivoInterface {
    arquivo: {
        id: number;
        tamanho_bytes: number;
        nome_original: string;
        diretorio_caminho: string | null;
    };
    descricao: string | null;
    fase: VariavelFase;
}

interface IUltimaAnaliseValor {
    variavel_id: number;
    valor_realizado: string | null;
    analise_qualitativa: string | null;
}

@Injectable()
export class VariavelCicloService {
    private enabled: boolean;
    constructor(
        private readonly prisma: PrismaService,
        private readonly uploadService: UploadService,
        private readonly variavelService: VariavelService,
        private readonly util: VariavelUtilService,
        //
        @Inject(forwardRef(() => PdmService))
        private readonly pdmService: PdmService
    ) {
        this.enabled = false;
    }

    async onModuleInit() {
        if (CrontabIsEnabled('variavel_ciclo')) {
            // irá ser necessário verificar uma vez por mes ativar as variaveis
            const botUser = await this.prisma.pessoa.findUnique({
                where: { id: CONST_BOT_USER_ID },
                select: { id: true },
            });
            this.enabled = !!botUser;
        }
    }

    @Cron(CronExpression.EVERY_HOUR)
    async variavelCicloCrontab() {
        if (!this.enabled) return;
        // TODO
    }

    async getPermissionSet(
        filters: FilterVariavelGlobalCicloDto,
        user: PessoaFromJwt,
        consulta_historica: boolean = false
    ): Promise<Prisma.Enumerable<Prisma.VariavelWhereInput>> {
        const isRoot = user.hasSomeRoles(['SMAE.superadmin', 'CadastroVariavelGlobal.administrador']);

        let pessoaId = user.id;

        if (filters.simular_ponto_focal && isRoot) {
            pessoaId = filters.simular_usuario ?? pessoaId;
        }

        const whereConditions: Prisma.Enumerable<Prisma.VariavelWhereInput> = [
            {
                id: filters.variavel_id ? { in: filters.variavel_id } : undefined,
                equipes_configuradas: consulta_historica ? undefined : true,
                removido_em: null,
            },
        ];

        if (filters.equipe_id) {
            whereConditions.push({
                VariavelGrupoResponsavelEquipe: {
                    some: {
                        removido_em: null,
                        grupo_responsavel_equipe: {
                            id: filters.equipe_id,
                            removido_em: null,
                        },
                    },
                },
            });
        }

        if (filters.palavra_chave) {
            whereConditions.push({
                id: { in: await this.variavelService.buscaIdsPalavraChave(filters.palavra_chave) },
            });
        }

        whereConditions.push({
            AND: [...this.variavelService.getVariavelWhereSet(filters), { tipo: 'Global' }],
        });

        if (!isRoot && user.hasSomeRoles(['CadastroVariavelGlobal.administrador_no_orgao'])) {
            const orgao_id = user.orgao_id;
            if (!orgao_id) throw new BadRequestException('Usuário sem órgão associado');

            whereConditions.push({
                OR: [
                    { medicao_orgao_id: orgao_id },
                    { validacao_orgao_id: orgao_id },
                    { liberacao_orgao_id: orgao_id },
                ],
            });
        } else if (!isRoot && consulta_historica === false) {
            const equipes = await this.prisma.grupoResponsavelEquipe.findMany({
                where: {
                    removido_em: null,
                    // se quiser q suma as variaveis sem edição, precisa tirar daqui pra sincronizar
                    // com o where do filter de "Preenchimento"/etc
                    perfil: { in: ['Medicao', 'Validacao', 'Liberacao'] },
                    GrupoResponsavelEquipePessoa: {
                        some: {
                            removido_em: null,
                            pessoa_id: pessoaId,
                        },
                    },
                },
            });
            const equipeIds = equipes.map((e) => e.id);

            whereConditions.push({
                VariavelGrupoResponsavelEquipe: {
                    some: {
                        grupo_responsavel_equipe: {
                            removido_em: null,
                            id: {
                                in: equipeIds,
                            },
                        },
                    },
                },
            });
        }

        return { AND: whereConditions };
    }

    async getVariavelCiclo(
        filters: FilterVariavelGlobalCicloDto,
        user: PessoaFromJwt
    ): Promise<VariavelGlobalCicloDto[]> {
        const whereFilter = await this.getPermissionSet(filters, user);

        const mapPerfil: Record<VariavelFase, PerfilResponsavelEquipe> = {
            Liberacao: 'Liberacao',
            Preenchimento: 'Medicao',
            Validacao: 'Validacao',
        };
        const minhasEquipes = await user.getEquipesColaborador(this.prisma);

        const variaveis = await this.prisma.variavelCicloCorrente.findMany({
            where: {
                ultimo_periodo_valido: filters.referencia,
                variavel: {
                    AND: whereFilter,
                },
                fase: filters.fase,
                eh_corrente: true,
            },
            orderBy: [{ 'variavel': { codigo: 'asc' } }],
            include: {
                variavel: {
                    select: {
                        id: true,
                        titulo: true,
                        codigo: true,
                        periodicidade: true,
                        VariavelGrupoResponsavelEquipe: {
                            where: {
                                removido_em: null,

                                grupo_responsavel_equipe: filters.fase
                                    ? {
                                          perfil: mapPerfil[filters.fase],
                                      }
                                    : undefined,
                            },
                            select: {
                                grupo_responsavel_equipe: {
                                    select: {
                                        id: true,
                                        titulo: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        const rows = variaveis.map((v) => {
            let pode_editar: boolean = false;
            const prazo: Date | null = v.prazo;
            const equipesDb = v.variavel.VariavelGrupoResponsavelEquipe.map((e) => e.grupo_responsavel_equipe.id);

            const equipes: IdTituloDto[] = v.variavel.VariavelGrupoResponsavelEquipe.map((e) => ({
                id: e.grupo_responsavel_equipe.id,
                titulo: e.grupo_responsavel_equipe.titulo,
            }));

            if (minhasEquipes.length > 0) {
                pode_editar = equipesDb.some((e) => minhasEquipes.includes(e));
            }

            return {
                id: v.variavel.id,
                titulo: v.variavel.titulo,
                periodicidade: v.variavel.periodicidade,
                fase: v.fase,
                proximo_periodo_abertura: Date2YMD.toString(v.proximo_periodo_abertura),
                ultimo_periodo_valido: Date2YMD.toString(v.ultimo_periodo_valido),
                pedido_complementacao: v.pedido_complementacao,
                codigo: v.variavel.codigo,
                atrasos: v.atrasos.length ? v.atrasos.map((a) => Date2YMD.toString(a)) : null,
                equipes,
                pode_editar,
                prazo,
                em_atraso:
                    v.atrasos.length > 0 ||
                    (v.prazo !== null &&
                        v.prazo.valueOf() < DateTime.local({ zone: SYSTEM_TIMEZONE }).toJSDate().valueOf()),
            } satisfies VariavelGlobalCicloDto;
        });

        return rows;
    }

    async patchVariavelCiclo(dto: BatchAnaliseQualitativaDto, user: PessoaFromJwt): Promise<void> {
        const load = await this.getVariavelCiclo({ id: dto.variavel_id, referencia: dto.data_referencia }, user);
        if (load.length === 0)
            throw new BadRequestException('Variável não encontrada, ou não tem permissão para acessar');
        const dadosCiclo = load[0];
        if (dadosCiclo.pode_editar === false)
            throw new BadRequestException('Usuário não tem permissão para editar esta variável');

        const whereFilter = await this.getPermissionSet({}, user);

        const cicloCorrente = await this.prisma.variavelCicloCorrente.findFirst({
            where: {
                variavel: {
                    AND: whereFilter,
                },
                variavel_id: dto.variavel_id,
                eh_corrente: true,
            },
            include: {
                variavel: {
                    select: {
                        id: true,
                        titulo: true,
                        variaveis_filhas: {
                            where: { removido_em: null, tipo: 'Global' },
                            select: { id: true },
                        },
                    },
                },
            },
        });
        if (!cicloCorrente) throw new BadRequestException('Variável não encontrada, ou não tem permissão para acessar');
        if (Date2YMD.toString(cicloCorrente.ultimo_periodo_valido) != Date2YMD.toString(dto.data_referencia))
            throw new BadRequestException(`Data de ref não é a última válida (${cicloCorrente.ultimo_periodo_valido})`);

        if ((!dto.pedido_complementacao && !dto.analise_qualitativa) || dto.analise_qualitativa?.length === 0)
            throw new BadRequestException('É necessário fornecer uma análise qualitativa ou pedir complementação');

        // sempre verifica se o periodo é válido, just in case...
        const valid = await this.util.gerarPeriodoVariavelEntreDatas(dto.variavel_id, null, {
            data_valor: dto.data_referencia,
        });
        if (valid.length === 0) throw new BadRequestException('Data de referência não é válida para a variável');

        this.validaValoresVariaveis(dto, cicloCorrente);

        const now = new Date(Date.now());

        await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient): Promise<void> => {
            // Cria uma nova analise qualitativa, marcando primeiro a última como falsa
            await prismaTxn.variavelGlobalCicloAnalise.updateMany({
                where: {
                    variavel_id: dto.variavel_id,
                    ultima_revisao: true,
                    referencia_data: dto.data_referencia,
                    fase: cicloCorrente.fase,
                },
                data: { ultima_revisao: false },
            });

            // nem cria a analise de, já que vai marcar como removido_em logo em seguida todas as fases
            if (!dto.pedido_complementacao)
                await prismaTxn.variavelGlobalCicloAnalise.create({
                    data: {
                        variavel_id: dto.variavel_id,
                        referencia_data: dto.data_referencia,
                        informacoes_complementares: dto.analise_qualitativa,
                        criado_por: user.id,
                        ultima_revisao: true,
                        valores: dto.valores as any,
                        fase: cicloCorrente.fase,
                        aprovada: dto.aprovar,
                    },
                });

            // uploads se existirem
            if (dto.uploads && Array.isArray(dto.uploads)) {
                await this.upsertVariavelGlobalCicloDocumento(
                    dto.variavel_id,
                    new Date(dto.data_referencia),
                    cicloCorrente.fase,
                    dto.uploads,
                    user,
                    prismaTxn
                );
            }

            let conferida: boolean = false;

            if (dto.aprovar && dto.pedido_complementacao)
                throw new BadRequestException('Não é possível aprovar e pedir complementação ao mesmo tempo');

            // Troca de fase
            if (cicloCorrente.fase === 'Preenchimento') {
                if (dto.aprovar) {
                    await this.moveFase(cicloCorrente.variavel.id, 'Validacao', prismaTxn, user);
                }

                if (dto.pedido_complementacao)
                    throw new BadRequestException('Não é possível pedir complementação nesta fase');
            } else if (cicloCorrente.fase === 'Validacao') {
                if (dto.aprovar) {
                    // aqui poderia ter o mesmo "problema" de faltar alguma filha, mas ai o
                    // não temos como saber pq não temos campos para acompanhar isso, já que sempre
                    // estamos salvando o status apenas na variável mãe. No frontend é sempre enviado todas as filhas
                    await this.moveFase(cicloCorrente.variavel.id, 'Liberacao', prismaTxn, user);
                } else if (dto.pedido_complementacao) {
                    await this.moveFase(cicloCorrente.variavel.id, 'Preenchimento', prismaTxn, user);
                    // cria o pedido depois
                    await this.criaPedidoComplementacao(
                        cicloCorrente.variavel.id,
                        dto.pedido_complementacao,
                        dto.data_referencia,
                        user,
                        prismaTxn,
                        now
                    );
                }
            } else if (cicloCorrente.fase === 'Liberacao') {
                if (dto.aprovar) {
                    conferida = true;

                    // Verifica se todas as filhas estão conferidas ou serão atualizadas neste batch
                    const filhaIds = cicloCorrente.variavel.variaveis_filhas.map((child) => child.id);
                    await this.verificaStatusConferenciaFilhas(filhaIds, prismaTxn, dto);

                    await this.marcaLiberacaoEnviada(cicloCorrente.variavel.id, prismaTxn);
                } else if (dto.pedido_complementacao) {
                    await this.moveFase(cicloCorrente.variavel.id, 'Validacao', prismaTxn, user);
                    // cria o pedido após mover a fase
                    await this.criaPedidoComplementacao(
                        cicloCorrente.variavel.id,
                        dto.pedido_complementacao,
                        dto.data_referencia,
                        user,
                        prismaTxn,
                        now
                    );
                }
            }

            // apenas atualiza quando for conferida, antes deixa em branco
            // na serie_variavel, como na volta de pedido de complementação caso já tenha sido aprovado alguma vez
            // vai manter o ultimo valor aprovado
            if (conferida) {
                await this.updateSerieVariavelConferida(
                    cicloCorrente.variavel.id,
                    dto.data_referencia,
                    true,
                    prismaTxn
                );

                const variaveisIds: number[] = [dto.variavel_id];
                for (const valor of dto.valores) {
                    if (valor.variavel_id) variaveisIds.push(valor.variavel_id);

                    const variavelInfo = await this.variavelService.loadVariavelComCategorica(
                        'Global',
                        prismaTxn,
                        valor.variavel_id ?? dto.variavel_id
                    );

                    await this.atualizaSerieVariavel(
                        variavelInfo,
                        valor,
                        prismaTxn,
                        now,
                        user,
                        dto.data_referencia,
                        conferida
                    );
                }

                if (variaveisIds.length) {
                    await this.variavelService.recalc_series_dependentes(variaveisIds, prismaTxn);
                    await this.variavelService.recalc_indicador_usando_variaveis(variaveisIds, prismaTxn);
                }
            }
        });
    }

    private async verificaStatusConferenciaFilhas(
        filhaIds: number[],
        prismaTxn: Prisma.TransactionClient,
        dto: BatchAnaliseQualitativaDto
    ) {
        if (!filhaIds.length) return;

        const serieFilhas = await prismaTxn.serieVariavel.findMany({
            where: {
                variavel_id: { in: filhaIds },
                data_valor: dto.data_referencia,
                serie: 'Realizado',
            },
            select: { variavel_id: true, conferida: true },
        });

        // se não ta conferida e não ta no batch, não pode aprovar
        const filhosNaoVerificados = serieFilhas.filter(
            (series) => !series.conferida && !dto.valores.some((v) => v.variavel_id === series.variavel_id)
        );

        if (filhosNaoVerificados.length > 0)
            throw new BadRequestException('Não é possível aprovar. Existem variáveis filhas não conferidas.');
    }

    private validaValoresVariaveis(dto: BatchAnaliseQualitativaDto, cicloCorrente: ICicloCorrente) {
        for (const valor of dto.valores) {
            // Remove variavel_id dos valores principais se for o mesmo que a variável sendo analisada
            if (valor.variavel_id && valor.variavel_id == dto.variavel_id) delete valor.variavel_id;
        }

        const valorGlobalOuMae = dto.valores.filter((valor) => !valor.variavel_id);
        const valorFilhas = dto.valores.filter((valor) => valor.variavel_id);

        const variableIds = dto.valores.map((v) => v.variavel_id).filter((id) => id !== undefined);
        const uniqueIds = new Set(variableIds);
        if (variableIds.length !== uniqueIds.size) {
            throw new BadRequestException('Valores duplicados para a mesma variável não são permitidos');
        }

        if (cicloCorrente.variavel.variaveis_filhas.length > 0) {
            if (valorFilhas.length === 0) {
                throw new BadRequestException('É necessário fornecer valores para as variáveis filhas');
            }
            if (valorGlobalOuMae.length > 0) {
                throw new BadRequestException('Variáveis com filhas não podem ter valores próprios');
            }

            if (valorFilhas.length != cicloCorrente.variavel.variaveis_filhas.length) {
                throw new BadRequestException('Quantidade de valores fornecidos para as variáveis filhas não confere');
            }
        } else {
            if (valorGlobalOuMae.length === 0) {
                throw new BadRequestException('É necessário fornecer um valor para a variável');
            }
            if (valorGlobalOuMae.length > 1) {
                throw new BadRequestException('Apenas um valor pode ser fornecido para uma variável sem filhas');
            }
            if (valorFilhas.length > 0) {
                throw new BadRequestException('Variáveis sem filhas não podem ter valores de filhas');
            }
        }

        const filhasSet = new Set(cicloCorrente.variavel.variaveis_filhas.map((v) => v.id));
        for (const valor of valorFilhas) {
            if (!valor.variavel_id) continue;
            if (!filhasSet.has(valor.variavel_id)) {
                throw new BadRequestException(`Variável filha ${valor.variavel_id} não encontrada`);
            }
            filhasSet.delete(valor.variavel_id);
        }

        if (filhasSet.size > 0) {
            throw new BadRequestException(
                `Valores não fornecidos para as variáveis filhas: ${Array.from(filhasSet).join(', ')}`
            );
        }
    }

    private async atualizaSerieVariavel(
        variavelInfo: VariavelComCategorica,
        valor: VariavelGlobalAnaliseItemDto,
        prismaTxn: Prisma.TransactionClient,
        now: Date,
        user: PessoaFromJwt,
        dataReferencia: Date,
        conferida: boolean
    ) {
        const valor_nominal = valor.valor_realizado === '' ? '' : valor.valor_realizado;

        let variavel_categorica_valor_id: number | null = null;

        if (variavelInfo.variavel_categorica) {
            const valorExiste = variavelInfo.variavel_categorica.valores.find(
                (v) => v.valor_variavel === +valor_nominal
            );
            if (!valorExiste)
                throw new BadRequestException(`Valor ${valor_nominal} não é permitido para a variável categórica`);
            variavel_categorica_valor_id = valorExiste.id;
        }

        const existeValor = await prismaTxn.serieVariavel.findFirst({
            where: {
                variavel_id: variavelInfo.id,
                serie: 'Realizado',
                data_valor: dataReferencia,
            },
            select: { id: true, valor_nominal: true },
        });

        if (existeValor && valor_nominal === '') {
            await prismaTxn.serieVariavel.delete({
                where: {
                    id: existeValor.id,
                },
            });
        } else if (!existeValor && valor_nominal !== '') {
            await prismaTxn.serieVariavel.create({
                data: {
                    variavel_id: variavelInfo.id,
                    serie: 'Realizado',
                    data_valor: dataReferencia,
                    valor_nominal: valor_nominal,
                    atualizado_em: now,
                    atualizado_por: user.id,
                    conferida: conferida,
                    variavel_categorica_id: variavelInfo.variavel_categorica?.id,
                    variavel_categorica_valor_id: variavel_categorica_valor_id,
                },
            });
        } else if (existeValor && valor_nominal !== '') {
            if (existeValor.valor_nominal.toString() !== valor_nominal) {
                await prismaTxn.serieVariavel.update({
                    where: { id: existeValor.id },
                    data: {
                        valor_nominal: valor_nominal,
                        atualizado_em: now,
                        atualizado_por: user.id,
                        conferida: conferida,
                        variavel_categorica_id: variavelInfo.variavel_categorica?.id,
                        variavel_categorica_valor_id: variavel_categorica_valor_id,
                    },
                });
            }
        }

        if (!variavelInfo.acumulativa) {
            await this.atualizaSerieVariavelAcumulada(
                variavelInfo,
                prismaTxn,
                now,
                user,
                dataReferencia,
                valor_nominal,
                conferida
            );
        }
    }

    private async atualizaSerieVariavelAcumulada(
        variavelInfo: VariavelComCategorica,
        prismaTxn: Prisma.TransactionClient,
        now: Date,
        user: PessoaFromJwt,
        dataReferencia: Date,
        valor_nominal: string,
        conferida: boolean
    ) {
        const existeValorAcumulado = await prismaTxn.serieVariavel.findFirst({
            where: {
                variavel_id: variavelInfo.id,
                serie: 'RealizadoAcumulado',
                data_valor: new Date(dataReferencia),
            },
            select: { id: true },
        });

        if (existeValorAcumulado) {
            await prismaTxn.serieVariavel.update({
                where: { id: existeValorAcumulado.id },
                data: {
                    valor_nominal: valor_nominal,
                    atualizado_em: now,
                    atualizado_por: user.id,
                    conferida: conferida,
                },
            });
        } else if (valor_nominal !== '') {
            await prismaTxn.serieVariavel.create({
                data: {
                    variavel_id: variavelInfo.id,
                    serie: 'RealizadoAcumulado',
                    data_valor: new Date(dataReferencia),
                    valor_nominal: valor_nominal,
                    atualizado_em: now,
                    atualizado_por: user.id,
                    conferida: conferida,
                },
            });
        }
    }

    async getVariavelAnaliseQualitativa(
        dto: FilterVariavelAnaliseQualitativaGetDto,
        user: PessoaFromJwt
    ): Promise<VariavelAnaliseQualitativaResponseDto> {
        const { variavel_id, data_referencia } = dto;

        const cicloCorrente = await this.prisma.variavelCicloCorrente.findFirst({
            where: {
                variavel_id: variavel_id,
                eh_corrente: true,
            },
            select: {
                fase: true,
                ultimo_periodo_valido: true,
            },
        });
        if (!cicloCorrente) throw new BadRequestException('Variável não encontrada no ciclo corrente');
        if (
            !dto.consulta_historica &&
            Date2YMD.toString(cicloCorrente.ultimo_periodo_valido) != Date2YMD.toString(dto.data_referencia)
        )
            throw new BadRequestException(
                `Data de referência não é a última válida (${Date2YMD.dbDateToDMY(cicloCorrente.ultimo_periodo_valido)}), os ciclos devem ser preenchidos em ordem.`
            );

        const whereFilter = await this.getPermissionSet({}, user, true);

        const variavel = await this.prisma.variavel.findFirst({
            where: {
                id: variavel_id,
                AND: whereFilter,
            },
            select: {
                id: true,
                suspendida_em: true,
                variavel_categorica_id: true,
                casas_decimais: true,
                periodicidade: true,
                acumulativa: true,
                codigo: true,
                titulo: true,
                valor_base: true,
                unidade_medida: { select: { id: true, sigla: true, descricao: true } },
                recalculando: true,
                recalculo_erro: true,
                recalculo_tempo: true,
                variavel_mae_id: true,

                variaveis_filhas: {
                    where: { removido_em: null, tipo: 'Global' },
                    select: {
                        id: true,
                        suspendida_em: true,
                        variavel_categorica_id: true,
                        casas_decimais: true,
                        periodicidade: true,
                        acumulativa: true,
                        codigo: true,
                        titulo: true,
                        valor_base: true,
                        recalculando: true,
                        recalculo_erro: true,
                        recalculo_tempo: true,
                        variavel_mae_id: true,
                        unidade_medida: { select: { id: true, sigla: true, descricao: true } },
                    },
                },
            },
        });
        if (!variavel) throw new BadRequestException('Variável não encontrada, ou não tem permissão para acessar');

        // Carrega os valores da série para todas as variáveis (mãe e filhas)
        const valoresSerieVariavel = await this.prisma.serieVariavel.findMany({
            where: {
                OR: [
                    variavel.variaveis_filhas.length > 0 ? {} : { variavel_id: variavel_id },
                    {
                        variavel: {
                            id: {
                                in: variavel.variaveis_filhas.map((v) => v.id),
                            },
                        },
                    },
                ],
                data_valor: data_referencia,
                serie: { in: ['Realizado', 'RealizadoAcumulado'] },
            },
            select: {
                variavel_id: true,
                serie: true,
                valor_nominal: true,
            },
        });
        console.log(valoresSerieVariavel);

        // carrega a ultima linha de cada uma das analises
        const fases: VariavelFase[] = ['Liberacao', 'Preenchimento', 'Validacao'];
        const pQueries = fases.map(async (fase) => {
            return await this.prisma.variavelGlobalCicloAnalise.findFirst({
                where: {
                    removido_em: null,
                    variavel_id: variavel_id,
                    referencia_data: data_referencia,
                    fase: fase,
                },
                take: 1,
                orderBy: { criado_em: 'desc' },
                select: {
                    informacoes_complementares: true,
                    valores: true,
                    criado_em: true,
                    pessoaCriador: { select: { nome_exibicao: true } },
                    fase: true,
                    eh_liberacao_auto: true,
                    ultima_revisao: true,
                },
            });
        });
        const analisesDb = await Promise.all(pQueries);

        // Encontra a última análise com revisão e ordena por fase
        const ultimaAnalise =
            analisesDb
                .filter((a) => a?.ultima_revisao && a.fase)
                .sort((a, b) => {
                    const faseOrder = { Liberacao: 1, Validacao: 2, Preenchimento: 3 };
                    return faseOrder[a!.fase] - faseOrder[b!.fase];
                })[0] || undefined;

        const analises = analisesDb
            .filter((result): result is NonNullable<typeof result> => result !== null)
            .map(
                (r) =>
                    ({
                        analise_qualitativa: r.informacoes_complementares ?? '',
                        criado_em: r.criado_em,
                        criador_nome: r.pessoaCriador.nome_exibicao,
                        fase: r.fase,
                        eh_liberacao_auto: r.eh_liberacao_auto,
                    }) satisfies AnaliseQualitativaDto
            );

        // Buscar uploads associados
        const uploads = await this.prisma.variavelGlobalCicloDocumento.findMany({
            where: {
                variavel_id: variavel_id,
                referencia_data: data_referencia,
                removido_em: null,
            },
            select: { arquivo: true, descricao: true, fase: true },
        });

        // Processar e formatar os resultados
        // Se estiver na fase de Preenchimento sem análise prévia, usa os valores da série
        // Para outras fases ou quando houver análise, prioriza os valores do formulário
        const useSerieVariavel = cicloCorrente.fase === 'Preenchimento' && !ultimaAnalise; // ultimaAnalise=Form Enviado

        let valoresFormatados: VariavelValorDto[];

        if (useSerieVariavel) {
            valoresFormatados = this.formatarValores(variavel, valoresSerieVariavel, []);
        } else {
            const valoresForm = ultimaAnalise?.valores as any as IUltimaAnaliseValor[];
            if (Array.isArray(valoresForm)) {
                for (const v of valoresForm) {
                    // seta a variavel mãe no item q está sem (form do preenchido natural)
                    if (!v.variavel_id) v.variavel_id = variavel_id;
                }
            }

            const remapSeriesVariavel: ValorSerieInterface[] = [];

            // busca Realizado and RealizadoAcumulado duma vez
            const getSerieVariavel = (variableId: number) => {
                const realizado = valoresSerieVariavel.find(
                    (v) => v.variavel_id === variableId && v.serie === 'Realizado'
                );
                const realizadoAcumulado = valoresSerieVariavel.find(
                    (v) => v.variavel_id === variableId && v.serie === 'RealizadoAcumulado'
                );
                return { realizado, realizadoAcumulado };
            };

            const variavelProcessadas = new Set<number>();

            // Primeiro, pra cada form
            if (valoresForm && Array.isArray(valoresForm)) {
                for (const valorForm of valoresForm) {
                    const { realizado, realizadoAcumulado } = getSerieVariavel(valorForm.variavel_id);
                    variavelProcessadas.add(valorForm.variavel_id);

                    // se tem o RealizadoAcumulado e Realizado, então recalcula o acumulado do form baseado
                    // no acumulado anterior
                    if (realizadoAcumulado && valorForm.valor_realizado) {
                        const valorRecalc =
                            parseFloat(realizadoAcumulado.valor_nominal.toString()) -
                            (realizado ? parseFloat(realizado.valor_nominal.toString()) : 0) +
                            parseFloat(valorForm.valor_realizado);

                        remapSeriesVariavel.push({
                            variavel_id: valorForm.variavel_id,
                            serie: 'RealizadoAcumulado',
                            valor_nominal: { toString: () => valorRecalc.toString() },
                        });
                    }
                }
            }

            // se sobrou alguma variável sem form, adiciona o Realizado e RealizadoAcumulado
            for (const valor of remapSeriesVariavel) {
                if (variavelProcessadas.has(valor.variavel_id)) continue;

                const { realizado, realizadoAcumulado } = getSerieVariavel(valor.variavel_id);

                if (realizado) {
                    remapSeriesVariavel.push(realizado);
                    if (realizadoAcumulado) remapSeriesVariavel.push(realizadoAcumulado);
                    variavelProcessadas.add(valor.variavel_id);
                }
            }

            valoresFormatados = this.formatarValores(variavel, remapSeriesVariavel, valoresForm);
        }

        const uploadsFormatados = this.formatarUploads(uploads);

        const pedidoCompDb = await this.prisma.variavelGlobalPedidoComplementacao.findFirst({
            where: {
                variavel_id: variavel_id,
                referencia_data: data_referencia,
                atendido: false,
                ultima_revisao: true,
            },
            select: {
                pedido: true,
                criado_em: true,
                pessoaCriador: {
                    select: { nome_exibicao: true },
                },
                ultima_revisao: true,
            },
            orderBy: { criado_em: 'desc' },
        });

        const pedido_complementacao: PSPedidoComplementacaoDto | null = pedidoCompDb
            ? {
                  pedido: pedidoCompDb.pedido,
                  criado_em: pedidoCompDb.criado_em,
                  criador_nome: pedidoCompDb.pessoaCriador.nome_exibicao,
              }
            : null;

        return {
            fase: cicloCorrente.fase,
            pedido_complementacao,
            variavel: this.formatarVariavelResumo(variavel),
            possui_variaveis_filhas: variavel.variaveis_filhas.length > 0,
            analises,
            valores: valoresFormatados,
            uploads: uploadsFormatados,
        };
    }

    private formatarValores(
        variavel: VariavelResumoInput & { variaveis_filhas: VariavelResumoInput[] },
        valores: ValorSerieInterface[],
        formValues?: IUltimaAnaliseValor[]
    ): VariavelValorDto[] {
        const valoresMap = new Map<number, VariavelValorDto>();

        const todasVariaveis = [...variavel.variaveis_filhas];
        if (todasVariaveis.length === 0) todasVariaveis.push(variavel); // Se não tem filhas, adiciona a mãe

        // caso a variável não tenha filhas, mas o formValues tenha, adiciona a variável mãe
        if (variavel.variaveis_filhas.length === 0 && Array.isArray(formValues) && formValues.length === 1) {
            formValues[0].variavel_id = variavel.id;
        }

        for (const v of todasVariaveis) {
            valoresMap.set(v.id, {
                variavel: this.formatarVariavelResumo(v),
                valor_realizado: null,
                valor_realizado_acumulado: null,
                analise_qualitativa: null,
            });
        }

        // Primeiro tenta preencher os valores com os valores do formulário
        if (formValues && Array.isArray(formValues)) {
            for (const formValue of formValues) {
                const valorDto = valoresMap.get(formValue.variavel_id);
                if (valorDto) {
                    valorDto.valor_realizado = formValue.valor_realizado || null;
                    valorDto.analise_qualitativa = formValue.analise_qualitativa || null;
                }
            }
        }

        // Isso vai ou preencher os valores do formulário
        // ou preencher os buracos onde os valores do form não existem
        for (const valor of valores) {
            const valorDto = valoresMap.get(valor.variavel_id);
            if (!valorDto) continue;

            if (valor.serie === 'Realizado' && !valorDto.valor_realizado) {
                valorDto.valor_realizado = valor.valor_nominal.toString();
            } else if (valor.serie === 'RealizadoAcumulado') {
                valorDto.valor_realizado_acumulado = valor.valor_nominal.toString();
            }
        }

        return Array.from(valoresMap.values());
    }

    private formatarUploads(uploads: UploadArquivoInterface[]): VariavelAnaliseDocumento[] {
        return uploads.map((upload) => {
            const arquivo = upload.arquivo;
            const token = this.uploadService.getDownloadToken(arquivo.id, TEMPO_EXPIRACAO_ARQUIVO);
            return {
                download_token: token.download_token,
                descricao: upload.descricao,
                id: arquivo.id,
                nome_original: arquivo.nome_original,
                fase: upload.fase,
                // no momento, sempre pode editar pois quem subiu pode editar, e os supervisores podem editar tudo, então
                // não há necessidade de verificar permissões
                pode_editar: true,
            } satisfies VariavelAnaliseDocumento;
        });
    }

    private async moveFase(
        variavelId: number,
        nextPhase: VariavelFase,
        prismaTxn: Prisma.TransactionClient,
        user: PessoaFromJwt
    ): Promise<void> {
        await prismaTxn.variavelGlobalPedidoComplementacao.updateMany({
            where: { variavel_id: variavelId, atendido: false, ultima_revisao: true },
            data: { atendido: true, atendido_em: new Date(), atendido_por: user.id },
        });

        await prismaTxn.variavelCicloCorrente.update({
            where: { variavel_id: variavelId },
            data: {
                fase: nextPhase,
                liberacao_enviada: false,
                pedido_complementacao: false,
            },
        });

        await prismaTxn.$executeRaw`SELECT f_atualiza_variavel_ciclo_corrente(${variavelId}::int)::text`;
    }

    private async marcaLiberacaoEnviada(variavelId: number, prismaTxn: Prisma.TransactionClient): Promise<void> {
        const self = await prismaTxn.variavelCicloCorrente.findFirstOrThrow({
            where: { variavel_id: variavelId },
            select: { fase: true },
        });
        if (self.fase !== 'Liberacao')
            throw new BadRequestException('A variável não está na fase de liberação, erro interno');

        await prismaTxn.variavelCicloCorrente.update({
            where: { variavel_id: variavelId },
            data: {
                liberacao_enviada: true,
            },
        });

        await prismaTxn.$executeRaw`SELECT f_atualiza_variavel_ciclo_corrente(${variavelId}::int)::text`;
    }

    private async criaPedidoComplementacao(
        variavelId: number,
        pedido: string,
        dataReferencia: Date,
        user: PessoaFromJwt,
        prismaTxn: Prisma.TransactionClient,
        now: Date
    ): Promise<void> {
        await prismaTxn.variavelCicloCorrente.update({
            where: { variavel_id: variavelId },
            data: { pedido_complementacao: true },
        });
        await prismaTxn.variavelGlobalPedidoComplementacao.create({
            data: {
                variavel_id: variavelId,
                pedido: pedido,
                criado_por: user.id,
                referencia_data: dataReferencia,
                criado_em: now,
                ultima_revisao: true,
                atendido: false,
            },
        });

        // a fase corrente já é a nova fase que retrocedeu
        const faseCorrente = await prismaTxn.variavelCicloCorrente.findFirstOrThrow({
            where: { variavel_id: variavelId },
            select: { fase: true },
        });
        // ao retroceder de fase, o apaga as analises das fases anteriores
        await prismaTxn.variavelGlobalCicloAnalise.updateMany({
            where: {
                variavel_id: variavelId,
                referencia_data: dataReferencia,
                AND: {
                    // nunca apaga o Preenchimento
                    NOT: { fase: 'Preenchimento' },
                },
                NOT: {
                    fase: faseCorrente.fase,
                },
                ultima_revisao: true,
            },
            data: {
                removido_em: now,
                removido_por: user.id,
            },
        });
    }

    private async updateSerieVariavelConferida(
        variavelId: number,
        dataReferencia: Date,
        conferida: boolean,
        prismaTxn: Prisma.TransactionClient
    ): Promise<void> {
        await prismaTxn.serieVariavel.updateMany({
            where: {
                variavel_id: variavelId,
                data_valor: dataReferencia,
            },
            data: { conferida: conferida },
        });
    }

    private formatarVariavelResumo(variavel: VariavelResumoInput): VariavelResumo {
        return {
            id: variavel.id,
            suspendida: variavel.suspendida_em !== null,
            variavel_categorica_id: variavel.variavel_categorica_id,
            casas_decimais: variavel.casas_decimais,
            periodicidade: variavel.periodicidade,
            acumulativa: variavel.acumulativa,
            codigo: variavel.codigo,
            titulo: variavel.titulo,
            valor_base: variavel.valor_base.toString(),
            unidade_medida: {
                id: variavel.unidade_medida.id,
                sigla: variavel.unidade_medida.sigla,
                descricao: variavel.unidade_medida.descricao,
            },
            variavel_mae_id: variavel.variavel_mae_id,
            recalculando: variavel.recalculando,
            recalculo_erro: variavel.recalculo_erro,
            recalculo_tempo: variavel.recalculo_tempo,
        };
    }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: SYSTEM_TIMEZONE })
    async updateVariavelCiclo() {
        if (!this.enabled) return;

        const logger = LoggerWithLog('VariavelCicloUpdateService');

        try {
            process.env.INTERNAL_DISABLE_QUERY_LOG = '1';
            await this.prisma.$transaction(async (prismaTx) => {
                const lockPromise: Promise<{ locked: boolean }[]> =
                    prismaTx.$queryRaw`SELECT pg_try_advisory_xact_lock(${JOB_CICLO_VARIAVEL}) as locked`;
                lockPromise.then(() => {
                    process.env.INTERNAL_DISABLE_QUERY_LOG = '';
                });

                const locked = await lockPromise;
                if (!locked[0].locked) return;

                const variaveis = await prismaTx.variavel.findMany({
                    where: {
                        tipo: 'Global',
                        variavel_mae_id: null,
                        removido_em: null,
                    },
                    select: {
                        id: true,
                    },
                });

                for (const variavel of variaveis) {
                    await this.processVariavel(variavel.id, logger);
                }
            });

            logger.log('Processamento do ciclo de variáveis concluído');
        } catch (error) {
            logger.error(`Erro ao atualizar ciclo de variáveis : ${error.message}`);
        } finally {
            process.env.INTERNAL_DISABLE_QUERY_LOG = '';
            await logger.saveLogs(this.prisma, { pessoa_id: CONST_BOT_USER_ID });
        }
    }

    private async processVariavel(variavelId: number, logger: LoggerWithLog) {
        try {
            // segunda transação para garantir que a variável não seja alterada enquanto processamos
            await this.prisma.$transaction(async (prismaTx) => {
                const currentState = await this.getVariavelCicloCorrente(variavelId, prismaTx);

                await prismaTx.$executeRaw`SELECT f_atualiza_variavel_ciclo_corrente(${variavelId}::int)::text`;

                const newState = await this.getVariavelCicloCorrente(variavelId, prismaTx);
                if (!newState) {
                    logger.error(`Variável ${variavelId} não encontrada após atualização`);
                    return;
                }

                if (this.hasStateChanged(currentState, newState)) {
                    logger.log(`Mudança de estado em ${variavelId}. Iniciando recálculo.`);
                    await this.recalculaVariavelNovoCiclo(variavelId, prismaTx);
                } else {
                    logger.log(`Sem alterações para a variável ${variavelId}`);
                }
            });
        } catch (error) {
            logger.error(`Erro ao processar variável ${variavelId}: ${error.message}`);
        }
    }

    private async getVariavelCicloCorrente(
        variavelId: number,
        prisma: Prisma.TransactionClient
    ): Promise<VariavelCicloCorrente | null> {
        return await prisma.variavelCicloCorrente.findUnique({ where: { variavel_id: variavelId } });
    }

    private hasStateChanged(anterior: VariavelCicloCorrente | null, atualizado: VariavelCicloCorrente): boolean {
        if (!anterior) return true;

        return (
            anterior.ultimo_periodo_valido.getTime() !== atualizado.ultimo_periodo_valido.getTime() ||
            anterior.fase !== atualizado.fase
        );
    }

    private async recalculaVariavelNovoCiclo(variavelId: number, prismaTxn: Prisma.TransactionClient) {
        await this.variavelService.recalc_series_dependentes([variavelId], prismaTxn);
        await this.variavelService.recalc_indicador_usando_variaveis([variavelId], prismaTxn);
    }

    async upsertVariavelGlobalCicloDocumento(
        variavel_id: number,
        referencia_data: Date,
        fase: VariavelFase,
        uploads: UpsertVariavelGlobalCicloDocumentoDto[],
        user: PessoaFromJwt,
        prismaTx: Prisma.TransactionClient
    ): Promise<void> {
        const existingDocs = await prismaTx.variavelGlobalCicloDocumento.findMany({
            where: {
                variavel_id: variavel_id,
                referencia_data: referencia_data,
                removido_em: null,
            },
            select: { arquivo_id: true, id: true },
        });

        const existingArquivoIds = new Set<number>();
        for (const upload of uploads) {
            const uploadArquivoId = this.uploadService.checkUploadOrDownloadToken(upload.upload_token);
            const exitingDoc = existingDocs.find((doc) => doc.arquivo_id === uploadArquivoId);
            existingArquivoIds.add(uploadArquivoId);

            if (exitingDoc) {
                await prismaTx.variavelGlobalCicloDocumento.update({
                    where: { id: exitingDoc.id },
                    data: {
                        descricao: upload.descricao,
                    },
                });
            } else {
                await prismaTx.variavelGlobalCicloDocumento.create({
                    data: {
                        variavel_id: variavel_id,
                        referencia_data: referencia_data,
                        descricao: upload.descricao,
                        arquivo_id: uploadArquivoId,
                        criado_por: user.id,
                        fase: fase,
                    },
                });
            }
        }

        // deleta os que não estão no array de uploads
        const removidos = existingDocs.filter((doc) => !existingArquivoIds.has(doc.arquivo_id));
        if (removidos.length > 0) {
            await prismaTx.variavelGlobalCicloDocumento.updateMany({
                where: {
                    arquivo_id: { in: removidos.map((doc) => doc.arquivo_id) },
                    variavel_id: variavel_id,
                    referencia_data: referencia_data,
                },
                data: {
                    removido_em: new Date(),
                    removido_por: user.id,
                },
            });
        }
    }
}
