import { BadRequestException, HttpException, Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { Prisma, ProjetoFase, ProjetoOrigemTipo, ProjetoStatus, TipoProjeto } from '@prisma/client';
import { DateTime } from 'luxon';
import { IdCodTituloDto } from 'src/common/dto/IdCodTitulo.dto';

import { ReadOnlyBooleanType } from 'src/common/TypeReadOnly';
import { FormatCurrency } from 'src/common/format-currency';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { Date2YMD, SYSTEM_TIMEZONE } from '../../common/date2ymd';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../../upload/upload.service';
import { PortfolioDto } from '../portfolio/entities/portfolio.entity';
import { PortfolioService } from '../portfolio/portfolio.service';
import { CreateProjetoDocumentDto, CreateProjetoDto, PPfonteRecursoDto } from './dto/create-projeto.dto';
import { FilterProjetoDto, FilterProjetoMDODto } from './dto/filter-projeto.dto';
import {
    CloneProjetoTarefasDto,
    TransferProjetoPortfolioDto,
    UpdateProjetoDocumentDto,
    UpdateProjetoDto,
} from './dto/update-projeto.dto';
import {
    ProjetoDetailBaseMdo,
    ProjetoDetailDto,
    ProjetoDetailMdoDto,
    ProjetoDocumentoDto,
    ProjetoDto,
    ProjetoEquipeItemDto,
    ProjetoMdoDto,
    ProjetoMetaDetailDto,
    ProjetoPermissoesDto,
} from './entities/projeto.entity';

import { PessoaPrivilegioService } from '../../auth/pessoaPrivilegio.service';
import { BlocoNotaService } from '../../bloco-nota/bloco-nota/bloco-nota.service';
import { PaginatedWithPagesDto } from '../../common/dto/paginated.dto';
import { HtmlSanitizer } from '../../common/html-sanitizer';
import { CreateGeoEnderecoReferenciaDto, ReferenciasValidasBase } from '../../geo-loc/entities/geo-loc.entity';
import { GeoLocService, UpsertEnderecoDto } from '../../geo-loc/geo-loc.service';
import { UpdateTarefaDto } from '../tarefa/dto/update-tarefa.dto';
import { TarefaService } from '../tarefa/tarefa.service';
import { JwtService } from '@nestjs/jwt';
import { Object2Hash } from '../../common/object2hash';

const FASES_LIBERAR_COLABORADOR: ProjetoStatus[] = ['Registrado', 'Selecionado', 'EmPlanejamento'];
const StatusParaFase: Record<ProjetoStatus, ProjetoFase> = {
    Registrado: 'Registro',
    Selecionado: 'Planejamento',
    EmPlanejamento: 'Planejamento',
    Planejado: 'Planejamento',
    Validado: 'Acompanhamento',
    EmAcompanhamento: 'Acompanhamento',
    Suspenso: 'Acompanhamento',
    Fechado: 'Encerramento',
    MDO_Concluida: 'Encerramento',
    MDO_EmAndamento: 'Acompanhamento',
    MDO_NaoIniciada: 'Planejamento',
    MDO_Paralisada: 'Acompanhamento',
} as const;

export const ProjetoStatusParaExibicao: Record<ProjetoStatus, string> = {
    Registrado: 'Registrado',
    Selecionado: 'Selecionado',
    EmPlanejamento: 'Em Planejamento',
    Planejado: 'Planejado',
    Validado: 'Validado',
    EmAcompanhamento: 'Em Acompanhamento',
    Suspenso: 'Suspenso',
    Fechado: 'Concluído',
    MDO_Concluida: 'Concluída',
    MDO_EmAndamento: 'Em Andamento',
    MDO_NaoIniciada: 'Não Iniciada',
    MDO_Paralisada: 'Paralisada',
} as const;

export class ProjetoOrgaoParticipante {
    projeto_id: number;
    orgao_id: number;
}

export type HtmlProjetoUe = {
    nomeDoProjeto: string;
    statusDoProjeto: string;
    descricaoDoProjeto: string;
    orgaoResponsavel: string[];
    responsavelPeloProjeto: string;
    dataInicio: string;
    dataTermino: string;
    custoEstimado: string;
    fonteDeRecursos: string[];
    origem: string;
    codigoDaMeta: string | null;
    textoDaMeta: string;
    //escopo: string[];
    etapas: string[];
    orgaosEnvolvidos: string[];
};

type ProjetoResumoPermisao = {
    arquivado: boolean;
    status: ProjetoStatus;
    portfolio: {
        orgaos: {
            orgao_id: number;
        }[];
    };
    equipe: ProjetoEquipeItemDto[];
    id: number;
    responsaveis_no_orgao_gestor: number[];
    colaboradores_no_orgao: number[];
    responsavel_id: number | null;
    tipo: TipoProjeto;
};

class AnyPageTokenJwtBody {
    search_hash: string;
    total_rows: number;
    issued_at: number;
    ipp: number;
}

@Injectable()
export class ProjetoService {
    private readonly logger = new Logger(ProjetoService.name);
    constructor(
        private readonly prisma: PrismaService,
        private readonly portfolioService: PortfolioService,
        private readonly uploadService: UploadService,
        private readonly geolocService: GeoLocService,
        private readonly blocoNotaService: BlocoNotaService,
        @Inject(forwardRef(() => TarefaService))
        private readonly tarefaService: TarefaService,
        private readonly pessoaPrivService: PessoaPrivilegioService,
        private readonly jwtService: JwtService
    ) {}

    private async processaOrigem(dto: CreateProjetoDto) {
        let meta_id: number | null = dto.meta_id ? dto.meta_id : null;
        let iniciativa_id: number | null = dto.iniciativa_id ? dto.iniciativa_id : null;
        let atividade_id: number | null = dto.atividade_id ? dto.atividade_id : null;
        let origem_outro: string | null = dto.origem_outro ? dto.origem_outro : null;
        let meta_codigo: string | null = dto.meta_codigo ? dto.meta_codigo : null;
        const origem_tipo: ProjetoOrigemTipo = dto.origem_tipo;

        if (origem_tipo === ProjetoOrigemTipo.PdmSistema) {
            await validaPdmSistema(this);
        } else if (origem_tipo === ProjetoOrigemTipo.PdmAntigo) {
            validaPdmAntigo();
        } else if (origem_tipo === ProjetoOrigemTipo.Outro) {
            validaOutro();
        } else {
            throw new HttpException(`origem_tipo ${origem_tipo} não é suportado`, 500);
        }

        return {
            origem_tipo,
            meta_id,
            atividade_id,
            iniciativa_id,
            origem_outro,
            meta_codigo,
        };

        function validaOutro() {
            if (!origem_outro)
                throw new HttpException('origem_outro| Deve ser enviado quando origem_tipo for Outro', 400);

            if (meta_id) throw new HttpException('meta_id| Não deve ser enviado caso origem_tipo seja Outro', 400);
            if (iniciativa_id)
                throw new HttpException('iniciativa_id| Não deve ser enviado caso origem_tipo seja Outro', 400);
            if (atividade_id)
                throw new HttpException('atividade_id| Não deve ser enviado caso origem_tipo seja Outro', 400);
            if (meta_codigo)
                throw new HttpException('meta_codigo| Não deve ser enviado caso origem_tipo seja Outro', 400);

            // força a limpeza no banco, pode ser que tenha vindo como undefined
            meta_id = atividade_id = iniciativa_id = meta_codigo = null;
        }

        function validaPdmAntigo() {
            const errMsg = 'caso origem seja outro sistema de meta';
            if (!meta_codigo) throw new HttpException(`meta_codigo| Meta código deve ser enviado ${errMsg}`, 400);
            if (!origem_outro)
                throw new HttpException(`origem_outro| Descrição da origem deve ser enviado ${errMsg}`, 400);

            if (meta_id) throw new HttpException(`meta_id| Meta não deve ser enviado ${errMsg}`, 400);
            if (iniciativa_id) throw new HttpException(`iniciativa_id| Iniciativa não deve ser enviado ${errMsg}`, 400);
            if (atividade_id) throw new HttpException(`atividade_id| Atividade não deve ser enviado ${errMsg}`, 400);

            // força a limpeza no banco, pode ser que tenha vindo como undefined
            meta_id = atividade_id = iniciativa_id = null;
        }

        async function validaPdmSistema(self: ProjetoService) {
            if (!atividade_id && !iniciativa_id && !meta_id)
                throw new HttpException(
                    'meta| é obrigatório enviar meta_id|iniciativa_id|atividade_id quando origem_tipo=PdmSistema',
                    400
                );

            if (atividade_id) {
                self.logger.log('validando atividade_id');
                const atv = await self.prisma.atividade.findFirstOrThrow({
                    where: { id: atividade_id, removido_em: null },
                    select: { iniciativa_id: true },
                });
                const ini = await self.prisma.iniciativa.findFirstOrThrow({
                    where: { id: atv.iniciativa_id, removido_em: null },
                    select: { meta_id: true },
                });
                await self.prisma.iniciativa.findFirstOrThrow({
                    where: { id: ini.meta_id, removido_em: null },
                    select: { id: true },
                });

                iniciativa_id = atv.iniciativa_id;
                meta_id = ini.meta_id;
            } else if (iniciativa_id) {
                self.logger.log('validando iniciativa_id');
                const ini = await self.prisma.iniciativa.findFirstOrThrow({
                    where: { id: iniciativa_id, removido_em: null },
                    select: { meta_id: true },
                });

                meta_id = ini.meta_id;
                atividade_id = null;
            } else if (meta_id) {
                self.logger.log('validando meta_id');
                await self.prisma.meta.findFirstOrThrow({
                    where: { id: meta_id, removido_em: null },
                    select: { id: true },
                });

                iniciativa_id = atividade_id = null;
            }

            if (origem_outro)
                throw new HttpException('origem_outro| Não deve ser enviado caso origem_tipo seja PdmSistema', 400);
            if (meta_codigo)
                throw new HttpException('meta_codigo| Não deve ser enviado caso origem_tipo seja PdmSistema', 400);

            // força a limpeza no banco, pode ser que tenha vindo como undefined
            meta_codigo = origem_outro = null;
        }
    }

    private async processaOrgaoGestor(dto: CreateProjetoDto, portfolio: PortfolioDto, checkFk: boolean) {
        if (!dto.orgao_gestor_id) return { orgao_gestor_id: undefined, responsaveis_no_orgao_gestor: undefined };

        const orgao_gestor_id: number = +dto.orgao_gestor_id;
        const responsaveis_no_orgao_gestor: number[] = dto.responsaveis_no_orgao_gestor
            ? dto.responsaveis_no_orgao_gestor
            : [];

        if (checkFk) {
            //console.dir({ portfolio, orgao_gestor_id, responsaveis_no_orgao_gestor }, { depth: 44 });
            // se o banco ficou corrompido, não tem como o usuário arrumar
            if (portfolio.orgaos.map((r) => r.id).includes(orgao_gestor_id) == false)
                throw new HttpException(
                    `orgao_gestor_id| Órgão não faz parte do Portfolio (${portfolio.orgaos
                        .map((r) => r.sigla)
                        .join(', ')})`,
                    400
                );
        }

        // esse TODO continua existindo
        // TODO verificar se cada [responsaveis_no_orgao_gestor] existe realmente
        // e se tem o privilegio gestor_de_projeto

        return {
            orgao_gestor_id,
            responsaveis_no_orgao_gestor,
        };
    }
    /**
     *
     * orgao_gestor_id tem que ser um dos órgãos que fazem parte do portfólio escolhido pro projeto ¹,
     * esse campo é required (por enquanto eu estou deixando mudar, não está afetando tanta coisa assim a mudança dele)
     * responsaveis_no_orgao_gestor é a lista de pessoas dentro do órgão escolhido, que tem a permissão SMAE.gestor_de_projeto² e
     * quem for escolhido aqui poderá visualizar o projeto mesmo não sendo um Projeto.administrador, esse campo pode ficar vazio,
     * pois na criação os PMO não sabem exatamente quem vai acompanhar o projeto
     *
     * Esses dois campos acima são referentes as pessoas que estão administrando o projeto, não necessariamente estão envolvidas no projeto.
     *
     *
     * orgaos_participantes são a lista dos órgãos que participam do projeto em si
     * (por exemplo, se for pra construir escola em Itaquera, um dos órgãos participantes pode ser a "Subprefeitura Itaquera"³ e
     * mais um órgão "Secretaria Municipal de Educação")
     *
     * E o órgão responsável, tem que escolher a partir do órgão pra ser o responsável,
     * e dentro desse órgão responsável uma pessoa (e apenas uma) pra cuidar do registro e planejamento desse projeto,
     * essa pessoa é quem tem a permissão SMAE.colaborador_de_projeto
     * ¹: as pessoas que fazem parte desse órgão (e tiver a permissão de SMAE.gestor_de_projeto) e gestoras, poderão visualizar o projeto, mesmo não fazendo parte do mesmo.
     * ²: tem em algum card aqui os novos filtros que entrou pra essa parte do sistema, mas ta tudo nos filtros do GET /pessoa Swagger UI
     * ³: chute total, pode ser totalmente diferente o uso ou a secretaria
     * *: essa pessoa tem acesso de escrita até a hora que o status do projeto passar de "EmPlanejamento", depois disso vira read-only
     * */
    async create(tipo: TipoProjeto, dto: CreateProjetoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        // pra criar, verifica se a pessoa pode realmente acessar o portfolio, então
        // começa listando todos os portfolios
        const portfolios = await this.portfolioService.findAll(tipo, user, true);
        if (tipo == 'PP') {
            if (!dto.orgaos_participantes || dto.orgaos_participantes.length == 0)
                throw new HttpException('Campo órgão participantes obrigatório para projetos', 400);
            if (!dto.orgao_responsavel_id)
                throw new HttpException('Campo órgão responsável obrigatório para projetos', 400);
            if (!dto.responsavel_id) throw new HttpException('Campo responsável obrigatório para projetos', 400);
        }

        const portfolio = portfolios.filter((r) => r.id == dto.portfolio_id)[0];
        if (!portfolio)
            throw new HttpException(
                'portfolio_id| Portfolio não está liberado para criação de projetos para seu usuário',
                400
            );

        const { origem_tipo, meta_id, atividade_id, iniciativa_id, origem_outro } = await this.processaOrigem(dto);
        const { orgao_gestor_id, responsaveis_no_orgao_gestor } = await this.processaOrgaoGestor(dto, portfolio, true);

        if (!origem_tipo) throw new Error('origem_tipo deve estar definido no create de Projeto');

        this.removeCampos(tipo, dto, 'create');

        if (dto.projeto_etapa_id) {
            await this.prisma.projetoEtapa.findFirstOrThrow({
                where: { id: dto.projeto_etapa_id, removido_em: null, tipo_projeto: tipo },
                select: { id: true },
            });
        }

        if (dto.portfolios_compartilhados?.length) {
            // Caso o portfolio seja de modelo para clonagem.
            // Não permitir compartilhar com outros ports.
            if (portfolio.modelo_clonagem)
                throw new HttpException(
                    'portfolios_compartilhados| Projeto não pode ser compartilhado pois pertence a um Portfolio de modelo de clonagem.',
                    400
                );

            // Os portfolios compartilhados obrigatoriamente devem possuir ao menos um órgão em comum.
            const portfoliosCompartilhados = portfolios.filter((p) =>
                dto.portfolios_compartilhados?.some((x) => x == p.id)
            );
            await this.checkPortCompartilhadoOrgaos(portfolio, portfoliosCompartilhados);
        }

        if (tipo == 'MDO') {
            if (!dto.orgao_origem_id) throw new HttpException('orgao_origem_id| Campo obrigatório para obras', 400);
            if (!dto.grupo_tematico_id) throw new HttpException('grupo_tematico_id| Campo obrigatório para obras', 400);
            if (!dto.tipo_intervencao_id)
                throw new HttpException('tipo_intervencao_id| Campo obrigatório para obras', 400);

            await this.verificaGrupoTematico(dto);
        }

        const statusPadrao = tipo == 'PP' ? 'Registrado' : 'MDO_NaoIniciada';
        const status = dto.status ?? statusPadrao;
        const now = new Date(Date.now());

        if (dto.tags === null) dto.tags = [];

        if (Array.isArray(dto.tags)) {
            const tags = await this.prisma.projetoTag.findMany({
                where: { id: { in: dto.tags }, tipo_projeto: tipo, removido_em: null },
                select: { id: true },
            });

            if (tags.length !== dto.tags.length)
                throw new HttpException('tags| Uma ou mais tag não foi encontrada', 400);
        }

        const created = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const row = await prismaTx.projeto.create({
                    data: {
                        tipo: tipo,
                        registrado_por: user.id,
                        registrado_em: now,
                        portfolio_id: dto.portfolio_id,
                        orgao_gestor_id: orgao_gestor_id!,
                        responsaveis_no_orgao_gestor: responsaveis_no_orgao_gestor,

                        orgaos_participantes: Array.isArray(dto.orgaos_participantes)
                            ? {
                                  createMany: {
                                      data: dto.orgaos_participantes.map((o) => {
                                          return { orgao_id: o };
                                      }),
                                  },
                              }
                            : undefined,
                        projeto_etapa_id: dto.projeto_etapa_id,
                        orgao_responsavel_id: dto.orgao_responsavel_id,
                        responsavel_id: dto.responsavel_id,
                        nome: dto.nome,
                        resumo: dto.resumo ?? '',
                        previsao_inicio: dto.previsao_inicio,
                        previsao_termino: dto.previsao_termino,

                        origem_tipo: origem_tipo,
                        origem_outro: origem_outro,
                        meta_id: meta_id,
                        iniciativa_id: iniciativa_id,
                        atividade_id: atividade_id,

                        previsao_custo: dto.previsao_custo,
                        principais_etapas: dto.principais_etapas,

                        regiao_id: dto.regiao_id,
                        logradouro_tipo: dto.logradouro_tipo,
                        logradouro_nome: dto.logradouro_nome,
                        logradouro_numero: dto.logradouro_numero,
                        logradouro_cep: dto.logradouro_cep,

                        objetivo: '',
                        objeto: '',
                        publico_alvo: '',
                        status: status,
                        fase: StatusParaFase[status],

                        portfolios_compartilhados: {
                            createMany: {
                                data: dto.portfolios_compartilhados
                                    ? dto.portfolios_compartilhados.map((pc) => {
                                          return {
                                              portfolio_id: pc,
                                              criado_em: now,
                                              criado_por: user.id,
                                          };
                                      })
                                    : [],
                            },
                        },

                        // Este campo, normalmente, é definido com a ação "selecionar" (acao.service)
                        // No entanto, caso o Portfolio seja de compartilhamento, já deve vir pré-definida.
                        // Para permitir criação de cronograma.
                        eh_prioritario: portfolio.modelo_clonagem ? true : false,

                        grupo_tematico_id: dto.grupo_tematico_id,
                        tipo_intervencao_id: dto.tipo_intervencao_id,
                        equipamento_id: dto.equipamento_id,
                        orgao_origem_id: dto.orgao_origem_id,
                        orgao_executor_id: dto.orgao_executor_id,
                        mdo_detalhamento: dto.mdo_detalhamento,
                        mdo_programa_habitacional: dto.mdo_programa_habitacional,
                        mdo_n_unidades_habitacionais: dto.mdo_n_unidades_habitacionais,
                        mdo_n_familias_beneficiadas: dto.mdo_n_familias_beneficiadas,
                        mdo_previsao_inauguracao: dto.mdo_previsao_inauguracao,
                        mdo_observacoes: dto.mdo_observacoes,
                        secretario_executivo: dto.secretario_executivo,
                        secretario_responsavel: dto.secretario_responsavel,

                        colaboradores_no_orgao: dto.colaboradores_no_orgao ?? [],
                        orgao_colaborador_id: dto.orgao_colaborador_id,
                        secretario_colaborador: dto.secretario_colaborador,
                        tags: dto.tags ?? [],
                    },
                    select: { id: true },
                });

                if (tipo == 'MDO') {
                    const codigo = await this.geraProjetoMDOCodigo(row.id, prismaTx);
                    await prismaTx.projeto.update({
                        where: { id: row.id },
                        data: { codigo: codigo },
                    });
                }
                //await this.verificaCampos(prismaTx, row.id, tipo);

                await this.upsertRegioes(dto, prismaTx, row.id, now, [], user, portfolio.nivel_regionalizacao);

                const self = await prismaTx.projeto.findFirstOrThrow({
                    where: { id: row.id },
                    select: { id: true, ProjetoRegiao: true },
                });

                await this.upsertFonteRecurso(dto, prismaTx, row.id);

                await prismaTx.tarefaCronograma.create({
                    data: {
                        projeto_id: row.id,
                        tolerancia_atraso: dto.tolerancia_atraso,
                    },
                });

                const geoDto = new CreateGeoEnderecoReferenciaDto();
                geoDto.projeto_id = row.id;
                geoDto.tokens = dto.geolocalizacao;
                geoDto.tipo = 'Endereco';

                const geo = await this.geolocService.upsertGeolocalizacao(geoDto, user, prismaTx, now);

                await this.appendRegioesByGeoLoc(geo, self, portfolio, prismaTx, now, user);

                return row;
            }
        );

        return created;
    }

    private async upsertRegioes(
        dto: CreateProjetoDto | UpdateProjetoDto,
        prismaTx: Prisma.TransactionClient,
        projeto_id: number,
        now: Date,
        old_regiao_ids: number[],
        user: PessoaFromJwt,
        nivel_regionalizacao: number
    ) {
        if (!('regiao_ids' in dto) || dto.regiao_ids === undefined) return;

        if (dto.regiao_ids == null) dto.regiao_ids = [];

        const regiaoSorted = dto.regiao_ids.sort().join(',');
        const oldSorted = old_regiao_ids.sort().join(',');

        this.logger.debug(`regiao_ids: ${regiaoSorted} | old_regiao_ids: ${oldSorted}`);
        if (regiaoSorted == oldSorted) return;

        if (Array.isArray(dto.regiao_ids)) {
            await this.verificaRegioes(dto.regiao_ids, nivel_regionalizacao);
        }

        const removedIds = old_regiao_ids.filter((r) => !dto.regiao_ids!.includes(r));
        const addedIds = dto.regiao_ids.filter((r) => !old_regiao_ids.includes(r));

        for (const regiao_id of removedIds) {
            await prismaTx.projetoRegiao.updateMany({
                where: { projeto_id: projeto_id, regiao_id: regiao_id, removido_em: null },
                data: { removido_em: now, removido_por: user.id },
            });
        }

        for (const regiao_id of addedIds) {
            await prismaTx.projetoRegiao.create({
                data: {
                    projeto_id: projeto_id,
                    regiao_id: regiao_id,
                    criado_em: now,
                    criado_por: user.id,
                },
            });
        }
    }

    private async verificaRegioes(regiao_ids: number[], nivel_regionalizacao: number) {
        const regioes = await this.prisma.regiao.findMany({
            where: { id: { in: regiao_ids }, removido_em: null },
            select: { id: true, nivel: true, parente_id: true, descricao: true },
        });

        // verifica se as regiões estão no nível correto
        for (const r_id of regiao_ids) {
            const regiao = regioes.find((r) => r.id == r_id);
            if (!regiao) throw new BadRequestException(`Região ${r_id} não encontrada`);

            if (regiao.nivel > nivel_regionalizacao + 1 || regiao.nivel < nivel_regionalizacao)
                throw new BadRequestException(
                    `Região ${regiao.descricao} não é permitida para o nível de regionalização ${nivel_regionalizacao}`
                );
        }

        // verifica se as regiões de nível X+1 tem o pai na lista
        const regioesFilhas = regioes.filter((r) => r.nivel == nivel_regionalizacao + 1);
        for (const r of regioesFilhas) {
            if (r.parente_id && !regiao_ids.includes(r.parente_id)) {
                const parentRegion = await this.prisma.regiao.findFirst({ where: { id: r.parente_id } });

                throw new BadRequestException(
                    `Região ${r.descricao} de nível ${r.nivel} exige que a região pai ${
                        parentRegion?.descricao ?? r.parente_id
                    } esteja na lista`
                );
            }
        }

        // verifica se as regiões de nível X estão no mesmo pai (pra n ficar tão esquisito)

        // como atualmente o sistema esta com fixo nivel_regionalizacao=3 (Subprefeitura) para MDO
        // então precisamos chegar na cidade (nivel 2, região norte/sul/etc) e puxar o parente_id (nivel 1, município)

        const regions3 = regioes.filter((r) => r.nivel == nivel_regionalizacao);
        const regions2 = await this.prisma.regiao.findMany({
            where: {
                id: { in: regions3.map((r) => r.parente_id ?? 0) },
            },
            select: { parente_id: true },
        });

        const parent2 = regions2[0]?.parente_id;
        if (!regions2.every((r) => r.parente_id == parent2))
            throw new BadRequestException(`Todas as subprefeituras devem estar no mesmo município (região de nível 1)`);
    }

    private async verificaGrupoTematico(dto: CreateProjetoDto | UpdateProjetoDto) {
        const grupo_tematico = await this.prisma.grupoTematico.findFirstOrThrow({
            where: { id: dto.grupo_tematico_id },
        });
        if (grupo_tematico.familias_beneficiadas && !dto.mdo_n_familias_beneficiadas)
            throw new HttpException('mdo_n_familias_beneficiadas| Campo obrigatório para obras', 400);
        if (grupo_tematico.unidades_habitacionais && !dto.mdo_n_unidades_habitacionais)
            throw new HttpException('mdo_n_unidades_habitacionais| Campo obrigatório para obras', 400);
        if (grupo_tematico.programa_habitacional && !dto.mdo_programa_habitacional)
            throw new HttpException('mdo_programa_habitacional| Campo obrigatório para obras', 400);
    }

    private removeCampos(tipo: string, dto: CreateProjetoDto | UpdateProjetoDto, op: 'create' | 'update') {
        if (tipo == 'MDO') {
            delete dto.resumo;
            delete dto.principais_etapas;
            delete dto.regiao_id;
            delete dto.logradouro_tipo;
            delete dto.logradouro_nome;
            delete dto.logradouro_numero;
            delete dto.logradouro_cep;
            if ('data_aprovacao' in dto) delete dto.data_aprovacao;
            if ('data_revisao' in dto) delete dto.data_revisao;
            if ('versao' in dto) delete dto.versao;
            if ('coordenador_ue' in dto) delete dto.coordenador_ue;
            if ('nao_escopo' in dto) delete dto.nao_escopo;
            if ('publico_alvo' in dto) delete dto.publico_alvo;
            if ('objetivo' in dto) delete dto.objetivo;
            if ('objeto' in dto) delete dto.objeto;
            if ('restricoes' in dto) delete dto.restricoes;
            if ('premissas' in dto) delete dto.premissas;

            const liberados: ProjetoStatus[] = [
                'MDO_Concluida',
                'MDO_EmAndamento',
                'MDO_NaoIniciada',
                'MDO_Paralisada',
            ];
            if (dto.status && !liberados.includes(dto.status))
                throw new HttpException('status| Status inválido para Obras', 400);
        } else if (tipo == 'PP') {
            // mantém o default do banco, como era antes
            if (dto.status && op == 'create') {
                delete dto.status;
            }

            const liberados: ProjetoStatus[] = [
                'EmAcompanhamento',
                'EmPlanejamento',
                'Fechado',
                'Planejado',
                'Selecionado',
                'Registrado',
                'Suspenso',
                'Validado',
            ];
            if (dto.status && !liberados.includes(dto.status))
                throw new HttpException('status| Status inválido para Projetos', 400);
        }
    }

    private async verificaCampos(prismaTx: Prisma.TransactionClient, id: number, tipo: string) {
        const _self = await prismaTx.projeto.findFirstOrThrow({ where: { id: id } });
        if (tipo == 'PP') {
            // em teoria estava antes aceitando string vazia então talvez nem seja tão necessário assim
            // if (!self.resumo) throw new HttpException('resumo| Resumo é obrigatório para Gestão de Projetos', 400);
        }
    }

    private async checkPortCompartilhadoOrgaos(portPrincipal: PortfolioDto, portCompartilhados: PortfolioDto[]) {
        for (const portfolioCompartilhado of portCompartilhados) {
            if (portfolioCompartilhado.id == portPrincipal.id)
                throw new HttpException(
                    'portfolios_compartilhados| Portfolio compartilhado deve ser diferente do Portfolio principal.',
                    400
                );

            if (
                !portfolioCompartilhado.orgaos
                    .map((o) => o.id)
                    .some((pco) => {
                        return portPrincipal.orgaos.map((o) => o.id).includes(pco);
                    })
            )
                throw new HttpException(
                    'portfolios_compartilhados| Portfolio compartilhado deve conter ao menos um órgão em comum com o Portfolio principal.',
                    400
                );
        }
    }

    async findAllIds(
        tipo: TipoProjeto,
        user: PessoaFromJwt | undefined,
        portfolio_id: number | undefined = undefined
    ): Promise<{ id: number }[]> {
        const permissionsSet: Prisma.Enumerable<Prisma.ProjetoWhereInput> = this.getProjetoWhereSet(tipo, user, true);
        return await this.prisma.projeto.findMany({
            where: {
                tipo: tipo,
                portfolio_id,
                AND:
                    permissionsSet.length > 0
                        ? [
                              {
                                  AND: permissionsSet,
                              },
                          ]
                        : undefined,
            },
            select: { id: true },
        });
    }

    async findAll(tipo: TipoProjeto, filters: FilterProjetoDto, user: PessoaFromJwt): Promise<ProjetoDto[]> {
        const ret: ProjetoDto[] = [];
        const permissionsSet: Prisma.Enumerable<Prisma.ProjetoWhereInput> = this.getProjetoWhereSet(tipo, user, false);

        const rows = await this.prisma.projeto.findMany({
            where: {
                tipo: tipo,
                eh_prioritario: filters.eh_prioritario,
                orgao_responsavel_id: filters.orgao_responsavel_id,
                arquivado: filters.arquivado,
                status: filters.status ? { in: filters.status } : undefined,
                portfolio_id: filters.portfolio_id,
                AND:
                    permissionsSet.length > 0
                        ? [
                              {
                                  AND: permissionsSet,
                              },
                          ]
                        : undefined,
            },
            select: {
                id: true,
                nome: true,
                status: true,
                eh_prioritario: true,
                arquivado: true,
                codigo: true,

                atividade: {
                    select: {
                        iniciativa: {
                            select: {
                                meta: {
                                    select: {
                                        id: true,
                                        codigo: true,
                                        titulo: true,
                                    },
                                },
                            },
                        },
                    },
                },

                iniciativa: {
                    select: {
                        meta: {
                            select: {
                                id: true,
                                codigo: true,
                                titulo: true,
                            },
                        },
                    },
                },

                meta: {
                    select: {
                        id: true,
                        codigo: true,
                        titulo: true,
                    },
                },

                orgao_responsavel: {
                    select: {
                        id: true,
                        sigla: true,
                        descricao: true,
                    },
                },
                portfolio: {
                    select: { id: true, titulo: true, modelo_clonagem: true },
                },
                portfolios_compartilhados: {
                    where: { removido_em: null },
                    select: {
                        portfolio: {
                            select: {
                                id: true,
                                titulo: true,
                            },
                        },
                    },
                },
                regiao: {
                    select: {
                        id: true,
                        nivel: true,
                        descricao: true,
                    },
                },
            },
            orderBy: { codigo: 'asc' },
        });

        const geoDto = new ReferenciasValidasBase();
        geoDto.projeto_id = rows.map((r) => r.id);
        const geolocalizacao = await this.geolocService.carregaReferencias(geoDto);

        for (const row of rows) {
            let meta: IdCodTituloDto | null;

            if (row.atividade) {
                meta = { ...row.atividade.iniciativa.meta };
            } else if (row.iniciativa) {
                meta = { ...row.iniciativa.meta };
            } else if (row.meta) {
                meta = row.meta;
            } else {
                meta = null;
            }

            ret.push({
                id: row.id,
                nome: row.nome,
                status: row.status,
                meta: meta,
                orgao_responsavel: row.orgao_responsavel ? { ...row.orgao_responsavel } : null,
                portfolio: row.portfolio,
                arquivado: row.arquivado,
                eh_prioritario: row.eh_prioritario,
                codigo: row.codigo,
                geolocalizacao: geolocalizacao.get(row.id) || [],
                portfolios_compartilhados: row.portfolios_compartilhados.map((pc) => {
                    return {
                        id: pc.portfolio.id,
                        titulo: pc.portfolio.titulo,
                    };
                }),
            });
        }

        return ret;
    }

    async findAllMDO(filters: FilterProjetoMDODto, user: PessoaFromJwt): Promise<PaginatedWithPagesDto<ProjetoMdoDto>> {
        let token_paginacao = filters.token_paginacao;

        let ipp = filters.ipp ?? 25;
        const page = filters.pagina ?? 1;
        let total_registros = 0;
        let tem_mais = false;

        if (page > 1 && !token_paginacao) throw new HttpException('Campo obrigatório para paginação', 400);

        const tokenPaginacao = filters.token_paginacao;
        // para não atrapalhar no hash, remove o campo pagina
        delete filters.pagina;
        delete filters.token_paginacao;

        const palavrasChave = await this.buscaIdsPalavraChave(filters.palavra_chave);

        let now = new Date(Date.now());
        if (tokenPaginacao) {
            const decoded = this.decodeNextPageToken(tokenPaginacao, filters);
            total_registros = decoded.total_rows;
            ipp = decoded.ipp;
            now = new Date(decoded.issued_at);
        }

        const offset = (page - 1) * ipp;

        const permissionsSet: Prisma.Enumerable<Prisma.ProjetoWhereInput> = this.getProjetoWhereSet('MDO', user, false);
        const filterSet = this.getProjetoMDOWhereSet(filters);
        const linhas = await this.prisma.viewProjetoMDO.findMany({
            where: {
                // Filtro por palavras-chave com tsvector
                id: {
                    in: palavrasChave != undefined ? palavrasChave : undefined,
                },
                projeto: {
                    registrado_em: { lte: now },
                    AND: [...permissionsSet, ...filterSet],
                },
            },
            include: {
                orgao_origem: { select: { id: true, sigla: true, descricao: true } },
                portfolio: { select: { id: true, titulo: true } },
            },
            orderBy: [{ [filters.ordem_coluna]: filters.ordem_direcao === 'asc' ? 'asc' : 'desc' }, { codigo: 'asc' }],
            skip: offset,
            take: ipp,
        });

        if (tokenPaginacao) {
            token_paginacao = filters.token_paginacao;
            tem_mais = offset + linhas.length < total_registros;
        } else {
            const info = await this.encodeNextPageToken(filters, now, user);
            token_paginacao = info.jwt;
            total_registros = info.body.total_rows;
            tem_mais = offset + linhas.length < total_registros;
        }

        const paginas = Math.ceil(total_registros / ipp);
        return {
            tem_mais,
            total_registros: total_registros,
            token_paginacao: token_paginacao!,
            paginas,
            pagina_corrente: page,
            linhas: linhas.map((r): ProjetoMdoDto => {
                return {
                    id: r.id,
                    codigo: r.codigo,
                    nome: r.nome,
                    status: r.status,
                    orgao_origem: r.orgao_origem,
                    grupo_tematico: { id: r.grupo_tematico_id, nome: r.grupo_tematico_nome },
                    equipamento: r.equipamento_id ? { id: r.equipamento_id, nome: r.equipamento_nome! } : null,
                    tipo_intervencao: r.tipo_intervencao_id
                        ? { id: r.tipo_intervencao_id, nome: r.tipo_intervencao_nome! }
                        : null,
                    regioes: r.regioes,
                    portfolio: r.portfolio,
                };
            }),
        };
    }

    private getProjetoWhereSet(tipo: TipoProjeto, user: PessoaFromJwt | undefined, isBi: boolean) {
        const permissionsBaseSet: Prisma.Enumerable<Prisma.ProjetoWhereInput> = [
            {
                tipo: tipo,
                removido_em: null,
                portfolio: { removido_em: null },
            },
        ];
        if (!user) return permissionsBaseSet;

        if (isBi && user.hasSomeRoles(['SMAE.acesso_bi'])) return permissionsBaseSet;

        if (user.hasSomeRoles([tipo == 'PP' ? 'Projeto.administrador' : 'ProjetoMDO.administrador'])) {
            this.logger.debug('roles Projeto.administrador, ver todos os projetos');
            // nenhum filtro para o administrador
            return permissionsBaseSet;
        }

        const waterfallSet: Prisma.Enumerable<Prisma.ProjetoWhereInput> = [];

        if (
            user.hasSomeRoles([tipo == 'PP' ? 'Projeto.administrador_no_orgao' : 'ProjetoMDO.administrador_no_orgao'])
        ) {
            this.logger.verbose(
                `Adicionando ver todos os projetos do portfolio com orgao ${user.orgao_id} (Projeto(MDO)?.administrador_no_orgao)`
            );
            waterfallSet.push({
                portfolio: {
                    orgaos: {
                        some: {
                            orgao_id: user.orgao_id,
                        },
                    },
                },
            });
        }

        if (user.hasSomeRoles([tipo == 'PP' ? 'SMAE.gestor_de_projeto' : 'MDO.gestor_de_projeto'])) {
            this.logger.verbose(
                `Adicionando projetos onde responsaveis_no_orgao_gestor contém ${user.id} (SMAE|MDO.gestor_de_projeto)`
            );
            waterfallSet.push({ responsaveis_no_orgao_gestor: { has: user.id } });
        }

        if (user.hasSomeRoles([tipo == 'PP' ? 'SMAE.colaborador_de_projeto' : 'MDO.colaborador_de_projeto'])) {
            this.logger.verbose(
                `Adicionar ver projetos onde responsavel_id=${user.id} (SMAE|MDO.colaborador_de_projeto)`
            );
            waterfallSet.push({ responsavel_id: user.id });

            this.logger.verbose(
                `Adicionar ver projetos onde equipe contém pessoa_id=${user.id} (SMAE|MDO.colaborador_de_projeto) ou colaboradores_no_orgao contém pessoa_id=${user.id} (SMAE|MDO.colaborador_de_projeto)`
            );
            waterfallSet.push({
                OR: [
                    {
                        equipe: {
                            some: {
                                removido_em: null,
                                pessoa_id: user.id,
                            },
                        },
                    },
                    { colaboradores_no_orgao: { has: user.id } },
                ],
            });
        }

        if (user.hasSomeRoles([tipo == 'PP' ? 'SMAE.espectador_de_projeto' : 'MDO.colaborador_de_projeto'])) {
            this.logger.verbose(
                `Adicionar ver projetos e portfolios que participam dos grupo-portfolios contendo pessoa_id=${user.id} (SMAE|MDO.espectador_de_projeto)`
            );
            waterfallSet.push({
                OR: [
                    // ou o projeto ta num grupo com a pessoa
                    {
                        ProjetoGrupoPortfolio: {
                            some: {
                                removido_em: null,
                                GrupoPortfolio: {
                                    removido_em: null,
                                    GrupoPortfolioPessoa: {
                                        some: {
                                            removido_em: null,
                                            pessoa_id: user.id,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    // ou o port ta num grupo-port que tem essa pessoa
                    {
                        portfolio: {
                            removido_em: null,
                            PortfolioGrupoPortfolio: {
                                some: {
                                    removido_em: null,
                                    GrupoPortfolio: {
                                        removido_em: null,
                                        GrupoPortfolioPessoa: {
                                            some: {
                                                pessoa_id: user.id,
                                                removido_em: null,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    // Ou portfolios compartilhados
                    {
                        portfolios_compartilhados: {
                            some: {
                                removido_em: null,
                                portfolio: {
                                    removido_em: null,
                                    PortfolioGrupoPortfolio: {
                                        some: {
                                            removido_em: null,
                                            GrupoPortfolio: {
                                                removido_em: null,
                                                GrupoPortfolioPessoa: {
                                                    some: {
                                                        pessoa_id: user.id,
                                                        removido_em: null,
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                ],
            });
        }

        // pelo menos uma das condições deveria ser verdadeira
        if (waterfallSet.length == 0) throw new HttpException('Sem permissões para acesso aos projetos.', 400);

        permissionsBaseSet.push({
            OR: waterfallSet,
        });

        return permissionsBaseSet;
    }

    async getDadosProjetoUe(tipo: TipoProjeto, id: number, user: PessoaFromJwt | undefined): Promise<HtmlProjetoUe> {
        const projeto = await this.findOne(tipo, id, user, 'ReadOnly');

        const fonte_recursos: string[] = [];

        if (projeto.fonte_recursos) {
            // como é o relatório é 1 projeto por vez
            // e não imagino que cada projeto via ter muitas fontes de recurso, vou fazer 1
            // query pra cada item

            for (const fr of projeto.fonte_recursos) {
                // TODO eu acho que aqui ta faltando o check pra quando a fonte do recurso > ano corrente
                // buscar o ano corrente
                const rows: {
                    codigo: string;
                    descricao: string;
                }[] = await this.prisma
                    .$queryRaw`select codigo, descricao from sof_entidades_linhas where col = 'fonte_recursos'

                and ano = ${fr.fonte_recurso_ano}::int
                and codigo = ${fr.fonte_recurso_cod_sof}::varchar`;

                if (rows[0]) fonte_recursos.push(rows[0].codigo + ' - ' + rows[0].descricao);
            }
        }

        const fc = new FormatCurrency();
        return {
            nomeDoProjeto: projeto.nome,
            statusDoProjeto: ProjetoStatusParaExibicao[projeto.status],
            descricaoDoProjeto: projeto.resumo,
            orgaoResponsavel: projeto.orgao_responsavel
                ? [projeto.orgao_responsavel.sigla + ' - ' + projeto.orgao_responsavel.descricao]
                : [],
            responsavelPeloProjeto: projeto.responsavel ? projeto.responsavel.nome_exibicao : '-',
            dataInicio: Date2YMD.dbDateToDMY(projeto.previsao_inicio),
            dataTermino: Date2YMD.dbDateToDMY(projeto.previsao_termino),
            custoEstimado: projeto.previsao_custo ? fc.toString(projeto.previsao_custo) : '-',
            fonteDeRecursos: fonte_recursos,
            origem: projeto.origem_tipo == 'Outro' ? projeto.origem_outro || '' : 'Programa de Metas',
            codigoDaMeta: projeto.meta ? projeto.meta.codigo : projeto.meta_codigo,
            textoDaMeta: projeto.meta ? projeto.meta.titulo : '',
            //escopo: projeto.escopo ? projeto.escopo.split('\n\n') : [],
            etapas: projeto.principais_etapas ? projeto.principais_etapas.split('\n\n') : [],
            orgaosEnvolvidos: projeto.orgaos_participantes.map((r) => r.sigla + ' - ' + r.descricao),
        };
    }
    // na fase de execução, o responsavel só vai poder mudar as datas do realizado da tarefa
    // o órgão gestor continua podendo preencher os dados realizado
    async findOne(
        tipo: TipoProjeto | 'AUTO',
        id: number,
        user: PessoaFromJwt | undefined,
        readonly: ReadOnlyBooleanType
    ): Promise<ProjetoDetailDto | ProjetoDetailMdoDto> {
        if (tipo == 'AUTO') {
            const projeto = await this.prisma.projeto.findFirstOrThrow({
                where: { id: id, removido_em: null },
                select: { tipo: true },
            });
            tipo = projeto.tipo;
        }

        const permissionsSet: Prisma.Enumerable<Prisma.ProjetoWhereInput> = this.getProjetoWhereSet(tipo, user, false);
        const projeto = await this.prisma.projeto.findFirst({
            where: {
                id: id,
                tipo: tipo,
                removido_em: null,
                AND:
                    permissionsSet.length > 0
                        ? [
                              {
                                  AND: permissionsSet,
                              },
                          ]
                        : undefined,
            },
            select: {
                id: true,
                arquivado: true,
                origem_tipo: true,
                meta_id: true,
                iniciativa_id: true,
                atividade_id: true,
                origem_outro: true,
                portfolio_id: true,
                meta_codigo: true,
                nome: true,
                status: true,
                fase: true,
                resumo: true,
                codigo: true,
                objeto: true,
                objetivo: true,
                data_aprovacao: true,
                data_revisao: true,
                versao: true,
                publico_alvo: true,
                previsao_inicio: true,
                previsao_custo: true,
                previsao_duracao: true,
                previsao_termino: true,
                nao_escopo: true,
                principais_etapas: true,
                responsaveis_no_orgao_gestor: true,
                responsavel_id: true,
                eh_prioritario: true,
                secretario_executivo: true,
                secretario_responsavel: true,
                coordenador_ue: true,

                TarefaCronograma: {
                    where: { removido_em: null },
                    take: 1,
                    select: {
                        id: true,
                        previsao_custo: true,
                        previsao_duracao: true,
                        previsao_inicio: true,
                        previsao_termino: true,

                        atraso: true,
                        em_atraso: true,
                        projecao_termino: true,
                        realizado_duracao: true,
                        percentual_concluido: true,

                        realizado_inicio: true,
                        realizado_termino: true,
                        realizado_custo: true,
                        tolerancia_atraso: true,
                        percentual_atraso: true,
                        status_cronograma: true,
                    },
                },

                portfolio: {
                    select: {
                        id: true,
                        titulo: true,
                        nivel_maximo_tarefa: true,
                        orcamento_execucao_disponivel_meses: true,
                        nivel_regionalizacao: true,
                        modelo_clonagem: true,
                        orgaos: {
                            select: {
                                orgao_id: true,
                            },
                        },
                    },
                },
                equipe: {
                    where: { removido_em: null },
                    select: {
                        pessoa: {
                            select: {
                                id: true,
                                nome_exibicao: true,
                            },
                        },
                        orgao_id: true,
                    },
                },
                ProjetoGrupoPortfolio: {
                    where: { removido_em: null },
                    select: {
                        grupo_portfolio_id: true,
                    },
                },
                orgao_gestor: {
                    select: {
                        id: true,
                        sigla: true,
                        descricao: true,
                    },
                },

                orgao_responsavel: {
                    select: {
                        id: true,
                        sigla: true,
                        descricao: true,
                    },
                },

                premissas: {
                    select: {
                        id: true,
                        premissa: true,
                    },
                },

                restricoes: {
                    select: {
                        id: true,
                        restricao: true,
                    },
                },

                fonte_recursos: {
                    select: {
                        id: true,
                        fonte_recurso_cod_sof: true,
                        fonte_recurso_ano: true,
                        valor_percentual: true,
                        valor_nominal: true,
                    },
                },

                responsavel: {
                    select: {
                        id: true,
                        nome_exibicao: true,
                    },
                },

                orgaos_participantes: {
                    select: {
                        orgao: {
                            select: {
                                id: true,
                                sigla: true,
                                descricao: true,
                            },
                        },
                    },
                },

                meta: {
                    select: {
                        pdm_id: true,
                        codigo: true,
                        titulo: true,
                        id: true,
                    },
                },

                iniciativa: {
                    select: {
                        id: true,
                        codigo: true,
                        titulo: true,
                        meta: {
                            select: {
                                id: true,
                                codigo: true,
                                titulo: true,
                                pdm_id: true,
                            },
                        },
                    },
                },

                atividade: {
                    select: {
                        id: true,
                        codigo: true,
                        titulo: true,
                        iniciativa: {
                            select: {
                                id: true,
                                codigo: true,
                                titulo: true,
                                meta: {
                                    select: {
                                        id: true,
                                        codigo: true,
                                        titulo: true,
                                        pdm_id: true,
                                    },
                                },
                            },
                        },
                    },
                },

                regiao: {
                    select: {
                        id: true,
                        descricao: true,
                    },
                },

                selecionado_em: true,
                em_planejamento_em: true,
                projeto_etapa: {
                    select: {
                        id: true,
                        descricao: true,
                    },
                },
                ano_orcamento: true,
                logradouro_tipo: true,
                logradouro_nome: true,
                logradouro_numero: true,
                logradouro_cep: true,

                portfolios_compartilhados: {
                    where: { removido_em: null },
                    select: {
                        portfolio: {
                            select: { id: true, titulo: true },
                        },
                    },
                },
                tipo: true,
                ProjetoRegiao: {
                    where: { removido_em: null },
                    orderBy: { regiao: { descricao: 'asc' } },
                    select: {
                        regiao: {
                            select: { id: true, descricao: true, nivel: true, parente_id: true },
                        },
                    },
                },
                secretario_colaborador: true,
                orgao_colaborador: { select: { id: true, sigla: true, descricao: true } },
                colaboradores_no_orgao: true,
                orgao_origem: { select: { id: true, sigla: true, descricao: true } },
                grupo_tematico: { select: { id: true, nome: true } },
                tipo_intervencao: { select: { id: true, nome: true } },
                equipamento: { select: { id: true, nome: true } },
                tags: true,
                mdo_detalhamento: true,
                orgao_executor: { select: { id: true, sigla: true, descricao: true } },
                mdo_programa_habitacional: true,
                mdo_n_unidades_habitacionais: true,
                mdo_n_familias_beneficiadas: true,
                mdo_previsao_inauguracao: true,
                mdo_observacoes: true,
            },
        });
        if (!projeto) throw new HttpException('Projeto não encontrado ou sem permissão para acesso', 400);

        const permissoes = await this.calcPermissions(projeto, user, readonly);

        let meta: ProjetoMetaDetailDto | null = projeto.meta ? projeto.meta : null;

        let iniciativa: IdCodTituloDto | null = null;
        let atividade: IdCodTituloDto | null = null;

        const geoDto = new ReferenciasValidasBase();
        geoDto.projeto_id = projeto.id;
        const geolocalizacao = await this.geolocService.carregaReferencias(geoDto);

        if (projeto.iniciativa) {
            iniciativa = {
                id: projeto.iniciativa.id,
                codigo: projeto.iniciativa.codigo,
                titulo: projeto.iniciativa.titulo,
            };

            meta = {
                id: projeto.iniciativa.meta.id,
                codigo: projeto.iniciativa.meta.codigo,
                titulo: projeto.iniciativa.meta.titulo,
                pdm_id: projeto.iniciativa.meta.pdm_id,
            };
        }

        if (projeto.atividade) {
            atividade = {
                id: projeto.atividade.id,
                codigo: projeto.atividade.codigo,
                titulo: projeto.atividade.titulo,
            };

            iniciativa = {
                id: projeto.atividade.iniciativa.id,
                codigo: projeto.atividade.iniciativa.codigo,
                titulo: projeto.atividade.iniciativa.titulo,
            };

            meta = {
                id: projeto.atividade.iniciativa.meta.id,
                codigo: projeto.atividade.iniciativa.meta.codigo,
                titulo: projeto.atividade.iniciativa.meta.titulo,
                pdm_id: projeto.atividade.iniciativa.meta.pdm_id,
            };
        }

        const [responsaveis_no_orgao_gestor, colaboradores_no_orgao, tags] = await Promise.all([
            this.prisma.pessoa.findMany({
                where: { id: { in: projeto.responsaveis_no_orgao_gestor } },
                select: {
                    id: true,
                    nome_exibicao: true,
                },
            }),
            this.prisma.pessoa.findMany({
                where: { id: { in: projeto.colaboradores_no_orgao } },
                select: {
                    id: true,
                    nome_exibicao: true,
                },
            }),
            this.prisma.projetoTag.findMany({
                where: { id: { in: projeto.tags } },
                select: {
                    id: true,
                    descricao: true,
                },
            }),
        ]);

        const tarefaCrono = projeto.TarefaCronograma[0] ? projeto.TarefaCronograma[0] : undefined;

        let ret: ProjetoDetailDto = {
            id: projeto.id,
            meta_id: projeto.meta_id,
            iniciativa_id: projeto.iniciativa_id,
            atividade_id: projeto.atividade_id,
            projeto_etapa: projeto.projeto_etapa,
            nome: projeto.nome,
            status: projeto.status,
            fase: projeto.fase,
            resumo: projeto.resumo,
            portfolio_id: projeto.portfolio_id,

            codigo: projeto.codigo,
            objeto: projeto.objeto,
            objetivo: projeto.objetivo,
            publico_alvo: projeto.publico_alvo,
            previsao_inicio: projeto.previsao_inicio,
            previsao_custo: projeto.previsao_custo,
            previsao_duracao: projeto.previsao_duracao,
            previsao_termino: projeto.previsao_termino,
            nao_escopo: projeto.nao_escopo,

            principais_etapas: projeto.principais_etapas,
            orgao_gestor: projeto.orgao_gestor,
            orgao_responsavel: projeto.orgao_responsavel,
            responsavel: projeto.responsavel,
            premissas: projeto.premissas,
            restricoes: projeto.restricoes,
            fonte_recursos: projeto.fonte_recursos,
            origem_tipo: projeto.origem_tipo,
            origem_outro: projeto.origem_outro,
            meta_codigo: projeto.meta_codigo,
            selecionado_em: projeto.selecionado_em,
            em_planejamento_em: projeto.em_planejamento_em,
            data_aprovacao: projeto.data_aprovacao,
            data_revisao: projeto.data_revisao,
            versao: projeto.versao,
            eh_prioritario: projeto.eh_prioritario,
            arquivado: projeto.arquivado,
            secretario_executivo: projeto.secretario_executivo,
            secretario_responsavel: projeto.secretario_responsavel,
            coordenador_ue: projeto.coordenador_ue,
            equipe: projeto.equipe,

            ano_orcamento: projeto.ano_orcamento,
            regiao: projeto.regiao,
            logradouro_tipo: projeto.logradouro_tipo,
            logradouro_nome: projeto.logradouro_nome,
            logradouro_numero: projeto.logradouro_numero,
            logradouro_cep: projeto.logradouro_cep,

            secretario_colaborador: projeto.secretario_colaborador,
            orgao_colaborador: projeto.orgao_colaborador,

            portfolio: {
                ...{
                    ...projeto.portfolio,
                    orgaos: undefined,
                    // Agora o cronograma sempre será liberado para uso. No entanto, se o projeto estiver em Registro.
                    // Deve ser limitado ao nível 1.
                    nivel_maximo_tarefa:
                        projeto.status == ProjetoStatus.Registrado ? 1 : projeto.portfolio.nivel_maximo_tarefa,
                },
            },

            tarefa_cronograma: projeto.TarefaCronograma[0] ?? null,
            grupo_portfolio: projeto.ProjetoGrupoPortfolio.map((r) => r.grupo_portfolio_id),

            orgao_origem: projeto.orgao_origem,

            previsao_calculada: tarefaCrono ? true : false,

            atraso: tarefaCrono?.atraso ?? null,
            em_atraso: tarefaCrono?.em_atraso ?? false,
            projecao_termino: tarefaCrono?.projecao_termino ?? null,
            realizado_duracao: tarefaCrono?.realizado_duracao ?? null,
            percentual_concluido: tarefaCrono?.percentual_concluido ?? null,
            realizado_inicio: tarefaCrono?.realizado_inicio ?? null,
            realizado_termino: tarefaCrono?.realizado_termino ?? null,
            realizado_custo: tarefaCrono?.realizado_custo ?? null,
            tolerancia_atraso: tarefaCrono?.tolerancia_atraso ?? 0,
            percentual_atraso: tarefaCrono?.percentual_atraso ?? null,
            status_cronograma: tarefaCrono?.status_cronograma ?? null,
            colaboradores_no_orgao: colaboradores_no_orgao,
            regioes: projeto.ProjetoRegiao.map((r) => r.regiao),
            meta: meta,
            iniciativa: iniciativa,
            atividade: atividade,
            responsaveis_no_orgao_gestor: responsaveis_no_orgao_gestor,
            permissoes: permissoes,
            bloco_nota_token: user ? await this.blocoNotaService.getTokenFor({ projeto_id: projeto.id }, user) : '',
            orgaos_participantes: projeto.orgaos_participantes.map((o) => {
                return {
                    id: o.orgao.id,
                    sigla: o.orgao.sigla,
                    descricao: o.orgao.descricao,
                };
            }),
            geolocalizacao: geolocalizacao.get(projeto.id) || [],

            portfolios_compartilhados: projeto.portfolios_compartilhados
                ? projeto.portfolios_compartilhados.map((pc) => {
                      return { id: pc.portfolio.id, titulo: pc.portfolio.titulo };
                  })
                : null,
            tags,
        };

        if (tipo == 'MDO') {
            const retMdo: ProjetoDetailBaseMdo = {
                equipamento: projeto.equipamento,
                tipo_intervencao: projeto.tipo_intervencao,
                grupo_tematico: projeto.grupo_tematico || { id: 0, nome: '' },

                orgao_executor: projeto.orgao_executor,
                mdo_detalhamento: projeto.mdo_detalhamento,
                mdo_programa_habitacional: projeto.mdo_programa_habitacional,
                mdo_n_unidades_habitacionais: projeto.mdo_n_unidades_habitacionais,
                mdo_n_familias_beneficiadas: projeto.mdo_n_familias_beneficiadas,
                mdo_previsao_inauguracao: projeto.mdo_previsao_inauguracao,
                mdo_observacoes: projeto.mdo_observacoes,
            };

            ret = {
                ...ret,
                ...retMdo,
            };
        }

        return ret;
    }

    private async calcPermissions(
        projeto: ProjetoResumoPermisao,
        user: PessoaFromJwt | undefined,
        readonly: ReadOnlyBooleanType
    ): Promise<ProjetoPermissoesDto> {
        const camposLiberadosPorPadrao = projeto.tipo == 'MDO';

        const permissoes: ProjetoPermissoesDto = {
            acao_arquivar: false,
            acao_restaurar: false,
            acao_selecionar: false,
            acao_iniciar_planejamento: false,
            acao_finalizar_planejamento: false,
            acao_validar: false,
            acao_iniciar: false,
            acao_suspender: false,
            acao_reiniciar: false,
            acao_cancelar: false,
            acao_terminar: false,
            campo_premissas: false,
            campo_restricoes: false,
            campo_data_aprovacao: false,
            campo_data_revisao: false,
            campo_codigo: camposLiberadosPorPadrao,
            campo_versao: false,
            campo_objeto: false,
            campo_objetivo: false,
            campo_publico_alvo: false,
            campo_secretario_executivo: camposLiberadosPorPadrao,
            campo_secretario_responsavel: camposLiberadosPorPadrao,
            campo_coordenador_ue: false,
            campo_nao_escopo: false,
            apenas_leitura: true,
            sou_responsavel: false,
            acao_iniciar_obra: camposLiberadosPorPadrao,
            acao_concluir_obra: camposLiberadosPorPadrao,
            acao_paralisar_obra: camposLiberadosPorPadrao,
            status_permitidos: [],
        };

        // se o projeto está arquivado, não podemos arquivar novamente
        // mas podemos restaurar (retornar para o status e fase anterior)
        if (projeto.arquivado == true) {
            permissoes.acao_restaurar = true;
        } else {
            permissoes.acao_arquivar = true;
        }

        let pessoaPodeEscrever = false;

        if (user) {
            pessoaPodeEscrever = this.calcPessoaPodeEscrever(user, pessoaPodeEscrever, projeto, permissoes);
        } else {
            // user null == sistema puxando o relatório, então se precisar só mudar pra pessoaPodeEscrever=true
        }

        permissoes.apenas_leitura = pessoaPodeEscrever == false;

        if (projeto.arquivado == false) {
            if (projeto.tipo == 'PP') {
                // se já saiu da fase de registro, então está liberado preencher o campo
                // de código, pois esse campo de código, quando preenchido durante o status "Selecionado" irá automaticamente
                // migrar o status para "EmPlanejamento"
                permissoes.campo_nao_escopo = true;
                permissoes.campo_objeto = true;
                permissoes.campo_objetivo = true;
            }

            if (projeto.status !== 'Registrado' && projeto.tipo == 'PP') {
                permissoes.campo_codigo = true;
                permissoes.campo_premissas = true;
                permissoes.campo_restricoes = true;

                permissoes.campo_data_aprovacao = true;
                permissoes.campo_data_revisao = true;
                permissoes.campo_versao = true;

                permissoes.campo_publico_alvo = true;
                permissoes.campo_secretario_executivo = true;
                permissoes.campo_secretario_responsavel = true;
                permissoes.campo_coordenador_ue = true;
            }

            if (pessoaPodeEscrever) {
                switch (projeto.status) {
                    case 'Registrado':
                        permissoes.acao_selecionar = true;
                        break;
                    case 'Selecionado':
                        permissoes.status_permitidos.push('Registrado');
                        permissoes.acao_iniciar_planejamento = true;
                        break;
                    case 'EmPlanejamento':
                        permissoes.status_permitidos.push('Selecionado');
                        permissoes.status_permitidos.push('Registrado');
                        permissoes.acao_finalizar_planejamento = true;
                        break;
                    case 'Planejado':
                        permissoes.status_permitidos.push('EmPlanejamento');
                        permissoes.status_permitidos.push('Selecionado');
                        permissoes.status_permitidos.push('Registrado');
                        permissoes.acao_validar = true;
                        break;
                    case 'Validado':
                        permissoes.status_permitidos.push('Planejado');
                        permissoes.status_permitidos.push('EmPlanejamento');
                        permissoes.status_permitidos.push('Selecionado');
                        permissoes.status_permitidos.push('Registrado');
                        permissoes.acao_iniciar = true;
                        break;
                    case 'EmAcompanhamento':
                        permissoes.status_permitidos.push('Validado');
                        permissoes.status_permitidos.push('Planejado');
                        permissoes.status_permitidos.push('EmPlanejamento');
                        permissoes.status_permitidos.push('Selecionado');
                        permissoes.status_permitidos.push('Registrado');
                        permissoes.acao_suspender = permissoes.acao_terminar = true;
                        break;
                    case 'Suspenso':
                        permissoes.status_permitidos.push('EmAcompanhamento');
                        permissoes.status_permitidos.push('Validado');
                        permissoes.status_permitidos.push('Planejado');
                        permissoes.status_permitidos.push('EmPlanejamento');
                        permissoes.status_permitidos.push('Selecionado');
                        permissoes.status_permitidos.push('Registrado');
                        permissoes.acao_cancelar = permissoes.acao_reiniciar = true;
                        break;
                    case 'Fechado':
                        permissoes.status_permitidos.push('EmAcompanhamento');
                        permissoes.status_permitidos.push('Validado');
                        permissoes.status_permitidos.push('Planejado');
                        permissoes.status_permitidos.push('EmPlanejamento');
                        permissoes.status_permitidos.push('Selecionado');
                        permissoes.status_permitidos.push('Registrado');
                        permissoes.acao_arquivar = true;
                        break;
                    case 'MDO_Concluida':
                        permissoes.status_permitidos.push('MDO_EmAndamento');
                        permissoes.status_permitidos.push('MDO_NaoIniciada');
                        permissoes.status_permitidos.push('MDO_Paralisada');
                        permissoes.acao_arquivar = true;
                        break;
                    case 'MDO_EmAndamento':
                        permissoes.status_permitidos.push('MDO_Concluida');
                        permissoes.status_permitidos.push('MDO_NaoIniciada');
                        permissoes.status_permitidos.push('MDO_Paralisada');
                        permissoes.acao_concluir_obra = true;
                        permissoes.acao_paralisar_obra = true;
                        break;
                    case 'MDO_NaoIniciada':
                        permissoes.status_permitidos.push('MDO_Concluida');
                        permissoes.status_permitidos.push('MDO_EmAndamento');
                        permissoes.status_permitidos.push('MDO_Paralisada');
                        permissoes.acao_iniciar_obra = true;
                        permissoes.acao_arquivar = true;
                        break;
                    case 'MDO_Paralisada':
                        permissoes.status_permitidos.push('MDO_Concluida');
                        permissoes.status_permitidos.push('MDO_EmAndamento');
                        permissoes.status_permitidos.push('MDO_NaoIniciada');
                        permissoes.acao_iniciar_obra = true;
                        permissoes.acao_arquivar = true;
                        break;
                }
            }
        }

        if (user && readonly === 'ReadWrite' && pessoaPodeEscrever == false) {
            throw new HttpException('Você não pode executar a ação no projeto.', 400);
        } else if (
            user &&
            readonly === 'ReadWriteTeam' &&
            pessoaPodeEscrever == false &&
            permissoes.sou_responsavel == false
        ) {
            throw new HttpException('Você não pode executar está a ação no projeto sem participar da equipe.', 400);
        }

        // se não pode escrever, logo, não pode ter nenhum campo ou acao habilitada
        if (pessoaPodeEscrever == false) {
            for (const key in permissoes) {
                if (key.startsWith('campo_') || key.startsWith('acao_')) {
                    (permissoes as any)[key] = false;
                }
            }
        }

        return permissoes;
    }

    private calcPessoaPodeEscrever(
        user: PessoaFromJwt,
        pessoaPodeEscrever: boolean,
        projeto: ProjetoResumoPermisao,
        permissoes: ProjetoPermissoesDto
    ): boolean {
        if (projeto.tipo == 'PP') return this.calcPessoaPodeEscreverPP(user, pessoaPodeEscrever, projeto, permissoes);

        return this.calcPessoaPodeEscreverMDO(user, pessoaPodeEscrever, projeto, permissoes);
    }

    /**
     * MDO todo mundo que tem qualquer permissão pode escrever, exceto espectador
     */
    private calcPessoaPodeEscreverMDO(
        user: PessoaFromJwt,
        pessoaPodeEscrever: boolean,
        projeto: ProjetoResumoPermisao,
        permissoes: ProjetoPermissoesDto
    ): boolean {
        const anyPerm = user.hasSomeRoles([
            'ProjetoMDO.administrador',
            'MDO.gestor_de_projeto',
            'ProjetoMDO.administrador_no_orgao',
            'MDO.colaborador_de_projeto',
            'MDO.espectador_de_projeto',
        ]);

        // Se não possuir nenhum dos papéis, não deveria ter acesso nem para leitura
        if (!anyPerm) throw new HttpException('Não foi possível calcular a permissão de acesso para o projeto.', 400);

        // Usuários administradores sempre podem escrever
        if (user.hasSomeRoles(['ProjetoMDO.administrador'])) {
            this.logger.verbose(`Pode escrever pois é administrador (ProjetoMDO.administrador)`);
            return true;
        }

        // Gestores de projeto no órgão gestor podem escrever
        if (user.hasSomeRoles(['MDO.gestor_de_projeto']) && projeto.responsaveis_no_orgao_gestor.includes(+user.id)) {
            this.logger.verbose(`Pode escrever pois é gestor de projeto no órgão gestor (MDO.gestor_de_projeto)`);
            return true;
        }

        // Administradores no órgão do projeto podem escrever
        if (user.hasSomeRoles(['ProjetoMDO.administrador_no_orgao'])) {
            // TODO : verificar talvez podemos mudar para orgão de origem ou algum outro,
            // mas por enquanto vamos manter o orgão do portfolio, regra do PP
            // no momento todas as escritas tem o mesmo peso de permissão
            pessoaPodeEscrever = projeto.portfolio.orgaos.some((r) => r.orgao_id == user.orgao_id);

            if (pessoaPodeEscrever) {
                this.logger.verbose(
                    `Pode escrever pois é administrador no órgão do projeto (ProjetoMDO.administrador_no_orgao)`
                );
                return true;
            }
        }

        // Colaboradores de projeto podem escrever todas as fases da obra (diferente do PP)
        if (user.hasSomeRoles(['MDO.colaborador_de_projeto'])) {
            const ehResp = projeto.responsavel_id && projeto.responsavel_id == +user.id;
            const ehEquipe = projeto.equipe.some((r) => r.pessoa.id == user.id);
            const ehColaborador = projeto.colaboradores_no_orgao.includes(+user.id);

            if (ehResp || ehEquipe || ehColaborador) {
                pessoaPodeEscrever = true;
                permissoes.sou_responsavel = true;
            }

            this.logger.verbose(
                `pessoa pode escrever: pessoaPodeEscrever=${pessoaPodeEscrever} sou_responsavel=${permissoes.sou_responsavel} ehResp: ${ehResp} ehEquipe: ${ehEquipe} ehColaborador: ${ehColaborador}`
            );

            if (pessoaPodeEscrever) return true;
        }

        // Se não se encaixou em nenhuma regra acima, não pode escrever
        this.logger.verbose(`Não se encaixa em nenhum critério para escrita.`);
        return false;
    }

    private calcPessoaPodeEscreverPP(
        user: PessoaFromJwt,
        pessoaPodeEscrever: boolean,
        projeto: ProjetoResumoPermisao,
        permissoes: ProjetoPermissoesDto
    ): boolean {
        const anyPerm = user.hasSomeRoles([
            'Projeto.administrador',
            'SMAE.gestor_de_projeto',
            'Projeto.administrador_no_orgao',
            'SMAE.colaborador_de_projeto',
            'SMAE.espectador_de_projeto',
        ]);
        if (!anyPerm) throw new HttpException('Não foi possível calcular a permissão de acesso para o projeto.', 400);

        if (user.hasSomeRoles(['Projeto.administrador'])) {
            // admin pode tudo, nem precisa testar mais coisas

            this.logger.verbose(
                `Pode escrever pois está na lista de responsável no órgão gestor (SMAE.gestor_de_projeto)`
            );
            return true;
        }

        // começa pelo mais barato
        if (user.hasSomeRoles(['SMAE.gestor_de_projeto']) && projeto.responsaveis_no_orgao_gestor.includes(+user.id)) {
            if (pessoaPodeEscrever)
                this.logger.verbose(
                    `Pode escrever pois está na lista de responsável no órgão gestor (SMAE.gestor_de_projeto)`
                );

            return true;
        }

        // testa agora com um reduce, já ta carregado anyway
        if (user.hasSomeRoles(['Projeto.administrador_no_orgao'])) {
            // precisa ter o órgão no portfólio
            pessoaPodeEscrever = projeto.portfolio.orgaos.filter((r) => r.orgao_id == user.orgao_id)[0] != undefined;

            if (pessoaPodeEscrever) {
                this.logger.verbose(`pode escrever pois faz parte do órgão (Projeto.administrador_no_orgao)`);
                return true;
            }
        }

        if (user.hasSomeRoles(['SMAE.colaborador_de_projeto'])) {
            const ehResp = projeto.responsavel_id && projeto.responsavel_id == +user.id;
            const ehEquipe = projeto.equipe.filter((r) => r.pessoa.id == user.id)[0] != undefined;
            const ehColaborador = projeto.colaboradores_no_orgao.includes(+user.id);

            if (ehResp || ehEquipe || ehColaborador) {
                pessoaPodeEscrever = FASES_LIBERAR_COLABORADOR.includes(projeto.status);
                // mesmo não podendo escrever, ele ainda é o responsável, ele pode fazer algumas escritas (do realizado, no cronograma)
                permissoes.sou_responsavel = true;
            }

            this.logger.verbose(
                `pessoa pode escrever: pessoaPodeEscrever=${pessoaPodeEscrever} sou_responsavel=${permissoes.sou_responsavel} ehResp: ${ehResp} ehEquipe: ${ehEquipe} ehColaborador: ${ehColaborador}`
            );

            if (ehResp) {
                if (pessoaPodeEscrever)
                    this.logger.verbose(
                        `pode escrever pois é responsavel e está em FASES_LIBERAR_COLABORADOR (SMAE.colaborador_de_projeto)`
                    );
                else this.logger.verbose(`não pode escrever mas ainda é o é responsavel (SMAE.colaborador_de_projeto)`);
            }

            if (ehEquipe) {
                if (pessoaPodeEscrever)
                    this.logger.verbose(
                        `pode escrever pois está na equipe e está em FASES_LIBERAR_COLABORADOR (SMAE.colaborador_de_projeto)`
                    );
                else
                    this.logger.verbose(
                        `não pode escrever mas está na equipe então é responsável (SMAE.colaborador_de_projeto)`
                    );
            }
        }

        return pessoaPodeEscrever;
    }

    async update(
        tipo: TipoProjeto,
        projetoId: number,
        dto: UpdateProjetoDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        // aqui é feito a verificação se esse usuário pode realmente acessar esse recurso
        const projeto = await this.findOne(tipo, projetoId, user, 'ReadWrite');
        this.removeCampos(tipo, dto, 'update');

        // migrou de status, verificar se  realmente poderia mudar
        if (dto.status && dto.status != projeto.status) {
            if (projeto.permissoes.status_permitidos.includes(dto.status) === false)
                throw new HttpException(`Você não é possível mudar o status do projeto para ${dto.status}`, 400);
        } else {
            // just to be sure, vai que muda durante a TX
            dto.status = undefined;
        }

        if ('grupo_tematico_id' in dto) {
            await this.verificaGrupoTematico(dto);
        } else {
            // bloqueia a mudança dos campos se não informar o grupo temático
            dto.mdo_n_familias_beneficiadas = undefined;
            dto.mdo_n_unidades_habitacionais = undefined;
            dto.mdo_programa_habitacional = undefined;
        }

        // TODO? se estiver arquivado, retorna 400 (estava só o comentario, sem o texto de TODO)

        let origem_tipo: ProjetoOrigemTipo | undefined = undefined;
        let meta_id: number | null | undefined = undefined;
        let iniciativa_id: number | null | undefined = undefined;
        let atividade_id: number | null | undefined = undefined;
        let origem_outro: string | null | undefined = undefined;
        let meta_codigo: string | null | undefined = undefined;

        if ('origem_tipo' in dto && dto.origem_tipo) {
            const origemVerification = await this.processaOrigem(dto as any);

            origem_tipo = origemVerification.origem_tipo;
            meta_id = origemVerification.meta_id;
            iniciativa_id = origemVerification.iniciativa_id;
            atividade_id = origemVerification.atividade_id;
            origem_outro = origemVerification.origem_outro;
            meta_codigo = origemVerification.meta_codigo;
        }

        const portfolios = await this.portfolioService.findAll(tipo, user, true);

        const portfolio = portfolios.filter((r) => r.id == projeto.portfolio_id)[0];
        if (!portfolio)
            throw new HttpException('portfolio_id| Portfolio não está liberado para o seu usuário editar', 400);

        const edit = dto.responsaveis_no_orgao_gestor
            ? {
                  orgao_gestor_id: projeto.orgao_gestor.id,
                  responsaveis_no_orgao_gestor: dto.responsaveis_no_orgao_gestor,
              }
            : {};
        const { orgao_gestor_id, responsaveis_no_orgao_gestor } = await this.processaOrgaoGestor(
            edit as any,
            portfolio,
            false
        );

        const now = new Date(Date.now());

        if (dto.tags == null) dto.tags = [];

        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            await this.upsertPremissas(dto, prismaTx, projetoId);
            await this.upsertRestricoes(dto, prismaTx, projetoId);
            await this.upsertFonteRecurso(dto, prismaTx, projetoId);

            if (Array.isArray(dto.tags)) {
                const newTagsSorted = dto.tags.sort().join(',');
                const oldTagsSorted = projeto.tags
                    .map((t) => t.id)
                    .sort()
                    .join(',');

                if (newTagsSorted !== oldTagsSorted) {
                    const tags = await prismaTx.projetoTag.findMany({
                        where: { id: { in: dto.tags }, tipo_projeto: tipo, removido_em: null },
                        select: { id: true },
                    });

                    if (tags.length !== dto.tags.length)
                        throw new HttpException('tags| Uma ou mais tag não foi encontrada', 400);
                }
            }

            if ('regiao_ids' in dto) {
                const regioes = await prismaTx.projetoRegiao.findMany({
                    where: { projeto_id: projetoId, removido_em: null },
                    select: { regiao_id: true },
                });
                await this.upsertRegioes(
                    dto,
                    prismaTx,
                    projeto.id,
                    now,
                    regioes.map((r) => r.regiao_id),
                    user,
                    projeto.portfolio.nivel_regionalizacao
                );
            }

            if (dto.orgaos_participantes !== undefined)
                await prismaTx.projetoOrgaoParticipante.deleteMany({ where: { projeto_id: projetoId } });

            dto.objeto = HtmlSanitizer(dto.objeto);
            dto.objetivo = HtmlSanitizer(dto.objetivo);
            dto.publico_alvo = HtmlSanitizer(dto.publico_alvo);
            dto.nao_escopo = HtmlSanitizer(dto.nao_escopo);

            if (dto.portfolios_compartilhados?.length) {
                const portfoliosCompartilhados = portfolios.filter((p) =>
                    dto.portfolios_compartilhados?.some((x) => x == p.id)
                );
                await this.checkPortCompartilhadoOrgaos(portfolio, portfoliosCompartilhados);

                const { deletedPC, createdPC } = this.checkDiffPortfoliosCompartilhados(
                    projeto.portfolios_compartilhados?.map((pc) => pc.id),
                    dto.portfolios_compartilhados
                );

                if (deletedPC.length) {
                    await prismaTx.portfolioProjetoCompartilhado.updateMany({
                        where: {
                            portfolio_id: { in: deletedPC },
                            projeto_id: projetoId,
                        },
                        data: {
                            removido_em: now,
                            removido_por: user.id,
                        },
                    });
                }

                if (createdPC.length) {
                    await prismaTx.portfolioProjetoCompartilhado.createMany({
                        data: createdPC.map((cpc) => {
                            return {
                                projeto_id: projetoId,
                                portfolio_id: cpc,
                                criado_em: now,
                                criado_por: user.id,
                            };
                        }),
                    });
                }
            } else {
                // Verificar se possui compartilhados e caso possua, remover.
                await prismaTx.portfolioProjetoCompartilhado.updateMany({
                    where: { projeto_id: projetoId, removido_em: null },
                    data: {
                        removido_em: now,
                        removido_por: user.id,
                    },
                });
            }

            if (dto.tolerancia_atraso !== undefined) {
                const feedback = await prismaTx.tarefaCronograma.updateMany({
                    where: { projeto_id: projetoId, removido_em: null },
                    data: {
                        tolerancia_atraso: dto.tolerancia_atraso,
                        tarefas_proximo_recalculo: new Date(),
                    },
                });
                this.logger.verbose(
                    `Repassando update de tolerancia_atraso= ${dto.tolerancia_atraso} para tarefaCronograma: ${feedback.count} updated rows`
                );
            }

            const self = await prismaTx.projeto.update({
                where: { id: projetoId },
                data: {
                    // origem
                    meta_id,
                    atividade_id,
                    iniciativa_id,
                    origem_outro,
                    meta_codigo,
                    origem_tipo,

                    // campos do create
                    orgao_gestor_id,
                    responsaveis_no_orgao_gestor,

                    orgao_responsavel_id: dto.orgao_responsavel_id,
                    responsavel_id: dto.responsavel_id,

                    projeto_etapa_id: dto.projeto_etapa_id,
                    nome: dto.nome,
                    resumo: dto.resumo,
                    previsao_inicio: dto.previsao_inicio,
                    previsao_termino: dto.previsao_termino,
                    previsao_custo: dto.previsao_custo,
                    principais_etapas: dto.principais_etapas,
                    versao: dto.versao,
                    data_aprovacao: dto.data_aprovacao,
                    data_revisao: dto.data_revisao,

                    status: dto.status,

                    // campos apenas do update
                    publico_alvo: dto.publico_alvo,
                    objeto: dto.objeto,
                    objetivo: dto.objetivo,
                    nao_escopo: dto.nao_escopo,
                    secretario_executivo: dto.secretario_executivo,
                    secretario_responsavel: dto.secretario_responsavel,
                    coordenador_ue: dto.coordenador_ue,

                    regiao_id: dto.regiao_id,
                    logradouro_cep: dto.logradouro_cep,
                    logradouro_nome: dto.logradouro_nome,
                    logradouro_numero: dto.logradouro_numero,
                    logradouro_tipo: dto.logradouro_tipo,

                    orgaos_participantes:
                        dto.orgaos_participantes !== undefined
                            ? {
                                  createMany: {
                                      data: dto.orgaos_participantes!.map((o) => {
                                          return { orgao_id: o };
                                      }),
                                  },
                              }
                            : undefined,

                    // campos MDO
                    grupo_tematico_id: dto.grupo_tematico_id,
                    tipo_intervencao_id: dto.tipo_intervencao_id,
                    equipamento_id: dto.equipamento_id,
                    orgao_executor_id: dto.orgao_executor_id,
                    mdo_detalhamento: dto.mdo_detalhamento,
                    mdo_programa_habitacional: dto.mdo_programa_habitacional,
                    mdo_n_unidades_habitacionais: dto.mdo_n_unidades_habitacionais,
                    mdo_n_familias_beneficiadas: dto.mdo_n_familias_beneficiadas,
                    mdo_previsao_inauguracao: dto.mdo_previsao_inauguracao,
                    mdo_observacoes: dto.mdo_observacoes,

                    // TODO validar as permissoes
                    colaboradores_no_orgao: dto.colaboradores_no_orgao ?? [],
                    orgao_colaborador_id: dto.orgao_colaborador_id,
                    secretario_colaborador: dto.secretario_colaborador,

                    tags: dto.tags ?? [],
                },
                select: {
                    id: true,
                    projeto_etapa_id: true,
                    ProjetoRegiao: {
                        where: { removido_em: null },
                        select: {
                            regiao_id: true,
                        },
                    },
                },
            });

            if (self.projeto_etapa_id && self.projeto_etapa_id != projeto.projeto_etapa?.id) {
                await prismaTx.projetoEtapa.findFirstOrThrow({
                    where: { id: self.projeto_etapa_id, removido_em: null, tipo_projeto: tipo },
                    select: { id: true },
                });
            }

            if (dto.geolocalizacao) {
                const geoDto = new CreateGeoEnderecoReferenciaDto();
                geoDto.projeto_id = projeto.id;
                geoDto.tokens = dto.geolocalizacao;
                geoDto.tipo = 'Endereco';

                const geo = await this.geolocService.upsertGeolocalizacao(geoDto, user, prismaTx, now);

                await this.appendRegioesByGeoLoc(geo, self, portfolio, prismaTx, now, user);
            }

            // se já passou da fase do planejamento, então sim pode verificar se há necessidade de gerar
            // ou atualizar o código
            if (
                projeto.em_planejamento_em !== null &&
                ((dto.meta_id && projeto.meta_id != dto.meta_id) ||
                    (dto.origem_outro && projeto.origem_outro != dto.origem_outro) ||
                    (dto.origem_tipo && projeto.origem_tipo != dto.origem_tipo) ||
                    (dto.meta_codigo && projeto.meta_codigo != dto.meta_codigo) ||
                    (dto.orgao_responsavel_id && (projeto.orgao_responsavel?.id || 0) != dto.orgao_responsavel_id) ||
                    (!projeto.codigo &&
                        projeto.selecionado_em &&
                        projeto.orgao_responsavel &&
                        projeto.orgao_responsavel.id))
            ) {
                let codigo;
                if (tipo == 'MDO') {
                    codigo = await this.geraProjetoMDOCodigo(projeto.id, prismaTx);
                } else {
                    codigo = await this.geraProjetoCodigo(projeto.id, prismaTx);
                }

                if (codigo != projeto.codigo)
                    await prismaTx.projeto.update({ where: { id: projeto.id }, data: { codigo: codigo } });
            }

            //await this.verificaCampos(prismaTx, projetoId, tipo);

            await this.upsertGrupoPort(prismaTx, projeto, dto, now, user);
            await this.upsertEquipe(tipo, prismaTx, projeto, dto, now, user);
        });

        return { id: projetoId };
    }

    private async appendRegioesByGeoLoc(
        geo: UpsertEnderecoDto,
        self: { id: number; ProjetoRegiao: { regiao_id: number }[] },
        portfolio: PortfolioDto,
        prismaTx: Prisma.TransactionClient,
        now: Date,
        user: PessoaFromJwt
    ) {
        const regioesExistentes = self.ProjetoRegiao.map((r) => r.regiao_id);
        this.logger.verbose(JSON.stringify({ 'regioesExistentes': regioesExistentes }));
        for (const r of geo.novos_enderecos) {
            for (const rr of r.regioes) {
                this.logger.verbose(JSON.stringify({ rr: rr }));
                if (regioesExistentes.find((regiao_id) => regiao_id == rr.id)) {
                    this.logger.verbose(`Região ${rr.id} já existe no projeto ${self.id}`);
                    continue; // região já existe
                }

                if (portfolio.nivel_regionalizacao != rr.nivel && portfolio.nivel_regionalizacao != rr.nivel - 1) {
                    this.logger.verbose(
                        `Região ${rr.id}, nível ${rr.nivel} não é permitido para o portfolio ${portfolio.id}`
                    );
                    continue; // Só entra região se for do mesmo nível ou um nível abaixo
                }

                regioesExistentes.push(rr.id);
                await prismaTx.projetoRegiao.create({
                    data: {
                        regiao_id: rr.id,
                        projeto_id: self.id,
                        criado_em: now,
                        criado_por: user.id,
                    },
                });
            }
        }
    }

    private checkDiffPortfoliosCompartilhados(
        currentPortCompartilhados: number[] | undefined,
        newPortCompartilhados: number[]
    ) {
        let deleted: number[] = [];
        let created: number[] = [];

        if (!currentPortCompartilhados) {
            created = newPortCompartilhados;
        } else {
            deleted = currentPortCompartilhados.filter((cpc) => {
                return !newPortCompartilhados.find((npc) => npc == cpc);
            });

            created = newPortCompartilhados.filter((npc) => {
                return !currentPortCompartilhados.find((cpc) => cpc == npc);
            });
        }

        return {
            deletedPC: deleted,
            createdPC: created,
        };
    }

    private async upsertGrupoPort(
        prismaTx: Prisma.TransactionClient,
        projeto: ProjetoDetailDto,
        dto: UpdateProjetoDto,
        now: Date,
        user: PessoaFromJwt
    ) {
        if (!Array.isArray(dto.grupo_portfolio)) return;

        const prevVersions = await prismaTx.projetoGrupoPortfolio.findMany({
            where: {
                removido_em: null,
                projeto_id: projeto.id,
            },
            include: {
                GrupoPortfolio: {
                    select: { orgao_id: true },
                },
            },
        });

        for (const grupoPortId of dto.grupo_portfolio) {
            if (prevVersions.filter((r) => r.grupo_portfolio_id == grupoPortId)[0]) continue;

            const gp = await prismaTx.grupoPortfolio.findFirstOrThrow({
                where: {
                    removido_em: null,
                    id: grupoPortId,
                },
                select: { id: true, orgao_id: true },
            });
            if (!user.hasSomeRoles(['Projeto.administrador'])) {
                if (!user.hasSomeRoles(['Projeto.administrador_no_orgao']) || user.orgao_id != gp.orgao_id)
                    throw new BadRequestException('Sem permissão para adicionar grupo de portfólio no projeto.');
            }

            await prismaTx.projetoGrupoPortfolio.create({
                data: {
                    grupo_portfolio_id: gp.id,
                    criado_em: now,
                    criado_por: user.id,
                    projeto_id: projeto.id,
                },
            });
        }

        for (const prevPortRow of prevVersions) {
            // pula as que continuam na lista
            if (dto.grupo_portfolio.filter((r) => r == prevPortRow.grupo_portfolio_id)[0]) continue;
            if (!user.hasSomeRoles(['Projeto.administrador'])) {
                if (
                    !user.hasSomeRoles(['Projeto.administrador_no_orgao']) ||
                    user.orgao_id != prevPortRow.GrupoPortfolio.orgao_id
                )
                    throw new BadRequestException('Sem permissão para remover grupo de portfólio no projeto.');
            }

            // remove o relacionamento
            await prismaTx.projetoGrupoPortfolio.update({
                where: {
                    id: prevPortRow.id,
                    removido_em: null,
                },
                data: {
                    removido_em: now,
                    removido_por: user.id,
                },
            });
        }
    }

    private async upsertEquipe(
        tipo: TipoProjeto,
        prismaTx: Prisma.TransactionClient,
        projeto: ProjetoDetailDto,
        dto: UpdateProjetoDto,
        now: Date,
        user: PessoaFromJwt
    ) {
        if (!Array.isArray(dto.equipe)) return;

        const prevVersions = await prismaTx.projetoEquipe.findMany({
            where: {
                removido_em: null,
                projeto_id: projeto.id,
            },
        });

        for (const pessoaId of dto.equipe) {
            if (prevVersions.filter((r) => r.pessoa_id == pessoaId)[0]) continue;

            const pComPriv = await this.pessoaPrivService.pessoasComPriv(
                [tipo == 'PP' ? 'SMAE.colaborador_de_projeto' : 'MDO.colaborador_de_projeto'],
                [pessoaId]
            );
            const pessoaComPerm = pComPriv[0];

            if (!pessoaComPerm)
                throw new BadRequestException(
                    `Pessoa id ${pessoaId} não foi encontrada ou não tem o privilégio necessário.`
                );

            if (!user.hasSomeRoles(['Projeto.administrador'])) {
                if (!user.hasSomeRoles(['Projeto.administrador_no_orgao']) || user.orgao_id != pessoaComPerm.orgao_id)
                    throw new BadRequestException('Sem permissão para adicionar grupo de portfólio no projeto.');
            }

            await prismaTx.projetoEquipe.create({
                data: {
                    pessoa_id: pessoaComPerm.pessoa_id,
                    orgao_id: pessoaComPerm.orgao_id,
                    criado_em: now,
                    criado_por: user.id,
                    projeto_id: projeto.id,
                },
            });
        }

        for (const prevEquipeRow of prevVersions) {
            // pula as que continuam na lista
            if (dto.equipe.filter((r) => r == prevEquipeRow.pessoa_id)[0]) continue;

            if (!user.hasSomeRoles(['Projeto.administrador'])) {
                if (!user.hasSomeRoles(['Projeto.administrador_no_orgao']) || user.orgao_id != prevEquipeRow.orgao_id)
                    throw new BadRequestException('Sem permissão para remover a pessoa da equipe do projeto.');
            }

            // remove o relacionamento
            await prismaTx.projetoEquipe.update({
                where: {
                    id: prevEquipeRow.id,
                    removido_em: null,
                },
                data: {
                    removido_em: now,
                    removido_por: user.id,
                },
            });
        }
    }

    async geraProjetoMDOCodigo(id: number, prismaTx: Prisma.TransactionClient): Promise<string | undefined> {
        // buscar o ano baseado em 'selecionado_em'
        const projeto = await prismaTx.projeto.findUniqueOrThrow({
            where: { id },
            select: {
                id: true,
                portfolio_id: true,
                orgao_origem: {
                    select: {
                        sigla: true,
                    },
                },
            },
        });

        if (!projeto.orgao_origem)
            throw new HttpException('Não é possível gerar o código da obra sem um órgão de origem.', 400);

        await prismaTx.$queryRaw`SELECT id FROM portfolio WHERE id = ${projeto.portfolio_id}::int FOR UPDATE`;
        let anoSequencia = DateTime.local({ zone: SYSTEM_TIMEZONE }).year;
        let sequencial = 0;

        const buscaExistente = await prismaTx.projetoNumeroSequencial.findFirst({
            where: {
                projeto_id: id,
            },
        });

        if (buscaExistente) {
            anoSequencia = buscaExistente.ano;
            sequencial = buscaExistente.valor;
            this.logger.debug(
                `Projeto não deve mudar de ano, nem portfolio. Mantendo sequencial e ano anteriores. Mantendo sequencial ${sequencial}`
            );
        } else {
            this.logger.debug(`Gerando novo sequencial para o portfolio ${projeto.portfolio_id} em ${anoSequencia}.`);
            sequencial =
                (await prismaTx.projetoNumeroSequencial.count({
                    where: {
                        portfolio_id: projeto.portfolio_id,
                        ano: anoSequencia,
                    },
                })) + 1;
            this.logger.debug(`=> Registrando sequencial ${sequencial}.`);

            await prismaTx.projetoNumeroSequencial.create({
                data: {
                    projeto_id: projeto.id,
                    portfolio_id: projeto.portfolio_id,
                    ano: anoSequencia,
                    valor: sequencial,
                },
            });
        }

        return ['MDO', anoSequencia, projeto.orgao_origem.sigla, sequencial.toString().padStart(4, '0')].join('.');
    }

    async geraProjetoCodigo(id: number, prismaTx: Prisma.TransactionClient): Promise<string | undefined> {
        // buscar o ano baseado em 'selecionado_em'
        const projeto = await prismaTx.projeto.findUniqueOrThrow({
            where: { id },
            select: {
                id: true,
                selecionado_em: true,
                portfolio_id: true,
                orgao_responsavel: {
                    select: {
                        sigla: true,
                    },
                },
                meta: {
                    select: {
                        codigo: true,
                    },
                },
                meta_codigo: true,
                origem_tipo: true,
            },
        });

        if (!projeto.selecionado_em)
            throw new HttpException('Não é possível gerar o código do projeto sem a data em que foi selecionado.', 400);

        if (!projeto.orgao_responsavel)
            throw new HttpException('Não é possível gerar o código do projeto sem um órgão responsável.', 400);

        await prismaTx.$queryRaw`SELECT id FROM portfolio WHERE id = ${projeto.portfolio_id}::int FOR UPDATE`;
        let anoSequencia = DateTime.local({ zone: SYSTEM_TIMEZONE }).year;
        let sequencial = 0;

        const buscaExistente = await prismaTx.projetoNumeroSequencial.findFirst({
            where: {
                projeto_id: id,
            },
        });

        if (buscaExistente) {
            anoSequencia = buscaExistente.ano;
            sequencial = buscaExistente.valor;
            this.logger.debug(
                `Projeto não deve mudar de ano, nem portfolio. Mantendo sequencial e ano anteriores. Mantendo sequencial ${sequencial}`
            );
        } else {
            this.logger.debug(`Gerando novo sequencial para o portfolio ${projeto.portfolio_id} em ${anoSequencia}.`);
            sequencial =
                (await prismaTx.projetoNumeroSequencial.count({
                    where: {
                        portfolio_id: projeto.portfolio_id,
                        ano: anoSequencia,
                    },
                })) + 1;
            this.logger.debug(`=> Registrando sequencial ${sequencial}.`);

            await prismaTx.projetoNumeroSequencial.create({
                data: {
                    projeto_id: projeto.id,
                    portfolio_id: projeto.portfolio_id,
                    ano: anoSequencia,
                    valor: sequencial,
                },
            });
        }

        // não sei se faz sentido ser M quando é outro, mas blz
        let cod_meta = 'M000';

        if (projeto.origem_tipo == 'PdmAntigo') {
            cod_meta = 'M' + (projeto.meta_codigo || '').padStart(3, '0');
        } else if (projeto.origem_tipo == 'PdmSistema' && projeto.meta) {
            cod_meta = 'M' + projeto.meta.codigo.padStart(3, '0');
        }

        return [
            projeto.orgao_responsavel!.sigla,
            DateTime.fromJSDate(projeto.selecionado_em).setZone(SYSTEM_TIMEZONE).year,
            cod_meta,
            sequencial.toString().padStart(3, '0'),
        ].join('.');
    }

    private async upsertPremissas(dto: UpdateProjetoDto, prismaTx: Prisma.TransactionClient, projetoId: number) {
        if (Array.isArray(dto.premissas) == false) return;

        const keepIds: number[] = [];
        for (const premissa of dto.premissas!) {
            if ('id' in premissa && premissa.id) {
                await prismaTx.projetoPremissa.findFirstOrThrow({
                    where: { projeto_id: projetoId, id: premissa.id },
                });
                await prismaTx.projetoPremissa.update({
                    where: { id: premissa.id },
                    data: { premissa: premissa.premissa },
                });
                keepIds.push(premissa.id);
            } else {
                const row = await prismaTx.projetoPremissa.create({
                    data: { premissa: premissa.premissa, projeto_id: projetoId },
                });
                keepIds.push(row.id);
            }
        }
        await prismaTx.projetoPremissa.deleteMany({
            where: { projeto_id: projetoId, id: { notIn: keepIds } },
        });
    }

    private async upsertRestricoes(dto: UpdateProjetoDto, prismaTx: Prisma.TransactionClient, projetoId: number) {
        if (Array.isArray(dto.restricoes) == false) return;

        const keepIds: number[] = [];
        for (const restricao of dto.restricoes!) {
            if ('id' in restricao && restricao.id) {
                await prismaTx.projetoRestricao.findFirstOrThrow({
                    where: { projeto_id: projetoId, id: restricao.id },
                });
                await prismaTx.projetoRestricao.update({
                    where: { id: restricao.id },
                    data: { restricao: restricao.restricao },
                });
                keepIds.push(restricao.id);
            } else {
                const row = await prismaTx.projetoRestricao.create({
                    data: { restricao: restricao.restricao, projeto_id: projetoId },
                });
                keepIds.push(row.id);
            }
        }
        await prismaTx.projetoRestricao.deleteMany({
            where: { projeto_id: projetoId, id: { notIn: keepIds } },
        });
    }

    private async upsertFonteRecurso(
        dto: { fonte_recursos?: PPfonteRecursoDto[] | undefined },
        prismaTx: Prisma.TransactionClient,
        projetoId: number
    ) {
        if (Array.isArray(dto.fonte_recursos) == false) return;

        const byYearFonte: Record<string, Record<string, boolean>> = {};
        const anoCorrente = DateTime.local({ locale: SYSTEM_TIMEZONE }).year;

        for (const fr of dto.fonte_recursos!) {
            let anoLookup = fr.fonte_recurso_ano;

            if (anoLookup > anoCorrente) anoLookup = anoCorrente;

            if (!byYearFonte[anoLookup]) byYearFonte[anoLookup] = {};
            if (!byYearFonte[anoLookup][fr.fonte_recurso_cod_sof])
                byYearFonte[anoLookup][fr.fonte_recurso_cod_sof] = true;
        }

        const resultsFonte: Record<string, Record<string, string>> = {};
        for (const ano in byYearFonte) {
            const codigos = Object.keys(byYearFonte[ano]);
            const rows: {
                codigo: string;
                descricao: string;
            }[] = await this.prisma
                .$queryRaw`select codigo, descricao from sof_entidades_linhas where col = 'fonte_recursos'
            and ano = ${ano}::int
            and codigo = ANY(${codigos}::varchar[])`;
            if (!resultsFonte[ano]) resultsFonte[ano] = {};
            for (const r of rows) {
                resultsFonte[ano][r.codigo] = r.descricao;
            }
        }

        const keepIds: number[] = [];
        for (const fr of dto.fonte_recursos!) {
            const valor_nominal = fr.valor_nominal !== undefined ? fr.valor_nominal : null;
            const valor_percentual = fr.valor_percentual !== undefined ? fr.valor_percentual : null;
            if (valor_nominal == null && valor_percentual == null)
                throw new HttpException('Valor Percentual e Valor Nominal não podem ser ambos nulos', 400);

            let anoLookup = fr.fonte_recurso_ano;
            if (anoLookup > anoCorrente) anoLookup = anoCorrente;

            if (resultsFonte[anoLookup][fr.fonte_recurso_cod_sof] == undefined) {
                throw new HttpException(
                    `Fonte de recurso ${fr.fonte_recurso_cod_sof} não foi encontrada para o ano ${anoLookup} (original ${fr.fonte_recurso_ano}).`,
                    400
                );
            }

            if ('id' in fr && fr.id) {
                await prismaTx.projetoFonteRecurso.findFirstOrThrow({
                    where: { projeto_id: projetoId, id: fr.id },
                });
                await prismaTx.projetoFonteRecurso.update({
                    where: { id: fr.id },
                    data: {
                        fonte_recurso_ano: fr.fonte_recurso_ano,
                        fonte_recurso_cod_sof: fr.fonte_recurso_cod_sof,
                        valor_nominal: valor_nominal,
                        valor_percentual: valor_percentual,
                        atualizado_em: new Date(Date.now()),
                    },
                });
                keepIds.push(fr.id);
            } else {
                const row = await prismaTx.projetoFonteRecurso.create({
                    data: {
                        fonte_recurso_ano: fr.fonte_recurso_ano,
                        fonte_recurso_cod_sof: fr.fonte_recurso_cod_sof,
                        valor_nominal: valor_nominal,
                        valor_percentual: valor_percentual,
                        projeto_id: projetoId,
                    },
                });
                keepIds.push(row.id);
            }
        }
        await prismaTx.projetoFonteRecurso.deleteMany({
            where: { projeto_id: projetoId, id: { notIn: keepIds } },
        });
    }

    async remove(tipo: TipoProjeto, id: number, user: PessoaFromJwt) {
        await this.prisma.projeto.updateMany({
            where: {
                tipo: tipo,
                id: id,
                removido_em: null,
            },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });
        return;
    }

    async append_document(tipo: TipoProjeto, projetoId: number, dto: CreateProjetoDocumentDto, user: PessoaFromJwt) {
        // aqui é feito a verificação se esse usuário pode realmente acessar esse recurso
        await this.findOne(tipo, projetoId, user, 'ReadWriteTeam');

        const arquivoId = this.uploadService.checkUploadOrDownloadToken(dto.upload_token);
        if (dto.diretorio_caminho)
            await this.uploadService.updateDir({ caminho: dto.diretorio_caminho }, dto.upload_token);

        const now = new Date(Date.now());
        const documento = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const arquivo = await prismaTx.arquivo.findFirstOrThrow({
                    where: { id: arquivoId },
                    select: { descricao: true },
                });

                return await prismaTx.projetoDocumento.create({
                    data: {
                        criado_em: now,
                        criado_por: user.id,
                        arquivo_id: arquivoId,
                        projeto_id: projetoId,
                        descricao: dto.descricao ?? arquivo.descricao,
                        data: dto.data,
                    },
                    select: {
                        id: true,
                    },
                });
            }
        );

        return { id: documento.id };
    }

    async list_document(tipo: TipoProjeto, projetoId: number, user: PessoaFromJwt): Promise<ProjetoDocumentoDto[]> {
        // aqui é feito a verificação se esse usuário pode realmente acessar esse recurso
        await this.findOne(tipo, projetoId, user, 'ReadOnly');

        return await this.findAllDocumentos(projetoId);
    }

    private async findAllDocumentos(projetoId: number): Promise<ProjetoDocumentoDto[]> {
        const documentosDB = await this.prisma.projetoDocumento.findMany({
            where: { projeto_id: projetoId, removido_em: null },
            orderBy: [{ descricao: 'asc' }, { data: 'asc' }],
            select: {
                id: true,
                descricao: true,
                data: true,
                arquivo: {
                    select: {
                        id: true,
                        tamanho_bytes: true,
                        descricao: true,
                        nome_original: true,
                        diretorio_caminho: true,
                    },
                },
            },
        });
        const documentosRet: ProjetoDocumentoDto[] = documentosDB.map((d) => {
            return {
                id: d.id,
                data: d.data,
                descricao: d.descricao,
                arquivo: {
                    id: d.arquivo.id,
                    tamanho_bytes: d.arquivo.tamanho_bytes,
                    descricao: d.arquivo.descricao,
                    nome_original: d.arquivo.nome_original,
                    diretorio_caminho: d.arquivo.diretorio_caminho,
                    download_token: this.uploadService.getDownloadToken(d.arquivo.id, '30d').download_token,
                    // prop extra deprecada, copia do nivel acima
                    data: d.data,
                },
            };
        });

        return documentosRet;
    }

    async updateDocumento(
        tipo: TipoProjeto,
        projetoId: number,
        documentoId: number,
        dto: UpdateProjetoDocumentDto,
        user: PessoaFromJwt
    ) {
        this.uploadService.checkUploadOrDownloadToken(dto.upload_token);
        if (dto.diretorio_caminho)
            await this.uploadService.updateDir({ caminho: dto.diretorio_caminho }, dto.upload_token);

        const documento = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                return await prismaTx.projetoDocumento.update({
                    where: {
                        id: documentoId,
                        projeto: { tipo, id: projetoId },
                        projeto_id: projetoId,
                    },
                    data: {
                        descricao: dto.descricao,
                        data: dto.data,
                        atualizado_por: user.id,
                        atualizado_em: new Date(Date.now()),
                    },
                    select: { id: true },
                });
            }
        );

        return { id: documento.id };
    }

    async remove_document(tipo: TipoProjeto, projetoId: number, projetoDocId: number, user: PessoaFromJwt) {
        // aqui é feito a verificação se esse usuário pode realmente acessar esse recurso
        await this.findOne(tipo, projetoId, user, 'ReadWriteTeam');

        await this.prisma.projetoDocumento.updateMany({
            where: { projeto_id: projetoId, removido_em: null, id: projetoDocId },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });
    }

    async cloneTarefas(tipo: TipoProjeto, projetoId: number, dto: CloneProjetoTarefasDto, user: PessoaFromJwt) {
        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            // O true é para indicar que é clone de projeto e não de transferência.
            await prismaTx.$queryRaw`CALL clone_tarefas('true'::boolean, ${dto.projeto_fonte_id}::int, ${projetoId}::int);`;
        });

        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            // Buscando tarefas criadas e disparando calc de topologia.
            const tarefas = await prismaTx.tarefa.findMany({
                where: {
                    tarefa_cronograma: {
                        projeto_id: projetoId,
                        removido_em: null,
                    },
                    removido_em: null,
                },
                select: {
                    id: true,
                    dependencias: {
                        select: {
                            id: true,
                            tarefa_id: true,
                            dependencia_tarefa_id: true,
                            tipo: true,
                            latencia: true,
                        },
                    },
                },
            });

            for (const tarefa of tarefas) {
                let dto: UpdateTarefaDto = {};

                if (tarefa.dependencias.length) {
                    dto = {
                        dependencias: tarefa.dependencias.map((e) => {
                            return {
                                dependencia_tarefa_id: e.dependencia_tarefa_id,
                                tipo: e.tipo,
                                latencia: e.latencia,
                            };
                        }),
                    };

                    await this.tarefaService.update({ projeto_id: projetoId }, tarefa.id, dto, user);
                }
            }
        });
    }

    async transferPortfolio(
        tipo: TipoProjeto,
        projetoId: number,
        dto: TransferProjetoPortfolioDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const projeto = await this.findOne(tipo, projetoId, user, 'ReadWrite');

        const updated = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const portfolioAntigo = projeto.portfolio;

                const portfolioNovo = await prismaTx.portfolio
                    .findFirstOrThrow({
                        where: { id: dto.portfolio_id, removido_em: null },
                        select: {
                            id: true,
                            nivel_maximo_tarefa: true,
                            nivel_regionalizacao: true,
                            orcamento_execucao_disponivel_meses: true,
                            orgaos: {
                                select: { orgao_id: true },
                            },
                        },
                    })
                    .catch(() => {
                        throw new HttpException('portfolio_id| Não foi encontrado', 400);
                    });
                const estaCompartilhado = projeto.portfolios_compartilhados?.some((p) => p.id == dto.portfolio_id);
                if (estaCompartilhado)
                    throw new HttpException(
                        'portfolio_id| Projeto está compartilhado com o Portfolio destino.' +
                            ' Remova primeiro o compartilhamento, e poderá transferir o projeto.',
                        400
                    );

                // Nível de tarefas, do port novo, não pode ser menor.
                if (portfolioNovo.nivel_maximo_tarefa < portfolioAntigo.nivel_maximo_tarefa)
                    throw new HttpException(
                        'portfolio_id| Portfolio novo deve ter nível máximo de tarefa maior ou igual ao portfolio original.',
                        400
                    );

                // Nível de regionalização deve ser igual.
                if (portfolioNovo.nivel_regionalizacao != portfolioAntigo.nivel_regionalizacao)
                    throw new HttpException(
                        'portfolio_id| Portfolio novo deve ter mesmo nível de regionalização.',
                        400
                    );

                // Meses disponíveis para orçamento devem ser iguais.
                if (
                    !assertOrcamentoDisponivelEqual(
                        portfolioNovo.orcamento_execucao_disponivel_meses,
                        portfolioAntigo.orcamento_execucao_disponivel_meses
                    )
                )
                    throw new HttpException(
                        'portfolio_id| Portfolio novo deve ter mesmos meses disponíveis para orçamento.',
                        400
                    );

                // Por agora o órgão gestor não será modificado.
                // Portanto deve ser verificado se ele está presente nos órgãos do novo port.
                if (!portfolioNovo.orgaos.map((o) => o.orgao_id).some((o) => o == projeto.orgao_gestor.id))
                    throw new HttpException('portfolio_id| Órgão gestor do Projeto deve estar no Portfolio novo.', 400);

                await Promise.all([
                    prismaTx.projeto.update({ where: { id: projetoId }, data: { portfolio_id: dto.portfolio_id } }),

                    // Números sequenciais utilizados pelo Projeto
                    prismaTx.projetoNumeroSequencial.updateMany({
                        where: {
                            portfolio_id: portfolioAntigo.id,
                            projeto_id: projetoId,
                        },
                        data: { portfolio_id: portfolioNovo.id },
                    }),

                    // Removendo projeto de grupos de Portfolio.
                    prismaTx.projetoGrupoPortfolio.updateMany({
                        where: { projeto_id: projetoId },
                        data: {
                            removido_em: new Date(Date.now()),
                            removido_por: user.id,
                        },
                    }),
                ]);

                return { id: projeto.id };
            }
        );

        return updated;

        function assertOrcamentoDisponivelEqual(novo: number[], velho: number[]): boolean {
            if (novo.length !== velho.length) {
                return false;
            }

            for (let i = 0; i < novo.length; i++) {
                if (novo[i] !== velho[i]) {
                    return false;
                }
            }

            return true;
        }
    }

    private getProjetoMDOWhereSet(filters: FilterProjetoMDODto) {
        const permissionsBaseSet: Prisma.Enumerable<Prisma.ProjetoWhereInput> = [
            {
                portfolio_id: filters.portfolio_id,
                ProjetoRegiao: filters.regioes
                    ? {
                          some: {
                              removido_em: null,
                              regiao_id: { in: filters.regioes },
                          },
                      }
                    : undefined,
                orgao_origem_id: filters.orgao_origem_id ? { in: filters.orgao_origem_id } : undefined,
                status: filters.status ? { in: filters.status } : undefined,
                nome: filters.nome ? { in: filters.nome } : undefined,
                codigo: filters.codigo ? { in: filters.codigo } : undefined,
                grupo_tematico_id: filters.grupo_tematico_id ? { in: filters.grupo_tematico_id } : undefined,
                tipo_intervencao_id: filters.tipo_intervencao_id ? { in: filters.tipo_intervencao_id } : undefined,
                equipamento_id: filters.equipamento_id ? { in: filters.equipamento_id } : undefined,
                eh_prioritario: filters.eh_prioritario,
                arquivado: filters.arquivado,
                orgao_responsavel_id: filters.orgao_responsavel_id,
            },
        ];
        return permissionsBaseSet;
    }

    private decodeNextPageToken(jwt: string | undefined, filters: FilterProjetoMDODto): AnyPageTokenJwtBody {
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

    private async encodeNextPageToken(
        filters: FilterProjetoMDODto,
        issued_at: Date,
        user: PessoaFromJwt
    ): Promise<{
        jwt: string;
        body: AnyPageTokenJwtBody;
    }> {
        const permissionsSet: Prisma.Enumerable<Prisma.ProjetoWhereInput> = this.getProjetoWhereSet('MDO', user, false);
        const filterSet = this.getProjetoMDOWhereSet(filters);
        const total_rows = await this.prisma.projeto.count({
            where: {
                AND: [...permissionsSet, ...filterSet],
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
        let palavrasChave: number[] | undefined = undefined;
        if (input) {
            const rows: { id: number }[] = await this.prisma
                .$queryRaw`SELECT id FROM projeto WHERE vetores_busca @@ plainto_tsquery('simple', ${input})`;
            palavrasChave = rows.map((row) => row.id);
        }
        return palavrasChave;
    }
}
