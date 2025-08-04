import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Nota, Prisma, TipoNota } from 'src/generated/prisma/client';
import { DateTime } from 'luxon';
import { SmaeConfigService } from 'src/common/services/smae-config.service';
import { uuidv7 } from 'uuidv7';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { CONST_TIPO_NOTA_DIST_RECURSO, CONST_TIPO_NOTA_TRANSF_GOV } from '../../common/consts';
import { Date2YMD, SYSTEM_TIMEZONE } from '../../common/date2ymd';
import { PaginatedDto, PAGINATION_TOKEN_TTL } from '../../common/dto/paginated.dto';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { HtmlSanitizer } from '../../common/html-sanitizer';
import { PrismaService } from '../../prisma/prisma.service';
import { BlocoNotaService } from '../bloco-nota/bloco-nota.service';
import { TipoNotaService } from '../tipo-nota/tipo-nota.service';
import { FilterNotaComunicadoDto, NotaComunicadoItemDto } from './dto/comunicados.dto';
import {
    BuscaNotaDto,
    CreateNotaDto,
    NotaEnderecamentoRespostas,
    NovaRespostaDto,
    RecordWithIdJwt,
    TipoNotaDetail,
    TipoNotaItem,
    UpdateNotaDto,
} from './dto/nota.dto';

class NextPageTokenJwtBody {
    offset: number;
}

const JWT_AUD = 'nt';
type JwtToken = {
    nota_id: number;
    write: boolean;
    aud: string;
};

type DadosEmailInfo = {
    objeto: string;
    link: string;
    nota: string;
};

@Injectable()
export class NotaService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly blocoService: BlocoNotaService,
        private readonly tipoService: TipoNotaService,
        private readonly prisma: PrismaService,
        private readonly smaeConfigService: SmaeConfigService
    ) {}

    async getTipoNotaDistRecurso(prismaCtx: Prisma.TransactionClient = this.prisma): Promise<number> {
        const nota = await prismaCtx.tipoNota.findFirstOrThrow({
            where: {
                id: CONST_TIPO_NOTA_DIST_RECURSO,
            },
            select: { id: true },
        });
        return nota.id;
    }

    async create(
        dto: CreateNotaDto,
        user: PessoaFromJwt | { id: number },
        prismaCtx?: Prisma.TransactionClient
    ): Promise<RecordWithIdJwt> {
        const blocoId = this.blocoService.checkToken(dto.bloco_token);
        const tipo = await this.tipoService.findOneOrThrow(dto.tipo_nota_id);
        dto.nota = HtmlSanitizer(dto.nota);

        if (!tipo.permite_revisao && dto.rever_em) delete dto.rever_em;
        if (!tipo.permite_email && dto.dispara_email) dto.dispara_email = false;

        if ('modulo_sistema' in user && !user.orgao_id)
            throw new BadRequestException('Necessário ter órgão para criar uma nota');

        // acredito que podemos rever isso, para que notas possam sim ser private mas encaminhadas para órgãos
        // a questão é que o publico sempre aparece na listagem, sem qualquer restrição, fazendo com que o encaminhamento
        // seja inútil para proteger a privacidade da nota, serve apenas para as respostas que não existem no momento no frontend
        if (Array.isArray(dto.enderecamentos) && dto.enderecamentos.length && tipo.eh_publico == false)
            throw new BadRequestException('Não é possível encaminhar notas privadas.');

        const now = new Date(Date.now());
        const performCreate = async (prismaTx: Prisma.TransactionClient) => {
            const nota = await prismaTx.nota.create({
                data: {
                    data_nota: dto.data_nota,
                    nota: dto.nota,
                    status: dto.status,
                    dispara_email: dto.dispara_email === undefined ? undefined : !!dto.dispara_email,
                    rever_em: dto.rever_em,
                    titulo: dto.titulo,
                    dados: (dto.dados as any) ?? null,

                    bloco_nota_id: blocoId,
                    criado_por: user.id,
                    orgao_responsavel_id: 'orgao_id' in user ? (user.orgao_id ?? null) : null,
                    pessoa_responsavel_id: user.id,
                    tipo_nota_id: tipo.id,
                    usuarios_lidos: [], // agora precisa inicializar, se não os hasSome/hasEvery não funcionam
                },
                select: {
                    id: true,
                    nota: true,
                    dispara_email: true,
                    rever_em: true,
                    data_nota: true,
                },
            });
            this.validateReverEm(nota);

            if (tipo.permite_enderecamento) await this.upsertEnderecamentos(prismaTx, nota.id, dto, now, user.id, nota);

            return nota.id;
        };

        let id: number;
        if (prismaCtx) {
            id = await performCreate(prismaCtx);
        } else {
            id = await this.prisma.$transaction(async (prisma: Prisma.TransactionClient) => {
                return await performCreate(prisma);
            });
        }

        return {
            id_jwt: this.getToken(id),
            id,
        };
    }

    private validateReverEm(nota: { rever_em: Date | null; data_nota: Date }) {
        if (
            nota.rever_em &&
            nota.rever_em.valueOf() < DateTime.local({ zone: SYSTEM_TIMEZONE }).startOf('day').valueOf()
        )
            throw new BadRequestException('Data de revisão inválida, deve ser após a data de hoje.');
        if (nota.rever_em && nota.rever_em.valueOf() < nota.data_nota.valueOf())
            throw new BadRequestException('Data de revisão inválida, deve ser após a data da nota.');
    }

    permissionSet(user: PessoaFromJwt) {
        const permissionsSet: Prisma.Enumerable<Prisma.NotaWhereInput> = [];

        permissionsSet.push({
            OR: [
                {
                    tipo_nota: { eh_publico: true },
                },
                {
                    tipo_nota: {
                        eh_publico: false,
                        removido_em: null,
                    },
                    pessoa_responsavel_id: user.id,
                },
                user.orgao_id
                    ? {
                          NotaEnderecamento: {
                              some: {
                                  removido_em: null,
                                  orgao_enderecado_id: user.orgao_id,
                              },
                          },
                      }
                    : {},
                {
                    NotaEnderecamento: {
                        some: {
                            removido_em: null,
                            pessoa_enderecado_id: user.id,
                        },
                    },
                },
                user.orgao_id
                    ? {
                          tipo_nota: {
                              visivel_resp_orgao: true,
                              removido_em: null,
                          },
                          orgao_responsavel_id: user.orgao_id,
                      }
                    : {},
            ],
        });

        return permissionsSet;
    }

    async findAll(filters: BuscaNotaDto, user: PessoaFromJwt): Promise<TipoNotaItem[]> {
        if (!filters.status && !filters.nota_id) filters.status = ['Programado', 'Em_Curso'];

        const permissionSet: Prisma.Enumerable<Prisma.NotaWhereInput[]> = this.permissionSet(user);
        const today = Date2YMD.toString(DateTime.local({ zone: SYSTEM_TIMEZONE }).startOf('day').toJSDate());
        const rows = await this.prisma.nota.findMany({
            where: {
                removido_em: null,
                id: filters.nota_id ? filters.nota_id : undefined,
                bloco_nota_id: {
                    in: filters.blocos_token.map((b) => this.blocoService.checkToken(b)),
                },

                status: { in: filters.status },

                AND: permissionSet,
            },
            include: {
                pessoa_responsavel: {
                    select: { id: true, nome_exibicao: true },
                },
                orgao_responsavel: {
                    select: { id: true, sigla: true },
                },
                tipo_nota: true,
            },
            orderBy: [{ bloco_nota_id: 'asc' }, { data_nota: 'desc' }, { rever_em: 'desc' }],
        });

        return rows
            .map((r): TipoNotaItem => {
                const idPerm = this.getTokenWithPerm(r.id, user, r);
                return {
                    id_jwt: idPerm.token,
                    bloco_token: this.blocoService.getToken(r.bloco_nota_id),
                    data_nota: Date2YMD.toString(r.data_nota),
                    dispara_email: r.dispara_email,
                    nota: r.nota,
                    status: r.status,
                    tipo_nota_id: r.tipo_nota_id,
                    orgao_responsavel: r.orgao_responsavel,
                    // voltando o calculo aqui, pra não ter que fazer join com a view sendo que já estamos na nota...
                    data_ordenacao: Date2YMD.toString(
                        Date2YMD.toString(r.data_nota) <= today && r.rever_em ? r.rever_em : r.data_nota
                    ),
                    rever_em: Date2YMD.toStringOrNull(r.rever_em),
                    bloco_id: r.bloco_nota_id,
                    pessoa_responsavel: r.pessoa_responsavel,
                    n_enderecamentos: r.n_enderecamentos,
                    n_repostas: r.n_repostas,
                    ultima_resposta: r.ultima_resposta,
                    pode_editar: idPerm.write,
                    dados: r.dados ? (r.dados.valueOf() as any) : null,
                    titulo: r.titulo,
                };
            })
            .sort((a, b) => {
                if (a.bloco_id !== b.bloco_id) {
                    return a.bloco_id - b.bloco_id;
                } else {
                    return a.data_ordenacao.localeCompare(b.data_ordenacao);
                }
            });
    }

    async findOne(signedId: string, user: PessoaFromJwt): Promise<TipoNotaDetail> {
        const id = this.checkToken(signedId);
        const today = Date2YMD.toString(DateTime.local({ zone: SYSTEM_TIMEZONE }).startOf('day').toJSDate());

        const r = await this.prisma.nota.findFirst({
            where: { id, removido_em: null },
            include: {
                pessoa_responsavel: {
                    select: { id: true, nome_exibicao: true },
                },
                orgao_responsavel: {
                    select: { id: true, sigla: true },
                },
                tipo_nota: true,
                NotaEnderecamento: {
                    where: {
                        removido_em: null,
                    },
                    orderBy: {
                        orgao_enderecado: { sigla: 'asc' },
                    },
                    select: {
                        id: true,
                        orgao_enderecado: {
                            select: { id: true, sigla: true },
                        },
                        pessoa_enderecado: {
                            select: { id: true, nome_exibicao: true },
                        },
                    },
                },
                NotaEnderecamentoResposta: {
                    where: {
                        removido_em: null,
                    },
                    orderBy: {
                        criado_em: 'desc',
                    },
                    select: {
                        id: true,
                        resposta: true,
                        criado_em: true,
                        nota_enderecamento_id: true,
                        nota_enderecamento: {
                            select: {
                                orgao_enderecado: {
                                    select: { id: true, sigla: true },
                                },
                            },
                        },
                        criador: {
                            select: { id: true, nome_exibicao: true },
                        },
                    },
                },
            },
        });
        if (!r) throw new NotFoundException('Nota não encontrada');

        const idPerm = this.getTokenWithPerm(r.id, user, r);
        return {
            id_jwt: idPerm.token,
            pode_editar: idPerm.write,
            bloco_token: this.blocoService.getToken(r.bloco_nota_id),
            data_nota: Date2YMD.toString(r.data_nota),
            dispara_email: r.dispara_email,
            nota: r.nota,
            status: r.status,
            tipo_nota_id: r.tipo_nota_id,
            orgao_responsavel: r.orgao_responsavel,
            data_ordenacao: Date2YMD.toString(
                Date2YMD.toString(r.data_nota) <= today && r.rever_em ? r.rever_em : r.data_nota
            ),
            bloco_id: r.bloco_nota_id,
            pessoa_responsavel: r.pessoa_responsavel,
            n_enderecamentos: r.n_enderecamentos,
            n_repostas: r.n_repostas,
            ultima_resposta: r.ultima_resposta,
            enderecamentos: r.NotaEnderecamento,
            rever_em: Date2YMD.toStringOrNull(r.rever_em),
            dados: r.dados ? (r.dados.valueOf() as any) : null,
            titulo: r.titulo,
            respostas: r.NotaEnderecamentoResposta.map((resp): NotaEnderecamentoRespostas => {
                return {
                    id: resp.id,
                    pode_remover: resp.criador.id == user.id,
                    criado_em: resp.criado_em,
                    criador: resp.criador,
                    resposta: resp.resposta,
                    nota_enderecamento_id: resp.nota_enderecamento_id,
                    orgao_enderecado: resp.nota_enderecamento.orgao_enderecado!,
                };
            }),
        };
    }

    async removeResposta(signedId: string, respostaId: number, user: PessoaFromJwt): Promise<void> {
        const notaId = this.checkToken(signedId);
        const notaResposta = await this.prisma.notaEnderecamentoResposta.findFirst({
            where: {
                nota_id: notaId,
                removido_em: null,
                id: respostaId,
                criado_por: user.id,
            },
            select: { id: true },
        });
        if (!notaResposta) throw new BadRequestException(`Você só pode remover respostas que for criador.`);

        const now = new Date(Date.now());
        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            await prismaTx.notaEnderecamentoResposta.update({
                where: { id: respostaId },
                data: {
                    removido_em: now,
                    criado_por: user.id,
                },
            });

            await prismaTx.nota.update({
                where: { id: notaId },
                data: {
                    n_repostas: { decrement: 1 },
                },
            });
        });
    }

    async novaResposta(signedId: string, dto: NovaRespostaDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const id = this.checkToken(signedId);
        const nota = await this.prisma.nota.findFirstOrThrow({
            where: { id: id, removido_em: null },
            select: {
                id: true,
                dispara_email: true,
                nota: true,
                tipo_nota: { select: { permite_replica: true } },
            },
        });

        if (!nota.tipo_nota.permite_replica) throw new BadRequestException('Tipo de nota não permite replica');
        dto.resposta = HtmlSanitizer(dto.resposta);

        const now = new Date(Date.now());
        return await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            const encaminhamentoInfo = await prismaTx.notaEnderecamento.findFirstOrThrow({
                where: {
                    nota_id: id,
                    id: dto.nota_enderecamento_id,
                },
                select: {
                    id: true,
                    pessoa_enderecado: {
                        select: { email: true },
                    },
                    orgao_enderecado: {
                        select: { email: true, sigla: true },
                    },
                },
            });

            let emailTo = '';

            if (encaminhamentoInfo.pessoa_enderecado?.email) {
                emailTo = encaminhamentoInfo.pessoa_enderecado.email;
            } else if (encaminhamentoInfo.orgao_enderecado?.email) {
                emailTo = encaminhamentoInfo.orgao_enderecado.email;
            }

            const r = await prismaTx.notaEnderecamentoResposta.create({
                data: {
                    nota_id: id,
                    criado_por: user.id,
                    criado_em: now,
                    nota_enderecamento_id: dto.nota_enderecamento_id,
                    resposta: dto.resposta,
                },
                select: { id: true },
            });

            await prismaTx.nota.update({
                where: { id: nota.id },
                data: { n_repostas: { increment: 1 }, ultima_resposta: now },
            });

            if (nota.dispara_email && emailTo) {
                const objeto = await this.geraDadosEmail(nota.id, prismaTx);
                await prismaTx.emaildbQueue.create({
                    data: {
                        id: uuidv7(),
                        config_id: 1,
                        subject: `Nova resposta - ${objeto.objeto}`,
                        template: 'nota-nova-resposta.html',
                        to: emailTo,
                        variables: {
                            resposta: dto.resposta,
                            ...objeto,
                        },
                    },
                });
            }

            return r;
        });
    }

    async update(
        signedId: string,
        dto: UpdateNotaDto,
        user: PessoaFromJwt,
        prismaCtx?: Prisma.TransactionClient
    ): Promise<RecordWithIdJwt> {
        const id = this.checkWritableToken(signedId);
        dto.nota = HtmlSanitizer(dto.nota);

        const nota = await this.prisma.nota.findFirstOrThrow({
            where: { id: id, removido_em: null },
            select: {
                id: true,
                dispara_email: true,
                nota: true,
                tipo_nota: { select: { permite_revisao: true, permite_enderecamento: true, eh_publico: true } },
                rever_em: true,
                data_nota: true,
            },
        });

        if (nota.tipo_nota.permite_revisao && dto.rever_em) delete dto.rever_em;

        if (Array.isArray(dto.enderecamentos) && dto.enderecamentos.length && nota.tipo_nota.eh_publico == false)
            throw new BadRequestException('Não é possível encaminhar notas privadas.');

        const now = new Date(Date.now());

        const performUpdate = async (prismaTx: Prisma.TransactionClient) => {
            let usuarios_lidos: number[] | undefined = undefined;
            if (dto.nota && dto.nota !== nota.nota) {
                await prismaTx.notaRevisao.create({
                    data: { criado_por: user.id, nota: nota.nota, nota_id: nota.id },
                });
                usuarios_lidos = [];
            }

            const updated = await prismaTx.nota.update({
                where: { id },
                data: {
                    nota: dto.nota,
                    status: dto.status,
                    data_nota: dto.data_nota,
                    dispara_email: dto.dispara_email === undefined ? undefined : !!dto.dispara_email,
                    rever_em: dto.rever_em,
                    titulo: dto.titulo,
                    dados: (dto.dados as any) ?? null,
                    usuarios_lidos,
                },
                select: {
                    nota: true,
                    rever_em: true,
                    data_nota: true,
                },
            });

            if (
                nota.data_nota.valueOf() != updated.data_nota.valueOf() ||
                nota.rever_em?.valueOf() != updated.rever_em?.valueOf()
            )
                this.validateReverEm(updated);

            if (nota.tipo_nota.permite_enderecamento)
                await this.upsertEnderecamentos(prismaTx, id, dto, now, user.id, nota);
        };

        if (prismaCtx) {
            await performUpdate(prismaCtx);
        } else {
            await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
                await performUpdate(prismaTx);
            });
        }

        return { id_jwt: this.getToken(id), id };
    }

    private async upsertEnderecamentos(
        prismaTx: Prisma.TransactionClient,
        id: number,
        dto: UpdateNotaDto,
        now: Date,
        user_id: number,
        nota: { nota: string; id: number; dispara_email: boolean }
    ) {
        if (!Array.isArray(dto.enderecamentos)) return;

        const prevVersions = await prismaTx.notaEnderecamento.findMany({
            where: { nota_id: id, removido_em: null },
        });

        for (const enderecamento of dto.enderecamentos) {
            if (enderecamento.pessoa_enderecado_id == 0) enderecamento.pessoa_enderecado_id = null;

            if (
                prevVersions.filter(
                    (r) =>
                        r.orgao_enderecado_id === enderecamento.orgao_enderecado_id &&
                        r.pessoa_enderecado_id === enderecamento.pessoa_enderecado_id
                )[0]
            )
                continue;

            if (enderecamento.pessoa_enderecado_id && !enderecamento.orgao_enderecado_id)
                throw new BadRequestException(
                    `Necessário enviar o órgão da pessoa ${enderecamento.pessoa_enderecado_id}`
                );

            if (!enderecamento.orgao_enderecado_id) throw new BadRequestException(`Necessário enviar o órgão`);

            let emailTo = '';

            if (enderecamento.pessoa_enderecado_id && enderecamento.orgao_enderecado_id) {
                const pessoaInfo = await prismaTx.pessoa.findFirstOrThrow({
                    where: {
                        desativado: false,
                        id: enderecamento.pessoa_enderecado_id,
                        pessoa_fisica: {
                            orgao_id: enderecamento.orgao_enderecado_id,
                        },
                    },
                    select: { id: true, email: true },
                });
                emailTo = pessoaInfo.email;
            } else {
                const orgaoInfo = await prismaTx.orgao.findFirstOrThrow({
                    where: {
                        removido_em: null,
                        id: enderecamento.orgao_enderecado_id,
                    },
                    select: { id: true, email: true, sigla: true },
                });
                if (orgaoInfo.email) emailTo = orgaoInfo.email;
            }

            await prismaTx.notaEnderecamento.create({
                data: {
                    criado_em: now,
                    criado_por: user_id,
                    nota_id: nota.id,
                    pessoa_enderecado_id: enderecamento.pessoa_enderecado_id,
                    orgao_enderecado_id: enderecamento.orgao_enderecado_id,
                },
            });
            await prismaTx.nota.update({
                where: { id: nota.id },
                data: { n_enderecamentos: { increment: 1 } },
            });

            if (nota.dispara_email && emailTo) {
                const objeto = await this.geraDadosEmail(nota.id, prismaTx);
                await prismaTx.emaildbQueue.create({
                    data: {
                        id: uuidv7(),
                        config_id: 1,
                        subject: `Novo encaminhamento - ${objeto.objeto}`,
                        template: 'nota-novo-encaminhamento.html',
                        to: emailTo,
                        variables: {
                            ...objeto,
                        },
                    },
                });
            }
        }

        for (const prevPortRow of prevVersions) {
            // pula as que continuam na lista
            if (
                dto.enderecamentos.filter(
                    (r) =>
                        r.orgao_enderecado_id === prevPortRow.orgao_enderecado_id &&
                        r.pessoa_enderecado_id === prevPortRow.pessoa_enderecado_id
                )[0]
            )
                continue;

            // remove o relacionamento
            await prismaTx.notaEnderecamento.update({
                where: {
                    id: prevPortRow.id,
                    removido_em: null,
                },
                data: {
                    removido_em: now,
                    removido_por: user_id,
                },
            });
            await prismaTx.nota.update({
                where: { id: nota.id },
                data: { n_enderecamentos: { decrement: 1 } },
            });
        }
    }

    async geraDadosEmail(notaId: number, prismaTx: Prisma.TransactionClient): Promise<DadosEmailInfo> {
        const baseUrl = await this.smaeConfigService.getBaseUrl('URL_LOGIN_SMAE');

        const bloco = await prismaTx.blocoNota.findFirstOrThrow({
            where: { Nota: { some: { id: notaId } } },
            select: {
                bloco: true,
                Nota: {
                    select: {
                        nota: true,
                    },
                },
            },
        });
        const ret: DadosEmailInfo = {
            objeto: '',
            link: '',
            nota: bloco.Nota[0].nota,
        };

        let url: URL;
        if (bloco.bloco.startsWith('Transf:')) {
            const transferencia = await prismaTx.transferencia.findFirstOrThrow({
                where: { id: +bloco.bloco.split(':')[1] },
                select: { id: true, identificador: true },
            });

            ret.objeto = `transferência ${transferencia.identificador}`;
            url = new URL([baseUrl, 'transferencias-voluntarias', transferencia.id, 'notas'].join('/'));
        } else if (bloco.bloco.startsWith('Proj:')) {
            const projeto = await prismaTx.projeto.findFirstOrThrow({
                where: { id: +bloco.bloco.split(':')[1] },
                select: { id: true, codigo: true, nome: true },
            });

            url = new URL([baseUrl, 'projetos', projeto.id, 'escopo'].join('/'));
            ret.objeto = `projeto ${projeto.codigo ? projeto.codigo + ' -' : ''} ${projeto.nome}`;
        } else {
            throw new Error(`Bloco não identificado ${bloco.bloco}`);
        }

        url.searchParams.append('nota_id', notaId.toString());
        ret.link = url.toString();

        return ret;
    }

    async remove(signedId: string, user: PessoaFromJwt) {
        const id = this.checkWritableToken(signedId);
        const created = await this.prisma.nota.updateMany({
            where: { id: id, removido_em: null },
            data: {
                removido_em: new Date(Date.now()),
                removido_por: user.id,
            },
        });

        return created;
    }

    checkToken(token: string): number {
        let decoded: JwtToken | null = null;
        try {
            decoded = this.jwtService.verify(token) as JwtToken;
        } catch (error) {
            console.log(error);
        }
        if (!decoded || ![JWT_AUD].includes(decoded.aud)) throw new BadRequestException('nota_id inválido');

        return decoded.nota_id;
    }

    private checkWritableToken(token: string): number {
        let decoded: JwtToken | null = null;
        try {
            decoded = this.jwtService.verify(token) as JwtToken;
        } catch (error) {
            console.log(error);
        }
        if (!decoded || ![JWT_AUD].includes(decoded.aud)) throw new BadRequestException('nota_id inválido');

        if (decoded.write == false)
            throw new BadRequestException(`Sem permissão de escrita na nota ${decoded.nota_id}`);

        return decoded.nota_id;
    }

    getToken(id: number, withWrite: boolean = false): string {
        return this.jwtService.sign(
            {
                nota_id: id,
                write: withWrite,
                aud: JWT_AUD,
            } satisfies JwtToken,
            { expiresIn: '30d' }
        );
    }

    private getTokenWithPerm(
        id: number,
        user: PessoaFromJwt,
        nota: Nota & { tipo_nota: TipoNota }
    ): { token: string; write: boolean } {
        let write = nota.pessoa_responsavel_id == user.id;

        if (nota.tipo_nota.eh_publico && !write && user.orgao_id) {
            // se não for publico, pode escrever se for do mesmo órgão
            write = nota.orgao_responsavel_id == user.orgao_id;
        }

        // Caso usuário tenha priv de gestor de distribuição de recurso
        // Não pode editar.
        if (user.hasSomeRoles(['SMAE.gestor_distribuicao_recurso'])) {
            write = false;
        }

        return {
            token: this.jwtService.sign(
                {
                    nota_id: id,
                    write: write,
                    aud: JWT_AUD,
                } satisfies JwtToken,
                { expiresIn: '30d' }
            ),
            write,
        };
    }

    async checkNotaValida(nota: Nota): Promise<boolean> {
        const bloco = await this.prisma.blocoNota.findFirst({
            where: { Nota: { some: { id: nota.id } } },
            select: { bloco: true },
        });
        if (!bloco) return false;

        if (bloco.bloco.startsWith('Transf:')) {
            const transferencia = await this.prisma.transferencia.findFirstOrThrow({
                where: { id: +bloco.bloco.split(':')[1] },
                select: { removido_em: true },
            });

            return !transferencia.removido_em;
        } else if (bloco.bloco.startsWith('Proj:')) {
            const projeto = await this.prisma.projeto.findFirstOrThrow({
                where: { id: +bloco.bloco.split(':')[1] },
                select: { removido_em: true },
            });

            return !projeto.removido_em;
        }

        return false;
    }

    async marcaLidoStatusComunicado(notaId: number, userId: number, lido: boolean): Promise<void> {
        await this.prisma.$transaction(async (prisma) => {
            const nota = await prisma.nota.findUnique({
                where: { id: notaId, tipo_nota_id: CONST_TIPO_NOTA_TRANSF_GOV },
                select: { usuarios_lidos: true },
            });

            if (!nota) throw new BadRequestException(`Comunicado não encontrado: ${notaId}`);

            let updatedUsuariosLidos: number[];
            if (lido) {
                updatedUsuariosLidos = [...new Set([...nota.usuarios_lidos, userId])];
            } else {
                updatedUsuariosLidos = nota.usuarios_lidos.filter((id) => id !== userId);
            }

            await prisma.nota.update({
                where: { id: notaId },
                data: { usuarios_lidos: updatedUsuariosLidos },
            });
        });
    }

    async listaComunicados(
        filters: FilterNotaComunicadoDto,
        user: PessoaFromJwt
    ): Promise<PaginatedDto<NotaComunicadoItemDto>> {
        const { lido, palavra_chave, data_inicio, data_fim } = filters;

        let offset = 0;
        const limit = filters.ipp ?? 20;

        if (data_inicio && data_fim && data_inicio.valueOf() > data_fim.valueOf())
            throw new BadRequestException('Data de início não pode ser maior que data de fim');

        if (filters.token_proxima_pagina) {
            const decodedToken = this.decodeNextPageToken(filters.token_proxima_pagina);
            if (decodedToken) {
                offset = decodedToken.offset;
            }
        }

        const where: Prisma.NotaWhereInput = {
            tipo_nota_id: CONST_TIPO_NOTA_TRANSF_GOV,
            removido_em: null,
        };

        if (lido !== undefined) {
            if (lido) {
                where.usuarios_lidos = { has: user.id };
            } else {
                where.NOT = [{ usuarios_lidos: { has: user.id } }];
            }
        }

        if (palavra_chave) {
            where.OR = [
                { titulo: { contains: palavra_chave, mode: 'insensitive' } },
                { nota: { contains: palavra_chave, mode: 'insensitive' } },
            ];
        }

        if (data_inicio) where.data_nota = { gte: data_inicio };
        if (data_fim) where.data_nota = where.data_nota ? { gte: data_inicio, lte: data_fim } : { lte: data_fim };

        if (filters.tipo) {
            where.dados = {
                path: ['tipo'],
                equals: filters.tipo,
            };
        }

        const comunicados = await this.prisma.nota.findMany({
            where,
            orderBy: { data_nota: 'desc' },
            skip: offset,
            take: limit + 1,
        });

        const tem_mais = comunicados.length > limit;
        if (tem_mais) {
            comunicados.pop();
        }

        const linhas = comunicados.map((comunicado): NotaComunicadoItemDto => {
            const dados =
                comunicado.dados?.valueOf() && typeof comunicado.dados?.valueOf() == 'object'
                    ? (comunicado.dados.valueOf() as any)
                    : null;

            const publicado_em = dados?.publicado_em ? DateTime.fromISO(dados.publicado_em) : null;

            return {
                id: comunicado.id,
                titulo: comunicado.titulo || '',
                conteudo: comunicado.nota,
                data: publicado_em && publicado_em.isValid ? publicado_em.toJSDate() : comunicado.data_nota,
                dados,
                lido: comunicado.usuarios_lidos.includes(user.id),
            };
        });

        const token_proxima_pagina = tem_mais ? this.encodeNextPageToken({ offset: offset + limit }) : null;

        return {
            token_ttl: PAGINATION_TOKEN_TTL,
            linhas,
            tem_mais,
            token_proxima_pagina,
        };
    }

    private decodeNextPageToken(jwt: string): NextPageTokenJwtBody | null {
        try {
            return this.jwtService.verify(jwt) as NextPageTokenJwtBody;
        } catch {
            throw new BadRequestException('Token próxima página inválido');
        }
    }

    private encodeNextPageToken(opt: NextPageTokenJwtBody): string {
        return this.jwtService.sign(opt);
    }
}
