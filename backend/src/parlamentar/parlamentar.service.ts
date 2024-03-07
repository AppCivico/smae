import { HttpException, Injectable } from '@nestjs/common';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { PrismaService } from '../prisma/prisma.service';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import {
    CreateMandatoDto,
    CreateParlamentarDto,
    CreateMandatoRepresentatividadeDto,
    CreateMandatoSuplenteDto,
    CreateEquipeDto,
} from './dto/create-parlamentar.dto';
import { DadosEleicaoNivel, ParlamentarEquipeTipo, Prisma } from '@prisma/client';
import { ParlamentarDetailDto, ParlamentarDto } from './entities/parlamentar.entity';
import {
    UpdateEquipeDto,
    UpdateMandatoDto,
    UpdateParlamentarDto,
    UpdateRepresentatividadeDto,
} from './dto/update-parlamentar.dto';
import { RemoveMandatoDepsDto } from './dto/remove-mandato-deps.dto';
import { UploadService } from 'src/upload/upload.service';

@Injectable()
export class ParlamentarService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly uploadService: UploadService
    ) {}

    async create(dto: CreateParlamentarDto, user: PessoaFromJwt): Promise<RecordWithId> {
        let uploadId: number | null = null;
        if (dto.upload_foto) {
            uploadId = this.uploadService.checkUploadOrDownloadToken(dto.upload_foto);
        }
        delete dto.upload_foto;

        if (dto.telefone && !user.hasSomeRoles(['SMAE.acesso_telefone']))
            throw new HttpException('Usuário sem permissão para cadastro de telefone', 400);

        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const parlamentar = await prismaTxn.parlamentar.create({
                    data: {
                        ...dto,
                        foto_upload_id: uploadId,
                        criado_por: user ? user.id : undefined,
                        criado_em: new Date(Date.now()),
                    },
                    select: { id: true },
                });

                return parlamentar;
            }
        );

        return created;
    }

    async findAll(): Promise<ParlamentarDto[]> {
        const listActive = await this.prisma.parlamentar.findMany({
            where: {
                // TODO: filtros.
                removido_em: null,
            },
            select: {
                id: true,
                nome: true,
                nome_popular: true,
                em_atividade: true,

                mandatos: {
                    where: {
                        removido_em: null,
                        eleicao: { atual_para_mandatos: true },
                    },
                    take: 1,
                    select: {
                        cargo: true,
                        partido_atual: {
                            select: {
                                id: true,
                                nome: true,
                                sigla: true,
                                numero: true,
                            },
                        },
                    },
                },
            },
            orderBy: [{ nome: 'asc' }],
        });

        return listActive.map((p) => {
            return {
                ...p,

                cargo: p.mandatos.length > 0 ? p.mandatos[0].cargo : null,
                partido:
                    p.mandatos.length > 0 && p.mandatos[0].partido_atual ? { ...p.mandatos[0].partido_atual } : null,
            };
        });
    }

    async findOne(id: number, user: PessoaFromJwt): Promise<ParlamentarDetailDto> {
        const parlamentar = await this.prisma.parlamentar.findUniqueOrThrow({
            where: {
                id: id,
            },
            select: {
                id: true,
                nome: true,
                nome_popular: true,
                nascimento: true,
                email: true,
                telefone: true,
                em_atividade: true,
                foto_upload_id: true,

                equipe: {
                    where: { removido_em: null },
                    select: {
                        id: true,
                        mandato_id: true,
                        email: true,
                        nome: true,
                        telefone: true,
                        tipo: true,
                    },
                },

                mandatos: {
                    where: { removido_em: null },
                    select: {
                        id: true,
                        gabinete: true,
                        eleito: true,
                        cargo: true,
                        biografia: true,
                        atuacao: true,
                        uf: true,
                        suplencia: true,
                        endereco: true,
                        votos_estado: true,
                        votos_capital: true,
                        votos_interior: true,

                        eleicao: {
                            select: {
                                id: true,
                                ano: true,
                                atual_para_mandatos: true,
                                tipo: true,
                            },
                        },

                        partido_atual: {
                            select: {
                                id: true,
                                nome: true,
                                sigla: true,
                                numero: true,
                            },
                        },

                        partido_candidatura: {
                            select: {
                                id: true,
                                nome: true,
                                sigla: true,
                                numero: true,
                            },
                        },

                        suplentes: {
                            where: { removido_em: null },
                            select: {
                                id: true,
                                suplencia: true,
                                parlamentar: {
                                    select: {
                                        id: true,
                                        nome: true,
                                    },
                                },
                            },
                        },

                        representatividade: {
                            where: { removido_em: null },
                            select: {
                                id: true,
                                nivel: true,
                                municipio_tipo: true,
                                numero_votos: true,
                                pct_participacao: true,

                                regiao: {
                                    select: {
                                        id: true,
                                        nivel: true,
                                        codigo: true,

                                        eleicoesComparecimento: {
                                            where: { removido_em: null },
                                            take: 1,
                                            select: {
                                                id: true,
                                                valor: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        const mandatoCorrente = parlamentar.mandatos.find((m) => m.eleicao.atual_para_mandatos == true);

        return {
            ...parlamentar,
            nascimento: parlamentar.nascimento?.toISOString().split('T')[0],
            foto: parlamentar.foto_upload_id
                ? this.uploadService.getDownloadToken(parlamentar.foto_upload_id, '1 days').download_token
                : null,
            telefone: !user.hasSomeRoles(['SMAE.acesso_telefone']) ? parlamentar.telefone : null,

            mandato_atual: mandatoCorrente
                ? {
                      ...mandatoCorrente,

                      suplentes: mandatoCorrente.suplentes.map((s) => {
                          return { ...s.parlamentar };
                      }),

                      representatividade: mandatoCorrente.representatividade.map((r) => {
                          return {
                              ...r,

                              regiao: {
                                  ...r.regiao,
                                  comparecimento: { ...r.regiao.eleicoesComparecimento[0] },
                              },
                          };
                      }),
                  }
                : null,

            mandatos: parlamentar.mandatos.map((m) => {
                return {
                    ...m,

                    suplentes: m.suplentes.map((s) => {
                        return { ...s.parlamentar };
                    }),

                    representatividade: m.representatividade.map((r) => {
                        return {
                            ...r,

                            regiao: {
                                ...r.regiao,
                                comparecimento: { ...r.regiao.eleicoesComparecimento[0] },
                            },
                        };
                    }),
                };
            }),
        };
    }

    async update(id: number, dto: UpdateParlamentarDto, user: PessoaFromJwt): Promise<RecordWithId> {
        if (dto.telefone && !user.hasSomeRoles(['SMAE.acesso_telefone']))
            throw new HttpException('Usuário sem permissão para edição de telefone', 400);

        const updated = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const parlamentar = await prismaTxn.parlamentar.update({
                    where: { id: id },
                    data: {
                        atualizado_por: user.id,
                        atualizado_em: new Date(Date.now()),
                        ...dto,
                    },
                });

                return parlamentar;
            }
        );

        return updated;
    }

    async remove(id: number, user: PessoaFromJwt) {
        // TODO verificar dependentes

        const deleted = await this.prisma.parlamentar.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });

        return deleted;
    }

    async createEquipe(parlamentarId: number, dto: CreateEquipeDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const parlamentar = await this.prisma.parlamentar.count({
            where: { id: parlamentarId, removido_em: null },
        });
        if (!parlamentar) throw new HttpException('parlamentar_id| Parlamentar inválido.', 400);

        if (dto.mandato_id != undefined) {
            const mandato = await this.prisma.parlamentarMandato.count({
                where: { id: dto.mandato_id, parlamentar_id: parlamentarId, removido_em: null },
            });
            if (!mandato) throw new HttpException('mandato_id| Mandato inválido.', 400);
        }

        if (dto.tipo == ParlamentarEquipeTipo.Contato && !dto.mandato_id)
            throw new HttpException('tipo| Contato precisa receber ser relacionado ao mandato.', 400);

        if (dto.tipo == ParlamentarEquipeTipo.Assessor && dto.mandato_id != undefined) dto.mandato_id = undefined;

        const created = await this.prisma.parlamentarEquipe.create({
            data: {
                ...dto,
                parlamentar_id: parlamentarId,
                criado_por: user ? user.id : undefined,
                criado_em: new Date(Date.now()),
            },
            select: { id: true },
        });

        return created;
    }

    async updateEquipe(id: number, dto: UpdateEquipeDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const membroEquipe = await this.prisma.parlamentarEquipe.count({
            where: { id, removido_em: null },
        });
        if (!membroEquipe) throw new HttpException('id| membro de equipe inválido.', 400);

        await this.prisma.parlamentarEquipe.update({
            where: { id },
            data: {
                ...dto,
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
            },
        });

        return { id };
    }

    async removeEquipe(id: number, user: PessoaFromJwt) {
        await this.prisma.parlamentarEquipe.update({
            where: { id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });
    }

    async createMandato(parlamentarId: number, dto: CreateMandatoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const mandatoExists = await this.prisma.parlamentarMandato.count({
            where: {
                parlamentar_id: parlamentarId,
                eleicao_id: dto.eleicao_id,
                removido_em: null,
            },
        });
        if (mandatoExists) throw new HttpException('eleicao_id| Parlamentar já possui mandato para esta eleição', 400);

        const partidoCandidaturaExists = await this.prisma.partido.count({
            where: { id: dto.partido_candidatura_id, removido_em: null },
        });
        if (!partidoCandidaturaExists)
            throw new HttpException('partido_candidatura_id| Partido de candidatura inválido', 400);

        const partidoAtualExists = await this.prisma.partido.count({
            where: { id: dto.partido_atual_id, removido_em: null },
        });
        if (!partidoAtualExists) throw new HttpException('partido_atual_id| Partido atual inválido', 400);

        if ((dto.suplencia && !dto.mandato_principal_id) || (!dto.suplencia && dto.mandato_principal_id))
            throw new HttpException(
                'Para mandatos de suplentes, deve ser informado o grau de suplência e o mandato principal',
                400
            );

        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const mandato = await prismaTxn.parlamentarMandato.create({
                    data: {
                        parlamentar_id: parlamentarId,
                        ...dto,
                        criado_por: user ? user.id : undefined,
                        criado_em: new Date(Date.now()),
                    },
                    select: { id: true },
                });

                return mandato;
            }
        );

        return created;
    }

    async updateMandato(id: number, dto: UpdateMandatoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const self = await this.prisma.parlamentarMandato.findFirstOrThrow({
            where: { id },
        });

        if (dto.partido_atual_id && self.partido_atual_id != dto.partido_atual_id) {
            const partidoCandidaturaExists = await this.prisma.partido.count({
                where: { id: dto.partido_candidatura_id, removido_em: null },
            });
            if (!partidoCandidaturaExists)
                throw new HttpException('partido_candidatura_id| Partido de candidatura inválido', 400);
        }

        if (dto.partido_candidatura_id && self.partido_candidatura_id != dto.partido_candidatura_id) {
            const partidoAtualExists = await this.prisma.partido.count({
                where: { id: dto.partido_atual_id, removido_em: null },
            });
            if (!partidoAtualExists) throw new HttpException('partido_atual_id| Partido atual inválido', 400);
        }

        await this.prisma.parlamentarMandato.update({
            where: { id },
            data: {
                ...dto,
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
            },
        });

        return { id };
    }

    async removeMandato(id: number, user: PessoaFromJwt) {
        return await this.prisma.parlamentarMandato.update({
            where: { id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });
    }

    async createMandatoRepresentatividade(
        parlamentarId: number,
        dto: CreateMandatoRepresentatividadeDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const mandato = await this.prisma.parlamentarMandato.findFirst({
            where: {
                id: dto.mandato_id,
                parlamentar_id: parlamentarId,
                removido_em: null,
            },
        });
        if (!mandato) throw new HttpException('mandato_id| Não foi possível encontrar este mandato', 404);

        if (dto.nivel == DadosEleicaoNivel.Estado && dto.municipio_tipo != undefined)
            throw new HttpException('municipio_tipo| Não deve ser enviado para eleição de nível estadual.', 400);

        if (dto.nivel !== DadosEleicaoNivel.Estado && !dto.municipio_tipo)
            throw new HttpException('municipio_tipo| Deve ser informado para nível.', 400);

        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                let dadosEleicao = await prismaTxn.eleicaoComparecimento.findFirst({
                    where: {
                        eleicao_id: mandato.eleicao_id,
                        regiao_id: dto.regiao_id,
                        removido_em: null,
                    },
                    select: {id: true, valor: true}
                });

                if (!dadosEleicao) {
                    if (dto.numero_comparecimento == undefined)
                        throw new HttpException('numero_comparecimento| Precisa ser enviado', 400);

                    const regiao = await prismaTxn.regiao.findFirstOrThrow({
                        where: { id: dto.regiao_id, removido_em: null },
                        select: { nivel: true },
                    });

                    let nivelDadoEleicao: DadosEleicaoNivel;

                    if (regiao.nivel == 1) {
                        nivelDadoEleicao = DadosEleicaoNivel.Municipio;
                    } else if (regiao.nivel == 3) {
                        nivelDadoEleicao = DadosEleicaoNivel.Subprefeitura;
                    } else {
                        throw new HttpException('regiao_id| Faltando tratamento para nível de região', 400);
                    }

                    dadosEleicao = await prismaTxn.eleicaoComparecimento.create({
                        data: {
                            eleicao_id: mandato.eleicao_id,
                            regiao_id: dto.regiao_id,
                            nivel: nivelDadoEleicao,
                            valor: dto.numero_comparecimento,
                        },
                    });

                    delete dto.numero_comparecimento;
                } else {
                    if (dto.numero_comparecimento != undefined && dto.numero_comparecimento != dadosEleicao.valor) {
                        dadosEleicao = await prismaTxn.eleicaoComparecimento.update({
                            where: { id: dadosEleicao.id },
                            data: { valor: dto.numero_comparecimento }
                        })
                    }
                }

                let pct_participacao: number | null = dto.pct_valor ? dto.pct_valor : null;
                if (dadosEleicao && !dto.pct_valor) {
                    pct_participacao = (dto.numero_votos / dadosEleicao.valor) * 100;
                }

                const representatividade = await prismaTxn.mandatoRepresentatividade.create({
                    data: {
                        pct_participacao: pct_participacao,
                        ...dto,
                        criado_por: user ? user.id : undefined,
                        criado_em: new Date(Date.now()),
                    },
                    select: { id: true },
                });

                return representatividade;
            }
        );

        return created;
    }

    async updateMandatoRepresentatividade(
        representatividadeId: number,
        dto: UpdateRepresentatividadeDto,
        user: PessoaFromJwt
    ) {
        const updated = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const representatividade = await prismaTxn.mandatoRepresentatividade.update({
                    where: { id: representatividadeId },
                    data: {
                        ...dto,
                        // TODO? calc baseado em comparecimento
                        atualizado_por: user ? user.id : undefined,
                        atualizado_em: new Date(Date.now()),
                    },
                    select: { id: true },
                });

                return representatividade;
            }
        );

        return updated;
    }

    async removeMandatoRepresentatividade(
        representatividadeId: number,
        dto: RemoveMandatoDepsDto,
        user: PessoaFromJwt
    ) {
        return await this.prisma.mandatoRepresentatividade.updateMany({
            where: {
                id: representatividadeId,
                mandato_id: dto.mandato_id,
            },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });
    }

    async createSuplente(
        parlamentarId: number,
        dto: CreateMandatoSuplenteDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const mandatoPrincipal = await this.prisma.parlamentarMandato.findFirst({
            where: {
                id: dto.mandato_id,
                parlamentar_id: parlamentarId,
                removido_em: null,
                mandato_principal_id: null,
            },
            select: {
                id: true,
            },
        });
        if (!mandatoPrincipal) throw new HttpException('mandato_id| Mandato principal inválido', 400);

        const mandatoSuplente = await this.prisma.parlamentarMandato.findFirst({
            where: {
                id: dto.mandato_suplente_id,
                removido_em: null,
            },
            select: {
                id: true,
                mandato_principal_id: true,
                suplencia: true,
            },
        });
        if (!mandatoSuplente) throw new HttpException('mandato_id| Mandato suplente não encontrado', 400);

        if (mandatoSuplente.mandato_principal_id && mandatoSuplente.mandato_principal_id != dto.mandato_id)
            throw new HttpException(
                'mandato_suplente_id| Mandato suplente já é suplente de outro mandato distinto',
                400
            );

        if (!mandatoSuplente.suplencia && !dto.suplencia)
            throw new HttpException('suplencia| Grau de suplente deve ser informado', 400);

        await this.prisma.parlamentarMandato.updateMany({
            where: {
                id: mandatoSuplente.id,
            },
            data: {
                suplencia: dto.suplencia,
                mandato_principal_id: dto.mandato_id,
            },
        });

        return { id: mandatoSuplente.id };
    }

    async removeSuplente(mandatoSuplenteId: number, dto: RemoveMandatoDepsDto, user: PessoaFromJwt) {
        return await this.prisma.parlamentarMandato.updateMany({
            where: {
                id: mandatoSuplenteId,
                mandato_principal_id: dto.mandato_id,
            },
            data: {
                mandato_principal_id: null,
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
            },
        });
    }
}
