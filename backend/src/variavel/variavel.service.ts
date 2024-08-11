import {
    BadRequestException,
    HttpException,
    Inject,
    Injectable,
    Logger,
    NotFoundException,
    forwardRef,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
    Periodicidade,
    Prisma,
    Serie,
    TipoVariavel,
    TipoVariavelCategorica,
    VariavelCategoricaValor,
} from '@prisma/client';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { LoggerWithLog } from '../common/LoggerWithLog';
import { CONST_CRONO_VAR_CATEGORICA_ID } from '../common/consts';
import { Date2YMD, DateYMD } from '../common/date2ymd';
import { MIN_DTO_SAFE_NUM } from '../common/dto/consts';
import { AnyPageTokenJwtBody, PaginatedWithPagesDto } from '../common/dto/paginated.dto';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { Object2Hash } from '../common/object2hash';
import { PrismaService } from '../prisma/prisma.service';
import {
    ExistingSerieJwt,
    NonExistingSerieJwt,
    SerieJwt,
    SerieUpsert,
    ValidatedUpsert,
} from './dto/batch-serie-upsert.dto';
import {
    CreateGeradorVariaveBaselDto,
    CreateGeradorVariavelPDMDto,
    CreatePeloIndicadorDto,
    CreateVariavelBaseDto,
    CreateVariavelPDMDto,
    VariaveisPeriodosDto,
} from './dto/create-variavel.dto';
import { FilterVariavelDto, FilterVariavelGlobalDto } from './dto/filter-variavel.dto';
import { ListSeriesAgrupadas, VariavelDetailDto, VariavelGlobalDetailDto } from './dto/list-variavel.dto';
import { UpdateVariavelDto } from './dto/update-variavel.dto';
import {
    FilterSVNPeriodoDto,
    SACicloFisicoDto,
    SerieValorNomimal,
    SerieValorPorPeriodo,
    ValorSerieExistente,
    VariavelGlobalItemDto,
    VariavelItemDto,
} from './entities/variavel.entity';
import { PrismaHelpers } from '../common/PrismaHelpers';
import { MetaService } from '../meta/meta.service';

/**
 * ordem que é populado na função populaSeriesExistentes, usada no serviço do VariavelFormulaCompostaService
 */
export const ORDEM_SERIES_RETORNO: Serie[] = ['Previsto', 'PrevistoAcumulado', 'Realizado', 'RealizadoAcumulado'];

const InicioFimErrMsg =
    'Inicio/Fim da medição da variável não pode ser nulo quando a periodicidade da variável é diferente do indicador';

type IndicadorInfo = {
    id: number;
    iniciativa_id: number | null;
    atividade_id: number | null;
    regionalizavel: boolean;
    nivel_regionalizacao: number | null;
    meta_id: number | null;
    periodicidade?: Periodicidade;
};

export type VariavelComCategorica = {
    id: number;
    acumulativa: boolean;
    variavel_categorica: {
        id: number;
        tipo: TipoVariavelCategorica;
        valores: VariavelCategoricaValor[];
    } | null;
};

type FiltroData = {
    data_inicio?: Date;
    data_fim?: Date;
    data_valor?: Date;
};

@Injectable()
export class VariavelService {
    private readonly logger = new Logger(VariavelService.name);
    constructor(
        private readonly jwtService: JwtService,
        @Inject(forwardRef(() => MetaService))
        private readonly metaService: MetaService,
        private readonly prisma: PrismaService
    ) {}

    async loadVariaveisComCategorica(
        prismaTxn: Prisma.TransactionClient,
        variavelId: number[]
    ): Promise<VariavelComCategorica[]> {
        const rows = await prismaTxn.variavel.findMany({
            where: { id: { in: variavelId } },
            select: {
                id: true,
                acumulativa: true,
                variavel_categorica: {
                    select: {
                        id: true,
                        tipo: true,
                        valores: true,
                    },
                },
            },
        });
        for (const v of rows) {
            if (v && v.variavel_categorica?.tipo == 'Cronograma')
                throw new HttpException('Variável do tipo Cronograma não pode ser atualizada', 400);
        }

        return rows;
    }

    async loadVariavelComCategorica(
        prismaTxn: Prisma.TransactionClient,
        variavelId: number
    ): Promise<VariavelComCategorica> {
        const v = await this.loadVariaveisComCategorica(prismaTxn, [variavelId]);

        if (v.length == 0) throw new HttpException('Variável não encontrada', 400);
        return v[0];
    }

    async buildVarResponsaveis(
        variableId: number,
        responsaveis: number[]
    ): Promise<Prisma.VariavelResponsavelCreateManyInput[]> {
        const arr: Prisma.VariavelResponsavelCreateManyInput[] = [];
        for (const pessoaId of responsaveis) {
            arr.push({
                variavel_id: variableId,
                pessoa_id: pessoaId,
            });
        }
        return arr;
    }

    async create(tipo: TipoVariavel, dto: CreateVariavelBaseDto | CreateVariavelPDMDto, user: PessoaFromJwt) {
        const logger = LoggerWithLog('Criação de variável');
        // TODO: verificar se todos os membros de createVariavelDto.responsaveis estão ativos
        // e sao realmente do órgão createVariavelDto.orgao_id

        logger.log(`Dados recebidos: ${JSON.stringify(dto)}`);
        if (dto.supraregional === null) delete dto.supraregional;

        let indicador: IndicadorInfo | undefined = undefined;
        let codigo: string;
        if (tipo == 'PDM') {
            if (!('indicador_id' in dto) || !dto.indicador_id)
                throw new BadRequestException('Indicador é obrigatório para variáveis do PDM');
            if (!('codigo' in dto) || !dto.codigo)
                throw new BadRequestException('Código é obrigatório para variáveis do PDM');

            codigo = dto.codigo;
            indicador = await this.buscaIndicadorParaVariavel(dto.indicador_id);

            const metaRow = await this.prisma.view_pdm_meta_iniciativa_atividade.findFirstOrThrow({
                where: {
                    meta_id: indicador.meta_id ?? undefined,
                    iniciativa_id: indicador.iniciativa_id,
                    atividade_id: indicador.atividade_id,
                },
                select: { meta_id: true },
            });
            await this.metaService.assertMetaWriteOrThrow('PDM', metaRow.meta_id, user, 'variavel do indicador');

            this.fixIndicadorInicioFim(dto, indicador);
        } else if (tipo == 'Global') {
            this.checkPeriodoVariavelGlobal(dto);

            // Verificar: todo mundo pode criar pra qualquer órgão (responsavel, além do orgao_proprietario_id que é usado no grupo)
        } else {
            throw new BadRequestException('Tipo de variável inválido para criação manual');
        }

        await this.validaGruposResponsavel(dto, MIN_DTO_SAFE_NUM);

        this.checkOrgaoProprietario(tipo, dto, user);
        const responsaveis = 'responsaveis' in dto ? dto.responsaveis : [];

        // depois dos checks, pois pode deixar buracos na sequencia
        if (tipo == 'Global') {
            codigo = await this.geraCodigoVariavel(tipo, dto);
        }

        const created = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                if (dto.variavel_categorica_id !== null && dto.variavel_categorica_id) {
                    await this.carregaVariavelCategorica(prismaTx, dto.variavel_categorica_id);
                }

                if (indicador) {
                    if (indicador.regionalizavel && dto.regiao_id) {
                        const regiao = await this.prisma.regiao.findFirstOrThrow({
                            where: { id: dto.regiao_id },
                            select: { nivel: true },
                        });

                        if (regiao.nivel != indicador.nivel_regionalizacao)
                            throw new BadRequestException(
                                `O nível da região (${regiao.nivel}) precisa ser igual ao do indicador (${indicador.nivel_regionalizacao})`
                            );
                    }

                    if (!indicador.regionalizavel && dto.regiao_id)
                        throw new BadRequestException(`Indicador sem regionalização, não é possível enviar região.`);
                }

                const ret = await this.performVariavelSave(
                    tipo,
                    prismaTx,
                    dto,
                    indicador,
                    responsaveis,
                    logger,
                    codigo
                );
                await logger.saveLogs(prismaTx, user.getLogData());
                return ret;
            },
            {
                isolationLevel: 'Serializable',
                maxWait: 60 * 1000,
                timeout: 120 * 1000,
            }
        );

        return { id: created.id };
    }

    async geraCodigoVariavel(
        tipo: TipoVariavel,
        dto: Pick<CreateVariavelBaseDto, 'periodicidade' | 'inicio_medicao' | 'variavel_categorica_id'>
    ): Promise<string> {
        const deparaTipoCategorica: Record<TipoVariavelCategorica, string> = {
            Binaria: 'BIN', // ou "SN" pra SIM/NAO ?
            Cronograma: 'CRONO',
            Qualitativa: 'QUALI',
        };

        const deparaAmbienteVariavel: Record<TipoVariavel, string> = {
            Global: '',
            Calculada: 'CALC',
            PDM: 'PDM',
        };

        const deparaPeriodicidade: Record<Periodicidade, string> = {
            Mensal: '01',
            Anual: '12',
            Bimestral: '02',
            Trimestral: '03',
            Quadrimestral: '04',
            Semestral: '06',
            Quinquenal: '60',
            Secular: '120', // tao raro que poderia sair do padrão?
        };

        if (!dto.inicio_medicao) throw new BadRequestException('Inicio de medição é obrigatório para gerar código');
        const ano = +dto.inicio_medicao.getFullYear().toString();
        let contador: number = -1;

        for (let i = 0; i < 100 && contador === -1; i++) {
            try {
                const tryUpdate = await this.prisma.variavelNumeroSequencial.upsert({
                    where: { ano_referencia: ano },
                    update: { sequencial: { increment: 1 } },
                    create: {
                        ano_referencia: ano,
                        sequencial: 1,
                    },
                    select: { sequencial: true },
                });
                contador = tryUpdate.sequencial;
            } catch (error) {
                this.logger.error(`Erro ao tentar criar sequencial para ano ${ano}: ${error}`);
            }
        }
        const contadorStr = String(contador).padStart(5, '0');

        let categorica: string = '';

        if (dto.variavel_categorica_id) {
            const variavelCategorica = await this.prisma.variavelCategorica.findFirst({
                where: { id: dto.variavel_categorica_id },
                select: { tipo: true },
            });
            if (!variavelCategorica) throw new BadRequestException('Variável categórica não encontrada');
            categorica = deparaTipoCategorica[variavelCategorica.tipo];
        }

        const dotParts = [categorica, deparaPeriodicidade[dto.periodicidade], deparaAmbienteVariavel[tipo], contadorStr]
            .filter((e) => e && e.length > 0)
            .join('.');

        return `${dotParts}/${ano}`;
    }

    async create_region_generated(
        tipo: TipoVariavel,
        dto: CreateGeradorVariaveBaselDto | CreateGeradorVariavelPDMDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId[]> {
        const logger = LoggerWithLog('Geração de variáveis regionais');
        logger.verbose(`Dados recebidos: ${JSON.stringify(dto)}`);

        const regioesDb = await this.prisma.regiao.findMany({
            where: { id: { in: dto.regioes }, pdm_codigo_sufixo: { not: null }, removido_em: null },
            select: { nivel: true },
        });
        if (regioesDb.length != dto.regioes.length)
            throw new HttpException('Todas as regiões precisam ter um código de sufixo configurado', 400);

        const porNivel: Record<number, number> = {};
        for (const r of regioesDb) {
            if (!porNivel[r.nivel]) porNivel[r.nivel] = 0;
            porNivel[r.nivel]++;
        }
        if (Object.keys(porNivel).length != 1)
            throw new HttpException('Todas as regiões precisam ser do mesmo nível', 400);

        let indicador_id: number | undefined = undefined;
        if (tipo == 'PDM') {
            if (!('indicador_id' in dto))
                throw new BadRequestException('Indicador é obrigatório para variáveis do PDM');

            indicador_id = dto.indicador_id;
        }

        const responsaveis = 'responsaveis' in dto ? dto.responsaveis : [];

        const indicador = indicador_id ? await this.buscaIndicadorParaVariavel(indicador_id) : undefined;

        if (indicador) this.fixIndicadorInicioFim(dto, indicador);
        // TODO para Global: aqui precisa calcular o inicio/fim da variavel de alguma forma, ou obrigar a passar

        const nivel_regionalizacao = regioesDb[0].nivel;

        if (nivel_regionalizacao == 1 && dto.criar_formula_composta) {
            throw new BadRequestException('Não é possível criar fórmula composta para regiões de nível de municipio');
        }

        let codigo: string;
        if (tipo == 'Global') {
            if (dto.regiao_id) throw new BadRequestException('Região não pode ser enviada para geração de variaveis.');
            codigo = await this.geraCodigoVariavel(tipo, dto);
        } else {
            if (!('codigo' in dto) || !dto.codigo)
                throw new BadRequestException('Código é obrigatório para variáveis do PDM');
            codigo = dto.codigo;
        }

        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId[]> => {
                const ids: number[] = [];

                const regions = await this.prisma.regiao.findMany({
                    where: {
                        id: { in: dto.regioes },
                        pdm_codigo_sufixo: { not: null },
                        removido_em: null,
                    },
                    select: { pdm_codigo_sufixo: true, descricao: true, id: true },
                });

                const prefixo = codigo;
                delete (dto as any).regioes;
                delete (dto as any).codigo;
                for (const regiao of regions) {
                    const variavel = await this.performVariavelSave(
                        tipo,
                        prismaTxn,
                        {
                            ...dto, // aqui eu passo tudo, pq no performVariavelSave eu deixo só o que é necessário
                            titulo: dto.titulo + ' ' + regiao.descricao,
                            regiao_id: regiao.id,
                        },
                        indicador,
                        responsaveis,
                        logger,
                        prefixo + regiao.pdm_codigo_sufixo
                    );
                    ids.push(variavel.id);
                }

                if (dto.supraregional) {
                    logger.log('Criando variável supraregional');
                    const supra = await this.performVariavelSave(
                        tipo,
                        prismaTxn,
                        {
                            ...dto, // aqui eu deixo tudo tbm, só pra não duplicar 100%
                            titulo: dto.titulo,
                        },
                        indicador,
                        responsaveis,
                        logger,
                        prefixo
                    );
                    ids.push(supra.id);
                }

                if (dto.criar_formula_composta) {
                    const regioes_ids = regions.map((r) => r.id);

                    await this.geraFormulaComposta(
                        logger,
                        ids,
                        codigo,
                        regioes_ids,
                        nivel_regionalizacao,
                        dto.acumulativa, // usar_serie_acumulada
                        prismaTxn
                    );
                }

                await logger.saveLogs(prismaTxn, user.getLogData());
                return ids.map((n) => ({ id: n }));
            },
            {
                isolationLevel: 'Serializable',
                maxWait: 60 * 1000,
                timeout: 120 * 1000,
            }
        );

        return created;
    }

    private async geraFormulaComposta(
        logger: LoggerWithLog,
        todasVariaveis: number[],
        codigo: string,
        regionIDs: number[],
        nivel_regionalizacao: number,
        usar_serie_acumulada: boolean,
        prismaTxn: Prisma.TransactionClient
    ) {
        // SQL que retorna por nível as regiões pai e os filhos que estão dentro dela, agrupando por nivel.
        const fc_tasks: {
            nivel: number;
            parent: number | null;
            id: number;
            output_ids: number[];
            pdm_codigo_sufixo: string;
        }[] = await prismaTxn.$queryRaw`SELECT *
        FROM f_regiao_pai_por_filhos_por_nivel(${regionIDs}::bigint[]::int[], ${nivel_regionalizacao}::int);`;
        logger.debug(`GeraFormulaComposta: ${JSON.stringify(fc_tasks)}`);

        const varDb = await prismaTxn.variavel.findMany({
            where: { id: { in: todasVariaveis }, regiao_id: { not: null } },
            select: {
                regiao_id: true,
                id: true,
            },
        });

        for (const fc of fc_tasks) {
            // busca apenas as variáveis que estão na região
            const varEscopo = varDb.filter((v) => fc.output_ids.includes(v.regiao_id!)).map((v) => v.id);

            const formula = varEscopo.map((r) => '$_' + r.toString()).join(' + ');

            const fc_id = await prismaTxn.formulaComposta.create({
                data: {
                    titulo: `${codigo}.${fc.pdm_codigo_sufixo}`,
                    formula: formula,
                    formula_compilada: formula,
                    criar_variavel: true,
                    autogerenciavel: true,
                    tipo_pdm: 'PS',
                    FormulaCompostaVariavel: {
                        create: varEscopo.map((vid) => ({
                            variavel_id: vid,
                            janela: 1,
                            referencia: '_' + vid.toString(),
                            usar_serie_acumulada: usar_serie_acumulada,
                        })),
                    },
                },
                select: { id: true },
            });
            logger.log(`Formula composta criada: ${fc_id.id}`);
        }
    }

    private async performVariavelSave(
        tipo: TipoVariavel,
        prismaTxn: Prisma.TransactionClient,
        dto: CreateVariavelBaseDto,
        indicador: IndicadorInfo | undefined,
        responsaveis: number[],
        logger: LoggerWithLog | undefined,
        codigo: string
    ) {
        logger = logger ?? LoggerWithLog('Criação de variável');

        const indicador_id = indicador?.id;
        const jaEmUso = await prismaTxn.variavel.count({
            where: {
                removido_em: null,
                codigo: codigo,

                OR: [
                    indicador_id
                        ? {
                              tipo: 'PDM',
                              indicador_variavel: {
                                  some: {
                                      indicador_id: indicador_id,
                                  },
                              },
                          }
                        : {},
                    {
                        tipo: 'Global',
                    },
                ],
            },
        });
        if (jaEmUso > 0 && tipo == 'PDM')
            throw new BadRequestException(`Código ${codigo} já está em uso no indicador.`);
        if (jaEmUso > 0 && tipo == 'Global')
            throw new BadRequestException(`Código ${codigo} já está em uso no sistema.`);

        // TODO verificar quem pode usar o orgao_proprietario_id
        // TODO orgao_proprietario_id, validacao_grupo_ids, liberacao_grupo_ids

        const periodos = dto.periodos ? this.getPeriodTuples(dto.periodos) : {};

        const variavel = await prismaTxn.variavel.create({
            data: {
                tipo,
                titulo: dto.titulo,
                codigo: codigo,
                acumulativa: dto.acumulativa,
                mostrar_monitoramento: dto.mostrar_monitoramento,
                unidade_medida_id: dto.unidade_medida_id,
                ano_base: dto.ano_base,
                valor_base: dto.valor_base,
                periodicidade: dto.periodicidade,
                polaridade: dto.polaridade,
                orgao_id: dto.orgao_id,
                regiao_id: dto.regiao_id,
                variavel_categorica_id: dto.variavel_categorica_id,
                casas_decimais: dto.casas_decimais,
                atraso_meses: dto.atraso_meses,
                inicio_medicao: dto.inicio_medicao,
                fim_medicao: dto.fim_medicao,
                supraregional: dto.supraregional,

                dado_aberto: dto.dado_aberto,
                metodologia: dto.metodologia,
                descricao: dto.descricao,
                fonte_id: dto.fonte_id,
                orgao_proprietario_id: dto.orgao_proprietario_id,

                ...periodos,

                indicador_variavel: indicador_id ? { create: { indicador_id: indicador_id } } : undefined,
                VariavelAssuntoVariavel: {
                    createMany:
                        Array.isArray(dto.assuntos) && dto.assuntos.length > 0
                            ? {
                                  data: dto.assuntos.map((assunto_id) => ({
                                      assunto_variavel_id: assunto_id,
                                  })),
                              }
                            : undefined,
                },
            },
            select: { id: true },
        });
        logger.log(`Variável criada: ${variavel.id}`);

        if (indicador) {
            logger.log(`Resync indicador variável: ${JSON.stringify(indicador)}`);
            await this.resyncIndicadorVariavel(indicador, variavel.id, prismaTxn);
        }

        await prismaTxn.variavelResponsavel.createMany({
            data: await this.buildVarResponsaveis(variavel.id, responsaveis),
        });
        logger.verbose(`Responsáveis adicionados: ${responsaveis.join(', ')}`);

        const variavelId = variavel.id;

        await this.insertVariavelResponsavel(dto, prismaTxn, variavelId, logger);

        await this.recalc_series_dependentes([variavel.id], prismaTxn);

        return variavel;
    }

    private async insertVariavelResponsavel(
        dto: UpdateVariavelDto,
        prismaTxn: Prisma.TransactionClient,
        variavelId: number,
        logger: LoggerWithLog
    ) {
        if (Array.isArray(dto.medicao_grupo_ids)) {
            await prismaTxn.variavelGrupoResponsavelVariavel.createMany({
                data: dto.medicao_grupo_ids.map((grupo_id) => ({
                    variavel_id: variavelId,
                    grupo_responsavel_variavel_id: grupo_id,
                })),
            });
            logger.verbose(`Grupos de medição adicionados: ${dto.medicao_grupo_ids.join(', ')}`);
        }

        if (Array.isArray(dto.validacao_grupo_ids)) {
            await prismaTxn.variavelGrupoResponsavelVariavel.createMany({
                data: dto.validacao_grupo_ids.map((grupo_id) => ({
                    variavel_id: variavelId,
                    grupo_responsavel_variavel_id: grupo_id,
                })),
            });
            logger.verbose(`Grupos de validação adicionados: ${dto.validacao_grupo_ids.join(', ')}`);
        }

        if (Array.isArray(dto.liberacao_grupo_ids)) {
            await prismaTxn.variavelGrupoResponsavelVariavel.createMany({
                data: dto.liberacao_grupo_ids.map((grupo_id) => ({
                    variavel_id: variavelId,
                    grupo_responsavel_variavel_id: grupo_id,
                })),
            });
            logger.verbose(`Grupos de liberação adicionados: ${dto.liberacao_grupo_ids.join(', ')}`);
        }
    }

    private getPeriodTuples(p: VariaveisPeriodosDto | null): {
        periodo_preenchimento: number[];
        periodo_validacao: number[];
        periodo_liberacao: number[];
    } {
        const periodo_preenchimento: number[] = [];
        const periodo_validacao: number[] = [];
        const periodo_liberacao: number[] = [];

        // se caiu nessa função é pq quer atualizar
        if (!p) return { periodo_preenchimento, periodo_validacao, periodo_liberacao };

        if (p.preenchimento_inicio >= p.preenchimento_fim) {
            throw new BadRequestException('Preenchimento: Início deve ser menor que fim');
        }
        if (p.validacao_inicio >= p.validacao_fim) {
            throw new BadRequestException('Validação: Início deve ser menor que fim');
        }
        if (p.liberacao_inicio >= p.liberacao_fim) {
            throw new BadRequestException('Liberação: Início deve ser menor que fim');
        }

        // desativando regra por enquanto
        // Cada período de preenchimento deve ser menor que o próximo
        //        if (p.preenchimento_fim >= p.validacao_inicio) {
        //            throw new Error('Preenchimento fim deve ser menor que Validação início');
        //        }
        //        if (p.validacao_fim >= p.liberacao_inicio) {
        //            throw new Error('Validação fim deve ser menor que Liberação início');
        //        }

        return {
            periodo_preenchimento: [p.preenchimento_inicio, p.preenchimento_fim],
            periodo_liberacao: [p.liberacao_inicio, p.liberacao_fim],
            periodo_validacao: [p.validacao_inicio, p.validacao_fim],
        };
    }

    private async fixIndicadorInicioFim(
        createVariavelDto: CreateVariavelBaseDto | CreateGeradorVariaveBaselDto,
        indicador: IndicadorInfo
    ) {
        if (createVariavelDto.atraso_meses === undefined) createVariavelDto.atraso_meses = 1;
        if (createVariavelDto.periodicidade === indicador.periodicidade) {
            createVariavelDto.fim_medicao = null;
            createVariavelDto.inicio_medicao = null;
        } else {
            ['inicio_medicao', 'fim_medicao'].forEach((e: 'inicio_medicao' | 'fim_medicao') => {
                if (!createVariavelDto[e]) {
                    throw new HttpException(`${e}| ${InicioFimErrMsg}`, 400);
                }
            });
        }
    }

    async buscaIndicadorParaVariavel(indicador_id: number) {
        const indicador = await this.prisma.indicador.findFirst({
            where: { id: indicador_id, removido_em: null },
            select: {
                id: true,
                iniciativa_id: true,
                atividade_id: true,
                meta_id: true,
                periodicidade: true,
                regionalizavel: true,
                nivel_regionalizacao: true,
            },
        });
        if (!indicador) throw new HttpException('Indicador não encontrado', 400);
        return indicador!;
    }

    async resyncIndicadorVariavel(indicador: IndicadorInfo, variavel_id: number, prisma: Prisma.TransactionClient) {
        await prisma.indicadorVariavel.deleteMany({
            where: {
                variavel_id: variavel_id,
                NOT: { indicador_origem_id: null },
            },
        });

        this.logger.log(`resyncIndicadorVariavel: variavel ${variavel_id}, indicador: ${JSON.stringify(indicador)}`);

        // se o indicador é uma atividade, precisamos testar se essa atividade tem herança para a
        // iniciativa
        if (indicador.atividade_id) {
            const atividade = await prisma.atividade.findFirstOrThrow({
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
            this.logger.log(`resyncIndicadorVariavel: atividade encontrada ${JSON.stringify(atividade)}`);
            if (atividade.compoe_indicador_iniciativa) {
                const indicadorDaIniciativa = atividade.iniciativa.Indicador[0];

                if (!indicadorDaIniciativa) {
                    this.logger.warn(
                        `resyncIndicadorVariavel: Atividade ID=${indicador.atividade_id} compoe_indicador_iniciativa mas não tem indicador ativo`
                    );
                } else {
                    const data = {
                        indicador_id: indicadorDaIniciativa.id,
                        variavel_id: variavel_id,
                        indicador_origem_id: indicador.id,
                    };
                    this.logger.log(`resyncIndicadorVariavel: criando ${JSON.stringify(data)}`);
                    await prisma.indicadorVariavel.create({ data: data });
                }

                // atividade tbm compõe a meta, então precisa levar essa variavel para lá também
                // 'recursão' manual
                if (atividade.iniciativa.compoe_indicador_meta) {
                    this.logger.log(
                        `resyncIndicadorVariavel: iniciativa da atividade compoe_indicador_meta, buscando indicador da meta`
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
                            `resyncIndicadorVariavel: indicador da meta ${atividade.iniciativa.meta_id} não foi encontrado!`
                        );
                    } else {
                        const data = {
                            indicador_id: indicadorDaMeta.id,
                            variavel_id: variavel_id,
                            indicador_origem_id: indicadorDaIniciativa.id,
                        };
                        this.logger.log(`resyncIndicadorVariavel: criando ${JSON.stringify(data)}`);
                        await prisma.indicadorVariavel.create({
                            data: data,
                        });
                    }
                }
            }
        } else if (indicador.iniciativa_id) {
            // praticamente a mesma coisa, porém começa já na iniciativa
            const iniciativa = await prisma.iniciativa.findFirstOrThrow({
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
            this.logger.log(`resyncIndicadorVariavel: iniciativa encontrada ${JSON.stringify(iniciativa)}`);

            if (iniciativa.compoe_indicador_meta) {
                const indicadorDaMeta = iniciativa.meta.indicador[0];

                if (!indicadorDaMeta) {
                    this.logger.warn(
                        `resyncIndicadorVariavel: Iniciativa ${indicador.iniciativa_id} compoe_indicador_meta mas não tem indicador ativo na meta`
                    );
                } else {
                    const data = {
                        indicador_id: indicadorDaMeta.id,
                        variavel_id: variavel_id,
                        indicador_origem_id: indicador.id,
                    };
                    this.logger.log(`resyncIndicadorVariavel: criando ${JSON.stringify(data)}`);
                    await prisma.indicadorVariavel.create({ data: data });
                }
            }
        }
    }

    async findAll(tipo: TipoVariavel, filters: FilterVariavelDto): Promise<VariavelItemDto[]> {
        if (
            !filters.indicador_id &&
            !filters.meta_id &&
            !filters.iniciativa_id &&
            !filters.atividade_id &&
            !filters.regiao_id &&
            !filters.assuntos &&
            !filters.id
        ) {
            throw new BadRequestException(
                'Use ao menos um dos filtros: id, indicador_id, meta_id, iniciativa_id, atividade_id, regiao_id ou assuntos'
            );
        }

        const whereSet = this.getVariavelWhereSet(filters);

        // TODO seria bom verificar permissões do usuário, se realmente poderia visualizar [logo fazer batch edit dos valores] de todas as variaveis
        // do indicados, puxando as metas
        // atualmente o filtro ta só no frontend, pq o usuário não chegaria nesse endpoint sem usar o filtro de ID,
        // e o endpoint de metas já aplica o filtro
        // já que nessa listagem é retornado o token usado no batch

        const listActive = await this.prisma.variavel.findMany({
            where: {
                AND: whereSet,
                tipo: tipo == 'Global' ? { in: ['Global', 'Calculada'] } : tipo,
            },
            select: {
                id: true,
                titulo: true,
                codigo: true,
                acumulativa: true,
                casas_decimais: true,
                fim_medicao: true,
                inicio_medicao: true,
                atraso_meses: true,
                suspendida_em: true,
                mostrar_monitoramento: true,
                polaridade: true,
                unidade_medida: {
                    select: {
                        id: true,
                        descricao: true,
                        sigla: true,
                    },
                },
                ano_base: true,
                valor_base: true,
                periodicidade: true,
                orgao: {
                    select: {
                        id: true,
                        descricao: true,
                        sigla: true,
                    },
                },
                regiao: {
                    select: {
                        id: true,
                        nivel: true,
                        descricao: true,
                        parente_id: true,
                        codigo: true,
                        pdm_codigo_sufixo: true,
                    },
                },
                indicador_variavel: {
                    select: {
                        desativado: true,
                        id: true,
                        aviso_data_fim: true,
                        indicador_origem: {
                            select: {
                                id: true,
                                titulo: true,
                                meta: {
                                    select: {
                                        id: true,
                                        titulo: true,
                                    },
                                },
                                iniciativa: {
                                    select: {
                                        id: true,
                                        titulo: true,
                                    },
                                },
                                atividade: {
                                    select: {
                                        id: true,
                                        titulo: true,
                                    },
                                },
                            },
                        },
                        indicador: {
                            select: {
                                id: true,
                                titulo: true,
                                meta: {
                                    select: {
                                        id: true,
                                        titulo: true,
                                    },
                                },
                                iniciativa: {
                                    select: {
                                        id: true,
                                        titulo: true,
                                    },
                                },
                                atividade: {
                                    select: {
                                        id: true,
                                        titulo: true,
                                    },
                                },
                            },
                        },
                    },
                },
                variavel_responsavel: {
                    select: {
                        pessoa: { select: { id: true, nome_exibicao: true } },
                    },
                },
                variavel_categorica_id: true,
            },
        });

        const variaveisCrono = listActive.filter((v) => v.variavel_categorica_id === CONST_CRONO_VAR_CATEGORICA_ID);
        const etapaDoCrono = await this.prisma.etapa.findMany({
            where: {
                variavel_id: { in: variaveisCrono.map((v) => v.id) },
            },
            select: {
                id: true,
                variavel_id: true,
                titulo: true,
            },
        });

        const mapEtapa = etapaDoCrono.reduce((acc: Record<string, any>, etapa: any) => {
            acc[etapa.variavel_id!] = {
                id: etapa.id,
                titulo: etapa.titulo ?? '',
            };
            return acc;
        }, {});

        const ret = listActive.map((row) => {
            const responsaveis = row.variavel_responsavel.map((responsavel) => {
                return {
                    id: responsavel.pessoa.id,
                    nome_exibicao: responsavel.pessoa.nome_exibicao,
                };
            });

            let indicador_variavel: typeof row.indicador_variavel = [];
            // filtra as variaveis novamente caso tiver filtros por indicador ou atividade
            if (filters.indicador_id || filters.iniciativa_id || filters.atividade_id) {
                for (const iv of row.indicador_variavel) {
                    if (filters.atividade_id && filters.atividade_id === iv.indicador.atividade?.id) {
                        indicador_variavel.push(iv);
                    } else if (filters.indicador_id && filters.indicador_id === iv.indicador.id) {
                        indicador_variavel.push(iv);
                    } else if (filters.iniciativa_id && filters.iniciativa_id === iv.indicador.iniciativa?.id) {
                        indicador_variavel.push(iv);
                    }
                }
            } else {
                indicador_variavel = row.indicador_variavel;
            }

            return {
                acumulativa: row.acumulativa,
                atraso_meses: row.atraso_meses,
                casas_decimais: row.casas_decimais,
                codigo: row.codigo,
                id: row.id,
                mostrar_monitoramento: row.mostrar_monitoramento,
                unidade_medida: {
                    descricao: row.unidade_medida.descricao,
                    id: row.unidade_medida.id,
                    sigla: row.unidade_medida.sigla,
                },
                titulo: row.titulo,
                ano_base: row.ano_base,
                valor_base: row.valor_base,
                periodicidade: row.periodicidade,
                polaridade: row.polaridade,
                orgao: row.orgao,
                regiao: row.regiao,
                variavel_categorica_id: row.variavel_categorica_id,
                etapa: row.variavel_categorica_id === CONST_CRONO_VAR_CATEGORICA_ID ? mapEtapa[row.id] : null,
                inicio_medicao: Date2YMD.toStringOrNull(row.inicio_medicao),
                fim_medicao: Date2YMD.toStringOrNull(row.fim_medicao),
                indicador_variavel: indicador_variavel,
                responsaveis: responsaveis,
                suspendida: row.suspendida_em ? true : false,
            } satisfies VariavelItemDto;
        });

        return ret;
    }

    async findAllGlobal(
        filters: FilterVariavelGlobalDto,
        user: PessoaFromJwt
    ): Promise<PaginatedWithPagesDto<VariavelGlobalItemDto>> {
        let retToken = filters.token_paginacao;

        let ipp = filters.ipp ?? 50;
        const page = filters.pagina ?? 1;
        let total_registros = 0;
        let tem_mais = false;

        if (page > 1 && !retToken) throw new HttpException('Campo obrigatório para paginação', 400);

        const filterToken = filters.token_paginacao;
        // para não atrapalhar no hash, remove o campo pagina
        delete filters.pagina;
        delete filters.token_paginacao;

        const palavrasChave = await this.buscaIdsPalavraChave(filters.palavra_chave);

        let now = new Date(Date.now());
        if (filterToken) {
            const decoded = this.decodeNextPageToken(filterToken, filters);
            total_registros = decoded.total_rows;
            ipp = decoded.ipp;
            now = new Date(decoded.issued_at);
        }

        const offset = (page - 1) * ipp;

        //const permissionsSet: TODO: filtrar por plano do user? etc
        const filterSet = this.getVariavelGlobalWhereSet(filters, palavrasChave);
        const linhas = await this.prisma.viewVariavelGlobal.findMany({
            where: {
                AND: filterSet,
            },
            include: {
                orgao: { select: { id: true, sigla: true, descricao: true } },
                orgao_proprietario: { select: { id: true, sigla: true, descricao: true } },
            },
            orderBy: [{ [filters.ordem_coluna]: filters.ordem_direcao === 'asc' ? 'asc' : 'desc' }, { codigo: 'asc' }],
            skip: offset,
            take: ipp,
        });

        if (filterToken) {
            retToken = filterToken;
            tem_mais = offset + linhas.length < total_registros;
        } else {
            const info = await this.encodeNextPageToken(filters, now, user, palavrasChave);
            retToken = info.jwt;
            total_registros = info.body.total_rows;
            tem_mais = offset + linhas.length < total_registros;
        }

        const planos = await this.prisma.pdm.findMany({
            where: {
                id: { in: linhas.map((r) => r.planos).flat() },
            },
            select: {
                id: true,
                nome: true,
            },
        });
        const planoById = (pId: number): { id: number; nome: string } => {
            const plano = planos.find((p) => p.id === pId);
            if (!plano) return { id: MIN_DTO_SAFE_NUM, nome: 'Sem plano' };
            return plano;
        };

        const perm = user.hasSomeRoles([
            'CadastroVariavelGlobal.administrador_no_orgao',
            'CadastroVariavelGlobal.administrador',
        ]);
        const paginas = Math.ceil(total_registros / ipp);
        return {
            tem_mais,
            total_registros: total_registros,
            token_paginacao: retToken,
            paginas,
            pagina_corrente: page,
            linhas: linhas.map((r): VariavelGlobalItemDto => {
                return {
                    id: r.id,
                    codigo: r.codigo,
                    titulo: r.titulo,
                    planos: r.planos.map(planoById).sort((a, b) => a.nome.localeCompare(b.nome)),
                    orgao: r.orgao ?? {
                        descricao: 'Sem órgão',
                        id: MIN_DTO_SAFE_NUM,
                        sigla: 'SEM',
                    },
                    orgao_proprietario: r.orgao_proprietario ?? {
                        descricao: 'Sem órgão',
                        id: MIN_DTO_SAFE_NUM,
                        sigla: 'SEM',
                    },
                    fonte: r.fonte_id ? { id: r.fonte_id, nome: r.fonte_nome ?? '' } : null,
                    fim_medicao: Date2YMD.toStringOrNull(r.fim_medicao),
                    inicio_medicao: Date2YMD.toStringOrNull(r.inicio_medicao),
                    periodicidade: r.periodicidade,
                    pode_editar: perm,
                    pode_excluir: perm && r.planos.length == 0,
                };
            }),
        };
    }

    private decodeNextPageToken(jwt: string | undefined, filters: FilterVariavelGlobalDto): AnyPageTokenJwtBody {
        let tmp: AnyPageTokenJwtBody | null = null;

        try {
            if (jwt) tmp = this.jwtService.verify(jwt) as AnyPageTokenJwtBody;
        } catch {
            throw new HttpException('token_paginacao invalido', 400);
        }
        if (!tmp) throw new HttpException('token_paginacao invalido ou faltando', 400);

        if (tmp.search_hash != Object2Hash(filters))
            throw new HttpException(
                'Parâmetros da busca não podem ser diferente da busca inicial para avançar na paginação.',
                400
            );
        return tmp;
    }

    private getVariavelWhereSet(filters: FilterVariavelDto) {
        const firstSet: Prisma.Enumerable<Prisma.VariavelWhereInput> = [];
        if (filters.remover_desativados || filters.remover_desativados === undefined) {
            // não acredito que sirva de nada, mas vou manter pois já estava assim
            // da na mesma colocar o else-if ou não, pois o banco vai gerar 0 resultados no caso de combinações
            // impossíveis
            if (filters.indicador_id)
                firstSet.push({
                    indicador_variavel: {
                        some: {
                            desativado: false,
                            indicador_id: filters.indicador_id,
                        },
                    },
                });
            if (filters.meta_id)
                firstSet.push({
                    indicador_variavel: {
                        some: {
                            desativado: false,
                            indicador: {
                                meta_id: filters.meta_id,
                            },
                        },
                    },
                });
            if (filters.iniciativa_id)
                firstSet.push({
                    indicador_variavel: {
                        some: {
                            desativado: false,
                            indicador: {
                                iniciativa_id: filters.iniciativa_id,
                            },
                        },
                    },
                });
            if (filters.atividade_id)
                firstSet.push({
                    indicador_variavel: {
                        some: {
                            desativado: false,
                            indicador: {
                                atividade_id: filters.atividade_id,
                            },
                        },
                    },
                });
        }

        const permissionsBaseSet: Prisma.Enumerable<Prisma.VariavelWhereInput> = [
            {
                AND: firstSet,
                removido_em: null,
                VariavelAssuntoVariavel: Array.isArray(filters.assuntos)
                    ? { some: { assunto_variavel: { id: { in: filters.assuntos } } } }
                    : undefined,
                id: filters.id,
                orgao_id: filters.orgao_id,
                orgao_proprietario_id: filters.orgao_proprietario_id,
                periodicidade: filters.periodicidade,
                regiao_id: filters.regiao_id,
            },
        ];

        if (filters.nivel_regionalizacao && !filters.regiao_id) {
            firstSet.push({
                regiao: { nivel: filters.nivel_regionalizacao },
            });
        }

        return permissionsBaseSet;
    }

    private getVariavelGlobalWhereSet(filters: FilterVariavelGlobalDto, ids: number[] | undefined) {
        const globalSet: Prisma.Enumerable<Prisma.ViewVariavelGlobalWhereInput> = [];

        globalSet.push({
            // Filtro por palavras-chave com tsvector
            id: {
                in: ids != undefined ? ids : undefined,
            },
            planos: filters.plano_setorial_id ? { has: filters.plano_setorial_id } : undefined,
            tipo: { in: ['Calculada', 'Global'] },

            variavel: {
                AND: this.getVariavelWhereSet(filters),
            },
        });

        return globalSet;
    }

    private async encodeNextPageToken(
        filters: FilterVariavelGlobalDto,
        issued_at: Date,
        user: PessoaFromJwt,
        ids: number[] | undefined
    ): Promise<{
        jwt: string;
        body: AnyPageTokenJwtBody;
    }> {
        const filterSet = this.getVariavelGlobalWhereSet(filters, ids);
        const total_rows = await this.prisma.viewVariavelGlobal.count({
            where: {
                AND: filterSet,
            },
        });

        const body = {
            search_hash: Object2Hash(filters),
            ipp: filters.ipp!,
            issued_at: issued_at.valueOf(),
            total_rows,
        } satisfies AnyPageTokenJwtBody;

        return {
            jwt: this.jwtService.sign(body),
            body,
        };
    }

    async buscaIdsPalavraChave(input: string | undefined): Promise<number[] | undefined> {
        return PrismaHelpers.buscaIdsPalavraChave(this.prisma, 'variavel', input);
    }

    async update(tipo: TipoVariavel, variavelId: number, dto: UpdateVariavelDto, user: PessoaFromJwt) {
        const logger = LoggerWithLog('Atualização de variável');
        logger.log(`Dados recebidos: ${JSON.stringify(dto)}`);
        // TODO: verificar se todos os membros de createVariavelDto.responsaveis estão ativos e sao realmente do orgão createVariavelDto.orgao_id

        const selfBefUpdate = await this.prisma.variavel.findFirstOrThrow({
            where: { id: variavelId, tipo, removido_em: null },
            select: {
                periodicidade: true,
                supraregional: true,
                variavel_categorica_id: true,
                orgao_id: true,
                inicio_medicao: true,
                fim_medicao: true,
            },
        });
        if (selfBefUpdate.variavel_categorica_id === CONST_CRONO_VAR_CATEGORICA_ID)
            throw new HttpException('Variável do tipo Cronograma não pode ser atualizada', 400);

        await this.validaGruposResponsavel(dto, selfBefUpdate.orgao_id ?? MIN_DTO_SAFE_NUM);

        let indicador_id: number | undefined = undefined;
        if (tipo == 'PDM') {
            // buscando apenas pelo indicador pai verdadeiro desta variavel
            const indicadorViaVar = await this.verificaEscritaNaMeta(variavelId, user);

            indicador_id = indicadorViaVar.indicador.id;
        } else {
            // será que não há nenhuma regra mesmo? como a variavel não tem rel com o PDM sem o indicador,
            // provavelmente não tem mesmo o que verificam além do orgao proprietario
        }

        if (dto.codigo !== undefined) {
            const jaEmUso = await this.prisma.variavel.count({
                where: {
                    removido_em: null,
                    codigo: dto.codigo,
                    NOT: { id: variavelId },

                    OR: [
                        {
                            tipo: 'Global',
                        },
                        indicador_id
                            ? {
                                  tipo: 'PDM',
                                  indicador_variavel: {
                                      some: { indicador_id: indicador_id },
                                  },
                              }
                            : {},
                    ],
                },
            });
            if (jaEmUso > 0) throw new HttpException(`Código ${dto.codigo} já está em uso no indicador.`, 400);
        }

        // e com o indicador verdadeiro, temos os dados para recalcular os níveis
        const indicador = indicador_id ? await this.buscaIndicadorParaVariavel(indicador_id) : undefined;

        let oldValue = selfBefUpdate.periodicidade;
        if (dto.periodicidade) oldValue = dto.periodicidade;

        if (tipo == 'PDM') {
            if (!indicador) throw new BadRequestException('Indicador é necessário para variáveis do PDM');
            if (oldValue === indicador.periodicidade) {
                dto.fim_medicao = null;
                dto.inicio_medicao = null;
            } else {
                ['inicio_medicao', 'fim_medicao'].forEach((e: 'inicio_medicao' | 'fim_medicao') => {
                    if (dto[e] === null) {
                        throw new HttpException(`${e}| ${InicioFimErrMsg}`, 400);
                    }
                });
            }
        } else if (tipo == 'Global') {
            this.checkPeriodoVariavelGlobal({ ...dto, inicio_medicao: selfBefUpdate.inicio_medicao });
        }

        // Quando a variável é supraregional, está sendo enviado regiao_id = 0
        // Portanto tratando para não dar problema com a FK no Prisma.
        if (dto.regiao_id == 0 && selfBefUpdate.supraregional == true) delete dto.regiao_id;

        const responsaveis = 'responsaveis' in dto ? dto.responsaveis : [];

        const now = new Date(Date.now());
        await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient) => {
            const suspendida = dto.suspendida;

            const self = await prismaTxn.variavel.findFirstOrThrow({
                where: { id: variavelId },
                select: {
                    mostrar_monitoramento: true,
                    suspendida_em: true,
                    valor_base: true,
                    VariavelAssuntoVariavel: {
                        select: {
                            assunto_variavel_id: true,
                        },
                    },
                    VariavelGrupoResponsavelVariavel: {
                        where: { removido_em: null },
                        select: {
                            grupo_responsavel_variavel_id: true,
                        },
                    },
                },
            });
            const currentSuspendida = self.suspendida_em !== null;

            if (suspendida === true && currentSuspendida == false) {
                dto.mostrar_monitoramento = false;
            } else if (suspendida === false && currentSuspendida == true) {
                // retorna ao state que estava antes de desativar
                const prevDesativado = await prismaTxn.variavelSuspensaoLog.findFirst({
                    where: { variavel_id: variavelId },
                    orderBy: { criado_em: 'desc' },
                    select: { previo_status_mostrar_monitoramento: true },
                    take: 1,
                });

                dto.mostrar_monitoramento = prevDesativado?.previo_status_mostrar_monitoramento ?? true;
            }

            await this.updateCategorica(selfBefUpdate.variavel_categorica_id, dto, prismaTxn, variavelId, self);

            const gruposRecebidosSorted = [
                ...(dto.medicao_grupo_ids ?? []),
                ...(dto.validacao_grupo_ids ?? []),
                ...(dto.liberacao_grupo_ids ?? []),
            ]
                .sort()
                .join(',');
            const gruposAtuais = self.VariavelGrupoResponsavelVariavel.map((v) => v.grupo_responsavel_variavel_id)
                .sort()
                .join(',');

            if (
                gruposRecebidosSorted !== gruposAtuais &&
                (Array.isArray(dto.medicao_grupo_ids) ||
                    Array.isArray(dto.validacao_grupo_ids) ||
                    Array.isArray(dto.liberacao_grupo_ids))
            ) {
                logger.log('Grupos de responsáveis alterados...');

                await prismaTxn.variavelGrupoResponsavelVariavel.updateMany({
                    where: { variavel_id: variavelId, removido_em: null },
                    data: { removido_em: now },
                });
                await this.insertVariavelResponsavel(dto, prismaTxn, variavelId, logger);
            }

            this.checkOrgaoProprietario(tipo, dto, user);

            const updated = await prismaTxn.variavel.update({
                where: { id: variavelId },
                data: {
                    titulo: dto.titulo,
                    codigo: dto.codigo,
                    acumulativa: dto.acumulativa,
                    mostrar_monitoramento: dto.mostrar_monitoramento,
                    unidade_medida_id: dto.unidade_medida_id,
                    ano_base: dto.ano_base,
                    valor_base: dto.valor_base,
                    periodicidade: dto.periodicidade,
                    orgao_id: dto.orgao_id,
                    regiao_id: dto.regiao_id,
                    variavel_categorica_id: dto.variavel_categorica_id,
                    casas_decimais: dto.casas_decimais,
                    atraso_meses: dto.atraso_meses,
                    inicio_medicao: dto.inicio_medicao,
                    fim_medicao: dto.fim_medicao,

                    dado_aberto: dto.dado_aberto,
                    metodologia: dto.metodologia,
                    descricao: dto.descricao,
                    fonte_id: dto.fonte_id,
                    orgao_proprietario_id: dto.orgao_proprietario_id,

                    ...(dto.periodos ? this.getPeriodTuples(dto.periodos) : {}),

                    suspendida_em: suspendida ? now : null,
                },
                select: {
                    valor_base: true,
                    fim_medicao: true,
                },
            });

            // se mudar o fim do período, tem que atualizar os indicadores pois ha o novo campo de aviso
            if (selfBefUpdate.fim_medicao?.toString() !== updated.fim_medicao?.toString()) {
                await this.updateAvisoFimIndicador(prismaTxn, variavelId, updated);
            }

            if (suspendida !== undefined && suspendida !== currentSuspendida) {
                logger.log(`Suspensão alterada para ${suspendida}`);
                await prismaTxn.variavelSuspensaoLog.create({
                    data: {
                        variavel_id: variavelId,
                        pessoa_id: user.id,
                        suspendida: suspendida,
                        criado_em: now,
                        previo_status_mostrar_monitoramento: self.mostrar_monitoramento,
                    },
                });
            }

            if (Array.isArray(responsaveis)) {
                logger.log('Responsáveis alterados...');
                if (indicador) {
                    logger.log(`Resync indicador variável: ${JSON.stringify(indicador)}`);
                    await this.resyncIndicadorVariavel(indicador, variavelId, prismaTxn);
                }

                await prismaTxn.variavelResponsavel.deleteMany({ where: { variavel_id: variavelId } });

                await prismaTxn.variavelResponsavel.createMany({
                    data: await this.buildVarResponsaveis(variavelId, responsaveis),
                });
                logger.verbose(`Responsáveis adicionados: ${responsaveis.join(', ')}`);
            }

            if (Number(self.valor_base).toString() !== Number(updated.valor_base).toString()) {
                logger.log(`Valor base alterado de ${self.valor_base} para ${updated.valor_base}`);
                await this.recalc_series_dependentes([variavelId], prismaTxn);
            }

            await logger.saveLogs(prismaTxn, user.getLogData());
        });

        return { id: variavelId };
    }

    private async updateAvisoFimIndicador(
        prismaTxn: Prisma.TransactionClient,
        variavelId: number,
        updated: { valor_base: Prisma.Decimal; fim_medicao: Date | null }
    ) {
        const indicadoresQUsam = await prismaTxn.indicadorVariavel.findMany({
            where: {
                variavel_id: variavelId,
                desativado: false,
            },
            select: {
                indicador_id: true,
                indicador: {
                    select: {
                        fim_medicao: true,
                    },
                },
            },
        });

        // na tabela de indicador_variavel, o indicador_id pode repetir (ou era só na formula? mas just in case)
        const repetidos = new Set<number>();
        // Update aviso_data_fim for each indicador
        for (const iv of indicadoresQUsam) {
            if (repetidos.has(iv.indicador_id)) continue;
            repetidos.add(iv.indicador_id);

            const avisoDataFim = updated.fim_medicao ? iv.indicador.fim_medicao > updated.fim_medicao : false;
            await prismaTxn.indicadorVariavel.updateMany({
                where: {
                    indicador_id: iv.indicador_id,
                    variavel_id: variavelId,
                },
                data: {
                    aviso_data_fim: avisoDataFim,
                },
            });
        }

        await this.recalc_indicador_usando_variaveis([variavelId], prismaTxn);
    }

    private async verificaEscritaNaMeta(variavelId: number, user: PessoaFromJwt) {
        const indicadorViaVar = await this.prisma.indicadorVariavel.findFirst({
            where: { variavel_id: variavelId, indicador_origem_id: null },
            select: {
                indicador: {
                    select: {
                        id: true,
                        meta_id: true,
                        atividade_id: true,
                        iniciativa_id: true,
                    },
                },
            },
        });

        if (!indicadorViaVar)
            throw new HttpException('Variavel não encontrada, confira se você está no indicador base', 400);

        const metaRow = await this.prisma.view_pdm_meta_iniciativa_atividade.findFirstOrThrow({
            where: {
                meta_id: indicadorViaVar.indicador.meta_id ?? undefined,
                iniciativa_id: indicadorViaVar.indicador.iniciativa_id,
                atividade_id: indicadorViaVar.indicador.atividade_id,
            },
            select: { meta_id: true },
        });
        await this.metaService.assertMetaWriteOrThrow('PDM', metaRow.meta_id, user, 'variavel do indicador');
        return indicadorViaVar;
    }

    private checkPeriodoVariavelGlobal(dto: UpdateVariavelDto) {
        if (!dto.inicio_medicao)
            throw new HttpException('inicio_medicao| Início da medição é obrigatório para variáveis globais', 400);

        if (dto.fim_medicao && dto.inicio_medicao && dto.fim_medicao < dto.inicio_medicao)
            throw new HttpException('fim_medicao| Fim da medição deve ser maior que o início', 400);
    }

    private async updateCategorica(
        old_variavel_categorica_id: number | null,
        dto: UpdateVariavelDto,
        prismaTxn: Prisma.TransactionClient,
        variavelId: number,
        self: {
            valor_base: Prisma.Decimal;
            mostrar_monitoramento: boolean;
            suspendida_em: Date | null;
            VariavelAssuntoVariavel: { assunto_variavel_id: number }[];
        }
    ) {
        if (dto.variavel_categorica_id !== null && dto.variavel_categorica_id) {
            const variavelCategorica = await this.carregaVariavelCategorica(prismaTxn, dto.variavel_categorica_id);

            if (old_variavel_categorica_id == variavelCategorica.id) {
                this.logger.debug(`variavel_categorica_id já é igual, não há necessidade de alterar`);

                dto.variavel_categorica_id = undefined;
            }

            if (dto.variavel_categorica_id) {
                const existentes = await prismaTxn.serieVariavel.count({
                    where: {
                        variavel_id: variavelId,
                        variavel_categorica_id: dto.variavel_categorica_id,
                    },
                });
                if (existentes > 0)
                    throw new BadRequestException(
                        'Não é possível alterar a variável categórica de uma variável que já possui valores salvos como variável categórica.'
                    );

                const categoriaValores = await prismaTxn.variavelCategoricaValor.findMany({
                    where: { id: dto.variavel_categorica_id },
                });

                const serieValores = await prismaTxn.serieVariavel.groupBy({
                    where: {
                        variavel_id: variavelId,
                        serie: { in: ['Realizado', 'Previsto'] },
                    },
                    by: ['valor_nominal'],
                });

                const promises: Promise<unknown>[] = [];
                for (const sv of serieValores) {
                    const catValor = categoriaValores.find((cv) => cv.valor_variavel == +sv.valor_nominal.toString());
                    if (!catValor)
                        throw new BadRequestException(
                            'Não é possível adicionar classificação da categórica, pois há valores salvos incompatíveis. Valores encontrados: ' +
                                serieValores
                                    .slice(0, 10)
                                    .map((v) => v.valor_nominal)
                                    .join(', ')
                        );

                    promises.push(
                        prismaTxn.serieVariavel.updateMany({
                            where: {
                                variavel_id: variavelId,
                                serie: { in: ['Realizado', 'Previsto'] },
                                valor_nominal: sv.valor_nominal,
                            },
                            data: {
                                variavel_categorica_id: dto.variavel_categorica_id,
                                variavel_categorica_valor_id: catValor.id,
                            },
                        })
                    );
                }
                await Promise.all(promises);
            }
        } else if (dto.variavel_categorica_id === null && old_variavel_categorica_id !== null) {
            await prismaTxn.serieVariavel.updateMany({
                where: {
                    variavel_id: variavelId,
                    variavel_categorica_id: old_variavel_categorica_id,
                },
                data: {
                    variavel_categorica_id: null,
                    variavel_categorica_valor_id: null,
                },
            });

            this.logger.debug(`variavel_categorica_id foi removido, valores em serie-variavel mantidos`);
        }

        if (Array.isArray(dto.assuntos)) {
            const assuntoSorted = dto.assuntos.sort();
            const currentAssuntos = self.VariavelAssuntoVariavel.map((v) => v.assunto_variavel_id).sort();

            if (assuntoSorted.join(',') !== currentAssuntos.join(',')) {
                this.logger.debug(`Assuntos diferentes, atualizando`);
                await prismaTxn.variavelAssuntoVariavel.deleteMany({
                    where: { variavel_id: variavelId },
                });
                await prismaTxn.variavelAssuntoVariavel.createMany({
                    data: assuntoSorted.map((assunto_id) => ({
                        variavel_id: variavelId,
                        assunto_variavel_id: assunto_id,
                    })),
                });
            }
        } else if (dto.assuntos == null) {
            await prismaTxn.variavelAssuntoVariavel.deleteMany({
                where: { variavel_id: variavelId },
            });
        }
    }

    private async validaGruposResponsavel(dto: UpdateVariavelDto, current_orgao_id: number | undefined) {
        const orgao_id = dto.orgao_id ?? current_orgao_id;

        const grupoPrefetch = await this.prisma.grupoResponsavelVariavel.findMany({
            where: {
                orgao_id: orgao_id,
                id: {
                    in: [
                        ...(dto.medicao_grupo_ids ?? []),
                        ...(dto.validacao_grupo_ids ?? []),
                        ...(dto.liberacao_grupo_ids ?? []),
                    ],
                },
            },
            select: {
                id: true,
                perfil: true,
            },
        });

        if (Array.isArray(dto.medicao_grupo_ids)) {
            for (const grupoId of dto.medicao_grupo_ids) {
                const grupo = grupoPrefetch.find((g) => g.id === grupoId);
                if (!grupo) {
                    throw new HttpException(`Grupo ${grupoId} não encontrado. Verifique o Órgão Proprietário.`, 400);
                }
                if (grupo.perfil !== 'Medicao') {
                    throw new HttpException(`Grupo ${grupoId} não é de medição.`, 400);
                }
            }
        }

        if (Array.isArray(dto.validacao_grupo_ids)) {
            for (const grupoId of dto.validacao_grupo_ids) {
                const grupo = grupoPrefetch.find((g) => g.id === grupoId);
                if (!grupo) {
                    throw new HttpException(`Grupo ${grupoId} não encontrado. Verifique o Órgão Proprietário.`, 400);
                }
                if (grupo.perfil !== 'Validacao') {
                    throw new HttpException(`Grupo ${grupoId} não é de validação`, 400);
                }
            }
        }

        if (Array.isArray(dto.liberacao_grupo_ids)) {
            for (const grupoId of dto.liberacao_grupo_ids) {
                const grupo = grupoPrefetch.find((g) => g.id === grupoId);
                if (!grupo) {
                    throw new HttpException(`Grupo ${grupoId} não encontrado. Verifique o Órgão Proprietário.`, 400);
                }
                if (grupo.perfil !== 'Liberacao') {
                    throw new HttpException(`Grupo ${grupoId} não é de liberação`, 400);
                }
            }
        }
    }

    private checkOrgaoProprietario(tipo: string, dto: UpdateVariavelDto | CreateVariavelBaseDto, user: PessoaFromJwt) {
        if (tipo == 'PDM') {
            dto.orgao_proprietario_id = null;
        } else {
            if (!dto.orgao_proprietario_id)
                throw new BadRequestException('Órgão proprietário é obrigatório para variáveis globais');
            if (!user.orgao_id) throw new BadRequestException('Usuário sem órgão');

            if (!user.hasSomeRoles(['CadastroVariavelGlobal.administrador'])) {
                if (dto.orgao_proprietario_id !== user.orgao_id)
                    throw new HttpException('Você só pode criar variáveis globais em seu próprio órgão.', 400);
            }
        }
    }

    private async carregaVariavelCategorica(prismaTxn: Prisma.TransactionClient, variavel_categorica_id: number) {
        const variavelCategorica = await prismaTxn.variavelCategorica.findFirstOrThrow({
            where: { id: variavel_categorica_id },
            select: { tipo: true, id: true },
        });
        if (variavelCategorica.tipo == 'Cronograma')
            throw new BadRequestException('Variável categórica de cronograma não pode ser criada manualmente');
        return variavelCategorica;
    }

    async processVariaveisSuspensas(prismaTx: Prisma.TransactionClient): Promise<number[]> {
        const suspensas: { variaveis: number[] | null }[] = await prismaTx.$queryRaw`
            WITH jobs AS (
                SELECT
                    v.id as variavel_id,
                    v.atraso_meses * '-1 month'::interval as atraso_meses,
                    v.acumulativa as v_acumulativa,
                    v.suspendida_em,
                    cf.id AS cf_corrente_id,
                    cf.data_ciclo AS cf_corrente_data_ciclo,
                    s.serie AS serie,
                    pdm.id as pdm_id
                FROM variavel v
                INNER JOIN indicador_variavel iv ON iv.variavel_id = v.id AND iv.indicador_origem_id is null
                INNER JOIN indicador i ON iv.indicador_id = i.id AND i.removido_em is null
                LEFT JOIN meta m ON i.meta_id = m.id AND i.removido_em is null
                LEFT JOIN iniciativa ini ON i.iniciativa_id = ini.id AND ini.removido_em is null
                LEFT JOIN meta m2 ON ini.meta_id = m2.id AND m2.removido_em is null
                LEFT JOIN atividade a ON i.atividade_id = a.id AND a.removido_em is null
                LEFT JOIN iniciativa ini2 ON a.iniciativa_id = ini2.id AND ini2.removido_em is null
                LEFT JOIN meta m3 ON ini2.meta_id = m3.id AND m3.removido_em is null
                INNER JOIN pdm
                    ON CASE
                        WHEN m.id IS NOT NULL THEN m.pdm_id = pdm.id
                        WHEN m2.id IS NOT NULL THEN m2.pdm_id = pdm.id
                        WHEN m3.id IS NOT NULL THEN m3.pdm_id = pdm.id
                    END
                JOIN ciclo_fisico cf ON
                    cf.pdm_id = pdm.id
                    AND cf.data_ciclo > v.suspendida_em
                    AND cf.data_ciclo <= now()
                CROSS JOIN (
                    SELECT unnest(enum_range(NULL::"Serie")) serie
                ) s
                LEFT JOIN variavel_suspensa_controle vsc ON vsc.ciclo_fisico_corrente_id = cf.id AND vsc.variavel_id = v.id AND vsc.serie = s.serie
                WHERE s.serie IN ('Realizado', 'RealizadoAcumulado')
                AND vsc.id IS NULL
                ORDER BY cf.id
            ),
            lookup_valores AS (
                SELECT
                    j.variavel_id,
                    j.atraso_meses,
                    j.v_acumulativa,
                    j.suspendida_em,
                    j.cf_corrente_id,
                    j.cf_corrente_data_ciclo,
                    j.serie,
                    cf.id AS cf_base_id,
                    CASE WHEN v_acumulativa THEN 0::decimal
                    ELSE
                        -- não faz muito sentido não ter valor acumulado, mas se estiver faltando, é pq alguem apagou do banco na mão
                        CASE WHEN sv.valor_nominal IS NULL AND j.serie = 'RealizadoAcumulado' THEN 0 ELSE sv.valor_nominal END
                    END AS valor
                FROM jobs j
                JOIN ciclo_fisico cf ON cf.pdm_id = j.pdm_id AND cf.data_ciclo = date_trunc('month', j.suspendida_em)
                LEFT JOIN serie_variavel sv ON sv.variavel_id = j.variavel_id
                    AND sv.data_valor = date_trunc('month', j.suspendida_em) + j.atraso_meses
                    AND sv.serie = j.serie
                ORDER BY j.cf_corrente_data_ciclo
            ),
            lookup_existentes AS (
                SELECT
                    j.cf_corrente_id,
                    j.variavel_id,
                    j.serie,
                    sv.valor_nominal,
                    sv.id as sv_id
                FROM jobs j

                LEFT JOIN serie_variavel sv ON sv.variavel_id = j.variavel_id
                    AND sv.data_valor = j.cf_corrente_data_ciclo + j.atraso_meses
                    AND sv.serie = j.serie

            ),
            delete_values AS (
                DELETE FROM serie_variavel WHERE id IN (SELECT sv_id FROM lookup_existentes)
            ),
            insert_values AS (
                INSERT INTO serie_variavel (variavel_id, serie, data_valor, valor_nominal, ciclo_fisico_id)
                SELECT
                    lv.variavel_id,
                    lv.serie,
                    lv.cf_corrente_data_ciclo + lv.atraso_meses,
                    lv.valor,
                    lv.cf_corrente_id
                FROM lookup_valores lv
                WHERE lv.valor IS NOT NULL
            ),
            insert_control AS (
                INSERT INTO variavel_suspensa_controle (variavel_id, serie, ciclo_fisico_base_id, ciclo_fisico_corrente_id, valor_antigo, valor_novo, processado_em)
                SELECT
                    lv.variavel_id,
                    lv.serie,
                    lv.cf_base_id,
                    lv.cf_corrente_id,
                    le.valor_nominal,
                    lv.valor,
                    now()
                FROM lookup_valores lv
                LEFT JOIN lookup_existentes le ON le.variavel_id = lv.variavel_id AND lv.serie = le.serie AND lv.cf_corrente_id = le.cf_corrente_id
            ),
            must_update_indicators AS (
                SELECT
                    lv.variavel_id
                FROM lookup_valores lv
                GROUP BY 1
            )
            SELECT
                array_agg(variavel_id) as variaveis
            FROM must_update_indicators
        `;

        console.log('must_update_indicators: suspensas=', suspensas);
        if (suspensas[0] && Array.isArray(suspensas[0].variaveis)) {
            return suspensas[0].variaveis;
        }
        return [];
    }

    async remove(tipo: TipoVariavel, variavelId: number, user: PessoaFromJwt) {
        const logger = LoggerWithLog('Remoção de variável');
        logger.debug(`Removendo variável ${variavelId}`);
        // buscando apenas pelo indicador pai verdadeiro desta variavel
        const selfVariavel = await this.prisma.variavel.findFirst({
            where: {
                id: variavelId,
                tipo,
            },
            select: {
                valor_base: true,
                periodicidade: true,
                variavel_categorica_id: true,
            },
        });
        if (!selfVariavel)
            throw new BadRequestException('Variavel não encontrada, confira se você está no indicador base.');
        if (selfVariavel.variavel_categorica_id === CONST_CRONO_VAR_CATEGORICA_ID)
            throw new BadRequestException(
                'Variável do tipo Cronograma não pode ser removida pela variável, remova pela etapa.'
            );

        if (tipo == 'PDM') {
            // buscando apenas pelo indicador pai verdadeiro desta variavel
            await this.verificaEscritaNaMeta(variavelId, user);
        }

        const now = new Date(Date.now());
        await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient) => {
                const refEmUso = await prismaTx.indicadorFormulaVariavel.findMany({
                    where: { variavel_id: variavelId },
                    select: {
                        indicador: { select: { codigo: true, titulo: true } },
                    },
                });

                for (const ref of refEmUso) {
                    throw new BadRequestException(
                        `Não é possível remover a variável: em uso no indicador ${ref.indicador.codigo}, ${ref.indicador.titulo}`
                    );
                }

                const refFormulaComposta = await prismaTx.formulaComposta.findMany({
                    where: {
                        removido_em: null,
                        FormulaCompostaVariavel: {
                            some: {
                                variavel_id: variavelId,
                            },
                        },
                    },
                    select: { titulo: true },
                });
                for (const ref of refFormulaComposta) {
                    throw new BadRequestException(
                        `Não é possível remover a variável: em uso na variável composta ${ref.titulo}`
                    );
                }

                await prismaTx.variavelGrupoResponsavelVariavel.updateMany({
                    where: {
                        removido_em: null,
                        variavel: { id: variavelId },
                    },
                    data: {
                        removido_em: now,
                    },
                });

                await prismaTx.variavel.update({
                    where: { id: variavelId },
                    data: {
                        removido_em: now,
                        removido_por: user.id,
                    },
                    select: { id: true },
                });

                await prismaTx.indicadorVariavel.deleteMany({
                    where: { variavel_id: variavelId },
                });

                await logger.saveLogs(prismaTx, user.getLogData());
            },
            {
                isolationLevel: 'Serializable',
                maxWait: 15000,
                timeout: 25000,
            }
        );

        return { id: variavelId };
    }

    async getIndicadorViaVariavel(variavel_id: number) {
        const indicador = await this.prisma.indicador.findFirst({
            where: {
                IndicadorVariavel: {
                    some: {
                        variavel_id: variavel_id,
                        indicador_origem_id: null, // fix - nao era necessário antes de existir essa coluna
                    },
                },
            },
            select: {
                IndicadorVariavel: {
                    select: {
                        variavel: {
                            select: {
                                id: true,
                                casas_decimais: true,
                                periodicidade: true,
                                acumulativa: true,
                                titulo: true,
                                codigo: true,
                                suspendida_em: true,
                            },
                        },
                    },
                },
            },
        });
        if (!indicador) throw new HttpException('Indicador ou variavel não encontrada', 404);
        return indicador;
    }

    async getValorSerieExistente(
        variavelId: number,
        series: Serie[],
        filters: FiltroData
    ): Promise<ValorSerieExistente[]> {
        return await this.prisma.serieVariavel.findMany({
            where: {
                variavel_id: variavelId,
                serie: {
                    in: series,
                },
                AND: [
                    { data_valor: filters.data_inicio ? { gte: filters.data_inicio } : undefined },
                    { data_valor: filters.data_fim ? { lte: filters.data_fim } : undefined },
                    { data_valor: filters.data_valor }, // filtro fixo
                ],
            },
            select: {
                valor_nominal: true,
                id: true,
                data_valor: true,
                serie: true,
                conferida: true,
            },
        });
    }

    getValorSerieExistentePorPeriodo(
        valoresExistentes: ValorSerieExistente[],
        variavel_id: number
    ): SerieValorPorPeriodo {
        const porPeriodo: SerieValorPorPeriodo = new SerieValorPorPeriodo();
        for (const serieValor of valoresExistentes) {
            if (!porPeriodo[Date2YMD.toString(serieValor.data_valor)]) {
                porPeriodo[Date2YMD.toString(serieValor.data_valor)] = {
                    Previsto: undefined,
                    PrevistoAcumulado: undefined,
                    Realizado: undefined,
                    RealizadoAcumulado: undefined,
                };
            }

            porPeriodo[Date2YMD.toString(serieValor.data_valor)][serieValor.serie] = {
                data_valor: Date2YMD.toString(serieValor.data_valor),
                valor_nominal: serieValor.valor_nominal.toPrecision(),
                referencia: this.getEditExistingSerieJwt(serieValor.id, variavel_id),
                conferida: serieValor.conferida,
            };
        }

        return porPeriodo;
    }

    async getSeriePrevistoRealizado(
        tipo: TipoVariavel,
        filters: FilterSVNPeriodoDto,
        variavelId: number,
        user: PessoaFromJwt
    ): Promise<ListSeriesAgrupadas> {
        const selfItem = await this.findAll(tipo, { id: variavelId });
        if (selfItem.length === 0) throw new NotFoundException('Variável não encontrada');
        const variavel = selfItem[0];

        // TODO adicionar limpeza da serie para quem for ponto focal
        const valoresExistentes = await this.getValorSerieExistente(variavelId, ORDEM_SERIES_RETORNO, filters);
        const porPeriodo = this.getValorSerieExistentePorPeriodo(valoresExistentes, variavelId);

        const result: ListSeriesAgrupadas = {
            variavel: {
                id: variavelId,
                casas_decimais: variavel.casas_decimais,
                periodicidade: variavel.periodicidade,
                acumulativa: variavel.acumulativa,
                codigo: variavel.codigo,
                titulo: variavel.titulo,
                suspendida: variavel.suspendida,
                valor_base: variavel.valor_base.toString(),
            },
            linhas: [],
            ordem_series: ORDEM_SERIES_RETORNO,
        };

        const [analisesCiclo, documentoCiclo] = await Promise.all([
            this.prisma.variavelCicloFisicoQualitativo.findMany({
                where: {
                    variavel_id: variavelId,
                    referencia_data: { in: valoresExistentes.map((v) => v.data_valor) },
                    removido_em: null,
                },
                distinct: ['referencia_data'],
                select: {
                    id: true,
                    referencia_data: true,
                    analise_qualitativa: true,
                },
            }),
            this.prisma.variavelCicloFisicoDocumento.groupBy({
                where: {
                    variavel_id: variavelId,
                    removido_em: null,
                    referencia_data: { in: valoresExistentes.map((v) => v.data_valor) },
                },
                by: ['referencia_data'],
                _count: true,
            }),
        ]);

        const mapAnalisesCiclo: Record<string, (typeof analisesCiclo)[0]> = {};
        for (const analise of analisesCiclo) {
            mapAnalisesCiclo[Date2YMD.toString(analise.referencia_data)] = analise;
        }
        const mapDocumentoCiclo: Record<string, (typeof documentoCiclo)[0]> = {};
        for (const doc of documentoCiclo) {
            mapDocumentoCiclo[Date2YMD.toString(doc.referencia_data)] = doc;
        }

        // TODO bloquear acesso ao token pra quem não tiver o CadastroIndicador.inserir (e agora com o plano setorial)
        // isso mudou mais uma vez

        const todosPeriodos = await this.gerarPeriodoVariavelEntreDatas(variavel.id, filters);
        for (const periodoYMD of todosPeriodos) {
            const seriesExistentes: SerieValorNomimal[] = this.populaSeriesExistentes(
                porPeriodo,
                periodoYMD,
                variavelId,
                variavel
            );

            let ciclo_fisico: SACicloFisicoDto | undefined = undefined;

            const analiseCiclo = mapAnalisesCiclo[periodoYMD];
            const docCiclo = mapDocumentoCiclo[periodoYMD];
            if (analiseCiclo) {
                ciclo_fisico = {
                    id: analiseCiclo.id,
                    analise: analiseCiclo.analise_qualitativa || '',
                    tem_documentos: (docCiclo?._count || 0) > 0,
                };
            }

            result.linhas.push({
                periodo: periodoYMD.substring(0, 4 + 2 + 1),
                agrupador: periodoYMD.substring(0, 4),
                series: seriesExistentes,
                ciclo_fisico: ciclo_fisico,
            });
        }

        return result;
    }

    populaSeriesExistentes(
        porPeriodo: SerieValorPorPeriodo,
        periodoYMD: string,
        variavelId: number,
        variavel: { acumulativa: boolean }
    ) {
        const seriesExistentes: SerieValorNomimal[] = [];

        const existeValor = porPeriodo[periodoYMD];
        if (
            existeValor &&
            (existeValor.Previsto ||
                existeValor.PrevistoAcumulado ||
                existeValor.Realizado ||
                existeValor.RealizadoAcumulado)
        ) {
            if (existeValor.Previsto) {
                seriesExistentes.push(existeValor.Previsto);
            } else {
                seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD, variavelId, 'Previsto'));
            }

            if (existeValor.PrevistoAcumulado) {
                seriesExistentes.push(this.referencia_boba(variavel.acumulativa, existeValor.PrevistoAcumulado));
            } else {
                seriesExistentes.push(
                    this.referencia_boba(
                        variavel.acumulativa,
                        this.buildNonExistingSerieValor(periodoYMD, variavelId, 'PrevistoAcumulado')
                    )
                );
            }

            if (existeValor.Realizado) {
                seriesExistentes.push(existeValor.Realizado);
            } else {
                seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD, variavelId, 'Realizado'));
            }

            if (existeValor.RealizadoAcumulado) {
                seriesExistentes.push(this.referencia_boba(variavel.acumulativa, existeValor.RealizadoAcumulado));
            } else {
                seriesExistentes.push(
                    this.referencia_boba(
                        variavel.acumulativa,
                        this.buildNonExistingSerieValor(periodoYMD, variavelId, 'RealizadoAcumulado')
                    )
                );
            }
        } else {
            seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD, variavelId, 'Previsto'));
            seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD, variavelId, 'PrevistoAcumulado'));
            seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD, variavelId, 'Realizado'));
            seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD, variavelId, 'RealizadoAcumulado'));
        }
        return seriesExistentes;
    }

    private referencia_boba(varServerSideAcumulativa: boolean, sv: SerieValorNomimal): SerieValorNomimal {
        if (varServerSideAcumulativa) {
            sv.referencia = 'SS';
        }
        return sv;
    }

    private buildNonExistingSerieValor(periodo: DateYMD, variavelId: number, serie: Serie): SerieValorNomimal {
        return {
            data_valor: periodo,
            referencia: this.getEditNonExistingSerieJwt(variavelId, periodo, serie),
            valor_nominal: '',
        };
    }

    private getEditExistingSerieJwt(id: number, variavelId: number): string {
        // TODO opcionalmente adicionar o modificado_em aqui
        return this.jwtService.sign({
            id: id,
            v: variavelId,
        } as ExistingSerieJwt);
    }

    private getEditNonExistingSerieJwt(variavelId: number, period: DateYMD, serie: Serie): string {
        return this.jwtService.sign({
            p: period,
            v: variavelId,
            s: serie,
        } as NonExistingSerieJwt);
    }

    private async gerarPeriodoVariavelEntreDatas(variavelId: number, filtros?: FiltroData): Promise<DateYMD[]> {
        if (isNaN(variavelId)) throw new BadRequestException('Variável inválida');

        const dados: Record<string, string>[] = await this.prisma.$queryRawUnsafe(`
            select to_char(p.p, 'yyyy-mm-dd') as dt
            from busca_periodos_variavel(${variavelId}::int) as g(p, inicio, fim),
            generate_series(inicio, fim, p) p
            where true
            ${filtros && filtros.data_inicio ? `and p.p >= '${filtros.data_inicio.toISOString()}'::date` : ''}
            ${filtros && filtros.data_fim ? `and p.p <= '${filtros.data_fim.toISOString()}'::date` : ''}
            ${filtros && filtros.data_valor ? `and p.p = '${filtros.data_valor.toISOString()}'::date` : ''}
        `);

        return dados.map((e) => e.dt);
    }

    private validarValoresJwt(valores: SerieUpsert[]): ValidatedUpsert[] {
        const valids: ValidatedUpsert[] = [];
        console.log({ log: 'validation', valores });
        for (const valor of valores) {
            if (valor.referencia === 'SS')
                // server-side
                continue;
            let referenciaDecoded: SerieJwt | null = null;
            try {
                referenciaDecoded = this.jwtService.verify(valor.referencia) as SerieJwt;
            } catch (error) {
                this.logger.error(error);
            }
            if (!referenciaDecoded)
                throw new HttpException(
                    'Tempo para edição dos valores já expirou. Abra em uma nova aba e faça o preenchimento novamente.',
                    400
                );

            // se chegou como number, converte pra string
            const asText =
                typeof valor.valor == 'number' && valor.valor !== undefined
                    ? Number(valor.valor).toString()
                    : valor.valor;

            // garantia que o tipo é ou string, ou um texto em branco
            valids.push({
                valor: typeof asText === 'string' ? asText : '',
                referencia: referenciaDecoded,
            });
        }
        this.logger.debug(JSON.stringify({ log: 'validation', valids }));
        return valids;
    }

    async batchUpsertSerie(tipo: TipoVariavel, valores: SerieUpsert[], user: PessoaFromJwt) {
        // TODO opcionalmente verificar se o modificado_em de todas as variáveis ainda é igual
        // em relação ao momento JWT foi assinado, pra evitar sobrescrita da informação sem aviso para o usuário
        // da mesma forma, ao buscar os que não tem ID, não deve existir outro valor já existente no periodo

        const valoresValidos = this.validarValoresJwt(valores);

        const variaveisInfo = await this.loadVariaveisComCategorica(
            this.prisma,
            valoresValidos.map((e) => e.referencia.v)
        );

        const variaveisModificadas: Record<number, boolean> = {};
        const now = new Date(Date.now());

        await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient) => {
                const idsToBeRemoved: number[] = [];
                const updatePromises: Promise<any>[] = [];
                const createList: Prisma.SerieVariavelUncheckedCreateInput[] = [];
                let anySerieIsToBeCreatedOnVariable: number | undefined;

                for (const valor of valoresValidos) {
                    const variavelInfo = variaveisInfo.filter((e) => e.id === valor.referencia.v)[0];
                    if (!variavelInfo) throw new Error('Variável não encontrada, mas deveria já ter sido carregada.');

                    let variavel_categorica_valor_id: number | null = null;
                    // busca os valores vazios mas que já existem, para serem removidos
                    if (valor.valor === '' && 'id' in valor.referencia) {
                        idsToBeRemoved.push(valor.referencia.id);

                        if (!variaveisModificadas[valor.referencia.v]) {
                            variaveisModificadas[valor.referencia.v] = true;
                        }
                    } else if (valor.valor !== '') {
                        if (!variaveisModificadas[valor.referencia.v]) {
                            variaveisModificadas[valor.referencia.v] = true;
                        }
                        if (variavelInfo.variavel_categorica) {
                            const valorExiste = variavelInfo.variavel_categorica.valores.find(
                                (v) => v.valor_variavel === +valor.valor
                            );
                            if (!valorExiste)
                                throw new HttpException(
                                    `Valor ${valor.valor} não é permitido para a variável categórica`,
                                    400
                                );
                            variavel_categorica_valor_id = valorExiste.id;
                        }

                        if ('id' in valor.referencia) {
                            updatePromises.push(
                                prismaTxn.serieVariavel.updateMany({
                                    where: {
                                        id: valor.referencia.id,

                                        AND: [
                                            {
                                                OR: [
                                                    {
                                                        valor_nominal: {
                                                            not: valor.valor,
                                                        },
                                                    },
                                                    {
                                                        conferida: false,
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                    data: {
                                        valor_nominal: valor.valor,
                                        atualizado_em: now,
                                        atualizado_por: user.id,
                                        conferida: true,
                                        conferida_por: user.id,
                                        conferida_em: now,
                                        variavel_categorica_id: variavelInfo.variavel_categorica?.id,
                                        variavel_categorica_valor_id,
                                    },
                                })
                            );
                        } else {
                            if (!anySerieIsToBeCreatedOnVariable) anySerieIsToBeCreatedOnVariable = valor.referencia.v;
                            createList.push({
                                valor_nominal: valor.valor,
                                variavel_id: valor.referencia.v,
                                serie: valor.referencia.s,
                                data_valor: Date2YMD.fromString(valor.referencia.p),
                                conferida: true,
                                conferida_em: now,
                                conferida_por: user.id,
                                variavel_categorica_id: variavelInfo.variavel_categorica?.id,
                                variavel_categorica_valor_id,
                            });
                        }
                    } // else "não há valor" e não tem ID, ou seja, n precisa acontecer nada no banco
                }
                console.log({
                    idsToBeRemoved,
                    anySerieIsToBeCreatedOnVariable,
                    updatePromises,
                    createList,
                });
                // apenas um select pra forçar o banco fazer o serialize na variavel
                // ja que o prisma não suporta 'select for update'
                if (anySerieIsToBeCreatedOnVariable)
                    await prismaTxn.variavel.findFirst({
                        where: { id: anySerieIsToBeCreatedOnVariable },
                        select: { id: true },
                    });

                if (updatePromises.length) await Promise.all(updatePromises);

                // TODO: maybe pode verificar aqui o resultado e fazer o exception caso tenha removido alguma
                if (createList.length)
                    await prismaTxn.serieVariavel.deleteMany({
                        where: {
                            OR: createList.map((e) => {
                                return {
                                    data_valor: e.data_valor,
                                    variavel_id: e.variavel_id,
                                    serie: e.serie,
                                };
                            }),
                        },
                    });

                // ja este delete é esperado caso tenha valores pra ser removidos
                if (idsToBeRemoved.length)
                    await prismaTxn.serieVariavel.deleteMany({
                        where: {
                            id: { in: idsToBeRemoved },
                        },
                    });

                if (createList.length)
                    await prismaTxn.serieVariavel.createMany({
                        data: createList,
                    });

                const variaveisMod = Object.keys(variaveisModificadas).map((e) => +e);
                this.logger.log(`Variáveis modificadas: ${JSON.stringify(variaveisMod)}`);

                if (Array.isArray(variaveisMod)) {
                    await this.recalc_series_dependentes(variaveisMod, prismaTxn);
                    await this.recalc_indicador_usando_variaveis(variaveisMod, prismaTxn);
                }
            },
            {
                isolationLevel: 'Serializable',
                maxWait: 15000,
                timeout: 25000,
            }
        );
    }

    async recalc_series_dependentes(variaveis: number[], prismaTxn: Prisma.TransactionClient) {
        this.logger.log(`called recalc_series_dependentes (${JSON.stringify(variaveis)})`);
        const afetadas = await prismaTxn.variavel.findMany({
            where: {
                id: { in: variaveis },
                removido_em: null,
            },
            select: {
                id: true,
                acumulativa: true,
                FormulaCompostaVariavel: {
                    where: {
                        formula_composta: {
                            NOT: { variavel_calc_id: null },
                        },
                    },
                    select: {
                        formula_composta: {
                            select: {
                                variavel_calc_id: true,
                            },
                        },
                    },
                },
            },
        });
        this.logger.debug(`query.afetadas => ${JSON.stringify(afetadas)}`);
        for (const row of afetadas) {
            if (row.acumulativa) {
                this.logger.verbose(`Recalculando serie acumulada variavel ${row.id}...`);
                await prismaTxn.$queryRaw`select monta_serie_acumulada(${row.id}::int, null)`;
            }

            for (const vc of row.FormulaCompostaVariavel) {
                this.logger.verbose(`Invalidando variavel calculada ${vc.formula_composta.variavel_calc_id}...`);
                await prismaTxn.$queryRaw`select refresh_variavel(${vc.formula_composta.variavel_calc_id}::int, null)`;
            }
        }
    }

    async recalc_indicador_usando_variaveis(variaveis: number[], prismaTxn: Prisma.TransactionClient) {
        this.logger.log(`called recalc_indicador_usando_variaveis (${JSON.stringify(variaveis)})`);
        const indicadoresFv = await prismaTxn.indicadorFormulaVariavel.findMany({
            where: {
                variavel_id: { in: variaveis },
            },
            distinct: ['indicador_id'],
            select: { indicador_id: true },
        });
        const indicadoresFC = await prismaTxn.indicador.findMany({
            where: {
                removido_em: null,
                FormulaComposta: {
                    some: {
                        formula_composta: {
                            removido_em: null,
                            FormulaCompostaVariavel: {
                                some: { variavel_id: { in: variaveis } },
                            },
                        },
                    },
                },
            },
            select: { id: true },
        });
        const uniqueIndicadores = Array.from(
            new Set([...indicadoresFC.map((r) => r.id), ...indicadoresFv.map((r) => r.indicador_id)])
        );

        this.logger.log(`query.indicadores => ${uniqueIndicadores.join(',')}`);
        for (const indicador_id of uniqueIndicadores) {
            this.logger.log(`Recalculando indicador ... ${indicador_id}`);
            await prismaTxn.$queryRaw`select refresh_serie_indicador(${indicador_id}::int, null)`;
        }
    }

    async getMetaIdDaVariavel(variavel_id: number, prismaTxn: Prisma.TransactionClient): Promise<number> {
        const result: {
            meta_id: number;
        }[] = await prismaTxn.$queryRaw`
            select coalesce(

                -- busca pela diretamente na meta
                (
                    select m.id
                    from meta m
                    join indicador i on i.meta_id = m.id and i.removido_em is null
                    join indicador_variavel iv on iv.indicador_id = i.id and iv.desativado=false and iv.indicador_origem_id is null
                    where iv.variavel_id = ${variavel_id}::int
                    and i.removido_em is null
                ),
                (
                    select m.id
                    from meta m
                    join iniciativa _i on _i.meta_id = m.id
                    join indicador i on  i.iniciativa_id = _i.id
                    join indicador_variavel iv on iv.indicador_id = i.id and iv.desativado=false and iv.indicador_origem_id is null
                    where iv.variavel_id = ${variavel_id}::int
                    and i.removido_em is null
                ),
                (
                    select m.id
                    from meta m
                    join iniciativa _i on _i.meta_id = m.id
                    join atividade _a on _a.iniciativa_id = _i.id
                    join indicador i on  i.atividade_id = _a.id
                    join indicador_variavel iv on iv.indicador_id = i.id and iv.desativado=false and iv.indicador_origem_id is null
                    where iv.variavel_id = ${variavel_id}::int
                    and i.removido_em is null
                )
            ) as meta_id
        `;
        console.log(result);

        if (!result[0].meta_id) throw `getMetaIdDaVariavel: nenhum resultado para variavel ${variavel_id}`;
        return result[0].meta_id;
    }

    async getMetaIdDaFormulaComposta(
        formula_composta_id: number,
        prismaTxn: Prisma.TransactionClient
    ): Promise<number> {
        const result: {
            meta_id: number;
        }[] = await prismaTxn.$queryRaw`
            select coalesce(
                -- busca pela diretamente na meta
                (
                    select m.id
                    from meta m
                    join indicador i on i.meta_id = m.id and i.removido_em is null
                    join indicador_formula_composta fc on fc.indicador_id = i.id and fc.desativado=false and fc.indicador_origem_id is null
                    where fc.formula_composta_id = ${formula_composta_id}::int
                    and i.removido_em is null
                ),
                (
                    select m.id
                    from meta m
                    join iniciativa _i on _i.meta_id = m.id
                    join indicador i on  i.iniciativa_id = _i.id
                    join indicador_formula_composta fc on fc.indicador_id = i.id and fc.desativado=false and fc.indicador_origem_id is null
                    where fc.formula_composta_id = ${formula_composta_id}::int
                    and i.removido_em is null
                ),
                (
                    select m.id
                    from meta m
                    join iniciativa _i on _i.meta_id = m.id
                    join atividade _a on _a.iniciativa_id = _i.id
                    join indicador i on  i.atividade_id = _a.id
                    join indicador_formula_composta fc on fc.indicador_id = i.id and fc.desativado=false and fc.indicador_origem_id is null
                    where fc.formula_composta_id = ${formula_composta_id}::int
                    and i.removido_em is null
                )
            ) as meta_id
        `;
        console.log(result);

        if (!result[0].meta_id)
            throw `getMetaIdDaFormulaComposta: nenhum resultado para formula_composta ${formula_composta_id}`;
        return result[0].meta_id;
    }

    async getMetaIdDoIndicador(indicador_id: number, prismaTxn: Prisma.TransactionClient): Promise<number> {
        const result: {
            meta_id: number;
        }[] = await prismaTxn.$queryRaw`
            select coalesce(
                -- busca pela diretamente na meta
                (
                    select m.id
                    from meta m
                    join indicador i on i.meta_id = m.id and i.removido_em is null
                    where i.id = ${indicador_id}::int
                    and i.removido_em is null
                ),
                (
                    select m.id
                    from meta m
                    join iniciativa _i on _i.meta_id = m.id
                    join indicador i on  i.iniciativa_id = _i.id
                    where i.id = ${indicador_id}::int
                    and i.removido_em is null
                ),
                (
                    select m.id
                    from meta m
                    join iniciativa _i on _i.meta_id = m.id
                    join atividade _a on _a.iniciativa_id = _i.id
                    join indicador i on  i.atividade_id = _a.id
                    where i.id = ${indicador_id}::int
                    and i.removido_em is null
                )
            ) as meta_id
        `;
        console.log(result);

        if (!result[0].meta_id) throw `getMetaIdDoIndicador: nenhum resultado para indicador ${indicador_id}`;
        return result[0].meta_id;
    }

    async criarVariavelCronograma(
        dto: CreatePeloIndicadorDto,
        codigo: string,
        user: PessoaFromJwt,
        prismaTxn: Prisma.TransactionClient,
        now: Date
    ): Promise<RecordWithId> {
        const indicador = await prismaTxn.indicador.findFirstOrThrow({
            where: { id: dto.indicador_id },
        });
        const jaEmUso = await prismaTxn.variavel.count({
            where: {
                removido_em: null,
                codigo: codigo,
                indicador_variavel: {
                    some: {
                        indicador_id: indicador.id,
                    },
                },
            },
        });
        if (jaEmUso > 0) throw new HttpException(`Código ${codigo} já está em uso no indicador.`, 400);

        const variavel = await prismaTxn.variavel.create({
            data: {
                codigo: codigo,
                titulo: dto.titulo,
                orgao_id: dto.orgao_id,
                casas_decimais: 0,
                acumulativa: true,
                variavel_categorica_id: CONST_CRONO_VAR_CATEGORICA_ID,
                mostrar_monitoramento: false,
                suspendida_em: now,
                unidade_medida_id: 1,
                valor_base: 0,
                atraso_meses: 0, // acho que não faz sentido ser 1, vou de 0
                periodicidade: indicador.periodicidade,
                inicio_medicao: indicador.inicio_medicao,
                fim_medicao: indicador.fim_medicao,
            },
            select: { id: true },
        });

        await prismaTxn.indicadorVariavel.create({
            data: {
                variavel_id: variavel.id,
                indicador_id: dto.indicador_id,
                desativado: false,
            },
        });

        return { id: variavel.id };
    }

    async findOne(
        tipo: TipoVariavel,
        id: number,
        user: PessoaFromJwt
    ): Promise<VariavelGlobalDetailDto | VariavelDetailDto> {
        const selfItem = await this.findAll(tipo, { id: id });
        if (selfItem.length === 0) {
            throw new NotFoundException('Variável não encontrada');
        }

        const detalhes = await this.prisma.variavel.findFirstOrThrow({
            where: { id: id },
            select: {
                VariavelAssuntoVariavel: {
                    select: { assunto_variavel: { select: { id: true, nome: true } } },
                },
                periodo_liberacao: true,
                periodo_validacao: true,
                periodo_preenchimento: true,
                fonte: { select: { id: true, nome: true } },
                metodologia: true,
                dado_aberto: true,
                descricao: true,
                orgao_proprietario: {
                    select: {
                        id: true,
                        sigla: true,
                        descricao: true,
                    },
                },
                VariavelGrupoResponsavelVariavel: {
                    where: {
                        removido_em: null,
                    },
                    select: {
                        grupo_responsavel_variavel: {
                            select: {
                                id: true,
                                perfil: true,
                            },
                        },
                    },
                },
            },
        });

        const detailDto: VariavelDetailDto = {
            ...selfItem[0],
            assuntos: detalhes.VariavelAssuntoVariavel.map((e) => {
                return { id: e.assunto_variavel.id, nome: e.assunto_variavel.nome };
            }),
            periodos: {
                liberacao_inicio: detalhes.periodo_liberacao[0],
                liberacao_fim: detalhes.periodo_liberacao[1],
                validacao_inicio: detalhes.periodo_validacao[0],
                validacao_fim: detalhes.periodo_validacao[1],
                preenchimento_inicio: detalhes.periodo_preenchimento[0],
                preenchimento_fim: detalhes.periodo_preenchimento[1],
            },
            fonte: detalhes.fonte,
            metodologia: detalhes.metodologia,
            descricao: detalhes.descricao,
            dado_aberto: detalhes.dado_aberto,
        };

        if (tipo == 'Global') {
            // retirando, pois o ... do selfItem[0] adiciona isso que não queremos
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            delete (detailDto as any).responsaveis;

            const globalDetailDto: VariavelGlobalDetailDto = {
                ...detailDto,
                orgao_proprietario: detalhes.orgao_proprietario,
                medicao_grupo_ids: detalhes.VariavelGrupoResponsavelVariavel.filter(
                    (e) => e.grupo_responsavel_variavel.perfil === 'Medicao'
                ).map((e) => e.grupo_responsavel_variavel.id),
                validacao_grupo_ids: detalhes.VariavelGrupoResponsavelVariavel.filter(
                    (e) => e.grupo_responsavel_variavel.perfil === 'Validacao'
                ).map((e) => e.grupo_responsavel_variavel.id),
                liberacao_grupo_ids: detalhes.VariavelGrupoResponsavelVariavel.filter(
                    (e) => e.grupo_responsavel_variavel.perfil === 'Liberacao'
                ).map((e) => e.grupo_responsavel_variavel.id),
            };
            return globalDetailDto;
        }

        return detailDto;
    }
}
