import { BadRequestException, HttpException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CronogramaEtapaService } from 'src/cronograma-etapas/cronograma-etapas.service';
import { UpdateCronogramaEtapaDto } from 'src/cronograma-etapas/dto/update-cronograma-etapa.dto';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { CreateGeoEnderecoReferenciaDto, ReferenciasValidasBase } from '../geo-loc/entities/geo-loc.entity';
import { GeoLocService } from '../geo-loc/geo-loc.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEtapaDto } from './dto/create-etapa.dto';
import { FilterEtapaDto } from './dto/filter-etapa.dto';
import { UpdateEtapaDto } from './dto/update-etapa.dto';
import { Etapa } from './entities/etapa.entity';

const MSG_INI_POSTERIOR_TERM_PREV = 'A data de início previsto não pode ser posterior à data de término previsto.';
const MSG_INI_POSTERIOR_TERM_REAL = 'A data de início real não pode ser posterior à data de término real.';
const MSG_TERM_ANTERIOR_INI_PREV = 'A data de término previsto não pode ser anterior à data de início previsto.';
const MSG_TERM_ANTERIOR_INI_REAL = 'A data de término real não pode ser anterior à data de início real.';

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

            if (self.etapa_pai?.regiao && 'regiao_id' in dto && dto.regiao_id === undefined) {
                dto.regiao_id = self.etapa_pai.regiao.id;
            } else if (self.etapa_pai && dto.regiao_id && dto.regiao_id !== self.regiao_id) {
                if (!self.etapa_pai.regiao)
                    throw new BadRequestException(
                        'A etapa pai não possui região, que é obrigatória para o cadastro dos filhos.'
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
            } else if (dto.regiao_id && !self.etapa_pai?.regiao) {
                // garante para os registros novos que sempre vai ter uma região iniciada com o nível do cronograma

                if (!self.cronograma.nivel_regionalizacao)
                    throw new BadRequestException('O cronograma não possui nível de regionalização');

                const regiao = await prismaTx.regiao.findFirstOrThrow({
                    where: { id: dto.regiao_id },
                    select: { nivel: true, descricao: true },
                });
                if (regiao.nivel < self.cronograma.nivel_regionalizacao)
                    throw new BadRequestException(
                        `A região da etapa precisa ser de nível ${self.cronograma.nivel_regionalizacao} ou superior, região atual: ${regiao.descricao} (nível ${regiao.nivel})`
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

            if (geolocalizacao) {
                const geoDto = new CreateGeoEnderecoReferenciaDto();
                geoDto.etapa_id = id;
                geoDto.tokens = geolocalizacao;
                geoDto.tipo = 'Endereco';

                const regioes = await this.geolocService.upsertGeolocalizacao(geoDto, user, prismaTx, createdNow);
                console.log(regioes);
            }

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
                    GeoLocalizacaoReferencia: {
                        where: { removido_em: null },
                        select: { id: true },
                    },
                },
            });

            await this.updateResponsaveis(responsaveis, self, prismaTx);

            // apaga tudo por enquanto, não só as que têm algum crono dessa meta
            // isso aqui pq tem q cruzar com atv->ini-> chegar na meta
            await prismaTx.statusMetaCicloFisico.deleteMany();

            if (
                etapaAtualizada.endereco_obrigatorio &&
                etapaAtualizada.termino_real &&
                etapaAtualizada.GeoLocalizacaoReferencia.length == 0 &&
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
                etapaAtualizada.GeoLocalizacaoReferencia.length === 0 &&
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
