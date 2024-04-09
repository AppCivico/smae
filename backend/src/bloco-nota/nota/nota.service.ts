import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Nota, Prisma, TipoNota } from '@prisma/client';
import { uuidv7 } from 'uuidv7';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { BlocoNotaService } from '../bloco-nota/bloco-nota.service';
import { TipoNotaService } from '../tipo-nota/tipo-nota.service';
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
import { HtmlSanitizer } from '../../common/html-sanitizer';

const JWT_AUD = 'nt';
type JwtToken = {
    nota_id: number;
    write: boolean;
    aud: string;
};

type DadosEmailInfo = {
    objeto: string;
    link: string;
};

@Injectable()
export class NotaService {
    baseUrl: string;
    constructor(
        private readonly jwtService: JwtService,
        private readonly blocoService: BlocoNotaService,
        private readonly tipoService: TipoNotaService,
        private readonly prisma: PrismaService
    ) {
        const parsedUrl = new URL(process.env.URL_LOGIN_SMAE || 'http://smae-frontend/');
        this.baseUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}:${parsedUrl.port}`;
    }

    async create(dto: CreateNotaDto, user: PessoaFromJwt): Promise<RecordWithIdJwt> {
        const blocoId = this.blocoService.checkToken(dto.bloco_token);
        const tipo = await this.tipoService.findOneOrThrow(dto.tipo_nota_id);
        dto.nota = HtmlSanitizer(dto.nota);

        if (!tipo.permite_revisao && dto.rever_em) delete dto.rever_em;
        if (!tipo.permite_email && dto.dispara_email) dto.dispara_email = false;

        if (!user.orgao_id) throw new BadRequestException('Necessário ter órgão para criar uma nota');

        const now = new Date(Date.now());
        const token = await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            const nota = await prismaTx.nota.create({
                data: {
                    data_nota: dto.data_nota,
                    nota: dto.nota,
                    status: dto.status,
                    dispara_email: dto.dispara_email,
                    rever_em: dto.rever_em,

                    bloco_nota_id: blocoId,
                    criado_por: user.id,
                    orgao_responsavel_id: user.orgao_id!,
                    pessoa_responsavel_id: user.id,
                    tipo_nota_id: tipo.id,
                },
                select: {
                    id: true,
                    nota: true,
                    dispara_email: true,
                },
            });

            if (tipo.permite_enderecamento)
                await this.upsertEnderecamentos(prismaTx, nota.id, dto, now, user, nota, nota);

            return this.getToken(nota.id);
        });

        return {
            id_jwt: token,
        };
    }

    async findAll(filters: BuscaNotaDto, user: PessoaFromJwt): Promise<TipoNotaItem[]> {
        if (!filters.status) filters.status = ['Programado', 'Em_Curso'];

        const rows = await this.prisma.nota.findMany({
            where: {
                removido_em: null,
                bloco_nota_id: {
                    in: filters.blocos_token.map((b) => this.blocoService.checkToken(b)),
                },
                status: { in: filters.status },

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
                return {
                    id_jwt: this.getTokenWithPerm(r.id, user, r),
                    bloco_token: this.blocoService.getToken(r.bloco_nota_id),
                    data_nota: r.data_nota,
                    dispara_email: r.dispara_email,
                    nota: r.nota,
                    status: r.status,
                    tipo_nota_id: r.tipo_nota_id,
                    orgao_responsavel: r.orgao_responsavel,
                    data_ordenacao: r.rever_em ? r.rever_em : r.data_nota,
                    bloco_id: r.bloco_nota_id,
                    pessoa_responsavel: r.pessoa_responsavel,
                    n_enderecamentos: r.n_enderecamentos,
                    n_repostas: r.n_repostas,
                    ultima_resposta: r.ultima_resposta,
                };
            })
            .sort((a, b) => {
                if (a.bloco_id !== b.bloco_id) {
                    return a.bloco_id - b.bloco_id;
                } else {
                    return a.data_ordenacao.getTime() - b.data_ordenacao.getTime();
                }
            });
    }

    async findOne(signedId: string, user: PessoaFromJwt): Promise<TipoNotaDetail> {
        const id = this.checkToken(signedId);

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

        return {
            id_jwt: this.getTokenWithPerm(r.id, user, r),
            bloco_token: this.blocoService.getToken(r.bloco_nota_id),
            data_nota: r.data_nota,
            dispara_email: r.dispara_email,
            nota: r.nota,
            status: r.status,
            tipo_nota_id: r.tipo_nota_id,
            orgao_responsavel: r.orgao_responsavel,
            data_ordenacao: r.rever_em ? r.rever_em : r.data_nota,
            bloco_id: r.bloco_nota_id,
            pessoa_responsavel: r.pessoa_responsavel,
            n_enderecamentos: r.n_enderecamentos,
            n_repostas: r.n_repostas,
            ultima_resposta: r.ultima_resposta,
            enderecamentos: r.NotaEnderecamento,
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
                            nota: nota.nota,
                            resposta: dto.resposta,
                            ...objeto,
                        },
                    },
                });
            }

            return r;
        });
    }

    async update(signedId: string, dto: UpdateNotaDto, user: PessoaFromJwt): Promise<RecordWithIdJwt> {
        const id = this.checkWritableToken(signedId);
        dto.nota = HtmlSanitizer(dto.nota);

        console.log(id);

        const nota = await this.prisma.nota.findFirstOrThrow({
            where: { id: id, removido_em: null },
            select: {
                id: true,
                dispara_email: true,
                nota: true,
                tipo_nota: { select: { permite_revisao: true, permite_enderecamento: true } },
            },
        });

        if (nota.tipo_nota.permite_revisao && dto.rever_em) delete dto.rever_em;

        const now = new Date(Date.now());
        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            if (dto.nota && dto.nota !== nota.nota)
                await prismaTx.notaRevisao.create({
                    data: { criado_por: user.id, nota: nota.nota, nota_id: nota.id },
                });

            const updated = await prismaTx.nota.update({
                where: { id },
                data: {
                    nota: dto.nota,
                    status: dto.status,
                    data_nota: dto.data_nota,
                    dispara_email: dto.dispara_email,
                    rever_em: dto.rever_em,
                },
                select: {
                    nota: true,
                },
            });

            if (nota.tipo_nota.permite_enderecamento)
                await this.upsertEnderecamentos(prismaTx, id, dto, now, user, nota, updated);
        });

        return { id_jwt: this.getToken(id) };
    }

    private async upsertEnderecamentos(
        prismaTx: Prisma.TransactionClient,
        id: number,
        dto: UpdateNotaDto,
        now: Date,
        user: PessoaFromJwt,
        nota: { nota: string; id: number; dispara_email: boolean },
        updated: { nota: string }
    ) {
        if (!Array.isArray(dto.enderecamentos)) return;

        const prevVersions = await prismaTx.notaEnderecamento.findMany({
            where: { nota_id: id, removido_em: null },
        });

        for (const enderecamento of dto.enderecamentos) {
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
                    criado_por: user.id,
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
                            nota: updated.nota,
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
                    removido_por: user.id,
                },
            });
            await prismaTx.nota.update({
                where: { id: nota.id },
                data: { n_enderecamentos: { decrement: 1 } },
            });
        }
    }

    private async geraDadosEmail(notaId: number, prismaTx: Prisma.TransactionClient): Promise<DadosEmailInfo> {
        const bloco = await prismaTx.blocoNota.findFirst({
            where: { Nota: { some: { id: notaId } } },
            select: {
                bloco: true,
            },
        });
        const ret: DadosEmailInfo = {
            objeto: '',
            link: '',
        };
        if (!bloco) return ret;

        if (bloco.bloco.startsWith('Transf:')) {
            const transferencia = await prismaTx.transferencia.findFirstOrThrow({
                where: { id: +bloco.bloco.split(':')[1] },
                select: { id: true, identificador: true },
            });

            ret.objeto = `transferência ${transferencia.identificador}`;
            ret.link = [this.baseUrl, 'transferencias-voluntarias', transferencia.id, 'detalhes'].join('/');
        } else if (bloco.bloco.startsWith('Proj:')) {
            const projeto = await prismaTx.projeto.findFirstOrThrow({
                where: { id: +bloco.bloco.split(':')[1] },
                select: { id: true, codigo: true, nome: true },
            });

            ret.objeto = `projeto ${projeto.codigo ? projeto.codigo + ' -' : ''} ${projeto.nome}`;
            ret.link = [this.baseUrl, 'projetos', projeto.id, 'escopo'].join('/');
        }

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

    private checkToken(token: string): number {
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

    private getToken(id: number): string {
        return this.jwtService.sign(
            {
                nota_id: id,
                write: false,
                aud: JWT_AUD,
            } satisfies JwtToken,
            { expiresIn: '30d' }
        );
    }

    private getTokenWithPerm(id: number, user: PessoaFromJwt, nota: Nota & { tipo_nota: TipoNota }): string {
        let write = nota.pessoa_responsavel_id == user.id;

        if (nota.tipo_nota.eh_publico && !write && user.orgao_id) {
            // se não for publico, pode escrever se for do mesmo órgão
            write = nota.orgao_responsavel_id == user.orgao_id;
        }

        return this.jwtService.sign(
            {
                nota_id: id,
                write: write,
                aud: JWT_AUD,
            } satisfies JwtToken,
            { expiresIn: '30d' }
        );
    }
}
