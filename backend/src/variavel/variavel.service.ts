import {
    BadRequestException,
    forwardRef,
    HttpException,
    Inject,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
    PerfilResponsavelEquipe,
    Periodicidade,
    Prisma,
    Serie,
    TipoPdm,
    TipoVariavel,
    TipoVariavelCategorica,
    VariavelCategoricaValor,
} from '@prisma/client';
import { PrismaClient } from '@prisma/client/extension';
import { Regiao } from 'src/regiao/entities/regiao.entity';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { LoggerWithLog } from '../common/LoggerWithLog';
import { PrismaHelpers } from '../common/PrismaHelpers';
import { CONST_CRONO_VAR_CATEGORICA_ID, CONST_VAR_SEM_UN_MEDIDA } from '../common/consts';
import { Date2YMD, DateYMD, SYSTEM_TIMEZONE } from '../common/date2ymd';
import { MIN_DTO_SAFE_NUM, VAR_CATEGORICA_AS_NULL } from '../common/dto/consts';
import { AnyPageTokenJwtBody, PaginatedWithPagesDto, PAGINATION_TOKEN_TTL } from '../common/dto/paginated.dto';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { IsArrayContentsChanged } from '../common/helpers/IsArrayContentsEqual';
import { Object2Hash } from '../common/object2hash';
import { SeriesArrayShuffle } from '../common/shuffleArray';
import { MetaService } from '../meta/meta.service';
import { PrismaService } from '../prisma/prisma.service';
import { VariavelCategoricaService } from '../variavel-categorica/variavel-categorica.service';
import { NonExistingSerieJwt, SerieUpsert, ValidatedUpsert } from './dto/batch-serie-upsert.dto';
import {
    CreateGeradorVariaveBaselDto,
    CreateGeradorVariavelPDMDto,
    CreatePeloIndicadorDto,
    CreateVariavelBaseDto,
    CreateVariavelPDMDto,
    VariaveisPeriodosDto,
} from './dto/create-variavel.dto';
import { FilterVariavelDto, FilterVariavelGlobalDto } from './dto/filter-variavel.dto';
import {
    ListSeriesAgrupadas,
    PdmSimplesDto,
    VariavelDetailComAuxiliaresDto,
    VariavelDetailDto,
    VariavelGlobalDetailDto,
    VariavelResumoInput,
} from './dto/list-variavel.dto';
import { UpdateVariavelDto } from './dto/update-variavel.dto';
import {
    FilterPeriodoDto,
    FilterSVNPeriodoDto,
    FilterVariavelDetalheDto,
    SACicloFisicoDto,
    SerieIndicadorValorNominal,
    SerieValorCategoricaComposta,
    SerieValorCategoricaElemento,
    SerieValorNomimal,
    SerieValorPorPeriodo,
    TipoUso,
    ValorSerieExistente,
    VariavelGlobalItemDto,
    VariavelItemDto,
} from './entities/variavel.entity';
import { SerieCompactToken } from './serie.token.encoder';
import { VariavelUtilService } from './variavel.util.service';
import { DateTime } from 'luxon';
import { SmaeConfigService } from 'src/common/services/smae-config.service';
import { VariavelRelacionamentosResponseDto } from './dto/variavel-relacionamentos-response.dto';
import { VariavelSimplesDto } from './dto/variavel-simples.dto';
import { FormulaCompostaReferenciandoItemDto } from './dto/formula-composta-referenciando-item.dto';
import { PdmSimplesComTipoDto } from './dto/pdm-simples-com-tipo.dto';
import { IndicadorReferenciandoItemDto } from './dto/indicador-referenciando-item.dto';

const SUPRA_SUFIXO = ' - Supra';
/**
 * ordem que é populado na função populaSeriesExistentes, usada no serviço do VariavelFormulaCompostaService
 */
export const ORDEM_SERIES_RETORNO: Serie[] = ['Previsto', 'PrevistoAcumulado', 'Realizado', 'RealizadoAcumulado'];

const InicioFimErrMsg =
    'Inicio/Fim da medição da variável não pode ser nulo quando a periodicidade da variável é diferente do indicador';
type VariavelGlobalLiberacao = {
    referencia_data: Date;
    variavel_id: number;
};
type IndicadorInfo = {
    id: number;
    iniciativa_id: number | null;
    atividade_id: number | null;
    regionalizavel: boolean;
    nivel_regionalizacao: number | null;
    meta_id: number | null;
    periodicidade?: Periodicidade;
};

interface CicloAnalise {
    id: number;
    referencia_data: Date;
    analise_qualitativa?: string | null;
    contagem_qualitativa?: number | null;
}

interface CicloDocumento {
    referencia_data: Date;
    _count: number;
}

interface MetaArvorePdmRow {
    meta_id?: number;
    iniciativa_id?: number;
    atividade_id?: number;
    pdm_id?: number;
    codigo?: string;
    titulo?: string;
    nome?: string;
}

export type VariavelComCategorica = {
    id: number;
    acumulativa: boolean;
    variavel_mae_id: number | null;
    variavel_categorica: {
        id: number;
        tipo: TipoVariavelCategorica;
        valores: VariavelCategoricaValor[];
    } | null;
    tipo: TipoVariavel;
    orgao_proprietario_id: number | null;
    VariavelGrupoResponsavelEquipe: {
        grupo_responsavel_equipe: {
            perfil: PerfilResponsavelEquipe;
            id: number;
        };
    }[];
};

function getMaxDiasPeriodicidade(periodicidade: Periodicidade): number {
    switch (periodicidade) {
        case 'Mensal':
            return 28; // February
        case 'Bimestral':
            return 59; // February + March (28 + 31)
        case 'Trimestral':
            return 89; // February + March + April (28 + 31 + 30)
        case 'Quadrimestral':
            return 120; // February + March + April + May (28 + 31 + 30 + 31)
        case 'Semestral':
            return 180; // February + March + April + May + June + July (28 + 31 + 30 + 31 + 30 + 30)
        case 'Anual':
            return 365; // Non-leap year
        case 'Quinquenal':
            return 1825; // 5 years
        case 'Secular':
            return 36500; // 100 years
        default:
            periodicidade satisfies never;
    }
    throw new Error(`getMaxDiasPeriodicidade: Periodicidade=${periodicidade} não reconhecida`);
}

export function GetVariavelPalavraChave(input: string | undefined, prisma: PrismaClient) {
    return PrismaHelpers.buscaIdsPalavraChave(prisma, 'variavel', input);
}

export function GetVariavelWhereSet(filters: FilterVariavelDto) {
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
        if (filters.formula_composta_id) {
            firstSet.push({
                FormulaCompostaRelVariavel: {
                    some: {
                        formula_composta_id: filters.formula_composta_id,
                    },
                },
            });
        }
    }

    let variavel_categorica_id: number | undefined | null = filters.variavel_categorica_id ?? undefined;
    if (variavel_categorica_id === VAR_CATEGORICA_AS_NULL) variavel_categorica_id = null;

    const permissionsBaseSet: Prisma.Enumerable<Prisma.VariavelWhereInput> = [
        {
            AND: firstSet,
            removido_em: null,
            medicao_orgao_id: filters.medicao_orgao_id,
            validacao_orgao_id: filters.validacao_orgao_id,
            liberacao_orgao_id: filters.liberacao_orgao_id,
            variavel_categorica_id: variavel_categorica_id,
            VariavelAssuntoVariavel: Array.isArray(filters.assuntos)
                ? { some: { assunto_variavel: { id: { in: filters.assuntos } } } }
                : undefined,
            id: filters.id,
            orgao_id: filters.orgao_id,
            orgao_proprietario_id: filters.orgao_proprietario_id,
            periodicidade: filters.periodicidade,
            regiao_id: filters.regiao_id,
            titulo: filters.titulo ? { contains: filters.titulo, mode: 'insensitive' } : undefined,
            codigo: filters.codigo ? { contains: filters.codigo, mode: 'insensitive' } : undefined,
            descricao: filters.descricao ? { contains: filters.descricao, mode: 'insensitive' } : undefined,
        },
    ];

    if (filters.nivel_regionalizacao && !filters.regiao_id) {
        firstSet.push({
            regiao: { nivel: filters.nivel_regionalizacao },
        });
    }

    return permissionsBaseSet;
}

@Injectable()
export class VariavelService {
    private readonly logger = new Logger(VariavelService.name);
    private readonly serieToken = new SerieCompactToken(process.env.SESSION_JWT_SECRET + 'for-variables');
    constructor(
        private readonly jwtService: JwtService,
        @Inject(forwardRef(() => MetaService))
        private readonly metaService: MetaService,
        private readonly util: VariavelUtilService,
        private readonly vCatService: VariavelCategoricaService,
        private readonly prisma: PrismaService,
        private readonly smaeConfigService: SmaeConfigService
    ) {}

    private async loadVariaveisComCategorica(
        tipo: TipoVariavel,
        prismaTxn: Prisma.TransactionClient,
        variavelId: number[]
    ): Promise<VariavelComCategorica[]> {
        const rows = await prismaTxn.variavel.findMany({
            where: {
                tipo: tipo,
                id: { in: variavelId },
            },
            select: {
                id: true,
                acumulativa: true,
                tipo: true,
                variavel_mae_id: true,
                VariavelGrupoResponsavelEquipe: {
                    where: { removido_em: null },
                    select: {
                        grupo_responsavel_equipe: {
                            select: {
                                perfil: true,
                                id: true,
                            },
                        },
                    },
                },
                orgao_proprietario_id: true,
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
        tipo: TipoVariavel,
        prismaTxn: Prisma.TransactionClient,
        variavelId: number
    ): Promise<VariavelComCategorica> {
        const v = await this.loadVariaveisComCategorica(tipo, prismaTxn, [variavelId]);

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

            if (!indicador.atividade_id && !indicador.iniciativa_id && !indicador.meta_id)
                throw new BadRequestException('Indicador sem atividade, iniciativa ou meta');
            const metaRow = await this.prisma.view_pdm_meta_iniciativa_atividade.findFirstOrThrow({
                where: {
                    meta_id: indicador.meta_id ? indicador.meta_id : undefined,
                    iniciativa_id: indicador.iniciativa_id ? indicador.iniciativa_id : undefined,
                    atividade_id: indicador.atividade_id ? indicador.atividade_id : undefined,
                },
                select: { meta_id: true },
            });
            await this.metaService.assertMetaWriteOrThrow('_PDM', metaRow.meta_id, user, 'variavel do indicador');

            this.fixIndicadorInicioFim(dto, indicador);
            await this.checkDup(dto, undefined, indicador.id);
        } else if (tipo == 'Global') {
            this.checkPeriodoVariavelGlobal(dto);

            await this.checkDup(dto, undefined, undefined);
            // Verificar: todo mundo pode criar pra qualquer órgão (responsavel, além do orgao_proprietario_id que é usado no grupo)
        } else {
            throw new BadRequestException('Tipo de variável inválido para criação manual');
        }

        await this.validaEquipeResponsavel(dto, {
            liberacao_orgao_id: dto.orgao_id ?? MIN_DTO_SAFE_NUM,
            medicao_orgao_id: dto.orgao_id ?? MIN_DTO_SAFE_NUM,
            validacao_orgao_id: dto.orgao_id ?? MIN_DTO_SAFE_NUM,
        });
        await this.validaCamposCategorica(dto, 'create');

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

                let variavelMae;
                if (tipo == 'Global') {
                    // A primeira variável criada é a variável mãe.
                    variavelMae = await this.performVariavelSave(
                        tipo,
                        prismaTxn,
                        {
                            ...dto,
                            titulo: dto.titulo,
                            possui_variaveis_filhas: true,
                        },
                        indicador,
                        responsaveis,
                        logger,
                        prefixo
                    );
                    ids.push(variavelMae.id);
                }

                for (const regiao of regions) {
                    const variavel = await this.performVariavelSave(
                        tipo,
                        prismaTxn,
                        {
                            ...dto, // aqui eu passo tudo, pq no performVariavelSave eu deixo só o que é necessário
                            titulo: dto.titulo + ' - ' + regiao.descricao,
                            regiao_id: regiao.id,
                        },
                        indicador,
                        responsaveis,
                        logger,
                        prefixo + '.' + regiao.pdm_codigo_sufixo,
                        variavelMae?.id
                    );
                    ids.push(variavel.id);
                }

                let supraId: number | undefined = undefined;
                if (dto.supraregional) {
                    logger.log('Criando variável supraregional');
                    const supra = await this.performVariavelSave(
                        tipo,
                        prismaTxn,
                        {
                            ...dto, // aqui eu deixo tudo tbm, só pra não duplicar 100%
                            titulo: dto.titulo + (tipo == TipoVariavel.Global ? SUPRA_SUFIXO : ''),
                        },
                        indicador,
                        responsaveis,
                        logger,
                        prefixo + '.SUPRA',
                        variavelMae?.id
                    );
                    supraId = supra.id;
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
                        false, // não usar acumuladas nas calculadas pelo sistema
                        variavelMae?.id,
                        supraId,
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
        variavel_mae_id: number | null | undefined,
        supra_variavel_id: number | undefined,
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
        const mae = variavel_mae_id
            ? await prismaTxn.variavel.findFirst({
                  where: { id: variavel_mae_id },
                  select: { id: true, titulo: true },
              })
            : undefined;
        const titulo = mae?.titulo ?? undefined;

        for (const fc of fc_tasks) {
            // busca apenas as variáveis que estão na região
            const varEscopo = varDb.filter((v) => fc.output_ids.includes(v.regiao_id!)).map((v) => v.id);

            const formula_vars = varEscopo.map((r) => '$_' + r.toString());

            // se for o nivel mais alto, adiciona a variável supra
            if (fc.parent == null && supra_variavel_id) {
                formula_vars.push('$_' + supra_variavel_id.toString());
                varEscopo.push(supra_variavel_id);
            }

            const formula = formula_vars.join(' + ');

            const fc_id = await prismaTxn.formulaComposta.create({
                data: {
                    titulo: titulo ?? `${codigo}.${fc.pdm_codigo_sufixo}`,
                    calc_codigo: `${codigo}.${fc.pdm_codigo_sufixo}`,
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
                    variavel_mae_id: variavel_mae_id ?? null,
                    calc_regiao_id: fc.id,
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
        codigo: string,
        variavelMaeId?: number | null
    ) {
        if (dto.variavel_categorica_id && dto.acumulativa)
            throw new BadRequestException('Variáveis categóricas não podem ser acumulativas');

        logger = logger ?? LoggerWithLog('Criação de variável');

        variavelMaeId = variavelMaeId ?? null;

        const indicador_id = indicador?.id;
        const jaEmUso = await prismaTxn.variavel.count({
            where: {
                removido_em: null,
                codigo: codigo,
                variavel_mae_id: variavelMaeId,
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

        const periodos = dto.periodos ? this.getPeriodTuples(dto.periodos, dto.periodicidade) : {};

        const equipes_configuradas = this.isEquipesConfiguradas(dto);

        const orgao_id = dto.orgao_id ?? (tipo == 'Global' ? dto.orgao_proprietario_id : null);
        if (!orgao_id) throw new BadRequestException('Órgão é obrigatório para criar variável');

        const medicao_orgao_id = dto.medicao_orgao_id ?? orgao_id;
        const validacao_orgao_id = dto.validacao_orgao_id ?? orgao_id;
        const liberacao_orgao_id = dto.liberacao_orgao_id ?? orgao_id;

        const variavel = await prismaTxn.variavel.create({
            data: {
                equipes_configuradas: equipes_configuradas,
                tipo,
                variavel_mae_id: variavelMaeId,
                titulo: dto.titulo,
                codigo: codigo,
                acumulativa: dto.acumulativa,
                mostrar_monitoramento: dto.mostrar_monitoramento,
                unidade_medida_id: dto.unidade_medida_id ?? CONST_VAR_SEM_UN_MEDIDA,
                ano_base: dto.ano_base,
                valor_base: dto.valor_base ?? 0,
                periodicidade: dto.periodicidade,
                polaridade: dto.polaridade,
                orgao_id: orgao_id,
                regiao_id: dto.regiao_id,
                variavel_categorica_id: dto.variavel_categorica_id,
                casas_decimais: dto.casas_decimais,
                atraso_meses: dto.atraso_meses,
                inicio_medicao: dto.inicio_medicao,
                fim_medicao: dto.fim_medicao,
                supraregional: dto.supraregional,

                possui_variaveis_filhas: dto.possui_variaveis_filhas,

                medicao_orgao_id,
                validacao_orgao_id,
                liberacao_orgao_id,

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

        await this.insertEquipeResponsavel(dto, prismaTxn, variavelId, logger);

        await this.recalc_series_dependentes([variavel.id], prismaTxn);

        // Caso a variável seja Global, ela deve entrar na tabela de vars consolidadas, de dashboard do PS
        // OBS: apenas vars mães
        if (tipo == 'Global' && variavelMaeId == null) {
            await AddTaskRecalcVariaveis(prismaTxn, { variavelIds: [variavel.id] });
        }

        return variavel;
    }

    private async insertEquipeResponsavel(
        dto: UpdateVariavelDto,
        prismaTxn: Prisma.TransactionClient,
        variavelId: number,
        logger: LoggerWithLog
    ) {
        if (Array.isArray(dto.medicao_grupo_ids)) {
            await prismaTxn.variavelGrupoResponsavelEquipe.createMany({
                data: dto.medicao_grupo_ids.map((grupo_id) => ({
                    variavel_id: variavelId,
                    grupo_responsavel_equipe_id: grupo_id,
                })),
            });
            logger.verbose(`Grupos de medição adicionados: ${dto.medicao_grupo_ids.join(', ')}`);
        }

        if (Array.isArray(dto.validacao_grupo_ids)) {
            await prismaTxn.variavelGrupoResponsavelEquipe.createMany({
                data: dto.validacao_grupo_ids.map((grupo_id) => ({
                    variavel_id: variavelId,
                    grupo_responsavel_equipe_id: grupo_id,
                })),
            });
            logger.verbose(`Grupos de validação adicionados: ${dto.validacao_grupo_ids.join(', ')}`);
        }

        if (Array.isArray(dto.liberacao_grupo_ids)) {
            await prismaTxn.variavelGrupoResponsavelEquipe.createMany({
                data: dto.liberacao_grupo_ids.map((grupo_id) => ({
                    variavel_id: variavelId,
                    grupo_responsavel_equipe_id: grupo_id,
                })),
            });
            logger.verbose(`Grupos de liberação adicionados: ${dto.liberacao_grupo_ids.join(', ')}`);
        }
    }

    private getPeriodTuples(
        p: VariaveisPeriodosDto | null,
        periodo: Periodicidade
    ): {
        periodo_preenchimento: number[];
        periodo_validacao: number[];
        periodo_liberacao: number[];
    } {
        const periodo_preenchimento: number[] = [];
        const periodo_validacao: number[] = [];
        const periodo_liberacao: number[] = [];

        if (!p) return { periodo_preenchimento, periodo_validacao, periodo_liberacao };

        const maxDias = getMaxDiasPeriodicidade(periodo);

        // Calcula usando periodos fechados
        const preenchimento_fim = p.preenchimento_inicio + p.preenchimento_duracao - 1;
        const validacao_inicio = preenchimento_fim + 1;
        const validacao_fim = validacao_inicio + p.validacao_duracao - 1;
        const liberacao_inicio = validacao_fim + 1;
        const liberacao_fim = liberacao_inicio + p.liberacao_duracao - 1;

        // Não deixa vazar do periodo da variavel
        if (preenchimento_fim > maxDias)
            throw new BadRequestException(`Coleta: Duração total excede o ${maxDias} dias`);
        if (validacao_fim > maxDias)
            throw new BadRequestException(`Conferencia: Duração total excede o ${maxDias} dias`);
        if (liberacao_fim > maxDias) throw new BadRequestException(`Liberação: Duração total excede o ${maxDias} dias`);

        return {
            periodo_preenchimento: [p.preenchimento_inicio, preenchimento_fim],
            periodo_validacao: [validacao_inicio, validacao_fim],
            periodo_liberacao: [liberacao_inicio, liberacao_fim],
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
                        select: { id: true },
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
        let filtraMae = true;
        if (
            filters.indicador_id ||
            filters.meta_id ||
            filters.iniciativa_id ||
            filters.atividade_id ||
            filters.regiao_id ||
            filters.formula_composta_id ||
            filters.id
        )
            filtraMae = false;
        // se a pessoa passou um id, não filtra a variável mãe, ela realmente quer ver só aquela variável
        if (filters.variavel_mae_id) filtraMae = true;

        if (
            !filters.indicador_id &&
            !filters.meta_id &&
            !filters.iniciativa_id &&
            !filters.atividade_id &&
            !filters.regiao_id &&
            !filters.assuntos &&
            !filters.formula_composta_id &&
            !filters.id
        ) {
            throw new BadRequestException(
                'Use ao menos um dos filtros: id, indicador_id, meta_id, iniciativa_id, atividade_id, regiao_id, formula_composta_id ou assuntos'
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
                variavel_mae_id: !filtraMae ? undefined : (filters.variavel_mae_id ?? null),
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
                variavel_mae_id: true,
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
                supraregional: true,
                recalculando: true,
                recalculo_erro: true,
                recalculo_tempo: true,
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
                // Apenas utilizado para fornecer boolean de se possui filhas.
                possui_variaveis_filhas: true,
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
                variavel_categorica_id:
                    // na listagem, as categorica de crongrama devem se passar por uma várivel numérica
                    row.variavel_categorica_id === CONST_CRONO_VAR_CATEGORICA_ID ? null : row.variavel_categorica_id,
                etapa: row.variavel_categorica_id === CONST_CRONO_VAR_CATEGORICA_ID ? mapEtapa[row.id] : null,
                inicio_medicao: Date2YMD.toStringOrNull(row.inicio_medicao),
                fim_medicao: Date2YMD.toStringOrNull(row.fim_medicao),
                indicador_variavel: indicador_variavel,
                responsaveis: responsaveis,
                suspendida: row.suspendida_em ? true : false,
                possui_variaveis_filhas: row.possui_variaveis_filhas,
                supraregional: row.supraregional,
                recalculando: row.recalculando,
                recalculo_erro: row.recalculo_erro,
                recalculo_tempo: row.recalculo_tempo,
                variavel_mae_id: row.variavel_mae_id,
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
                variavel_mae_id: filters.variavel_mae_id ?? null,
            },
            include: {
                orgao: { select: { id: true, sigla: true, descricao: true } },
                variavel: {
                    select: {
                        supraregional: true,
                        variavel_categorica_id: true,
                        medicao_orgao: {
                            select: {
                                id: true,
                                sigla: true,
                            },
                        },
                    },
                },
                orgao_proprietario: { select: { id: true, sigla: true, descricao: true } },
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

        const ehAdminGeral = user.hasSomeRoles(['CadastroVariavelGlobal.administrador']);

        const paginas = Math.ceil(total_registros / ipp);
        return {
            tem_mais,
            token_ttl: PAGINATION_TOKEN_TTL,
            total_registros: total_registros,
            token_paginacao: retToken,
            paginas,
            pagina_corrente: page,
            linhas: linhas.map((r): VariavelGlobalItemDto => {
                let pode_editar = ehAdminGeral;
                let pode_editar_valor = ehAdminGeral;

                if (!pode_editar && user.hasSomeRoles(['CadastroVariavelGlobal.administrador_no_orgao'])) {
                    if (r.orgao_proprietario_id == user.orgao_id) {
                        pode_editar = true;
                        pode_editar_valor = true;
                    }
                }

                if (r.tipo == 'Calculada' || r.variavel.variavel_categorica_id === CONST_CRONO_VAR_CATEGORICA_ID) {
                    pode_editar = false;
                    pode_editar_valor = false;
                }
                if (r.variavel_mae_id) pode_editar = false;

                return {
                    id: r.id,
                    tipo: r.tipo,
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
                    pode_editar: pode_editar,
                    pode_editar_valor: pode_editar_valor,
                    pode_excluir: pode_editar && r.planos.length == 0,
                    possui_variaveis_filhas: r.possui_variaveis_filhas,
                    supraregional: r.variavel.supraregional,
                    regiao: r.regiao
                        ? ({
                              id: r.regiao.id,
                              descricao: r.regiao.descricao,
                              codigo: r.regiao.codigo,
                              nivel: r.regiao.nivel,
                              parente_id: r.regiao.parente_id,
                              pdm_codigo_sufixo: r.regiao.pdm_codigo_sufixo,
                          } satisfies Regiao)
                        : null,
                    orgao_responsal_coleta: r.variavel.medicao_orgao
                        ? {
                              id: r.variavel.medicao_orgao.id,
                              sigla: r.variavel.medicao_orgao.sigla,
                          }
                        : null,
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

    getVariavelWhereSet(filters: FilterVariavelDto) {
        return GetVariavelWhereSet(filters);
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

                NOT: filters.not_indicador_id
                    ? {
                          indicador_variavel: {
                              some: {
                                  indicador_id: filters.not_indicador_id,
                                  indicador_origem_id: null,
                              },
                          },
                      }
                    : undefined,
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
                variavel_mae_id: filters.variavel_mae_id ?? null,
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
        return GetVariavelPalavraChave(input, this.prisma);
    }

    async update(tipo: TipoVariavel, variavelId: number, dto: UpdateVariavelDto, user: PessoaFromJwt) {
        const logger = LoggerWithLog('Atualização de variável');
        logger.log(`Dados recebidos: ${JSON.stringify(dto)}`);
        // TODO: verificar se todos os membros de createVariavelDto.responsaveis estão ativos e sao realmente do orgão createVariavelDto.orgao_id

        const selfBefUpdate = await this.prisma.variavel.findFirstOrThrow({
            where: { id: variavelId, tipo, removido_em: null },
            select: {
                titulo: true,
                periodicidade: true,
                supraregional: true,
                variavel_categorica_id: true,
                liberacao_orgao_id: true,
                medicao_orgao_id: true,
                validacao_orgao_id: true,
                inicio_medicao: true,
                fim_medicao: true,
                variavel_mae_id: true,
                orgao_proprietario_id: true,
                variaveis_filhas: { select: { id: true, titulo: true } },
            },
        });
        if (selfBefUpdate.variavel_categorica_id === CONST_CRONO_VAR_CATEGORICA_ID)
            throw new HttpException('Variável do tipo Cronograma não pode ser atualizada', 400);

        if (selfBefUpdate.variavel_mae_id)
            throw new HttpException('Variável filha não pode ser atualizada diretamente', 400);

        await this.validaEquipeResponsavel(dto, {
            liberacao_orgao_id: selfBefUpdate.liberacao_orgao_id ?? dto.orgao_id ?? MIN_DTO_SAFE_NUM,
            medicao_orgao_id: selfBefUpdate.medicao_orgao_id ?? dto.orgao_id ?? MIN_DTO_SAFE_NUM,
            validacao_orgao_id: selfBefUpdate.validacao_orgao_id ?? dto.orgao_id ?? MIN_DTO_SAFE_NUM,
        });
        await this.validaCamposCategorica(dto, 'update');

        let indicador_id: number | undefined = undefined;
        if (tipo == 'PDM') {
            // buscando apenas pelo indicador pai verdadeiro desta variavel
            const indicadorViaVar = await this.verificaEscritaNaMeta(variavelId, user);

            indicador_id = indicadorViaVar.indicador.id;
        } else {
            if (dto.suspendida) throw new HttpException('Variáveis do plano setorial não podem ser suspensas.', 400); // uso necessita do ciclo do PDM, e tbm o caso de copiar o valor dos ids das categóricas
        }

        await this.checkDup(dto, variavelId, indicador_id);

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
            this.checkPeriodoVariavelGlobal({
                ...dto,
                inicio_medicao: selfBefUpdate.inicio_medicao ?? dto.inicio_medicao,
            });
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
                    periodicidade: true,
                    acumulativa: true,
                    VariavelAssuntoVariavel: {
                        select: {
                            assunto_variavel_id: true,
                        },
                    },
                    VariavelGrupoResponsavelEquipe: {
                        where: { removido_em: null },
                        select: {
                            grupo_responsavel_equipe_id: true,
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

            const gruposRecebidos = [
                ...(dto.medicao_grupo_ids ?? []),
                ...(dto.validacao_grupo_ids ?? []),
                ...(dto.liberacao_grupo_ids ?? []),
            ];
            const gruposAtuais = self.VariavelGrupoResponsavelEquipe.map((v) => v.grupo_responsavel_equipe_id);

            let equipes_configuradas: boolean | undefined = undefined;

            let medicao_orgao_id: number | undefined = undefined;
            let validacao_orgao_id: number | undefined = undefined;
            let liberacao_orgao_id: number | undefined = undefined;
            if (IsArrayContentsChanged(gruposRecebidos, gruposAtuais)) {
                logger.log('Equipe responsáveis alteradas...');
                equipes_configuradas = this.isEquipesConfiguradas(dto);

                await prismaTxn.variavelGrupoResponsavelEquipe.updateMany({
                    where: { variavel_id: variavelId, removido_em: null },
                    data: { removido_em: now },
                });

                if (dto.medicao_orgao_id) medicao_orgao_id = dto.medicao_orgao_id;
                if (dto.validacao_orgao_id) validacao_orgao_id = dto.validacao_orgao_id;
                if (dto.liberacao_orgao_id) liberacao_orgao_id = dto.liberacao_orgao_id;

                await this.insertEquipeResponsavel(dto, prismaTxn, variavelId, logger);
            }

            dto.orgao_proprietario_id = dto.orgao_proprietario_id ?? selfBefUpdate.orgao_proprietario_id;

            this.checkOrgaoProprietario(tipo, dto, user);

            const updated = await prismaTxn.variavel.update({
                where: { id: variavelId },
                data: {
                    equipes_configuradas: equipes_configuradas,
                    titulo: dto.titulo,
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
                    medicao_orgao_id,
                    validacao_orgao_id,
                    liberacao_orgao_id,
                    dado_aberto: dto.dado_aberto,
                    metodologia: dto.metodologia,
                    descricao: dto.descricao,
                    fonte_id: dto.fonte_id,
                    orgao_proprietario_id: dto.orgao_proprietario_id,

                    ...(dto.periodos
                        ? this.getPeriodTuples(dto.periodos, dto.periodicidade ?? self.periodicidade)
                        : {}),

                    suspendida_em: suspendida ? now : null,
                },
                select: {
                    valor_base: true,
                    fim_medicao: true,
                    acumulativa: true,
                    variaveis_filhas: {
                        select: {
                            id: true,
                            titulo: true,
                            supraregional: true,
                            regiao: {
                                select: {
                                    id: true,
                                    descricao: true,
                                },
                            },
                        },
                    },
                },
            });

            // Caso tenha filhas, deve atualizar as configs delas.
            const varsFilhasUpdates = [];
            for (const variavelFilha of updated.variaveis_filhas) {
                let titulo = dto.titulo;
                if (variavelFilha.regiao) titulo += ' - ' + variavelFilha.regiao.descricao;
                else if (variavelFilha.supraregional) titulo += SUPRA_SUFIXO;

                varsFilhasUpdates.push(
                    prismaTxn.variavel.updateMany({
                        where: {
                            id: variavelFilha.id,
                            removido_em: null,
                        },
                        data: {
                            titulo: titulo,
                            acumulativa: dto.acumulativa,
                            mostrar_monitoramento: dto.mostrar_monitoramento,
                            unidade_medida_id: dto.unidade_medida_id,
                            ano_base: dto.ano_base,
                            valor_base: dto.valor_base,
                            periodicidade: dto.periodicidade,
                            orgao_id: dto.orgao_id,
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

                            ...(dto.periodos
                                ? this.getPeriodTuples(dto.periodos, dto.periodicidade ?? self.periodicidade)
                                : {}),

                            suspendida_em: suspendida ? now : null,
                        },
                    })
                );
            }
            await Promise.all(varsFilhasUpdates);

            await prismaTxn.formulaComposta.updateMany({
                where: {
                    removido_em: null,
                    variavel_mae_id: variavelId,
                    autogerenciavel: true,
                },
                data: {
                    titulo: dto.titulo,
                    atualizar_calc: true,
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

            let recalc = Number(self.valor_base).toString() !== Number(updated.valor_base).toString();
            if (self.acumulativa != updated.acumulativa) recalc = true;

            if (recalc) {
                logger.log(`Valor base alterado de ${self.valor_base} para ${updated.valor_base}`);
                await this.recalc_series_dependentes([variavelId], prismaTxn);
            }

            if (tipo === 'PDM' && indicador) {
                await this.trataPeriodosSerieVariavel(
                    prismaTxn,
                    variavelId,
                    indicador.id,
                    dto.inicio_medicao === null ? undefined : dto.inicio_medicao,
                    dto.fim_medicao === null ? undefined : dto.fim_medicao
                );
            }
            await logger.saveLogs(prismaTxn, user.getLogData());
        });

        return { id: variavelId };
    }

    private async checkDup(dto: UpdateVariavelDto, variavelId: number | undefined, indicador_id: number | undefined) {
        const checkDup: ('codigo' | 'titulo')[] = ['codigo', 'titulo'];
        for (const col of checkDup) {
            if (dto[col] !== undefined) {
                const jaEmUso = await this.prisma.variavel.count({
                    where: {
                        removido_em: null,
                        [col]: { equals: dto[col], mode: 'insensitive' },
                        NOT: variavelId ? { id: variavelId } : undefined,
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
                if (jaEmUso > 0)
                    throw new HttpException(
                        `${col == 'codigo' ? 'Código' : 'Título'} já está em uso no indicador.`,
                        400
                    );
            }
        }
    }

    /*
      Função para remover as series inválidas quando a periodicidade da variável é alterada
      deve ser utilizada apenas para tipo PDM
     */
    public async trataPeriodosSerieVariavel(
        prismaTxn: Prisma.TransactionClient,
        variavelId: number,
        indicadorId: number,
        dataInicio?: Date,
        dataFim?: Date
    ) {
        const [indicadorInfo, variavelInfo] = await Promise.all([
            this.prisma.indicador.findFirst({
                where: { id: indicadorId },
                select: {
                    periodicidade: true,
                },
            }),
            this.prisma.variavel.findFirst({
                where: { id: variavelId },
                select: {
                    periodicidade: true,
                },
            }),
        ]);
        if (!indicadorInfo || !variavelInfo) throw new HttpException('Variável ou indicador não encontrados', 400);

        // Verifica se a periodicidade da variavel é igual a do indicador, se não for, não faz nada
        if (indicadorInfo.periodicidade != variavelInfo.periodicidade) return;

        let periodoValido: string[] = [];
        if (!dataInicio && !dataFim) {
            periodoValido = await this.util.gerarPeriodoVariavelEntreDatas(variavelId, indicadorId);
        } else {
            const filtro = new FilterPeriodoDto();
            filtro.data_inicio = dataInicio;
            filtro.data_fim = dataFim;
            periodoValido = await this.util.gerarPeriodoVariavelEntreDatas(variavelId, indicadorId, filtro);
        }
        //Recupera as series que serao excluidas
        const seriesAfetadas = await prismaTxn.serieVariavel.findMany({
            where: {
                NOT: {
                    data_valor: {
                        in: periodoValido.map((data) => Date2YMD.fromString(data)),
                    },
                },
                variavel_id: variavelId,
            },
        });

        //Cria os registros na tabela de historico
        for (const serie of seriesAfetadas) {
            await prismaTxn.serieVariavelHistorico.create({
                data: {
                    serie_variavel_id: serie.id,
                    variavel_id: serie.variavel_id,
                    serie: serie.serie,
                    data_valor: serie.data_valor,
                    valor_nominal: serie.valor_nominal,
                    variavel_categorica_id: serie.variavel_categorica_id,
                    variavel_categorica_valor_id: serie.variavel_categorica_id,
                    atualizado_em: serie.atualizado_em,
                    atualizado_por: serie.atualizado_por,
                    conferida: serie.conferida,
                    conferida_por: serie.conferida_por,
                    conferida_em: serie.conferida_em,
                    ciclo_fisico_id: serie.ciclo_fisico_id,
                },
            });
        }
        //Exclui os registros invalidos
        await prismaTxn.serieVariavel.deleteMany({
            where: {
                NOT: {
                    data_valor: {
                        in: periodoValido.map((data) => Date2YMD.fromString(data)),
                    },
                },
                variavel_id: variavelId,
            },
        });
    }

    private isEquipesConfiguradas(dto: UpdateVariavelDto) {
        return (
            Array.isArray(dto.medicao_grupo_ids) &&
            Array.isArray(dto.validacao_grupo_ids) &&
            Array.isArray(dto.liberacao_grupo_ids) &&
            dto.medicao_grupo_ids.length > 0 &&
            dto.validacao_grupo_ids.length > 0 &&
            dto.liberacao_grupo_ids.length > 0
        );
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
        await this.metaService.assertMetaWriteOrThrow('_PDM', metaRow.meta_id, user, 'variavel do indicador');
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

    private async validaCamposCategorica(dto: UpdateVariavelDto, op: 'create' | 'update') {
        if (dto.inicio_medicao && dto.inicio_medicao.getDate() != 1) {
            throw new HttpException('O início da medição deve ser no primeiro dia do mês.', 400);
        }
        if (dto.fim_medicao && dto.fim_medicao.getDate() != 1) {
            throw new HttpException('O fim da medição deve ser no primeiro dia do mês.', 400);
        }

        if (dto.variavel_categorica_id) {
            dto.ano_base = null;
            dto.valor_base = 0;
            dto.acumulativa = false;
            dto.casas_decimais = 0;
            dto.unidade_medida_id = CONST_VAR_SEM_UN_MEDIDA;
            dto.polaridade = 'Neutra';
        }

        if (op == 'create' && !dto.variavel_categorica_id) {
            if (!dto.unidade_medida_id) throw new HttpException('Unidade de medida é obrigatória', 400);
            if (dto.valor_base === undefined) throw new HttpException('Valor base é obrigatório', 400);
        }
    }

    private async validaEquipeResponsavel(
        dto: UpdateVariavelDto,
        antigo: {
            liberacao_orgao_id: number;
            medicao_orgao_id: number;
            validacao_orgao_id: number;
        }
    ) {
        const medicao_orgao_id = dto.medicao_orgao_id ?? antigo.medicao_orgao_id;
        const validacao_orgao_id = dto.validacao_orgao_id ?? antigo.validacao_orgao_id;
        const liberacao_orgao_id = dto.liberacao_orgao_id ?? antigo.liberacao_orgao_id;
        console.log(dto, antigo, medicao_orgao_id, validacao_orgao_id, liberacao_orgao_id);
        const grupoPrefetch = await this.prisma.grupoResponsavelEquipe.findMany({
            where: {
                orgao_id: { in: [medicao_orgao_id, validacao_orgao_id, liberacao_orgao_id] },
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
                orgao_id: true,
            },
        });

        if (Array.isArray(dto.medicao_grupo_ids)) {
            for (const grupoId of dto.medicao_grupo_ids) {
                const grupo = grupoPrefetch.find((g) => g.id === grupoId && g.orgao_id === medicao_orgao_id);
                if (!grupo) {
                    throw new HttpException(`Grupo ${grupoId} não encontrado. Verifique o Órgão Responsável.`, 400);
                }
                if (grupo.perfil !== 'Medicao') {
                    throw new HttpException(`Grupo ${grupoId} não é de medição.`, 400);
                }
            }
        }

        if (Array.isArray(dto.validacao_grupo_ids)) {
            for (const grupoId of dto.validacao_grupo_ids) {
                const grupo = grupoPrefetch.find((g) => g.id === grupoId && g.orgao_id === validacao_orgao_id);
                if (!grupo) {
                    throw new HttpException(`Grupo ${grupoId} não encontrado. Verifique o Órgão Responsável.`, 400);
                }
                if (grupo.perfil !== 'Validacao') {
                    throw new HttpException(`Grupo ${grupoId} não é de validação`, 400);
                }
            }
        }

        if (Array.isArray(dto.liberacao_grupo_ids)) {
            for (const grupoId of dto.liberacao_grupo_ids) {
                const grupo = grupoPrefetch.find((g) => g.id === grupoId && g.orgao_id === liberacao_orgao_id);
                if (!grupo) {
                    throw new HttpException(`Grupo ${grupoId} não encontrado. Verifique o Órgão Responsável.`, 400);
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

    async processVariaveisSuspensasController() {
        return await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient): Promise<number[]> => {
            return await this.processVariaveisSuspensas(prismaTx);
        });
    }

    async processVariaveisSuspensas(prismaTx: Prisma.TransactionClient): Promise<number[]> {
        await prismaTx.$queryRaw`
            CREATE TEMP TABLE _jobs ON COMMIT DROP AS
            SELECT * FROM (
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
            ) me
        `;

        await prismaTx.$queryRaw`
            CREATE TEMP TABLE _lookup_valores ON COMMIT DROP AS
            SELECT * FROM (
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
                FROM _jobs j
                JOIN ciclo_fisico cf ON cf.pdm_id = j.pdm_id AND cf.data_ciclo = date_trunc('month', j.suspendida_em)
                LEFT JOIN serie_variavel sv ON sv.variavel_id = j.variavel_id
                    AND sv.data_valor = date_trunc('month', j.suspendida_em) + j.atraso_meses
                    AND sv.serie = j.serie
                ORDER BY j.cf_corrente_data_ciclo
            ) me;
        `;

        await prismaTx.$queryRaw`
        CREATE TEMP TABLE _lookup_existentes ON COMMIT DROP AS
        SELECT
            j.cf_corrente_id,
            j.variavel_id,
            j.serie,
            sv.valor_nominal,
            sv.id as sv_id
        FROM _jobs j
        LEFT JOIN serie_variavel sv ON sv.variavel_id = j.variavel_id
            AND sv.data_valor = j.cf_corrente_data_ciclo + j.atraso_meses
            AND sv.serie = j.serie;
        `;

        await prismaTx.$executeRaw`
            DELETE FROM serie_variavel WHERE id IN (SELECT sv_id FROM _lookup_existentes WHERE sv_id IS NOT NULL)
        `;

        const suspensas: { variaveis: number[] | null }[] = await prismaTx.$queryRaw`
            WITH insert_values AS (
                INSERT INTO serie_variavel (variavel_id, serie, data_valor, valor_nominal, ciclo_fisico_id)
                SELECT
                    lv.variavel_id,
                    lv.serie,
                    lv.cf_corrente_data_ciclo + lv.atraso_meses,
                    lv.valor,
                    lv.cf_corrente_id
                FROM _lookup_valores lv
                WHERE lv.valor IS NOT NULL
                RETURNING variavel_id
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
                FROM _lookup_valores lv
                LEFT JOIN _lookup_existentes le ON le.variavel_id = lv.variavel_id AND lv.serie = le.serie AND lv.cf_corrente_id = le.cf_corrente_id
                RETURNING variavel_id
            ),
            must_update_indicators AS (
                SELECT variavel_id FROM insert_values
                UNION
                SELECT variavel_id FROM insert_control
            )
            SELECT
                array_agg(DISTINCT variavel_id) as variaveis
            FROM must_update_indicators
        `;

        if (suspensas[0] && Array.isArray(suspensas[0].variaveis)) {
            const varsSuspensas = suspensas[0].variaveis;
            if (varsSuspensas.length) {
                console.log('variáveis suspensas recalc:', varsSuspensas);
                await this.recalc_series_dependentes(varsSuspensas, prismaTx);
                await this.recalc_indicador_usando_variaveis(varsSuspensas, prismaTx);
            } else {
                console.log('não há variáveis suspensas');
            }

            return varsSuspensas;
        }
        return [];
    }

    async remove(tipo: TipoVariavel, variavelId: number, user: PessoaFromJwt) {
        const self = await this.findOne(tipo, variavelId, {}, user);
        if (!self) throw new BadRequestException('Variavel não encontrada, confira se você está no indicador base.');

        const logger = LoggerWithLog('Remoção de variável');
        logger.debug(`Removendo variável ${variavelId}`);

        // TODO: pensar se quando apagar uma calculada, ou seja por side-effect talvez, precisa apagar a formula-composta
        // do autogerenciavel
        if (self.variavel_categorica_id === CONST_CRONO_VAR_CATEGORICA_ID)
            throw new BadRequestException(
                'Variável do tipo Cronograma não pode ser removida pela variável, remova pela etapa.'
            );

        if (tipo == 'PDM') {
            // buscando apenas pelo indicador pai verdadeiro desta variavel
            await this.verificaEscritaNaMeta(variavelId, user);
        }
        if ('pode_editar' in self) {
            const selfTyped = self as any as VariavelGlobalItemDto;
            if (!selfTyped.pode_excluir) {
                throw new BadRequestException('Você não tem permissão para remover esta variável.');
            }
        }

        const now = new Date(Date.now());
        await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient) => {
                const refEmUso = await prismaTx.indicadorFormulaVariavel.findMany({
                    where: {
                        variavel_id: variavelId,
                        indicador: {
                            removido_em: null,
                        },
                    },
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

                await prismaTx.variavelGrupoResponsavelEquipe.updateMany({
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

                await AddTaskRecalcVariaveis(prismaTx, { variavelIds: [variavelId] });

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
                id: true,
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
        filters: FilterPeriodoDto
    ): Promise<ValorSerieExistente[]> {
        if (filters.ate_ciclo_corrente) {
            filters.data_fim = await this.util.ultimoPeriodoValido(variavelId);
        }

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
                elementos: true,
            },
        });
    }

    getValorSerieExistentePorPeriodo(
        valoresExistentes: ValorSerieExistente[],
        variavel_id: number,
        uso: TipoUso = 'escrita',
        user: PessoaFromJwt
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
                valor_nominal: serieValor.valor_nominal.toString(),
                referencia:
                    uso == 'escrita'
                        ? this.getEditExistingSerieJwt(
                              Date2YMD.toString(serieValor.data_valor),
                              serieValor.id,
                              variavel_id,
                              serieValor.serie,
                              user
                          )
                        : '',
                conferida: serieValor.conferida,
                elementos: serieValor.elementos,
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

        const series: Serie[] = [...ORDEM_SERIES_RETORNO];

        const disableShuffle = await this.smaeConfigService.getConfigBooleanWithDefault('DISABLE_SHUFFLE', false);
        SeriesArrayShuffle(series, disableShuffle); // garante que o consumidor não está usando os valores das series cegamente

        const cicloCorrente =
            filters.serie == 'Realizado' || filters.ate_ciclo_corrente
                ? await this.prisma.variavelCicloCorrente.findUnique({
                      where: { variavel_id: variavelId },
                      select: { ultimo_periodo_valido: true, prazo: true, atrasos: true },
                  })
                : null;

        if (filters.serie) {
            series.length = 0;
            for (const serie of ORDEM_SERIES_RETORNO) {
                if (serie.toLowerCase().includes(filters.serie.toLowerCase())) {
                    series.push(serie);
                }
            }
            if (filters.serie == 'Realizado') filters.ate_ciclo_corrente = true;

            if (cicloCorrente && cicloCorrente.atrasos.length > 0) {
                // caso tenha mais de um atraso, então o ciclo atual não é o ciclo corrente, então vamos pular já direto
                // na query o ultimo ciclo corrente
                filters.ate_ciclo_corrente_inclusive = false;
            }
        }

        // TODO adicionar limpeza da serie para quem for ponto focal
        const valoresExistentes = await this.getValorSerieExistente(variavelId, series, filters);
        const porPeriodo = this.getValorSerieExistentePorPeriodo(valoresExistentes, variavelId, filters.uso, user);

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
                variavel_categorica_id: variavel.variavel_categorica_id,
                unidade_medida: variavel.unidade_medida,
                recalculando: variavel.recalculando,
                recalculo_erro: variavel.recalculo_erro,
                recalculo_tempo: variavel.recalculo_tempo,
                variavel_mae_id: variavel.variavel_mae_id,
            },
            linhas: [],
            ordem_series: ORDEM_SERIES_RETORNO,
        };
        if (result.variavel?.variavel_categorica_id === CONST_CRONO_VAR_CATEGORICA_ID) {
            result.variavel.variavel_categorica_id = null;
        }

        const [analisesCiclo, documentoCiclo] = await this.procuraCicloAnaliseDocumento(
            tipo,
            variavelId,
            valoresExistentes
        );

        const mapAnalisesCiclo: Record<string, (typeof analisesCiclo)[0]> = {};
        for (const analise of analisesCiclo) {
            mapAnalisesCiclo[Date2YMD.toString(analise.referencia_data)] = analise;
        }
        const mapDocumentoCiclo: Record<string, (typeof documentoCiclo)[0]> = {};
        for (const doc of documentoCiclo) {
            mapDocumentoCiclo[Date2YMD.toString(doc.referencia_data)] = doc;
        }

        // TODO bloquear acesso ao token pra quem não for admin ou tecnico dessa meta (no PDM),
        // no Plano Setorial não tem problema vazar o token, pois lá tem controle na hora da escrita
        // que tbm poderia ser implementado

        let indicadorId: number | null = null;
        if (tipo === 'PDM') {
            const indicadorViaVar = await this.getIndicadorViaVariavel(variavelId);
            indicadorId = indicadorViaVar.id;
        }

        const todosPeriodos = await this.util.gerarPeriodoVariavelEntreDatas(variavel.id, indicadorId, filters);

        let prazoPassou = true; // Default para true (mostra tudo)
        let ultimoPeriodoValidoStr: string | null = null;
        if (filters.serie === 'Realizado' && cicloCorrente) {
            const currentDate = Date2YMD.toString(DateTime.local({ zone: SYSTEM_TIMEZONE }).startOf('day').toJSDate());
            // se o ciclo corrente não tem prazo, assume que o prazo não passou
            prazoPassou = cicloCorrente.prazo ? currentDate > Date2YMD.toString(cicloCorrente.prazo) : false;

            console.log(
                `Prazo: ${Date2YMD.toStringOrNull(cicloCorrente.prazo)}, Data atual: ${currentDate}, Prazo passou: ${prazoPassou}`
            );
            ultimoPeriodoValidoStr = Date2YMD.toString(cicloCorrente.ultimo_periodo_valido);
        }

        for (const periodoYMD of todosPeriodos) {
            const isCurrentCycle = ultimoPeriodoValidoStr === periodoYMD;

            if (isCurrentCycle && !prazoPassou) {
                if (!filters.suporta_ciclo_info) {
                    this.logger.debug(`Prazo não passou para ${periodoYMD} e frontend não suporta info. Pulando.`);
                    continue;
                }
                this.logger.debug(`Prazo não passou para ${periodoYMD}, mas frontend suporta info. Processando.`);
            }

            const seriesExistentes = this.populaSeriesExistentes(
                porPeriodo,
                periodoYMD,
                variavelId,
                variavel,
                filters.uso,
                user
            );
            let ciclo_fisico: SACicloFisicoDto | undefined = undefined;

            const analiseCiclo = mapAnalisesCiclo[periodoYMD];
            const docCiclo = mapDocumentoCiclo[periodoYMD];
            if (analiseCiclo) {
                ciclo_fisico = {
                    id: analiseCiclo.id,
                    analise: analiseCiclo.analise_qualitativa || '',
                    tem_documentos: (docCiclo?._count || 0) > 0,
                    contagem_qualitativa: analiseCiclo.contagem_qualitativa,
                };
            }

            result.linhas.push({
                periodo: periodoYMD.substring(0, 4 + 2 + 1),
                agrupador: periodoYMD.substring(0, 4),
                series: seriesExistentes,
                ciclo_fisico: ciclo_fisico,
            });

            if (isCurrentCycle && !prazoPassou && filters.suporta_ciclo_info) {
                // Busca o 'Realizado'
                const realizadoIndex = ORDEM_SERIES_RETORNO.indexOf('Realizado');
                if (realizadoIndex !== -1 && seriesExistentes[realizadoIndex]) {
                    const realizadoSerie = seriesExistentes[realizadoIndex] as SerieValorNomimal;
                    if (realizadoSerie) {
                        realizadoSerie.referencia = ':no_ciclo:';
                    }
                }
            }
        }

        if (filters.incluir_auxiliares) {
            const categorica = result.variavel?.variavel_categorica_id
                ? await this.vCatService.findAll({ id: result.variavel.variavel_categorica_id })
                : null;

            let categoricas: Record<string, string> | null = null;
            if (categorica && categorica[0]) {
                categoricas = categorica[0].valores
                    .map((v) => ({ [v.valor_variavel]: v.titulo }))
                    .reduce((acc, cur) => ({ ...acc, ...cur }), {});
            }

            result.dados_auxiliares = {
                categoricas: categoricas,
            };
        }

        return result;
    }

    private async procuraCicloAnaliseDocumento(
        tipo: TipoVariavel,
        variavelId: number,
        valoresExistentes: ValorSerieExistente[]
    ): Promise<[CicloAnalise[], CicloDocumento[]]> {
        const dataValores = valoresExistentes.map((v) => v.data_valor);

        if (tipo == TipoVariavel.PDM) {
            return await Promise.all([
                this.prisma.variavelCicloFisicoQualitativo.findMany({
                    where: {
                        variavel_id: variavelId,
                        referencia_data: { in: dataValores },
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
                        referencia_data: { in: dataValores },
                    },
                    by: ['referencia_data'],
                    _count: true,
                }),
            ]);
        } else if (tipo == TipoVariavel.Global) {
            // Caso a variável seja filha, dados relevantes são da mãe.
            const variavel = await this.prisma.variavel.findFirst({
                where: { id: variavelId },
                select: { variavel_mae_id: true },
            });
            if (!variavel) throw new Error('Erro Interno! Variável não encontrada em função de variável global.');

            const [analises, documentos] = await Promise.all([
                this.prisma.variavelGlobalCicloAnalise
                    .groupBy({
                        where: {
                            variavel_id: variavel.variavel_mae_id ? variavel.variavel_mae_id : variavelId,
                            referencia_data: { in: dataValores },
                            removido_em: null,
                            ultima_revisao: true,
                            fase: 'Liberacao',
                            aprovada: true,
                        },
                        by: ['referencia_data'],
                        _count: true,
                    })
                    .then((analises) => {
                        return analises.map((a) => {
                            return {
                                referencia_data: a.referencia_data,
                                analise_qualitativa: '',
                                contagem_qualitativa: a._count,
                            } as CicloAnalise;
                        });
                    }),
                this.prisma.variavelGlobalCicloDocumento.groupBy({
                    where: {
                        variavel_id: variavel.variavel_mae_id ? variavel.variavel_mae_id : variavelId,
                        removido_em: null,
                        referencia_data: { in: dataValores },
                    },
                    by: ['referencia_data'],
                    _count: true,
                }),
            ]);

            return [analises, documentos];
        } else {
            return [[], []];
        }
    }

    populaSeriesExistentes(
        porPeriodo: SerieValorPorPeriodo,
        periodoYMD: string,
        variavelId: number,
        variavel: { acumulativa: boolean; variavel_categorica_id: number | null; id: number },
        uso: TipoUso = 'escrita',
        user: PessoaFromJwt
    ): SerieIndicadorValorNominal[] | SerieValorNomimal[] | SerieValorCategoricaComposta[] {
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
                seriesExistentes.push(
                    variavel.variavel_categorica_id
                        ? this.serieCategoricaComElementos(existeValor.Previsto, variavel.id)
                        : existeValor.Previsto
                );
            } else {
                seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD, variavelId, 'Previsto', uso, user));
            }

            if (existeValor.PrevistoAcumulado) {
                seriesExistentes.push(this.referencia_boba(variavel.acumulativa, existeValor.PrevistoAcumulado));
            } else {
                seriesExistentes.push(
                    this.referencia_boba(
                        variavel.acumulativa,
                        this.buildNonExistingSerieValor(periodoYMD, variavelId, 'PrevistoAcumulado', uso, user)
                    )
                );
            }

            if (existeValor.Realizado) {
                seriesExistentes.push(
                    variavel.variavel_categorica_id
                        ? this.serieCategoricaComElementos(existeValor.Realizado, variavel.id)
                        : existeValor.Realizado
                );
            } else {
                seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD, variavelId, 'Realizado', uso, user));
            }

            if (existeValor.RealizadoAcumulado) {
                seriesExistentes.push(this.referencia_boba(variavel.acumulativa, existeValor.RealizadoAcumulado));
            } else {
                seriesExistentes.push(
                    this.referencia_boba(
                        variavel.acumulativa,
                        this.buildNonExistingSerieValor(periodoYMD, variavelId, 'RealizadoAcumulado', uso, user)
                    )
                );
            }
        } else {
            seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD, variavelId, 'Previsto', uso, user));
            seriesExistentes.push(
                this.buildNonExistingSerieValor(periodoYMD, variavelId, 'PrevistoAcumulado', uso, user)
            );
            seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD, variavelId, 'Realizado', uso, user));
            seriesExistentes.push(
                this.buildNonExistingSerieValor(periodoYMD, variavelId, 'RealizadoAcumulado', uso, user)
            );
        }

        if (uso == 'leitura') {
            for (const e of seriesExistentes) {
                delete (e as any).referencia;
            }
        }

        return seriesExistentes;
    }

    private serieCategoricaComElementos(serie: SerieValorNomimal, variavelId: number): SerieValorNomimal {
        interface Elementos {
            categorica: number[][];
        }

        const retorno: SerieValorNomimal = {
            valor_nominal: serie.valor_nominal,
            referencia: serie.referencia,
            data_valor: serie.data_valor,
            ha_conferencia_pendente: serie.ha_conferencia_pendente,
            conferida: serie.conferida,
        };

        if (!serie.elementos || typeof serie.elementos !== 'object') {
            retorno.elementos = [
                {
                    variavel_id: variavelId,
                    categoria: serie.valor_nominal,
                } satisfies SerieValorCategoricaElemento,
            ];

            return retorno;
        }

        const elementosParsed: Elementos = serie.elementos as unknown as Elementos;
        if (!elementosParsed.categorica) return retorno;

        retorno.elementos = elementosParsed.categorica.map((e) => {
            return {
                variavel_id: e[0],
                categoria: e[1].toString(),
            } satisfies SerieValorCategoricaElemento;
        });

        return retorno;
    }

    private referencia_boba(varServerSideAcumulativa: boolean, sv: SerieValorNomimal): SerieValorNomimal {
        if (varServerSideAcumulativa) {
            sv.referencia = 'SS';
        }
        sv.elementos = null;
        return sv;
    }

    private buildNonExistingSerieValor(
        periodo: DateYMD,
        variavelId: number,
        serie: Serie,
        uso: TipoUso,
        user: PessoaFromJwt
    ): SerieValorNomimal {
        return {
            data_valor: periodo,
            referencia: uso == 'escrita' ? this.getEditNonExistingSerieJwt(variavelId, periodo, serie, user) : '',
            valor_nominal: '',
        };
    }

    private getEditExistingSerieJwt(
        periodo: DateYMD,
        id: number,
        variavelId: number,
        serie: Serie,
        user: PessoaFromJwt
    ): string {
        // TODO opcionalmente adicionar o modificado_em aqui
        return this.serieToken.encode({
            serie,
            periodo,
            variavelId,
            id: BigInt(id),
            userId: BigInt(user.id),
        });
    }

    private getEditNonExistingSerieJwt(
        variavelId: number,
        periodo: DateYMD,
        serie: Serie,
        user: PessoaFromJwt
    ): string {
        return this.serieToken.encode({
            serie,
            periodo,
            variavelId: variavelId,
            userId: BigInt(user.id),
        });
    }

    private validarValoresJwt(valores: SerieUpsert[], user: PessoaFromJwt): ValidatedUpsert[] {
        const valids: ValidatedUpsert[] = [];
        for (const valor of valores) {
            if (valor.referencia === 'SS')
                // server-side
                continue;

            let decoded;
            try {
                decoded = this.serieToken.decode(valor.referencia, BigInt(user.id));
            } catch (error) {
                if (error instanceof HttpException) throw error;

                throw new HttpException('Token inválido ou não autorizado.', 400);
            }
            // se chegou como number, converte pra string
            const asText =
                typeof valor.valor == 'number' && valor.valor !== undefined
                    ? Number(valor.valor).toString()
                    : valor.valor;

            const referenciaDecoded: NonExistingSerieJwt = {
                periodo: decoded.periodo,
                variable_id: decoded.variavelId,
                serie: decoded.serie,
            };
            if (decoded.id !== undefined) (referenciaDecoded as any).id = Number(decoded.id);

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
        const logger = LoggerWithLog('Atualização de série');
        // TODO opcionalmente verificar se o modificado_em de todas as variáveis ainda é igual
        // em relação ao momento JWT foi assinado, pra evitar sobrescrita da informação sem aviso para o usuário
        // da mesma forma, ao buscar os que não tem ID, não deve existir outro valor já existente no periodo

        const valoresValidos = this.validarValoresJwt(valores, user);

        const variaveisInfo = await this.loadVariaveisComCategorica(
            tipo,
            this.prisma,
            valoresValidos.map((e) => e.referencia.variable_id)
        );
        const varIdsSorted = variaveisInfo.map((e) => e.id).sort();

        const orgao_id = user.orgao_id;
        if (!orgao_id) throw new BadRequestException('Usuário sem órgão');

        const globais = variaveisInfo.filter((v) => v.tipo === 'Global');
        if (tipo != 'Global' && globais.length)
            throw new BadRequestException('Não é possível editar variáveis globais.');

        // just in case, não poder editar o Calc mesmo por engano
        const naoPermitidos = variaveisInfo.filter((v) => v.tipo !== 'Global' && v.tipo !== 'PDM');
        if (naoPermitidos.length)
            throw new BadRequestException('Não é possível um ou mais tipos de variáveis enviados.');

        // validação de permissão de escrita para globais
        if (globais.length && !user.hasSomeRoles(['CadastroVariavelGlobal.administrador'])) {
            const collab = await user.getEquipesColaborador(this.prisma);
            const ehAdminNoOrgao = user.hasSomeRoles(['CadastroVariavelGlobal.administrador_no_orgao']);

            for (const variavel of variaveisInfo) {
                // PDM só valida pela listagem de variáveis, no momento
                if (variavel.tipo != 'Global') continue;

                if (!variavel.orgao_proprietario_id) throw new BadRequestException('Variável sem órgão proprietário.');

                if (ehAdminNoOrgao && variavel.orgao_proprietario_id !== orgao_id) {
                    throw new HttpException('Você não pode editar variáveis de outro órgão proprietário.', 400);
                }
                if (ehAdminNoOrgao) continue;

                const variavelEquipes = variavel.VariavelGrupoResponsavelEquipe.filter(
                    (g) =>
                        g.grupo_responsavel_equipe.perfil === 'Liberacao' ||
                        g.grupo_responsavel_equipe.perfil === 'Validacao'
                );
                if (!variavelEquipes.length) throw new BadRequestException('Variável sem grupo de escrita definido.');

                const variavelEquipesIds = variavelEquipes.map((e) => e.grupo_responsavel_equipe.id);
                if (!collab.some((e) => variavelEquipesIds.includes(e))) {
                    throw new HttpException(
                        'Você não tem permissão para editar esta variável por meio das equipes (Liberação ou Validação).',
                        400
                    );
                }
            }
        }

        // validações para caso tenha global, não pode ter mais de um pai presente no batch
        let variavelMaeId: number | undefined = undefined;
        if (globais.length) {
            const variavelMaes = new Set<number>();

            for (const variavel of variaveisInfo) {
                console.log(variavel);
                if (variavel.variavel_mae_id) variavelMaes.add(variavel.variavel_mae_id);
            }

            if (variavelMaes.size && variavelMaes.size > 1)
                throw new BadRequestException('Não é possível editar variáveis de diferentes pais ao mesmo tempo.');

            variavelMaeId = variavelMaes.size ? (variavelMaes.values().next().value as number) : undefined;
        }

        const variaveisModificadas: Record<number, boolean> = {};
        const now = new Date(Date.now());

        // apenas para as Globais, atualização do VariavelGlobalCicloAnalise
        // acontecerá aprovação de todas as variaveis que foram recebidas, mesmo que não tenham sido modificadas
        // uma vez que a conferencia é feita da mesma forma (e o refactor seria grande pra fazer um teste desnecessário)
        let mesesParaRemover: VariavelGlobalLiberacao[] = [];
        const mesesParaLiberar: VariavelGlobalLiberacao[] = [];

        await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient) => {
                await prismaTxn.$queryRaw`
                    select pg_advisory_xact_lock(varId::bigint)::varchar
                    from unnest(${varIdsSorted}::bigint[]) as varId;
                `;

                const idsToBeRemoved: number[] = [];
                const updatePromises: Promise<any>[] = [];
                const deletePromises: Promise<any>[] = [];
                const createList: Prisma.SerieVariavelUncheckedCreateInput[] = [];

                for (const valor of valoresValidos) {
                    const variavelInfo = variaveisInfo.filter((e) => e.id === valor.referencia.variable_id)[0];
                    if (!variavelInfo) throw new Error('Variável não encontrada, mas deveria já ter sido carregada.');

                    // não é para ser possível editar essas séries
                    // pois uma é pra ser a copia (no caso de acumulativa=false) e a outra é sempre gerado como "SS"
                    // logo não deveria ser possível editar por aqui
                    if (valor.referencia.serie == 'RealizadoAcumulado' || valor.referencia.serie == 'PrevistoAcumulado')
                        continue;

                    let variavel_categorica_valor_id: number | null = null;
                    // busca os valores vazios mas que já existem, para serem removidos
                    if (valor.valor === '' && 'id' in valor.referencia) {
                        logger.log(`Variável ${valor.referencia.variable_id} com valor vazio, será removida`);
                        idsToBeRemoved.push(valor.referencia.id);

                        if (!variaveisModificadas[valor.referencia.variable_id]) {
                            variaveisModificadas[valor.referencia.variable_id] = true;
                        }

                        if (
                            !variavelInfo.acumulativa &&
                            (valor.referencia.serie === 'Realizado' || valor.referencia.serie === 'Previsto')
                        ) {
                            const acumuladoSerie =
                                valor.referencia.serie === 'Realizado' ? 'RealizadoAcumulado' : 'PrevistoAcumulado';
                            deletePromises.push(
                                prismaTxn.serieVariavel.deleteMany({
                                    where: {
                                        variavel_id: valor.referencia.variable_id,
                                        serie: acumuladoSerie,
                                        data_valor: Date2YMD.fromString(valor.referencia.periodo),
                                    },
                                })
                            );
                        }
                    } else if (valor.valor !== '') {
                        if (!variaveisModificadas[valor.referencia.variable_id]) {
                            variaveisModificadas[valor.referencia.variable_id] = true;
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

                        const updateOrCreateData: Prisma.SerieVariavelCreateManyInput = {
                            data_valor: Date2YMD.fromString(valor.referencia.periodo),
                            valor_nominal: valor.valor,
                            variavel_id: valor.referencia.variable_id,
                            serie: valor.referencia.serie,
                            atualizado_em: now,
                            atualizado_por: user.id,
                            conferida: true,
                            conferida_por: user.id,
                            conferida_em: now,
                            variavel_categorica_id: variavelInfo.variavel_categorica?.id,
                            variavel_categorica_valor_id,
                        };

                        if ('id' in valor.referencia) {
                            if (globais.length && valor.referencia.serie == 'Realizado')
                                mesesParaLiberar.push({
                                    referencia_data: Date2YMD.fromString(valor.referencia.periodo),
                                    variavel_id: valor.referencia.variable_id,
                                });

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
                                    data: updateOrCreateData,
                                })
                            );
                        } else {
                            createList.push({
                                ...updateOrCreateData,
                                variavel_id: valor.referencia.variable_id,
                                serie: valor.referencia.serie,
                                data_valor: Date2YMD.fromString(valor.referencia.periodo),
                            });
                        }

                        // Sync 'RealizadoAcumulado' and 'PrevistoAcumulado' for non-accumulative variables
                        if (
                            !variavelInfo.acumulativa &&
                            (valor.referencia.serie === 'Realizado' || valor.referencia.serie === 'Previsto')
                        ) {
                            const acumuladoSerie =
                                valor.referencia.serie === 'Realizado' ? 'RealizadoAcumulado' : 'PrevistoAcumulado';

                            updatePromises.push(
                                prismaTxn.serieVariavel.upsert({
                                    where: {
                                        serie_variavel_id_data_valor: {
                                            variavel_id: valor.referencia.variable_id,
                                            serie: acumuladoSerie,
                                            data_valor: Date2YMD.fromString(valor.referencia.periodo),
                                        },
                                    },
                                    update: {
                                        // aqui vai acabar passando por cima dos timestamps e pessoas que fizeram
                                        // a conferencia... mas acho que não tem problema
                                        ...updateOrCreateData,
                                        serie: acumuladoSerie,
                                    },
                                    create: {
                                        ...updateOrCreateData,
                                        serie: acumuladoSerie,
                                    },
                                })
                            );
                        }
                    } // else "não há valor" e não tem ID, ou seja, n precisa acontecer nada no banco
                }

                // apaga antes dos updates, para que o upsert não tenha problemas
                if (deletePromises.length) await Promise.all(deletePromises);
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
                if (idsToBeRemoved.length) {
                    if (globais.length)
                        mesesParaRemover = await this.batchUpsertBuscaMesesParaRemover(
                            logger,
                            prismaTxn,
                            idsToBeRemoved
                        );

                    await prismaTxn.serieVariavel.deleteMany({
                        where: {
                            id: { in: idsToBeRemoved },
                        },
                    });
                }

                if (createList.length) {
                    logger.log(`Criando ${createList.length} novos valores de série...`);
                    await prismaTxn.serieVariavel.createMany({
                        data: createList,
                    });
                    if (globais.length)
                        for (const v of createList) {
                            if (v.serie !== 'Realizado') continue;

                            mesesParaLiberar.push({
                                referencia_data:
                                    typeof v.data_valor == 'string' ? Date2YMD.fromString(v.data_valor) : v.data_valor,
                                variavel_id: v.variavel_id,
                            });
                        }
                }

                if (variavelMaeId) {
                    await this.batchUpsertCicloVariavelMae(
                        prismaTxn,
                        variavelMaeId,
                        mesesParaRemover,
                        mesesParaLiberar,
                        now,
                        logger,
                        user
                    );
                } else {
                    await this.batchUpsertRemoveLiberacao(prismaTxn, mesesParaRemover, now, user);
                    await this.batchUpsertLiberaMeses(prismaTxn, mesesParaLiberar, logger, user);
                }

                const variaveisMod = Object.keys(variaveisModificadas).map((e) => +e);
                logger.log(`Variáveis recebidas: ${JSON.stringify(variaveisMod)}`);

                if (Array.isArray(variaveisMod)) {
                    await this.recalc_series_dependentes(variaveisMod, prismaTxn);
                    await this.recalc_indicador_usando_variaveis(variaveisMod, prismaTxn);

                    if (globais.length) {
                        this.logger.log(`Variáveis globais: atualizando ciclo corrente...`);
                        // hack para atualizar apenas a variável mae
                        if (variavelMaeId) {
                            globais.length = 1;
                            globais[0].id = variavelMaeId;
                        }

                        await prismaTxn.$queryRaw`
                        select f_atualiza_variavel_ciclo_corrente(varId::int)::varchar
                        from unnest(${globais.map((n) => n.id)}::int[]) as varId;`;
                    }
                }
                await logger.saveLogs(prismaTxn, user.getLogData());
            },
            {
                maxWait: 15000,
                timeout: 35000,
            }
        );
    }

    private async batchUpsertCicloVariavelMae(
        prismaTxn: Prisma.TransactionClient,
        variavelMaeId: number,
        mesesParaRemover: VariavelGlobalLiberacao[],
        mesesParaLiberar: VariavelGlobalLiberacao[],
        now: Date,
        logger: LoggerWithLog,
        user: PessoaFromJwt
    ) {
        const variaveisFilhas = await prismaTxn.variavel.findMany({
            where: {
                variavel_mae_id: variavelMaeId,
                removido_em: null,
                tipo: 'Global',
            },
            select: {
                id: true,
            },
        });

        const statusSeries = await prismaTxn.serieVariavel.findMany({
            where: {
                variavel_id: { in: variaveisFilhas.map((e) => e.id) },
                data_valor: { in: mesesParaLiberar.map((e) => e.referencia_data) },
                serie: 'Realizado',
            },
            select: {
                variavel_id: true,
                data_valor: true,
                conferida: true,
            },
        });

        const conferidoStatus: Record<number, Record<DateYMD, boolean>> = {};
        for (const status of statusSeries) {
            if (!conferidoStatus[status.variavel_id]) conferidoStatus[status.variavel_id] = {};
            conferidoStatus[status.variavel_id][Date2YMD.toString(status.data_valor)] = status.conferida;
        }

        for (const exSerie of mesesParaRemover) {
            if (!conferidoStatus[exSerie.variavel_id]) conferidoStatus[exSerie.variavel_id] = {};

            conferidoStatus[exSerie.variavel_id][Date2YMD.toString(exSerie.referencia_data)] = false;
        }

        const mesesResultado: Record<DateYMD, boolean> = {};

        const todosPeriodos = new Set<string>();
        for (const varId in conferidoStatus) {
            const monthStatuses = conferidoStatus[varId];
            for (const date in monthStatuses) {
                todosPeriodos.add(date);
            }
        }

        // Para cada periodo, verifica se todas as variáveis filhas estão conferidas
        const periodos = Array.from(todosPeriodos);
        for (let i = 0; i < periodos.length; i++) {
            const data = periodos[i];

            // Começa assumindo que está tudo conferido
            // se a variavel voltou na query, vai seguir com o motivo da tabela
            // senão, ela vai ter um registro como false por ter sido colocada no loop do mesesParaRemover
            let todosConferidos = true;

            for (const variavelFilha of variaveisFilhas) {
                const statusVar = conferidoStatus[variavelFilha.id];

                // para assim que não estiver conferido
                if (!statusVar || !statusVar[data]) {
                    todosConferidos = false;
                    break;
                }
            }

            mesesResultado[data] = todosConferidos;
        }
        logger.log(`Variável mãe ${variavelMaeId} - Resultado de liberação: ${JSON.stringify(mesesResultado)}`);

        const ajusteRemocao: VariavelGlobalLiberacao[] = [];
        const ajusteLiberacao: VariavelGlobalLiberacao[] = [];

        for (const data in mesesResultado) {
            const aprovado = mesesResultado[data];
            if (aprovado) {
                ajusteLiberacao.push({
                    referencia_data: Date2YMD.fromString(data),
                    variavel_id: variavelMaeId,
                });
            } else {
                ajusteRemocao.push({
                    referencia_data: Date2YMD.fromString(data),
                    variavel_id: variavelMaeId,
                });
            }
        }

        await this.batchUpsertRemoveLiberacao(prismaTxn, ajusteRemocao, now, user);
        await this.batchUpsertLiberaMeses(prismaTxn, ajusteLiberacao, logger, user);
    }

    private async batchUpsertLiberaMeses(
        prismaTxn: Prisma.TransactionClient,
        mesesParaAprovar: VariavelGlobalLiberacao[],
        logger: LoggerWithLog,
        user: PessoaFromJwt
    ) {
        if (!mesesParaAprovar.length) return;

        const alreadyApproved = await prismaTxn.variavelGlobalCicloAnalise.findMany({
            where: {
                removido_em: null,
                fase: 'Liberacao',
                OR: mesesParaAprovar.map((e) => {
                    return {
                        variavel_id: e.variavel_id,
                        referencia_data: e.referencia_data,
                    };
                }),
            },
            select: {
                id: true,
                variavel_id: true,
                referencia_data: true,
                eh_liberacao_auto: true,
                aprovada: true,
            },
        });
        const toInsert = mesesParaAprovar.filter((e) => {
            return !alreadyApproved.some(
                (a) => a.variavel_id === e.variavel_id && a.referencia_data.valueOf() == e.referencia_data.valueOf()
            );
        });
        const toUpdate = alreadyApproved.filter((a) => !a.eh_liberacao_auto && !a.aprovada);

        // Perform inserts
        if (toInsert.length > 0) {
            logger.log(
                `Criando novas liberações automáticas para ${toInsert.map((e) => e.variavel_id)} em ${toInsert.map(
                    (e) => Date2YMD.dbDateToDMY(e.referencia_data)
                )}`
            );

            await prismaTxn.variavelGlobalCicloAnalise.createMany({
                data: toInsert.map((item) => ({
                    variavel_id: item.variavel_id,
                    referencia_data: item.referencia_data,
                    fase: 'Liberacao',
                    eh_liberacao_auto: true,
                    aprovada: false,
                    ultima_revisao: true,
                    criado_por: user.id,
                    valores: {},
                })),
            });
        }

        // Perform updates
        if (toUpdate.length > 0) {
            logger.log(
                `Atualizando liberações automáticas para ${toUpdate.map((e) => e.variavel_id)} em ${toUpdate.map((e) =>
                    Date2YMD.dbDateToDMY(e.referencia_data)
                )}`
            );
            await prismaTxn.variavelGlobalCicloAnalise.updateMany({
                where: {
                    id: { in: toUpdate.map((item) => item.id) },
                },
                data: {
                    eh_liberacao_auto: true,
                },
            });
        }
    }

    private async batchUpsertRemoveLiberacao(
        prismaTxn: Prisma.TransactionClient,
        mesesParaRemover: VariavelGlobalLiberacao[],
        now: Date,
        user: PessoaFromJwt
    ) {
        if (!mesesParaRemover.length) return;
        this.logger.debug(`Variáveis globais: removendo liberação para ${JSON.stringify(mesesParaRemover)}`);

        await prismaTxn.variavelGlobalCicloAnalise.updateMany({
            where: {
                OR: mesesParaRemover.map((e) => {
                    return {
                        variavel_id: e.variavel_id,
                        referencia_data: e.referencia_data,
                    };
                }),
                removido_em: null,
                fase: 'Liberacao',
                ultima_revisao: true,
            },
            data: {
                removido_em: now,
                removido_por: user.id,
                ultima_revisao: false,
            },
        });

        // caso tenha alguma validação já feita, remove também
        await prismaTxn.variavelGlobalCicloAnalise.updateMany({
            where: {
                OR: mesesParaRemover.map((e) => {
                    return {
                        variavel_id: e.variavel_id,
                        referencia_data: e.referencia_data,
                    };
                }),
                removido_em: null,
                fase: 'Validacao',
                ultima_revisao: true,
            },
            data: {
                removido_em: now,
                removido_por: user.id,
                ultima_revisao: false,
            },
        });
    }

    private async batchUpsertBuscaMesesParaRemover(
        logger: LoggerWithLog,
        prismaTxn: Prisma.TransactionClient,
        idsToBeRemoved: number[]
    ) {
        logger.log(`Variáveis globais: buscando meses para remover liberação...`);
        const dbRows = await prismaTxn.serieVariavel.findMany({
            where: { id: { in: idsToBeRemoved }, serie: 'Realizado' },
            select: {
                variavel_id: true,
                data_valor: true,
            },
        });
        const mesesParaRemover = dbRows.map(
            (e) =>
                ({
                    variavel_id: e.variavel_id,
                    referencia_data: e.data_valor,
                }) satisfies VariavelGlobalLiberacao
        );
        logger.log(`Variáveis globais: meses para remover liberação: ${JSON.stringify(mesesParaRemover)}`);
        return mesesParaRemover;
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
            this.logger.verbose(`Recalculando serie acumulada variavel ${row.id}...`);
            await prismaTxn.$queryRaw`select monta_serie_acumulada(${row.id}::int, null)`;

            for (const vc of row.FormulaCompostaVariavel) {
                this.logger.verbose(`Invalidando variavel calculada ${vc.formula_composta.variavel_calc_id}...`);
                await prismaTxn.$queryRaw`select refresh_variavel(${vc.formula_composta.variavel_calc_id}::int, null)`;
            }
        }
    }

    async recalc_indicador_usando_variaveis(variaveis: number[], prismaTxn: Prisma.TransactionClient) {
        this.logger.log(`called recalc_indicador_usando_variaveis (${JSON.stringify(variaveis)})`);

        const indicadoresViaCalc = await prismaTxn.formulaComposta.findMany({
            where: {
                removido_em: null,
                FormulaCompostaVariavel: {
                    some: { variavel_id: { in: variaveis } },
                },
                variavel_calc_id: { not: null },
            },
            select: { id: true, variavel_calc_id: true },
        });

        const indicadoresFV = await prismaTxn.indicadorFormulaVariavel.findMany({
            where: {
                variavel_id: { in: [...variaveis, ...indicadoresViaCalc.map((r) => r.variavel_calc_id!)] },
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
            new Set([...indicadoresFC.map((r) => r.id), ...indicadoresFV.map((r) => r.indicador_id)])
        );

        this.logger.log(
            `Indicadores => ${uniqueIndicadores.join(',')} indicadoresViaCalc => ${JSON.stringify(indicadoresViaCalc)} indicadoresFV => ${JSON.stringify(indicadoresFV)} indicadoresFC => ${JSON.stringify(indicadoresFC)}`
        );
        for (const indicador_id of uniqueIndicadores) {
            this.logger.log(`Recalculando indicador ... ${indicador_id}`);
            await prismaTxn.$queryRaw`select refresh_serie_indicador(${indicador_id}::int, null)`;
        }
    }

    async recalc_vars_ps_dashboard(
        variaveis: number[],
        prismaTxn: Prisma.TransactionClient | undefined = undefined
    ): Promise<number> {
        if (prismaTxn) {
            return prismaTxn.$executeRaw`
                SELECT recalc_vars_ps_dashboard(${variaveis}::int[])
            `;
        } else {
            return this.prisma.$executeRaw`
                SELECT recalc_vars_ps_dashboard(${variaveis}::int[])
            `;
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
        now: Date,
        tipo: TipoVariavel = 'PDM'
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

        const orgao_id = dto.orgao_id;
        if (!orgao_id) throw new HttpException('Orgão não informado', 400);

        const variavel = await prismaTxn.variavel.create({
            data: {
                codigo: codigo,
                titulo: dto.titulo,
                orgao_id: orgao_id,
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
                tipo: tipo,
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
        filters: FilterVariavelDetalheDto,
        user: PessoaFromJwt
    ): Promise<VariavelGlobalDetailDto | VariavelDetailDto | VariavelDetailComAuxiliaresDto> {
        const selfItem = await this.findAll(tipo, { id: id });
        if (selfItem.length === 0) {
            throw new NotFoundException('Variável não encontrada');
        }

        const detalhes = await this.prisma.variavel.findFirstOrThrow({
            where: { id: id },
            select: {
                VariavelAssuntoVariavel: {
                    select: {
                        assunto_variavel: { select: { id: true, nome: true, categoria_assunto_variavel_id: true } },
                    },
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
                medicao_orgao_id: true,
                validacao_orgao_id: true,
                liberacao_orgao_id: true,

                medicao_orgao: {
                    select: { id: true, sigla: true },
                },
                validacao_orgao: {
                    select: { id: true, sigla: true },
                },
                liberacao_orgao: {
                    select: { id: true, sigla: true },
                },

                VariavelGrupoResponsavelEquipe: {
                    where: {
                        removido_em: null,
                    },
                    select: {
                        grupo_responsavel_equipe: {
                            select: {
                                id: true,
                                titulo: true,
                                perfil: true,
                            },
                        },
                    },
                },
            },
        });

        let detailDto: VariavelDetailDto | VariavelDetailComAuxiliaresDto = {
            ...selfItem[0],
            assuntos: detalhes.VariavelAssuntoVariavel.map((e) => {
                return {
                    id: e.assunto_variavel.id,
                    nome: e.assunto_variavel.nome,
                    categoria_assunto_variavel_id: e.assunto_variavel.categoria_assunto_variavel_id,
                };
            }),
            periodos: {
                preenchimento_inicio: detalhes.periodo_preenchimento[0],
                preenchimento_duracao: detalhes.periodo_preenchimento[1] - detalhes.periodo_preenchimento[0] + 1,
                validacao_duracao: detalhes.periodo_validacao[1] - detalhes.periodo_validacao[0] + 1,
                liberacao_duracao: detalhes.periodo_liberacao[1] - detalhes.periodo_liberacao[0] + 1,
            },
            fonte: detalhes.fonte,
            metodologia: detalhes.metodologia,
            descricao: detalhes.descricao,
            dado_aberto: detalhes.dado_aberto,
        } satisfies VariavelDetailDto;

        if (filters.incluir_auxiliares) {
            const categorica = selfItem[0].variavel_categorica_id
                ? await this.prisma.variavelCategorica.findFirst({
                      where: { id: selfItem[0].variavel_categorica_id },
                      select: { id: true, titulo: true },
                  })
                : null;

            detailDto = {
                ...detailDto,
                variavel_categorica: categorica,
                liberacao_grupo: [],
                validacao_grupo: [],
                medicao_grupo: [],
            } satisfies VariavelDetailComAuxiliaresDto;
        }

        if (tipo == 'Global') {
            // retirando, pois o ... do selfItem[0] adiciona isso que não queremos
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            delete (detailDto as any).responsaveis;

            if (filters.incluir_auxiliares) {
                const grupos = detalhes.VariavelGrupoResponsavelEquipe.map((e) => e.grupo_responsavel_equipe);
                for (const grupo of grupos) {
                    if (grupo.perfil === 'Medicao') {
                        (detailDto as VariavelDetailComAuxiliaresDto).medicao_grupo.push({
                            id: grupo.id,
                            titulo: grupo.titulo,
                        });
                    } else if (grupo.perfil === 'Validacao') {
                        (detailDto as VariavelDetailComAuxiliaresDto).validacao_grupo.push({
                            id: grupo.id,
                            titulo: grupo.titulo,
                        });
                    } else if (grupo.perfil === 'Liberacao') {
                        (detailDto as VariavelDetailComAuxiliaresDto).liberacao_grupo.push({
                            id: grupo.id,
                            titulo: grupo.titulo,
                        });
                    }
                }
            }

            const globalDetailDto: VariavelGlobalDetailDto = {
                ...detailDto,
                medicao_orgao_id: detalhes.medicao_orgao_id,
                validacao_orgao_id: detalhes.validacao_orgao_id,
                liberacao_orgao_id: detalhes.liberacao_orgao_id,
                orgao_proprietario: detalhes.orgao_proprietario!,

                liberacao_orgao: detalhes.liberacao_orgao,
                medicao_orgao: detalhes.medicao_orgao,
                validacao_orgao: detalhes.validacao_orgao,

                medicao_grupo_ids: detalhes.VariavelGrupoResponsavelEquipe.filter(
                    (e) => e.grupo_responsavel_equipe.perfil === 'Medicao'
                ).map((e) => e.grupo_responsavel_equipe.id),
                validacao_grupo_ids: detalhes.VariavelGrupoResponsavelEquipe.filter(
                    (e) => e.grupo_responsavel_equipe.perfil === 'Validacao'
                ).map((e) => e.grupo_responsavel_equipe.id),
                liberacao_grupo_ids: detalhes.VariavelGrupoResponsavelEquipe.filter(
                    (e) => e.grupo_responsavel_equipe.perfil === 'Liberacao'
                ).map((e) => e.grupo_responsavel_equipe.id),
            };

            return globalDetailDto;
        }

        return detailDto;
    }

    async findAllPdms(): Promise<PdmSimplesDto[]> {
        const rows = await this.prisma.pdm.findMany({
            where: {
                removido_em: null,
            },
            select: {
                id: true,
                nome: true,
                tipo: true,
            },
            orderBy: {
                nome: 'asc',
            },
        });
        return rows;
    }

    private async buscarVariavelComPermissao(variavelId: number, user: PessoaFromJwt) {
        const filters: FilterVariavelDto = { id: variavelId };
        const whereSet = this.getVariavelWhereSet(filters);

        const variavel = await this.prisma.variavel.findFirst({
            where: { AND: whereSet },
            select: {
                id: true,
                tipo: true,
                suspendida_em: true,
                variavel_categorica_id: true,
                unidade_medida: { select: { id: true, sigla: true, descricao: true } },
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
            },
        });

        if (!variavel) throw new NotFoundException('Variável não encontrada');
        if (variavel.tipo !== 'Global')
            throw new BadRequestException('Este endpoint é exclusivo para variáveis do tipo Global');

        return variavel;
    }

    private async buscarMaeFilhas(variavelId: number) {
        const variavel = await this.prisma.variavel.findUnique({
            where: { id: variavelId },
            select: { variavel_mae_id: true },
        });

        const mae = variavel?.variavel_mae_id
            ? await this.prisma.variavel.findUnique({
                  where: { id: variavel.variavel_mae_id },
                  select: { id: true, codigo: true, titulo: true },
              })
            : null;

        const filhas = await this.prisma.variavel.findMany({
            where: {
                variavel_mae_id: variavelId,
                removido_em: null,
            },
            select: {
                id: true,
                codigo: true,
                titulo: true,
            },
        });

        return { mae, filhas };
    }

    private async buscarIndicadoresReferentes(variavelId: number): Promise<IndicadorReferenciandoItemDto[]> {
        const indicadorVariavelRelacionamento = await this.prisma.indicadorVariavel.findMany({
            where: {
                variavel_id: variavelId,
                indicador: {
                    removido_em: null,
                },
            },
            select: {
                indicador: {
                    select: {
                        id: true,
                        codigo: true,
                        titulo: true,
                        indicador_tipo: true,
                        meta_id: true,
                        iniciativa_id: true,
                        atividade_id: true,
                    },
                },
            },
        });

        const metaIds: number[] = [];
        const iniciativaIds: number[] = [];
        const atividadeIds: number[] = [];
        const indicadores = [];

        for (const rel of indicadorVariavelRelacionamento) {
            const ind = rel.indicador;
            indicadores.push(ind);

            if (ind.meta_id) metaIds.push(ind.meta_id);
            if (ind.iniciativa_id) iniciativaIds.push(ind.iniciativa_id);
            if (ind.atividade_id) atividadeIds.push(ind.atividade_id);
        }

        let metas: MetaArvorePdmRow[] = [];

        const queryPdm = metaIds.length > 0 || iniciativaIds.length > 0 || atividadeIds.length > 0;

        const metaIdsFiltered = metaIds.filter((id): id is number => typeof id === 'number');
        const iniciativaIdsFiltered = iniciativaIds.filter((id): id is number => typeof id === 'number');
        const atividadeIdsFiltered = atividadeIds.filter((id): id is number => typeof id === 'number');

        if (queryPdm) {
            const clauses = [];

            if (metaIdsFiltered.length > 0) {
                clauses.push(Prisma.sql`meta_id IN (${Prisma.join(metaIdsFiltered)})`);
            }

            if (iniciativaIdsFiltered.length > 0) {
                clauses.push(Prisma.sql`iniciativa_id IN (${Prisma.join(iniciativaIdsFiltered)})`);
            }

            if (atividadeIdsFiltered.length > 0) {
                clauses.push(Prisma.sql`atividade_id IN (${Prisma.join(atividadeIdsFiltered)})`);
            }

            if (clauses.length === 0) {
                metas = [];
            } else {
                const query = Prisma.sql`
                    SELECT * FROM view_metas_arvore_pdm
                    WHERE ${Prisma.join(clauses, ' OR ')}
                `;
                metas = await this.prisma.$queryRaw<MetaArvorePdmRow[]>(query);
            }
        }

        const metasMap = new Map<number, MetaArvorePdmRow>();
        metas.forEach((m) => {
            if (m.meta_id) metasMap.set(m.meta_id, m);
            if (m.iniciativa_id) metasMap.set(m.iniciativa_id, m);
            if (m.atividade_id) metasMap.set(m.atividade_id, m);
            if (m.pdm_id) metasMap.set(m.pdm_id, m);
        });

        const indicadoresReferenciando = indicadores.map((ind) => {
            const meta = ind.meta_id ? (metasMap.get(ind.meta_id) ?? null) : null;
            const iniciativa = ind.iniciativa_id ? (metasMap.get(ind.iniciativa_id) ?? null) : null;
            const atividade = ind.atividade_id ? (metasMap.get(ind.atividade_id) ?? null) : null;

            const pdm =
                (meta?.pdm_id && metasMap.get(meta.pdm_id)) ??
                (iniciativa?.pdm_id && metasMap.get(iniciativa.pdm_id)) ??
                (atividade?.pdm_id && metasMap.get(atividade.pdm_id)) ??
                null;

            return {
                id: ind.id,
                codigo: ind.codigo,
                titulo: ind.titulo,
                tipo_indicador: ind.indicador_tipo,
                meta: meta ? { id: meta.meta_id!, codigo: meta.codigo!, titulo: meta.titulo! } : null,
                iniciativa: iniciativa
                    ? { id: iniciativa.iniciativa_id!, codigo: iniciativa.codigo!, titulo: iniciativa.titulo! }
                    : null,
                atividade: atividade
                    ? { id: atividade.atividade_id!, codigo: atividade.codigo!, titulo: atividade.titulo! }
                    : null,
                pdm: pdm ? { id: pdm.pdm_id!, nome: pdm.nome!, tipo: TipoPdm.PDM } : null,
            };
        });

        return indicadoresReferenciando;
    }

    private async buscarFormulasReferentes(
        variavelId: number,
        indicadoresReferenciando: IndicadorReferenciandoItemDto[]
    ): Promise<FormulaCompostaReferenciandoItemDto[]> {
        const formulasRel = await this.prisma.formulaCompostaRelVariavel.findMany({
            where: {
                variavel_id: variavelId,
                formula_composta: {
                    removido_em: null,
                    autogerenciavel: false,
                },
            },
            select: {
                formula_composta: {
                    select: {
                        id: true,
                        titulo: true,
                        tipo_pdm: true,
                        autogerenciavel: true,
                        variavel_calc_id: true,
                    },
                },
            },
        });

        const formulasMap = new Map<number, FormulaCompostaReferenciandoItemDto>();

        for (const rel of formulasRel) {
            const fc = rel.formula_composta;

            let pdm: PdmSimplesComTipoDto | null = null;

            if (fc.tipo_pdm === 'PDM') {
                const ref = indicadoresReferenciando.find(
                    (i) => i.meta?.id !== null || i.iniciativa?.id !== null || i.atividade?.id !== null
                );

                if (ref) {
                    const clauses: string[] = [];

                    if (ref.meta?.id) clauses.push(`meta_id = ${ref.meta.id}`);
                    if (ref.iniciativa?.id) clauses.push(`iniciativa_id = ${ref.iniciativa.id}`);
                    if (ref.atividade?.id) clauses.push(`atividade_id = ${ref.atividade.id}`);

                    const raw = await this.prisma.$queryRawUnsafe<{ pdm_id: number }[]>(
                        `SELECT pdm_id FROM view_metas_arvore_pdm WHERE ${clauses.join(' OR ')} LIMIT 1`
                    );

                    if (raw.length > 0) {
                        const pdmFromDb = await this.prisma.pdm.findUnique({
                            where: { id: raw[0].pdm_id },
                            select: { id: true, nome: true },
                        });

                        if (pdmFromDb) {
                            pdm = {
                                id: pdmFromDb.id,
                                nome: pdmFromDb.nome,
                                tipo: 'PDM',
                            };
                        }
                    }
                }
            } else if (fc.tipo_pdm === 'PS' && fc.variavel_calc_id) {
                const formulaRel = await this.prisma.formulaCompostaRelVariavel.findFirst({
                    where: { variavel_id: fc.variavel_calc_id },
                    select: { formula_composta_id: true },
                });

                const formula = formulaRel?.formula_composta_id
                    ? await this.prisma.formulaComposta.findUnique({
                          where: { id: formulaRel.formula_composta_id },
                          select: { id: true },
                      })
                    : null;

                const pdmFromDb = formula?.id
                    ? await this.prisma.pdm.findFirst({
                          where: { id: formula.id },
                          select: { id: true, nome: true },
                      })
                    : null;

                if (pdmFromDb) {
                    pdm = {
                        id: pdmFromDb.id,
                        nome: pdmFromDb.nome,
                        tipo: 'PS',
                    };
                }
            }

            formulasMap.set(fc.id, {
                id: fc.id,
                titulo: fc.titulo,
                tipo_pdm: fc.tipo_pdm,
                autogerenciavel: fc.autogerenciavel,
                pdm,
            });
        }

        return Array.from(formulasMap.values()).sort((a, b) => a.titulo.localeCompare(b.titulo));
    }

    private mapearRespostaFinal(data: {
        variavel: VariavelResumoInput;
        variavelMae: VariavelSimplesDto | null;
        variaveisFilhas: VariavelSimplesDto[];
        indicadoresReferenciando: IndicadorReferenciandoItemDto[];
        formulasCompostasReferenciando: FormulaCompostaReferenciandoItemDto[];
    }): VariavelRelacionamentosResponseDto {
        return {
            variavel: {
                id: data.variavel.id,
                suspendida: data.variavel.suspendida_em !== null,
                variavel_categorica_id: data.variavel.variavel_categorica_id,
                unidade_medida: data.variavel.unidade_medida ?? null,
                casas_decimais: data.variavel.casas_decimais,
                periodicidade: data.variavel.periodicidade,
                acumulativa: data.variavel.acumulativa,
                codigo: data.variavel.codigo,
                titulo: data.variavel.titulo,
                valor_base: data.variavel.valor_base?.toString() ?? '',
                recalculando: data.variavel.recalculando,
                recalculo_erro: data.variavel.recalculo_erro,
                recalculo_tempo: data.variavel.recalculo_tempo,
                variavel_mae_id: data.variavel.variavel_mae_id,
            },
            variavel_mae: data.variavelMae,
            variaveis_filhas: data.variaveisFilhas.sort((a, b) => a.codigo.localeCompare(b.codigo)),
            indicadores_referenciando: data.indicadoresReferenciando.sort((a, b) => a.codigo.localeCompare(b.codigo)),
            formulas_compostas_referenciando: data.formulasCompostasReferenciando.sort((a, b) =>
                a.titulo.localeCompare(b.titulo)
            ),
        };
    }

    async getRelacionamentos(variavelId: number, user: PessoaFromJwt): Promise<VariavelRelacionamentosResponseDto> {
        const variavel = await this.buscarVariavelComPermissao(variavelId, user);
        const { mae: variavelMae, filhas: variaveisFilhas } = await this.buscarMaeFilhas(variavel.id);
        const indicadoresReferenciando = await this.buscarIndicadoresReferentes(variavel.id);
        const formulasCompostasReferenciando = await this.buscarFormulasReferentes(
            variavel.id,
            indicadoresReferenciando
        );

        return this.mapearRespostaFinal({
            variavel,
            variavelMae,
            variaveisFilhas,
            indicadoresReferenciando,
            formulasCompostasReferenciando,
        });
    }
}

/**
 * Obtém os IDs das variáveis relacionadas a um PDM
 * @param pdmId O ID do PDM
 * @param prismaTx Cliente de transação do Prisma
 * @returns Array de IDs de variáveis
 */
async function getPdmVariavelIds(pdmId: number, prismaTx: Prisma.TransactionClient): Promise<number[]> {
    const variaveis = await prismaTx.$queryRaw<{ id: number }[]>`
        WITH pdm_items AS (
            SELECT id, tipo, meta_id, iniciativa_id, atividade_id
            FROM view_metas_arvore_pdm
            WHERE pdm_id = ${pdmId}
        )
        SELECT DISTINCT v.id
        FROM variavel v
        JOIN indicador_variavel iv ON v.id = iv.variavel_id
        JOIN indicador i ON iv.indicador_id = i.id
        JOIN pdm_items pi ON
            (pi.tipo = 'meta' AND i.meta_id = pi.id) OR
            (pi.tipo = 'iniciativa' AND i.iniciativa_id = pi.id) OR
            (pi.tipo = 'atividade' AND i.atividade_id = pi.id)
        WHERE v.removido_em IS NULL
        AND v.tipo = 'Global'
    `;

    return variaveis.map((v) => v.id);
}

/**
 * Recalcula variáveis para PDM ou IDs de variáveis específicas
 * @param prismaTx Cliente de transação do Prisma
 * @param options Opções contendo pdmId ou variavelIds
 * @returns Promise que é resolvida quando o recálculo é concluído
 */
export async function AddTaskRecalcVariaveis(
    prismaTx: Prisma.TransactionClient,
    options: { pdmId?: number; variavelIds?: number[] }
): Promise<void> {
    const logger = new Logger('VariaveisRecalc'); // Ajuste conforme necessário para seu logger

    let variavelIds: number[] = [];

    // Se os variavelIds forem fornecidos diretamente, use-os
    if (options.variavelIds && options.variavelIds.length > 0) {
        variavelIds = options.variavelIds;
        logger.log(`Recalculando ${variavelIds.length} variáveis específicas`);
    }
    // Caso contrário, obtenha variáveis do PDM
    else if (options.pdmId) {
        logger.log(`Recalculando variáveis para o PDM ID: ${options.pdmId}`);
        variavelIds = await getPdmVariavelIds(options.pdmId, prismaTx);

        if (variavelIds.length > 0) {
            logger.log(
                `Encontrou ${variavelIds.length} variáveis para recalcular o dashboard do PDM ID: ${options.pdmId}`
            );
        } else {
            logger.log(`Nenhuma variável global no PDM ID: ${options.pdmId}`);
            return;
        }
    } else {
        throw new Error('É necessário fornecer pdmId ou variavelIds');
    }

    // Executa refresh_variavel para todas as variáveis em uma única consulta
    if (variavelIds.length > 0) {
        await prismaTx.$queryRaw`
            SELECT refresh_variavel(v, null)::text
            FROM unnest(${variavelIds}::int[]) AS v
        `;
    }
}
