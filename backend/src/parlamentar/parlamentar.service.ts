import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DadosEleicaoNivel, ParlamentarCargo, Prisma } from '@prisma/client';
import { PaginatedDto, PAGINATION_TOKEN_TTL } from 'src/common/dto/paginated.dto';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { UploadService } from 'src/upload/upload.service';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { PrismaHelpers } from '../common/PrismaHelpers';
import { Date2YMD } from '../common/date2ymd';
import { MAX_DB_SAFE_INT32 } from '../common/dto/consts';
import { HtmlSanitizer } from '../common/html-sanitizer';
import { PrismaService } from '../prisma/prisma.service';
import {
    CreateEquipeDto,
    CreateMandatoDto,
    CreateMandatoRepresentatividadeDto,
    CreateMandatoSuplenteDto,
    CreateParlamentarDto,
} from './dto/create-parlamentar.dto';
import { FilterParlamentarDto } from './dto/filter-parlamentar.dto';
import {
    UpdateEquipeDto,
    UpdateMandatoDto,
    UpdateParlamentarDto,
    UpdateRepresentatividadeDto,
} from './dto/update-parlamentar.dto';
import { ParlamentarDetailDto, ParlamentarDto } from './entities/parlamentar.entity';
import {
    EleicaoComparecimentoDto,
    GetEleicaoComparecimentoDto,
    ComparecimentoConflictResponseDto,
} from './dto/eleicao-comparecimento.dto';
import { UniqueNumbers } from '../common/UniqueNumbers';

class NextPageTokenJwtBody {
    offset: number;
    ipp: number;
}

@Injectable()
export class ParlamentarService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly uploadService: UploadService,
        private readonly jwtService: JwtService
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
                const cpfExists = await prismaTxn.parlamentar.count({
                    where: { cpf: dto.cpf, removido_em: null },
                });
                if (cpfExists) throw new HttpException('CPF já cadastrado.', 400);

                const parlamentar = await prismaTxn.parlamentar.create({
                    data: {
                        nome: dto.nome,
                        nome_popular: dto.nome_popular,
                        nascimento: dto.nascimento,
                        telefone: dto.telefone,
                        email: dto.email,
                        em_atividade: dto.em_atividade,
                        cpf: dto.cpf,
                        foto_upload_id: uploadId,
                        criado_por: user ? user.id : undefined,
                        criado_em: new Date(Date.now()),
                    },
                    select: { id: true },
                });

                return parlamentar;
            },
            { isolationLevel: 'Serializable' }
        );

        return created;
    }

    private decodeNextPageToken(jwt: string | undefined): NextPageTokenJwtBody | null {
        let tmp: NextPageTokenJwtBody | null = null;
        try {
            if (jwt) tmp = this.jwtService.verify(jwt) as NextPageTokenJwtBody;
        } catch {
            throw new HttpException('Param next_page_token is invalid', 400);
        }
        return tmp;
    }

    private encodeNextPageToken(opt: NextPageTokenJwtBody): string {
        return this.jwtService.sign(opt);
    }

    async findAll(filters: FilterParlamentarDto, user: PessoaFromJwt): Promise<PaginatedDto<ParlamentarDto>> {
        let filterSuplente:
            | {
                  cargo: ParlamentarCargo;
                  eleicao_id: number;
                  mandato_principal_id: null;
                  NOT: { parlamentar_id: number };
              }
            | undefined;

        if (filters != undefined && filters.disponivel_para_suplente_parlamentar_id) {
            const mandatoPrincipal = await this.prisma.parlamentarMandato.findFirst({
                where: {
                    parlamentar: {
                        id: filters.disponivel_para_suplente_parlamentar_id,
                        removido_em: null,
                    },
                    removido_em: null,
                },
                select: {
                    cargo: true,
                    eleicao_id: true,
                },
            });

            if (!mandatoPrincipal) throw new HttpException('Não disponível para filtro', 400);

            filterSuplente = {
                NOT: { parlamentar_id: filters.disponivel_para_suplente_parlamentar_id },
                cargo: mandatoPrincipal.cargo,
                eleicao_id: mandatoPrincipal.eleicao_id,
                mandato_principal_id: null,
            };
        }

        const palavrasChave = await this.buscaIdsPalavraChave(filters.palavra_chave);
        let tem_mais = false;
        let token_proxima_pagina: string | null = null;

        let ipp = filters.ipp ? filters.ipp : 50;
        if (filters.ipp === -1) ipp = MAX_DB_SAFE_INT32;

        let offset = 0;
        const decodedPageToken = this.decodeNextPageToken(filters.token_proxima_pagina);

        if (decodedPageToken) {
            offset = decodedPageToken.offset;
            ipp = decodedPageToken.ipp;
        }

        const partidos = await this.prisma.partido.findMany({
            where: { removido_em: null },
            select: {
                id: true,
                sigla: true,
                nome: true,
                numero: true,
            },
        });

        const listActive = await this.prisma.parlamentar.findMany({
            where: {
                id: palavrasChave ? { in: palavrasChave } : undefined,
                removido_em: null,
                tem_mandato: filters.possui_mandatos,
                cpf: filters.cpf,
                mandatos: {
                    some: filterSuplente ? { ...filterSuplente } : undefined,
                },
            },
            select: {
                id: true,
                nome: true,
                nome_popular: true,
                em_atividade: true,
                cargo_mais_recente: true,
                partido_mais_recente: true,
                tem_mandato: true,
                cpf: true,
                mandatos: {
                    where: { removido_em: null },
                    select: {
                        eleicao: {
                            select: {
                                ano: true,
                            },
                        },
                    },
                },
            },
            orderBy: [{ nome_popular: 'asc' }, { id: 'asc' }],
            skip: offset,
            take: ipp + 1,
        });

        if (listActive.length > ipp) {
            tem_mais = true;
            listActive.pop();
            token_proxima_pagina = this.encodeNextPageToken({ ipp: ipp, offset: offset + ipp });
        }

        const linhas = listActive.map((p) => {
            const partido = partidos.find((e) => e.sigla == p.partido_mais_recente);
            const mandatos = p.mandatos.map((m) => m.eleicao.ano);

            return {
                ...p,

                cargo: p.cargo_mais_recente ?? null,
                partido: partido ?? null,
                eleicoes: mandatos,
                tem_mandato: p.tem_mandato,
                mandatos: p.tem_mandato ? mandatos : null,
                cpf: p.cpf ?? '000.000.000-00',
            };
        });

        return {
            linhas: linhas,
            token_ttl: PAGINATION_TOKEN_TTL,
            tem_mais: tem_mais,
            token_proxima_pagina: token_proxima_pagina,
        };
    }

    async findOne(id: number, user: PessoaFromJwt | undefined): Promise<ParlamentarDetailDto> {
        const parlamentar = await this.prisma.parlamentar.findUniqueOrThrow({
            where: {
                id: id,
            },
            select: {
                id: true,
                nome: true,
                nome_popular: true,
                nascimento: true,
                telefone: true,
                email: true,
                em_atividade: true,
                foto_upload_id: true,
                cpf: true,

                equipe: {
                    where: { removido_em: null },
                    select: {
                        id: true,
                        email: true,
                        nome: true,
                        telefone: true,
                        tipo: true,
                    },
                },

                mandatos: {
                    where: { removido_em: null },
                    orderBy: { eleicao: { ano: 'desc' } },
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
                        telefone: true,
                        email: true,

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
                                        email: true,
                                        telefone: true,
                                    },
                                },
                            },
                        },

                        representatividade: {
                            where: { removido_em: null },
                            orderBy: { ranking: 'asc' },
                            select: {
                                id: true,
                                nivel: true,
                                mandato: {
                                    select: {
                                        eleicao_id: true,
                                    },
                                },
                                municipio_tipo: true,
                                numero_votos: true,
                                pct_participacao: true,
                                ranking: true,
                                regiao: {
                                    select: {
                                        id: true,
                                        nivel: true,
                                        descricao: true,
                                        parente_id: true,
                                        RegiaoAcima: {
                                            select: {
                                                descricao: true,
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
        const comparecimentos = await this.prisma.eleicaoComparecimento.findMany({
            where: {
                eleicao_id: {
                    in: UniqueNumbers(parlamentar.mandatos.map((m) => m.eleicao.id)),
                },
                removido_em: null,
            },
            select: {
                regiao_id: true,
                valor: true,
                eleicao_id: true,
                id: true,
            },
        });
        const comparecimentosMap = new Map<number, typeof comparecimentos>();
        comparecimentos.forEach((c) => {
            if (!comparecimentosMap.has(c.eleicao_id)) {
                comparecimentosMap.set(c.eleicao_id, []);
            }
            comparecimentosMap.get(c.eleicao_id)!.push(c);
        });
        let mandatoCorrente = parlamentar.mandatos
            .sort((a, b) => b.eleicao.ano - a.eleicao.ano)
            .find((m) => m.eleicao.atual_para_mandatos == true);

        if (!mandatoCorrente) mandatoCorrente = parlamentar.mandatos[0];

        return {
            ...parlamentar,
            nascimento: Date2YMD.toStringOrNull(parlamentar.nascimento),
            telefone: user && user.hasSomeRoles(['SMAE.acesso_telefone']) ? parlamentar.telefone : null,
            foto: parlamentar.foto_upload_id
                ? this.uploadService.getDownloadToken(parlamentar.foto_upload_id, '1 days').download_token
                : null,
            cpf: parlamentar.cpf ?? '000.000.000-00',

            ultimo_mandato: mandatoCorrente
                ? {
                      ...mandatoCorrente,

                      suplentes: mandatoCorrente.suplentes.map((s) => {
                          return {
                              ...s,
                              parlamentar: {
                                  ...s.parlamentar,
                                  telefone:
                                      user && !user.hasSomeRoles(['SMAE.acesso_telefone'])
                                          ? s.parlamentar.telefone
                                          : null,
                              },
                          };
                      }),

                      representatividade: mandatoCorrente.representatividade.map((r) => {
                          const comparecimentos = comparecimentosMap.get(r.mandato.eleicao_id) || null;
                          const comparecimentoOk = comparecimentos
                              ? comparecimentos.find((c) => c.regiao_id === r.regiao.id)
                              : null;

                          return {
                              ...r,

                              regiao: {
                                  id: r.regiao.id,
                                  nivel: r.regiao.nivel,
                                  descricao: r.regiao.descricao,
                                  zona: r.regiao.nivel === 3 ? r.regiao.RegiaoAcima!.descricao : null,
                                  comparecimento: {
                                      id: comparecimentoOk?.id ?? 0,
                                      valor: comparecimentoOk?.valor ?? 0,
                                  },
                              },
                          };
                      }),
                  }
                : null,

            mandatos: parlamentar.mandatos.map((m) => {
                return {
                    ...m,

                    suplentes: m.suplentes.map((s) => {
                        return {
                            ...s,
                            parlamentar: {
                                ...s.parlamentar,
                                telefone:
                                    user && !user.hasSomeRoles(['SMAE.acesso_telefone'])
                                        ? s.parlamentar.telefone
                                        : null,
                            },
                        };
                    }),

                    representatividade: m.representatividade.map((r) => {
                        const comparecimentos = comparecimentosMap.get(r.mandato.eleicao_id) || null;
                        const comparecimentoOk = comparecimentos
                            ? comparecimentos.find((c) => c.regiao_id === r.regiao.id)
                            : null;
                        return {
                            ...r,

                            regiao: {
                                id: r.regiao.id,
                                nivel: r.regiao.nivel,
                                descricao: r.regiao.descricao,
                                zona: r.regiao.nivel === 3 ? r.regiao.RegiaoAcima!.descricao : null,
                                comparecimento: {
                                    id: comparecimentoOk?.id ?? 0,
                                    valor: comparecimentoOk?.valor ?? 0,
                                },
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

        let uploadId: number | null = null;
        if (dto.upload_foto) {
            uploadId = this.uploadService.checkUploadOrDownloadToken(dto.upload_foto);
        }
        delete dto.upload_foto;

        const now = new Date(Date.now());
        const updated = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                if (dto.cpf) {
                    const cpfExists = await prismaTxn.parlamentar.count({
                        where: { cpf: dto.cpf, removido_em: null, id: { not: id } },
                    });
                    if (cpfExists) throw new HttpException('CPF já cadastrado.', 400);
                }

                const parlamentar = await prismaTxn.parlamentar.update({
                    where: { id: id },
                    data: {
                        atualizado_por: user.id,
                        atualizado_em: now,
                        foto_upload_id: uploadId,

                        nome: dto.nome,
                        nome_popular: dto.nome_popular,
                        nascimento: dto.nascimento,
                        telefone: dto.telefone,
                        email: dto.email,
                        em_atividade: dto.em_atividade,
                        cpf: dto.cpf,
                    },
                });

                return parlamentar;
            },
            { isolationLevel: 'Serializable' }
        );

        return updated;
    }

    async remove(id: number, user: PessoaFromJwt) {
        const countTransferencias = await this.prisma.transferenciaParlamentar.count({
            where: {
                parlamentar_id: id,
                removido_em: null,
            },
        });
        if (countTransferencias)
            throw new HttpException('Parlamentar não pode ser excluído, pois possui transferência(s).', 400);

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
        if (!parlamentar) throw new HttpException('Parlamentar inválido.', 400);

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
        if (!membroEquipe) throw new HttpException('Membro de equipe inválido.', 400);

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
        if (mandatoExists) throw new HttpException('Parlamentar já possui mandato para esta eleição', 400);

        const partidoCandidaturaExists = await this.prisma.partido.count({
            where: { id: dto.partido_candidatura_id, removido_em: null },
        });
        if (!partidoCandidaturaExists) throw new HttpException('Partido de candidatura inválido', 400);

        const partidoAtualExists = await this.prisma.partido.count({
            where: { id: dto.partido_atual_id, removido_em: null },
        });
        if (!partidoAtualExists) throw new HttpException('Partido atual inválido', 400);

        dto.biografia = HtmlSanitizer(dto.biografia);

        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const mandato = await prismaTxn.parlamentarMandato.create({
                    data: {
                        parlamentar_id: parlamentarId,
                        ...dto,
                        criado_por: user ? user.id : undefined,
                        criado_em: new Date(Date.now()),
                    },
                    select: {
                        id: true,
                        partido_atual: {
                            select: {
                                sigla: true,
                            },
                        },
                        eleicao: {
                            select: {
                                ano: true,
                            },
                        },
                    },
                });

                // Na criação do mandato, deve ser atualizada as cols de controle.
                await prismaTxn.parlamentar.update({
                    where: {
                        id: parlamentarId,
                    },
                    data: {
                        cargo_mais_recente: dto.cargo,
                        partido_mais_recente: mandato.partido_atual.sigla,
                        tem_mandato: true,
                    },
                });

                // Caso o mandato seja mais novo que um possível mandato anterior, atualizar cols de controle.
                const mandatoAnterior = await prismaTxn.parlamentarMandato.findFirst({
                    where: {
                        parlamentar_id: parlamentarId,
                        removido_em: null,
                        id: { not: mandato.id },
                    },
                    orderBy: {
                        eleicao: { ano: 'desc' },
                    },
                    select: {
                        eleicao: {
                            select: {
                                ano: true,
                            },
                        },
                    },
                });
                if (mandatoAnterior && mandatoAnterior.eleicao.ano < mandato.eleicao.ano)
                    await prismaTxn.parlamentar.update({
                        where: {
                            id: parlamentarId,
                        },
                        data: {
                            cargo_mais_recente: dto.cargo,
                            partido_mais_recente: mandato.partido_atual.sigla,
                            tem_mandato: true,
                        },
                    });

                return { id: mandato.id };
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
            if (!partidoCandidaturaExists) throw new HttpException('Partido de candidatura inválido', 400);
        }

        if (dto.biografia) dto.biografia = HtmlSanitizer(dto.biografia);

        if (dto.partido_candidatura_id && self.partido_candidatura_id != dto.partido_candidatura_id) {
            const partidoAtualExists = await this.prisma.partido.count({
                where: { id: dto.partido_atual_id, removido_em: null },
            });
            if (!partidoAtualExists) throw new HttpException('Partido atual inválido', 400);
        }

        await this.prisma.parlamentarMandato.update({
            where: { id },
            data: {
                ...dto,
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
            },
        });

        // Verificando se é o mandato atual, e caso seja. Deve atualizar as cols de controle.
        if (
            (dto.cargo && self.cargo != dto.cargo) ||
            (dto.partido_atual_id && self.partido_atual_id != dto.partido_atual_id)
        ) {
            const mandatoAtual = await this.prisma.parlamentarMandato.findFirstOrThrow({
                where: {
                    parlamentar_id: self.parlamentar_id,
                    removido_em: null,
                    eleicao: {
                        atual_para_mandatos: true,
                    },
                },
                orderBy: { eleicao: { ano: 'desc' } },
                select: {
                    id: true,
                    eleicao: {
                        select: {
                            ano: true,
                            atual_para_mandatos: true,
                        },
                    },
                    partido_atual: {
                        select: {
                            sigla: true,
                        },
                    },
                },
            });
            if (self.id == mandatoAtual.id) {
                await this.prisma.parlamentar.update({
                    where: {
                        id: self.parlamentar_id,
                    },
                    data: {
                        cargo_mais_recente: dto.cargo,
                        partido_mais_recente: mandatoAtual.partido_atual.sigla,
                    },
                });
            }
        }

        return { id };
    }

    async removeMandato(id: number, user: PessoaFromJwt) {
        // Caso o mandato seja removido, as colunas em Parlamentar devem ser atualizadas.
        const mandato = await this.prisma.parlamentarMandato.findFirstOrThrow({
            where: {
                id,
                removido_em: null,
            },
            select: {
                parlamentar_id: true,
            },
        });

        const outrosMandatos = await this.prisma.parlamentarMandato.findMany({
            where: {
                id: { not: id },
                parlamentar_id: mandato.parlamentar_id,
                removido_em: null,
            },
            select: {
                id: true,
                eleicao: {
                    select: {
                        ano: true,
                        atual_para_mandatos: true,
                    },
                },
                cargo: true,
                partido_atual: {
                    select: {
                        sigla: true,
                    },
                },
            },
        });

        await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient) => {
            if (outrosMandatos.length == 0) {
                await prismaTxn.parlamentar.update({
                    where: {
                        id: mandato.parlamentar_id,
                    },
                    data: {
                        cargo_mais_recente: null,
                        partido_mais_recente: null,
                        tem_mandato: false,
                    },
                });
            } else {
                const mandatoMaisRecente = outrosMandatos.sort((a, b) => b.eleicao.ano - a.eleicao.ano)[0];

                await prismaTxn.parlamentar.update({
                    where: {
                        id: mandato.parlamentar_id,
                    },
                    data: {
                        cargo_mais_recente: mandatoMaisRecente.cargo,
                        partido_mais_recente: mandatoMaisRecente.partido_atual.sigla,
                    },
                });
            }

            await prismaTxn.parlamentarMandato.update({
                where: { id },
                data: {
                    removido_por: user.id,
                    removido_em: new Date(Date.now()),
                },
            });
        });

        return { id };
    }

    async getEleicaoComparecimento(
        query: GetEleicaoComparecimentoDto,
        user: PessoaFromJwt
    ): Promise<EleicaoComparecimentoDto> {
        let eleicaoId: number;

        if (query.mandato_id) {
            const mandato = await this.prisma.parlamentarMandato.findFirst({
                where: { id: query.mandato_id, removido_em: null },
                orderBy: [{}],
                select: { eleicao_id: true },
            });
            if (!mandato) throw new NotFoundException('Não foi possível encontrar este mandato');
            eleicaoId = mandato.eleicao_id;
        } else {
            eleicaoId = query.eleicao_id!;
        }

        const comparecimentos = await this.prisma.eleicaoComparecimento.findMany({
            where: {
                eleicao_id: eleicaoId,
                removido_em: null,
            },
            select: {
                regiao_id: true,
                valor: true,
                nivel: true,
                regiao: {
                    select: {
                        descricao: true,
                    },
                },
            },
        });

        // Busca todos os parlamentares em uma única consulta para evitar problema N+1
        const regiaoIds = comparecimentos.map((c) => c.regiao_id);
        const parlamentaresCounts = await this.prisma.mandatoRepresentatividade.groupBy({
            by: ['regiao_id'],
            where: {
                regiao_id: { in: regiaoIds },
                mandato: {
                    eleicao_id: eleicaoId,
                },
                removido_em: null,
            },
            _count: {
                id: true,
            },
        });

        // Cria um mapa para busca rápida
        const countsByRegiao = new Map(parlamentaresCounts.map((p) => [p.regiao_id, p._count.id]));

        const comparecimentosWithCount = comparecimentos.map((c) => {
            return {
                regiao_id: c.regiao_id,
                regiao_nome: c.regiao.descricao,
                nivel: c.nivel,
                valor: c.valor,
                parlamentares_count: countsByRegiao.get(c.regiao_id) || 0,
            };
        });

        return {
            eleicao_id: eleicaoId,
            comparecimentos: comparecimentosWithCount,
        };
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

        if (!dto.ranking) {
            throw new HttpException('ranking| Ranking é obrigatório', 400);
        }

        // Busca representatividade existente
        const existingMandato = await this.prisma.mandatoRepresentatividade.findFirst({
            where: {
                mandato_id: mandato.id,
                regiao_id: dto.regiao_id,
                removido_em: null,
            },
        });

        if (existingMandato) {
            throw new HttpException('Já existe um mandato para esta região.', 400);
        }

        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                // Gerencia criação/atualização do comparecimento
                let finalComparecimento: number;

                if (dto.numero_comparecimento !== undefined) {
                    await this.updateOrCreateComparecimento(
                        prismaTxn,
                        mandato.eleicao_id,
                        dto.regiao_id,
                        dto.numero_comparecimento
                    );
                    finalComparecimento = dto.numero_comparecimento;
                } else {
                    // Busca comparecimento existente
                    const existingComparecimento = await prismaTxn.eleicaoComparecimento.findFirst({
                        where: {
                            eleicao_id: mandato.eleicao_id,
                            regiao_id: dto.regiao_id,
                            removido_em: null,
                        },
                    });

                    if (!existingComparecimento) {
                        throw new HttpException(
                            'numero_comparecimento| Não foi possível encontrar dados de comparecimento para esta eleição/região. Informe o número de comparecimento.',
                            400
                        );
                    }
                    finalComparecimento = existingComparecimento.valor;
                }

                // Valida numero_votos <= comparecimento
                if (dto.numero_votos > finalComparecimento) {
                    throw new HttpException(
                        'numero_votos| Número de votos não pode ser maior que o comparecimento',
                        400
                    );
                }

                // Sempre calcula o percentual
                const pct_participacao = (dto.numero_votos / finalComparecimento) * 100;

                const representatividade = await prismaTxn.mandatoRepresentatividade.create({
                    data: {
                        regiao_id: dto.regiao_id,
                        pct_participacao: pct_participacao, // Usa valor calculado
                        mandato_id: dto.mandato_id,
                        nivel: dto.nivel,
                        municipio_tipo: dto.municipio_tipo,
                        numero_votos: dto.numero_votos,
                        ranking: dto.ranking,
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
    ): Promise<RecordWithId | ComparecimentoConflictResponseDto> {
        const currentRep = await this.prisma.mandatoRepresentatividade.findFirstOrThrow({
            where: { id: representatividadeId, removido_em: null },
            include: {
                mandato: {
                    select: { eleicao_id: true },
                },
            },
        });

        // Se enviou o valor novo de comparecimento, verifica se já existe um comparecimento para a região
        if (dto.numero_comparecimento !== undefined) {
            const existingComparecimento = await this.prisma.eleicaoComparecimento.findFirst({
                where: {
                    eleicao_id: currentRep.mandato.eleicao_id,
                    regiao_id: currentRep.regiao_id,
                    removido_em: null,
                },
            });

            if (existingComparecimento && existingComparecimento.valor !== dto.numero_comparecimento) {
                // Verifica quantos afetados
                const affectedCount = await this.prisma.mandatoRepresentatividade.count({
                    where: {
                        regiao_id: currentRep.regiao_id,
                        mandato: {
                            eleicao_id: currentRep.mandato.eleicao_id,
                        },
                        id: { not: representatividadeId },
                        removido_em: null,
                    },
                });

                if (affectedCount > 0 && !dto.confirma_alteracao_comparecimento) {
                    return {
                        conflict_detected: true,
                        comparecimento_existente: existingComparecimento.valor,
                        novo_comparecimento: dto.numero_comparecimento,
                        parlamentares_afetados: affectedCount,
                        message: `Atenção: há um valor de comparecimento para essa eleição/cargo/região diferente do informado. A alteração deste valor implicará no recálculo dos percentuais de ${affectedCount} parlamentares desta eleição/cargo/região. Confirma alteração?`,
                    };
                }
            }
        }

        // não deixa mais passar numero_votos <= comparecimento
        const finalComparecimento =
            dto.numero_comparecimento ||
            (await this.getComparecimentoForRegiao(currentRep.mandato.eleicao_id, currentRep.regiao_id));

        if (dto.numero_votos && finalComparecimento && dto.numero_votos > finalComparecimento) {
            throw new HttpException('numero_votos| Número de votos não pode ser maior que o comparecimento', 400);
        }

        return await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
            // Calcula a nova percentagem para essa representatividade
            let pct_participacao: number | undefined;
            if (dto.numero_votos !== undefined || dto.numero_comparecimento !== undefined) {
                const votos = dto.numero_votos || currentRep.numero_votos;
                const comparecimento = dto.numero_comparecimento || finalComparecimento;

                if (comparecimento) {
                    pct_participacao = (votos / comparecimento) * 100;
                }
            }

            await prismaTxn.mandatoRepresentatividade.updateMany({
                where: { id: representatividadeId },
                data: {
                    numero_votos: dto.numero_votos,
                    ranking: dto.ranking,
                    pct_participacao: pct_participacao,
                    atualizado_por: user.id,
                    atualizado_em: new Date(Date.now()),
                },
            });

            // Atualiza eleicao_comparecimento se necessário
            if (dto.numero_comparecimento !== undefined) {
                await this.updateOrCreateComparecimento(
                    prismaTxn,
                    currentRep.mandato.eleicao_id,
                    currentRep.regiao_id,
                    dto.numero_comparecimento
                );

                await this.recalcRepresentatividades(
                    prismaTxn,
                    currentRep.mandato.eleicao_id,
                    currentRep.regiao_id,
                    dto.numero_comparecimento
                );
            }

            return { id: representatividadeId };
        });
    }

    private async getComparecimentoForRegiao(eleicaoId: number, regiaoId: number): Promise<number | null> {
        const comparecimento = await this.prisma.eleicaoComparecimento.findFirst({
            where: {
                eleicao_id: eleicaoId,
                regiao_id: regiaoId,
                removido_em: null,
            },
        });
        return comparecimento?.valor || null;
    }

    // São os mesmos comparecimentos para todos os cargos: apenas eleição (ano) + região
    private async updateOrCreateComparecimento(
        prismaTxn: Prisma.TransactionClient,
        eleicaoId: number,
        regiaoId: number,
        novoValor: number
    ) {
        const existing = await prismaTxn.eleicaoComparecimento.findMany({
            where: {
                eleicao_id: eleicaoId,
                regiao_id: regiaoId,
                removido_em: null,
            },
            select: { id: true },
        });

        if (existing.length > 1) {
            await prismaTxn.eleicaoComparecimento.updateMany({
                where: { id: { in: existing.slice(1).map((e) => e.id) } },
                data: { removido_em: new Date() },
            });
        }

        if (existing) {
            const x = await prismaTxn.eleicaoComparecimento.updateMany({
                where: { id: existing[0].id },
                data: {
                    valor: novoValor,
                    atualizado_em: new Date(),
                },
            });
        } else {
            const regiao = await prismaTxn.regiao.findFirstOrThrow({
                where: { id: regiaoId, removido_em: null },
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

            await prismaTxn.eleicaoComparecimento.create({
                data: {
                    eleicao_id: eleicaoId,
                    regiao_id: regiaoId,
                    valor: novoValor,
                    nivel: nivelDadoEleicao,
                    criado_em: new Date(),
                },
            });
        }
    }

    private async recalcRepresentatividades(
        prismaTxn: Prisma.TransactionClient,
        eleicaoId: number,
        regiaoId: number,
        novoComparecimento: number
    ) {
        // Busca todas da eleicao/regiao
        const representatividades = await prismaTxn.mandatoRepresentatividade.findMany({
            where: {
                regiao_id: regiaoId,
                mandato: {
                    eleicao_id: eleicaoId,
                },
                removido_em: null,
            },
            select: {
                id: true,
                numero_votos: true,
            },
        });

        // Recalcula percentuais usando Promise.all para atualizações concorrentes
        const updatePromises = representatividades.map((rep) => {
            const novoPct = (rep.numero_votos / novoComparecimento) * 100;
            return prismaTxn.mandatoRepresentatividade.updateMany({
                where: { id: rep.id },
                data: {
                    pct_participacao: +novoPct.toPrecision(2),
                    atualizado_em: new Date(),
                },
            });
        });

        await Promise.all(updatePromises);
    }

    async buscaIdsPalavraChave(input: string | undefined): Promise<number[] | undefined> {
        return PrismaHelpers.buscaIdsPalavraChave(this.prisma, 'parlamentar', input);
    }

    async removeMandatoRepresentatividade(id: number, user: PessoaFromJwt): Promise<void> {
        await this.prisma.mandatoRepresentatividade.update({
            where: { id },
            data: {
                removido_por: user.id,
                removido_em: new Date(),
            },
        });
    }

    async createSuplente(
        _parlamentarId: number,
        _dto: CreateMandatoSuplenteDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return { id: 0 };

        // const mandatoPrincipal = await this.prisma.parlamentarMandato.findFirst({
        //     where: {
        //         id: dto.mandato_id,
        //         parlamentar_id: parlamentarId,
        //         removido_em: null,
        //         mandato_principal_id: null,
        //     },
        //     select: {
        //         id: true,
        //         cargo: true,
        //         eleicao_id: true,
        //         suplentes: {
        //             where: { removido_em: null },
        //             select: {
        //                 suplencia: true,
        //             },
        //         },
        //     },
        // });
        // if (!mandatoPrincipal) throw new HttpException('mandato_id| Mandato principal inválido', 400);

        // const parlamentarSuplente = await this.prisma.parlamentar.findFirst({
        //     where: {
        //         id: dto.parlamentar_suplente_id,
        //         removido_em: null,
        //     },
        //     select: {
        //         mandatos: {
        //             take: 1,
        //             where: {
        //                 eleicao_id: mandatoPrincipal.eleicao_id,
        //                 cargo: mandatoPrincipal.cargo,
        //                 removido_em: null,
        //             },
        //         },
        //     },
        // });

        // if (!parlamentarSuplente)
        //     throw new HttpException('parlamentar_suplente_id| Não foi encontrado parlamentar suplente', 400);

        // if (parlamentarSuplente && parlamentarSuplente.mandatos.length == 0)
        //     throw new HttpException('parlamentar_suplente_id| Não foi encontrado mandato para este parlamentar', 400);

        // if (
        //     mandatoPrincipal.suplentes.length > 0 &&
        //     mandatoPrincipal.suplentes.filter((e) => e.suplencia == dto.suplencia).length > 0
        // )
        //     throw new HttpException('suplencia| Parlamentar já possui um outro suplente deste nivel', 400);

        // const mandatoSuplente = parlamentarSuplente.mandatos[0];

        // if (dto.mandato_id == mandatoSuplente.id)
        //     throw new HttpException('Não é permitido suplente de si próprio', 400);

        // if (mandatoSuplente.mandato_principal_id && mandatoSuplente.mandato_principal_id != dto.mandato_id)
        //     throw new HttpException(
        //         'mandato_suplente_id| Mandato suplente já é suplente de outro mandato distinto',
        //         400
        //     );

        // if (!mandatoSuplente.suplencia && !dto.suplencia)
        //     throw new HttpException('suplencia| Grau de suplente deve ser informado', 400);

        // await this.prisma.parlamentarMandato.updateMany({
        //     where: {
        //         id: mandatoSuplente.id,
        //     },
        //     data: {
        //         suplencia: dto.suplencia,
        //         mandato_principal_id: dto.mandato_id,
        //     },
        // });

        // return { id: mandatoSuplente.id };
    }

    async removeSuplente(parlamentarTitularId: number, suplenteId: number, user: PessoaFromJwt) {
        return;
        // return await this.prisma.parlamentarMandato.updateMany({
        // where: {
        // parlamentar_id: suplenteId,
        // mandato_principal: {
        // parlamentar_id: parlamentarTitularId,
        // },
        // },
        // data: {
        // mandato_principal_id: null,
        // atualizado_por: user.id,
        // atualizado_em: new Date(Date.now()),
        // },
        // });
    }
}
