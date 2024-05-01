import { BadRequestException, HttpException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CronogramaEtapaService } from 'src/cronograma-etapas/cronograma-etapas.service';
import { UpdateCronogramaEtapaDto } from 'src/cronograma-etapas/dto/update-cronograma-etapa.dto';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { CreateGeoEnderecoReferenciaDto, ReferenciasValidasBase } from '../geo-loc/entities/geo-loc.entity';
import { GeoLocService, UpsertEnderecoDto } from '../geo-loc/geo-loc.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEtapaDto } from './dto/create-etapa.dto';
import { FilterEtapaDto } from './dto/filter-etapa.dto';
import { UpdateEtapaDto } from './dto/update-etapa.dto';
import { Etapa } from './entities/etapa.entity';

const MSG_INI_POSTERIOR_TERM_PREV = 'A data de início previsto não pode ser posterior à data de término previsto.';
const MSG_INI_POSTERIOR_TERM_REAL = 'A data de início real não pode ser posterior à data de término real.';
const MSG_TERM_ANTERIOR_INI_PREV = 'A data de término previsto não pode ser anterior à data de início previsto.';
const MSG_TERM_ANTERIOR_INI_REAL = 'A data de término real não pode ser anterior à data de início real.';

type DadosBaseRegiao = { parente_id: number | null; id: number; nivel: number; descricao: string };
type DadosBaseEtapa = {
    id: number;
    titulo: string;
    nivel_regiao_ok: number;
    geo_loc_count: number;
    regiao_id: number | null;
    etapa_pai_id: number | null;
    numero_irmao_regiao: number;
};

const findRootParent = (
    regionId: number,
    nivel_regionalizacao: number,
    regioesDb: DadosBaseRegiao[]
): DadosBaseRegiao => {
    const region = regioesDb.find((r) => r.id === regionId);
    if (!region) throw new Error(`Região id ${regionId} não foi carregada do banco de dados`);

    // aqui ta ao mesmo tempo variavel, mas como só volta regiões nivel 2 e 3 no
    // retorno do regiosDb, então vai ter problema se o cronograma começar em nivel 1 ou 4
    // ainda pensando no que fazer aqui, se o nivel coloco hardcoded pra 2 já que o nivel das camadas no máximo é 2
    // ou se altero o regioesDb pra carregar o nivel 1, por exemplo, então todo mundo de Sao-Paulo tbm teria que ser de SP
    // mas pode ter basicamente qualquer de qualquer camada (acho que faz sentido)

    console.log('region', region);
    return region.parente_id && region.nivel > nivel_regionalizacao
        ? findRootParent(region.parente_id, nivel_regionalizacao, regioesDb)
        : region;
};

@Injectable()
export class EtapaService {
    private readonly logger = new Logger(EtapaService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly cronogramaEtapaService: CronogramaEtapaService,
        private readonly geolocService: GeoLocService
    ) {}

    async create(cronogramaId: number, dto: CreateEtapaDto, user: PessoaFromJwt) {
        if (!user.hasSomeRoles(['CadastroMeta.inserir'])) {
            // logo, é um tecnico_cp
            // TODO buscar o ID da meta pelo cronograma, pra verificar
        }

        if (dto.inicio_previsto && dto.termino_previsto && dto.inicio_previsto > dto.termino_previsto)
            throw new BadRequestException(MSG_INI_POSTERIOR_TERM_PREV);

        if (dto.inicio_real && dto.termino_real && dto.inicio_real > dto.termino_real)
            throw new BadRequestException(MSG_INI_POSTERIOR_TERM_REAL);

        if (dto.termino_previsto && dto.inicio_previsto && dto.termino_previsto < dto.inicio_previsto)
            throw new BadRequestException(MSG_TERM_ANTERIOR_INI_PREV);

        if (dto.termino_real && dto.inicio_real && dto.termino_real < dto.inicio_real)
            throw new BadRequestException(MSG_TERM_ANTERIOR_INI_REAL);

        const now = new Date(Date.now());
        const created = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                await this.lockCronograma(cronogramaId);

                this.logger.log(`Criando etapa... ${JSON.stringify(dto)}`);

                const etapa = await prismaTx.etapa.create({
                    data: {
                        criado_por: user.id,
                        criado_em: now,
                        cronograma_id: cronogramaId,

                        etapa_pai_id: dto.etapa_pai_id,

                        descricao: dto.descricao,
                        status: dto.status,
                        titulo: dto.titulo,
                        inicio_previsto: dto.inicio_previsto,
                        termino_previsto: dto.termino_previsto,
                        inicio_real: dto.inicio_real,
                        prazo_inicio: dto.prazo_inicio,
                        prazo_termino: dto.prazo_termino,
                        peso: dto.peso,
                        percentual_execucao: dto.percentual_execucao,
                        endereco_obrigatorio: dto.endereco_obrigatorio,
                    },
                    select: { id: true },
                });

                if (Array.isArray(dto.responsaveis))
                    await prismaTx.etapaResponsavel.createMany({
                        data: await this.buildEtapaResponsaveis(etapa.id, dto.responsaveis),
                    });

                const dadosUpsertCronogramaEtapa: UpdateCronogramaEtapaDto = {
                    cronograma_id: cronogramaId,
                    etapa_id: etapa.id,
                    ordem: dto.ordem,
                };
                await this.cronogramaEtapaService.update(dadosUpsertCronogramaEtapa, user, prismaTx);

                if (dto.regiao_id || dto.termino_real || dto.geolocalizacao) {
                    this.logger.log('encaminhando para método de atualização e validações restantes...');
                    await this.update(
                        etapa.id,
                        {
                            regiao_id: dto.regiao_id,
                            termino_real: dto.termino_real,
                            geolocalizacao: dto.geolocalizacao,
                        },
                        user,
                        prismaTx
                    );
                }

                return etapa;
            }
        );

        return created;
    }

    private async lockCronograma(cronogramaId: number) {
        await this.prisma.$queryRaw`SELECT id FROM cronograma WHERE id = ${cronogramaId} FOR UPDATE`;
    }

    async findAll(filters: FilterEtapaDto | undefined = undefined) {
        const ret: Etapa[] = [];

        const etapaPaiId = filters?.etapa_pai_id;
        const regiaoId = filters?.regiao_id;
        const cronogramaId = filters?.cronograma_id;

        const etapas = await this.prisma.etapa.findMany({
            where: {
                etapa_pai_id: etapaPaiId,
                regiao_id: regiaoId,
                cronograma_id: cronogramaId,
                removido_em: null,

                etapa_filha: {
                    some: {
                        cronograma_id: cronogramaId,
                        etapa_filha: {
                            some: {
                                cronograma_id: cronogramaId,
                            },
                        },
                    },
                },
                CronogramaEtapa: {
                    every: {
                        cronograma_id: cronogramaId,
                    },
                },
            },
            include: {
                etapa_filha: {
                    include: {
                        etapa_filha: true,
                    },
                },
                CronogramaEtapa: true,
            },
        });

        const geoDto = new ReferenciasValidasBase();
        geoDto.etapa_id = etapas.map((r) => r.id);
        const geolocalizacao = await this.geolocService.carregaReferencias(geoDto);

        for (const etapa of etapas) {
            const cronograma_etapa = etapa.CronogramaEtapa.filter((r) => {
                return r.cronograma_id === cronogramaId;
            });

            ret.push({
                id: etapa.id,
                etapa_pai_id: etapa.etapa_pai_id,
                regiao_id: etapa.regiao_id,
                cronograma_id: etapa.cronograma_id,
                titulo: etapa.titulo,
                descricao: etapa.descricao,
                nivel: etapa.nivel,
                prazo_inicio: etapa.prazo_inicio,
                prazo_termino: etapa.prazo_termino,
                peso: etapa.peso,
                percentual_execucao: etapa.percentual_execucao,
                n_filhos_imediatos: etapa.n_filhos_imediatos,
                inicio_previsto: etapa.inicio_previsto,
                termino_previsto: etapa.termino_previsto,
                inicio_real: etapa.inicio_real,
                termino_real: etapa.termino_real,
                etapa_filha: etapa.etapa_filha,
                ordem: cronograma_etapa[0].ordem,
                endereco_obrigatorio: etapa.endereco_obrigatorio,
                geolocalizacao: geolocalizacao.get(etapa.id) || [],
            });
        }

        return ret;
    }

    async update(id: number, dto: UpdateEtapaDto, user: PessoaFromJwt, prismaCtx?: Prisma.TransactionClient) {
        const prisma = prismaCtx || this.prisma;

        const basicSelf = await prisma.etapa.findFirstOrThrow({
            where: { id, removido_em: null },
            select: {
                cronograma_id: true,
            },
        });

        if (!prismaCtx) await this.lockCronograma(basicSelf.cronograma_id);

        this.logger.log(`atualizando etapa id=${id}: ${JSON.stringify(dto)}`);
        const responsaveis = dto.responsaveis === null ? [] : dto.responsaveis;
        const geolocalizacao = dto.geolocalizacao;
        delete dto.geolocalizacao;

        const now = prismaCtx ? undefined : new Date(Date.now());
        const createdNow = now || new Date(Date.now());
        const performUpdate = async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
            const self = await prismaTx.etapa.findFirstOrThrow({
                where: { id },
                select: {
                    id: true,
                    n_filhos_imediatos: true,
                    percentual_execucao: true,
                    inicio_previsto: true,
                    inicio_real: true,
                    termino_previsto: true,
                    termino_real: true,
                    endereco_obrigatorio: true,
                    regiao_id: true,
                    etapa_pai: {
                        select: {
                            regiao: { select: { id: true, nivel: true, descricao: true } },
                        },
                    },
                    responsaveis: {
                        select: {
                            pessoa_id: true,
                        },
                        orderBy: { pessoa_id: 'asc' }, // manter esse order-by, se não o cache do updateResponsaveis quebra
                    },
                    GeoLocalizacaoReferencia: {
                        where: { removido_em: null },
                        select: { id: true },
                    },

                    cronograma: {
                        select: { id: true, nivel_regionalizacao: true },
                    },
                },
            });

            let verificaFilhos: boolean = false;
            if (self.etapa_pai?.regiao && 'regiao_id' in dto && dto.regiao_id === undefined) {
                dto.regiao_id = self.etapa_pai.regiao.id;
            } else if (self.etapa_pai?.regiao && 'regiao_id' in dto && dto.regiao_id === null) {
                throw new BadRequestException(
                    'A região da fase/subfase não pode ser removida, utilize o id da região superior.'
                );
            } else if ('regiao_id' in dto && self.etapa_pai && dto.regiao_id !== self.regiao_id) {
                this.logger.debug(`Validando região da etapa ${id} com base na região do pai`);
                if (!self.etapa_pai.regiao)
                    throw new BadRequestException(
                        'A etapa pai não possui região, que é obrigatória para o cadastro dos filhos com região.'
                    );
                // se for uma igual, tudo bem, agora se for uma diferente, precisa ser imediatamente filha
                // do pai
                if (self.etapa_pai.regiao.id !== dto.regiao_id) {
                    const regiaoEhfilha = await prismaTx.regiao.count({
                        where: { id: dto.regiao_id, parente_id: self.etapa_pai.regiao.id },
                    });
                    if (!regiaoEhfilha)
                        throw new BadRequestException(
                            `A região da etapa precisa ser a mesma região ou ser filho imediato da região "${self.etapa_pai.regiao.descricao}"`
                        );
                }
                verificaFilhos = true;
            } else if (dto.regiao_id === null && !self.etapa_pai) {
                verificaFilhos = true;
            } else if ('regiao_id' in dto && dto.regiao_id && !self.etapa_pai) {
                this.logger.debug(`Validando região da etapa ${id} com base no cronograma`);
                // garante para os registros novos que sempre vai ter uma região iniciada com o nível do cronograma
                // aqui sempre entra só no nivel da etapa (não tem pai)

                if (!self.cronograma.nivel_regionalizacao)
                    throw new BadRequestException(
                        'O cronograma não possui nível de regionalização, que é obrigatório para o cadastro de etapas com região.'
                    );

                const regiao = await prismaTx.regiao.findFirstOrThrow({
                    where: { id: dto.regiao_id },
                    select: { nivel: true, descricao: true },
                });
                if (regiao.nivel !== self.cronograma.nivel_regionalizacao)
                    throw new BadRequestException(
                        `A região da etapa precisa ser de nível ${self.cronograma.nivel_regionalizacao}, região enviada: ${regiao.descricao} (nível ${regiao.nivel})`
                    );
                verificaFilhos = true;
            }

            if (verificaFilhos) {
                const etapasFilhas = await prismaTx.etapa.count({
                    where: { etapa_pai_id: id, removido_em: null, regiao_id: { not: null } },
                    select: { id: true, regiao_id: true },
                });
                if (etapasFilhas)
                    throw new BadRequestException(
                        'Não é possível alterar a região de uma etapa/fase que possui filhos com região cadastrada.'
                    );
            }

            if (
                self.n_filhos_imediatos &&
                dto.percentual_execucao &&
                dto.percentual_execucao != self.percentual_execucao
            )
                throw new BadRequestException('Percentual de execução não pode ser enviado pois há dependentes.');

            if (
                self.n_filhos_imediatos &&
                ((dto.inicio_previsto && dto.inicio_previsto.getTime() != self.inicio_previsto?.getTime()) ||
                    (dto.inicio_real && dto.inicio_real.getTime() != self.inicio_real?.getTime()) ||
                    (dto.termino_previsto && dto.termino_previsto.getTime() != self.termino_previsto?.getTime()) ||
                    (dto.termino_real && dto.termino_real.getTime() != self.termino_real?.getTime()))
            )
                throw new BadRequestException('As datas não podem ser modificadas pois existem dependências.');

            const terminoPrevisto: Date | null = dto.termino_previsto ? dto.termino_previsto : self.termino_previsto;
            if (dto.inicio_previsto && terminoPrevisto && dto.inicio_previsto > terminoPrevisto)
                throw new BadRequestException(MSG_INI_POSTERIOR_TERM_PREV);

            const terminoReal: Date | null = dto.termino_real ? dto.termino_real : self.termino_real;
            if (dto.inicio_real && terminoReal && dto.inicio_real > terminoReal)
                throw new BadRequestException(MSG_INI_POSTERIOR_TERM_REAL);

            const inicioPrevisto: Date | null = dto.inicio_previsto ? dto.inicio_previsto : self.inicio_previsto;
            if (dto.termino_previsto && inicioPrevisto && dto.termino_previsto < inicioPrevisto)
                throw new BadRequestException(MSG_TERM_ANTERIOR_INI_PREV);

            const inicioReal: Date | null = dto.inicio_real ? dto.inicio_real : self.inicio_real;
            if (dto.termino_real && inicioReal && dto.termino_real < inicioReal)
                throw new BadRequestException(MSG_TERM_ANTERIOR_INI_REAL);

            const etapaAtualizada = await prismaTx.etapa.update({
                where: { id: id },
                data: {
                    atualizado_por: user.id,
                    atualizado_em: now,

                    regiao_id: dto.regiao_id,
                    descricao: dto.descricao,
                    status: dto.status,
                    titulo: dto.titulo,
                    inicio_previsto: dto.inicio_previsto,
                    termino_previsto: dto.termino_previsto,
                    inicio_real: dto.inicio_real,
                    termino_real: dto.termino_real,
                    prazo_inicio: dto.prazo_inicio,
                    prazo_termino: dto.prazo_termino,
                    peso: dto.peso,
                    percentual_execucao: dto.percentual_execucao,
                    endereco_obrigatorio: dto.endereco_obrigatorio,
                },
                select: {
                    id: true,
                    termino_real: true,
                    endereco_obrigatorio: true,
                    regiao_id: true,
                    titulo: true,
                    regiao: {
                        select: { id: true, descricao: true },
                    },
                    GeoLocalizacaoReferencia: {
                        where: { removido_em: null },
                        select: { id: true },
                    },
                },
            });

            const mudouDeRegiao = etapaAtualizada.regiao_id !== self.regiao_id;

            if (geolocalizacao) {
                this.logger.debug(`Atualizando geolocalização da etapa ${id}`);
                const geoDto = new CreateGeoEnderecoReferenciaDto();
                geoDto.etapa_id = id;
                geoDto.tokens = geolocalizacao;
                geoDto.tipo = 'Endereco';
                const cronoNivelRegiao = self.cronograma.nivel_regionalizacao;

                const regioes = await this.geolocService.upsertGeolocalizacao(geoDto, user, prismaTx, createdNow);

                if (
                    ((regioes.enderecos.length && mudouDeRegiao) || regioes.novos_enderecos.length) &&
                    cronoNivelRegiao &&
                    etapaAtualizada.regiao_id
                ) {
                    this.logger.debug(`Validando região da etapa ${id} com base na geolocalização`);
                    // carrega pois a região não foi alterada
                    const etapasDb = await this.carregaArvoreEtapas(prismaTx, id);

                    // todos os endereços precisam ser compatíveis entre si
                    // ou seja, se um endereço é de um município, todos os outros também precisam ser do mesmo
                    // município ou um filho desse município
                    const idRegioesEnderecos = regioes.enderecos.flatMap((r) => r.regioes).map((r) => r.id);
                    const regioesDb = await this.carregaArvoreRegioes(prismaTx, idRegioesEnderecos);

                    const eraCompativel = await this.validaOuAtualizaRegiaoPeloGeoLoc(
                        regioes,
                        cronoNivelRegiao,
                        regioesDb,
                        etapasDb,
                        prismaTx,
                        etapaAtualizada,
                        createdNow
                    );
                    this.logger.debug(`Região da etapa ${id} validada com base na geolocalização: ${eraCompativel}`);
                } else {
                    this.logger.debug(`Não foi necessário validar a região da etapa ${id} com base na geolocalização`);
                }
            }

            await this.updateResponsaveis(responsaveis, self, prismaTx);

            // apaga tudo por enquanto, não só as que têm algum crono dessa meta
            // isso aqui pq tem q cruzar com atv->ini-> chegar na meta
            await prismaTx.statusMetaCicloFisico.deleteMany();

            const etapaAtualizadaGeo = await prismaTx.etapa.findFirstOrThrow({
                where: { id: id },
                select: {
                    GeoLocalizacaoReferencia: {
                        where: { removido_em: null },
                        select: { id: true },
                    },
                },
            });

            if (
                etapaAtualizada.endereco_obrigatorio &&
                etapaAtualizada.termino_real &&
                etapaAtualizadaGeo.GeoLocalizacaoReferencia.length == 0 &&
                self.GeoLocalizacaoReferencia.length > 0
            )
                throw new HttpException(
                    'Endereços não podem ser removidos, pois a tarefa já foi concluída e o endereço é obrigatório.',
                    400
                );

            // Boolean de controle de endereço:
            // Caso seja true, a etapa só pode receber a data de termino_real
            // Se possuir endereço, ou seja, rows de GeoLocalizacaoReferencia
            if (
                etapaAtualizada.endereco_obrigatorio &&
                etapaAtualizadaGeo.GeoLocalizacaoReferencia.length === 0 &&
                etapaAtualizada.termino_real !== null
            )
                throw new HttpException('Endereço é obrigatório para adicionar a data de término.', 400);

            // Esta func verifica se as rows acima (etapa_pai_id) possuem esse boolean "endereco_obrigatorio"
            // E se está sendo respeitado
            if (dto.termino_real && self.termino_real?.valueOf() !== etapaAtualizada.termino_real?.valueOf()) {
                await this.verificaEtapaEnderecoObrigatorioPais(prismaTx, id, self.cronograma.id);
            }

            return etapaAtualizada;
        };

        if (prismaCtx) {
            await performUpdate(prismaCtx);
        } else {
            await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
                return await performUpdate(prismaTx);
            });
        }

        return { id };
    }

    private async validaOuAtualizaRegiaoPeloGeoLoc(
        regioes: UpsertEnderecoDto,
        cronoNivelRegiao: number,
        regioesDb: DadosBaseRegiao[],
        etapasDb: DadosBaseEtapa[],
        prismaTx: Prisma.TransactionClient,
        etapaAtual: {
            regiao: { id: number; descricao: string } | null;
            id: number;
            titulo: string | null;
            regiao_id: number | null;
            GeoLocalizacaoReferencia: { id: number }[];
        },
        now: Date
    ): Promise<boolean> {
        // creio que não precisamos disso
        // const primeiroRegistro =
        //  etapaAtualizada.GeoLocalizacaoReferencia.length == 0 && geolocalizacao.length > 0;
        const rootParents = regioes.enderecos.map((endereco) => {
            const highestRegionId = endereco.regioes.reduce(
                (minId, regiao) => (regiao.nivel > minId ? regiao.id : minId),
                0
            );
            const root = findRootParent(highestRegionId, cronoNivelRegiao, regioesDb);
            return { root, regioes: endereco.regioes };
        });

        const regioesLevels: string[] = [];
        const isValid = rootParents.every((parent) => {
            const rootInfo = regioesDb.find((r) => r.id === parent.root.id)!;

            const str: string[] = [];
            for (const regiao of parent.regioes) {
                const regiaoInfo = regioesDb.find((r) => r.id === regiao.id)!;
                str.push(`${regiaoInfo.descricao} (nível ${regiaoInfo.nivel})`);
            }
            regioesLevels.push(`${str.join(', ')} -> ${rootInfo.descricao}`);
            return parent.root.id === rootParents[0].root.id;
        });
        if (!isValid) {
            throw new BadRequestException(
                `Endereços não puderam ser adicionados. As regiões dos endereços são incompatíveis: ${regioesLevels.join(', ')}.`
            );
        }

        let enderecoCompativel: boolean = false;
        const dadosEtapa = etapasDb.find((e) => e.id === etapaAtual.id)!;

        // se um dia entrar endereços nivel 5 no smae, mas não existir ainda na parte de camadas
        // ai vai precisar mudar o código do regioesDb, pra carregar a arvore de regiões tanto pra cima,
        // e depois novamente completa arvore pra baixo, semelhante ao que é feito com etapas
        const existeEndereco = regioesDb.find((r) => r.id === dadosEtapa.regiao_id);
        if (existeEndereco) enderecoCompativel = true;
        this.logger.debug(`Endereço compatível: ${enderecoCompativel}`);

        if (!enderecoCompativel) {
            const temFilhas = etapasDb.some((e) => e.etapa_pai_id === etapaAtual.id);
            if (temFilhas) {
                // aqui talvez de pra mudar, se todas as filhas tiver regiao_id==etapaAtual.regiao_id, então
                // considerar que é possível fazer o update
                throw new BadRequestException(
                    `Endereços não puderam ser adicionados. A etapa atual ("${etapaAtual.titulo}" em ${etapaAtual.regiao?.descricao}) tem sub-etapas e os endereços não são compatíveis.`
                );
            }

            const comGeoLoc = etapasDb.filter((e) => e.geo_loc_count > 0 && e.id !== etapaAtual.id);
            if (comGeoLoc.length) {
                const incompativeis = comGeoLoc.map((e) => e.titulo).join(', ');

                throw new BadRequestException(
                    `Endereços não puderam ser adicionados. Já existem endereços incompatíveis na mesma hierarquia (${incompativeis}). Por favor, revise e tente novamente.`
                );
            }

            const msgErro: string[] = [];
            let podeAtualizar: boolean = true;

            const recurRoot = (etapaId: number): void => {
                const etapa = etapasDb.find((e) => e.id === etapaId);
                if (!etapa) throw new Error(`Etapa id ${etapaId} não foi carregada do banco de dados`);

                if (etapa.numero_irmao_regiao > 0) {
                    podeAtualizar = false;
                    if (etapa.numero_irmao_regiao == 1) {
                        msgErro.push(`Etapa "${etapa.titulo}" já tem 1 irmão com região`);
                    } else {
                        msgErro.push(`Etapa "${etapa.titulo}" já têm ${etapa.numero_irmao_regiao} irmãos com região`);
                    }
                    return;
                }

                if (etapa.etapa_pai_id) recurRoot(etapa.etapa_pai_id);

                return;
            };

            recurRoot(etapaAtual.id);

            if (!podeAtualizar) {
                throw new BadRequestException(`Endereços não puderam ser adicionados. ${msgErro.join('. ')}`);
            }

            const comRegiao = etapasDb.filter((e) => e.regiao_id !== null);
            for (const etapa of comRegiao) {
                const regiaoInfo = regioesDb.find((r) => r.nivel == etapa.nivel_regiao_ok);
                if (!regiaoInfo)
                    throw new Error(
                        `Região com nível ${etapa.nivel_regiao_ok} não foi encontrada com base na geolocalização`
                    );

                await prismaTx.etapa.update({
                    where: { id: etapa.id },
                    data: {
                        regiao_id: regiaoInfo.id,
                        atualizado_em: now,
                    },
                });
            }
        }

        return enderecoCompativel;
    }

    private async carregaArvoreEtapas(prismaTx: Prisma.TransactionClient, idEtapa: number): Promise<DadosBaseEtapa[]> {
        return await prismaTx.$queryRaw`
        WITH t AS (
            WITH RECURSIVE root_parent AS (
                WITH RECURSIVE etapa_path AS (
                    SELECT id, etapa_pai_id
                    FROM etapa m
                    WHERE m.id = ${idEtapa}::int
                    AND m.removido_em IS NULL
                    UNION ALL
                    SELECT t.id, t.etapa_pai_id
                    FROM etapa t
                    JOIN etapa_path tp ON tp.etapa_pai_id = t.id
                    AND t.removido_em IS NULL
                )
                SELECT id
                FROM etapa_path
                WHERE etapa_pai_id IS NULL
            ),
            etapa_children AS (
                SELECT id, etapa_pai_id, 0::int AS depth
                FROM etapa m
                WHERE m.id IN (SELECT id FROM root_parent)
                AND m.removido_em IS NULL
                UNION ALL
                SELECT t.id, t.etapa_pai_id, tp.depth + 1
                FROM etapa t
                JOIN etapa_children tp ON tp.id = t.etapa_pai_id
                AND t.removido_em IS NULL
            )
            SELECT
              ec.id,
              c.nivel_regionalizacao + ec.depth as nivel_regiao_ok,
              e.titulo,
              e.regiao_id,
              e.etapa_pai_id,
              count(gf.id) as geo_loc_count
            FROM etapa_children ec
            JOIN etapa e ON e.id = ec.id AND e.removido_em IS NULL
            JOIN cronograma c ON c.id = e.cronograma_id AND c.removido_em IS NULL
            LEFT JOIN geo_localizacao_referencia gf ON gf.etapa_id = e.id AND gf.removido_em IS NULL
            GROUP BY 1,2,3,4,5
        ),
        numero_irmao_regiao AS (
            SELECT
                t.etapa_pai_id,
                count(1)
            FROM t
            WHERE t.regiao_id IS NOT NULL
            GROUP BY 1
        )
        SELECT
            t.*,
            coalesce(n.count - 1, 0) as numero_irmao_regiao
        FROM t
        LEFT JOIN numero_irmao_regiao n ON n.etapa_pai_id = t.etapa_pai_id
    `;
    }

    private async carregaArvoreRegioes(
        prismaTx: Prisma.TransactionClient,
        idRegioesEnderecos: number[]
    ): Promise<DadosBaseRegiao[]> {
        return await prismaTx.$queryRaw`
            WITH RECURSIVE regiao_path AS (
                SELECT id, parente_id
                FROM regiao m
                WHERE m.id = ANY(${idRegioesEnderecos}::integer[])
                AND m.removido_em IS NULL
                UNION ALL
                SELECT t.id, t.parente_id
                FROM regiao t
                JOIN regiao_path tp ON tp.parente_id = t.id
                AND t.removido_em IS NULL
            ), dados AS (
                SELECT
                    id,
                    parente_id,
                    nivel,
                    descricao
                FROM regiao
                WHERE id IN (SELECT id FROM regiao_path)
            )
            SELECT *
            FROM dados`;
    }

    private async verificaEtapaEnderecoObrigatorioPais(
        prismaTx: Prisma.TransactionClient,
        id: number,
        cronograma_id: number
    ) {
        this.logger.debug(`verificando se etapa ${id} tem endereço obrigatório`);
        const paisComPendencias: { assert_geoloc_rule: string }[] =
            await prismaTx.$queryRaw`SELECT CAST(assert_geoloc_rule(${id}::integer, ${cronograma_id}::integer) AS VARCHAR)`;
        console.log(paisComPendencias);
        if (paisComPendencias[0].assert_geoloc_rule && paisComPendencias[0].assert_geoloc_rule !== null) {
            const pendentesStr = paisComPendencias[0].assert_geoloc_rule.slice(1, -1);
            const pendentes = pendentesStr.split(',').filter((e) => e.length > 1);

            if (pendentes.length > 0)
                throw new BadRequestException(
                    `Para que esta etapa seja finalizada, as seguintes etapas precisam ter o endereço preenchido: ${pendentes.join(',')}`
                );
        }
    }

    private async updateResponsaveis(
        responsaveis: number[] | undefined,
        etapa: {
            id: number;
            responsaveis: { pessoa_id: number }[];
        },
        prismaTx: Prisma.TransactionClient
    ) {
        if (Array.isArray(responsaveis)) {
            const currentVersion = etapa.responsaveis.map((r) => r.pessoa_id).join(',');
            const newVersionStr = responsaveis.sort((a, b) => a - b).join(',');

            if (currentVersion !== newVersionStr) {
                this.logger.debug(`responsaveis mudaram: old ${currentVersion} !== new ${newVersionStr}`);
                const promises = [];
                for (const responsavel of responsaveis) {
                    promises.push(
                        prismaTx.etapaResponsavel.upsert({
                            where: {
                                etapa_pessoa_uniq: {
                                    pessoa_id: responsavel,
                                    etapa_id: etapa.id,
                                },
                            },
                            create: {
                                pessoa_id: responsavel,
                                etapa_id: etapa.id,
                            },
                            update: {},
                        })
                    );
                }
                await Promise.all(promises);
            } else {
                this.logger.debug(
                    `responsaveis continuam iguais, o banco não será chamado para evitar o recálculo do trigger`
                );
            }
        }
    }

    async remove(id: number, user: PessoaFromJwt) {
        const etapa_has_children = await this.prisma.etapa.count({ where: { etapa_pai_id: id, removido_em: null } });
        if (etapa_has_children) throw new HttpException('Apague primeiro os filhos', 400);

        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            await prismaTx.etapa.updateMany({
                where: { id: id },
                data: {
                    removido_por: user.id,
                    removido_em: new Date(Date.now()),
                },
            });

            const cronogramas = await prismaTx.cronogramaEtapa.findMany({
                where: { etapa_id: id },
                select: { id: true },
            });

            for (const cronograma of cronogramas) {
                await this.cronogramaEtapaService.delete(cronograma.id, user);
            }
        });
    }

    async buildEtapaResponsaveis(
        etapaId: number,
        responsaveis: number[]
    ): Promise<Prisma.EtapaResponsavelCreateManyInput[]> {
        const arr: Prisma.EtapaResponsavelCreateManyInput[] = [];
        for (const pessoaId of responsaveis) {
            arr.push({
                etapa_id: etapaId,
                pessoa_id: pessoaId,
            });
        }
        return arr;
    }
}
