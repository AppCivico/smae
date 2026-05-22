import { HttpException, Injectable, Logger } from '@nestjs/common';
import { DistribuicaoSolicitacaoStatus, Prisma } from '@prisma/client';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { CONST_PERFIL_CASA_CIVIL } from 'src/common/consts';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { SmaeConfigService } from 'src/common/services/smae-config.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { uuidv7 } from 'uuidv7';
import { DistribuicaoRecursoService } from './distribuicao-recurso.service';
import { CreateDistribuicaoSolicitacaoAjusteDto } from './dto/create-distribuicao-solicitacao-ajuste.dto';
import { FilterDistribuicaoSolicitacaoAjusteDto } from './dto/filter-distribuicao-solicitacao-ajuste.dto';
import { GestaoDistribuicaoSolicitacaoAjusteDto } from './dto/gestao-distribuicao-solicitacao-ajuste.dto';
import { UpdateDistribuicaoRecursoDto } from './dto/update-distribuicao-recurso.dto';
import { UpdateDistribuicaoSolicitacaoAjusteDto } from './dto/update-distribuicao-solicitacao-ajuste.dto';
import {
    DistribuicaoSolicitacaoAjusteDto,
    ListDistribuicaoSolicitacaoAjusteDto,
} from './entities/distribuicao-solicitacao-ajuste.entity';

type CamposSolicitados = Record<string, { de: unknown; para: unknown }>;

// Campos permitidos para ajuste — subconjunto dos campos de leitura.
// Exclui id, orgao_gestor_id, parlamentares, registros_sei, transferencia_id.
const DISTRIBUICAO_AJUSTE_CAMPOS: readonly string[] = [
    'objeto',
    'nome',
    'pct_custeio',
    'pct_investimento',
    'empenho',
    'data_empenho',
    'programa_orcamentario_estadual',
    'programa_orcamentario_municipal',
    'proposta',
    'contrato',
    'convenio',
    'assinatura_termo_aceite',
    'assinatura_municipio',
    'assinatura_estado',
    'vigencia',
    'conclusao_suspensiva',
    'distribuicao_banco',
    'distribuicao_agencia',
    'distribuicao_conta',
    'rubrica_de_receita',
    'finalidade',
    'gestor_contrato',
    'dotacoes',
    'justificativa_aditamento',
    'valor_empenho',
    'valor_liquidado',
] as const;

// Campos que não são colunas reais em DistribuicaoRecurso (são transitórios/DTO-only).
// São permitidos no ajuste, mas não devem ser usados em select/comparação contra a tabela.
const DISTRIBUICAO_AJUSTE_CAMPOS_VIRTUAIS: readonly string[] = ['justificativa_aditamento'] as const;

const DISTRIBUICAO_SELECT_CAMPOS = {
    id: true,
    orgao_gestor_id: true,
    ...Object.fromEntries(
        DISTRIBUICAO_AJUSTE_CAMPOS.filter(
            (c) => c !== 'dotacoes' && !DISTRIBUICAO_AJUSTE_CAMPOS_VIRTUAIS.includes(c)
        ).map((c) => [c, true])
    ),
    dotacoes: { where: { removido_em: null }, select: { dotacao: true } },
};

const SOLICITACAO_AJUSTE_SELECT = {
    id: true,
    distribuicao_recurso_id: true,
    orgao_gestor_id: true,
    orgao_gestor: { select: { id: true, sigla: true, descricao: true } },
    status: true,
    campos_solicitados: true,
    informacoes_complementares: true,
    resposta_motivo: true,
    respondido_por: true,
    respondido_em: true,
    criado_por: true,
    criado_em: true,
    criador: { select: { id: true, nome_exibicao: true } },
    atualizado_por: true,
    atualizado_em: true,
} satisfies Prisma.DistribuicaoRecursoSolicitacaoAjusteSelect;

type SolicitacaoAjusteRow = Prisma.DistribuicaoRecursoSolicitacaoAjusteGetPayload<{
    select: typeof SOLICITACAO_AJUSTE_SELECT;
}>;

@Injectable()
export class DistribuicaoSolicitacaoAjusteService {
    private readonly logger = new Logger(DistribuicaoSolicitacaoAjusteService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly distribuicaoRecursoService: DistribuicaoRecursoService,
        private readonly smaeConfigService: SmaeConfigService
    ) {}

    async create(dto: CreateDistribuicaoSolicitacaoAjusteDto, user: PessoaFromJwt): Promise<RecordWithId> {
        if (!user.orgao_id) throw new HttpException('Usuário não possui órgão associado.', 400);

        return await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient) => {
                const distribuicao = await prismaTxn.distribuicaoRecurso.findFirst({
                    where: { id: dto.distribuicao_recurso_id, removido_em: null },
                    select: {
                        ...DISTRIBUICAO_SELECT_CAMPOS,
                        nome: true,
                        transferencia: { select: { id: true, identificador: true } },
                        orgao_gestor: { select: { sigla: true } },
                    },
                });

                if (!distribuicao) throw new HttpException('Distribuição de recurso não encontrada.', 404);

                if (distribuicao.orgao_gestor_id !== user.orgao_id) {
                    throw new HttpException(
                        'Você não tem permissão para solicitar ajuste nesta distribuição de recurso.',
                        403
                    );
                }

                const solicitacaoEmRegistro = await prismaTxn.distribuicaoRecursoSolicitacaoAjuste.findFirst({
                    where: {
                        distribuicao_recurso_id: dto.distribuicao_recurso_id,
                        status: DistribuicaoSolicitacaoStatus.EmRegistro,
                        removido_em: null,
                    },
                    select: { id: true },
                });

                if (solicitacaoEmRegistro) {
                    throw new HttpException(
                        `Já existe uma solicitação de ajuste em rascunho para esta distribuição. Edite a solicitação existente.`,
                        400
                    );
                }

                const campos_solicitados = this.buildCamposSolicitados(dto, distribuicao);

                const solicitacaoPendente = await prismaTxn.distribuicaoRecursoSolicitacaoAjuste.findFirst({
                    where: {
                        distribuicao_recurso_id: dto.distribuicao_recurso_id,
                        status: DistribuicaoSolicitacaoStatus.Pendente,
                        removido_em: null,
                    },
                    select: { campos_solicitados: true },
                });

                if (solicitacaoPendente) {
                    const camposPendentes = solicitacaoPendente.campos_solicitados as Record<string, unknown> | null;
                    if (camposPendentes) {
                        const overlap = Object.keys(campos_solicitados).filter((c) => c in camposPendentes);
                        if (overlap.length > 0) {
                            throw new HttpException(
                                `Já existe uma solicitação pendente que inclui os campos: ${overlap.join(', ')}. Aguarde a resolução antes de solicitar ajuste nesses campos.`,
                                400
                            );
                        }
                    }
                }

                const solicitacao = await prismaTxn.distribuicaoRecursoSolicitacaoAjuste
                    .create({
                        data: {
                            distribuicao_recurso_id: dto.distribuicao_recurso_id,
                            orgao_gestor_id: distribuicao.orgao_gestor_id,
                            status: DistribuicaoSolicitacaoStatus.EmRegistro,
                            campos_solicitados: campos_solicitados as unknown as Prisma.JsonObject,
                            informacoes_complementares: dto.informacoes_complementares ?? null,
                            criado_por: user.id,
                            criado_em: new Date(),
                            atualizado_por: user.id,
                            atualizado_em: new Date(),
                        },
                        select: { id: true },
                    })
                    .catch((err: any) => {
                        if (err?.code === 'P2002') {
                            throw new HttpException(
                                'Já existe uma solicitação de ajuste em andamento para esta distribuição. Edite a solicitação existente.',
                                400
                            );
                        }
                        throw err;
                    });

                return { id: solicitacao.id };
            },
            { isolationLevel: 'ReadCommitted' }
        );
    }

    async findAll(
        filters: FilterDistribuicaoSolicitacaoAjusteDto,
        user: PessoaFromJwt
    ): Promise<ListDistribuicaoSolicitacaoAjusteDto> {
        const where: Prisma.DistribuicaoRecursoSolicitacaoAjusteWhereInput = { removido_em: null };

        if (filters.distribuicao_recurso_id) where.distribuicao_recurso_id = filters.distribuicao_recurso_id;
        if (filters.status) where.status = filters.status;

        const isAdmin = user.hasSomeRoles(['CadastroDistribuicaoSolicitacaoAjuste.administrador']);
        if (!isAdmin) {
            if (!user.orgao_id) throw new HttpException('Usuário não possui órgão associado.', 400);
            where.orgao_gestor_id = user.orgao_id;
        }

        const rows = await this.prisma.distribuicaoRecursoSolicitacaoAjuste.findMany({
            where,
            orderBy: { criado_em: 'desc' },
            select: SOLICITACAO_AJUSTE_SELECT,
        });

        return { linhas: rows.map((r) => this.rowToDto(r, user)) };
    }

    async findOne(id: number, user: PessoaFromJwt): Promise<DistribuicaoSolicitacaoAjusteDto> {
        const where: Prisma.DistribuicaoRecursoSolicitacaoAjusteWhereInput = {
            id,
            removido_em: null,
            ...this.buildOrgaoFilter(user),
        };

        const row = await this.prisma.distribuicaoRecursoSolicitacaoAjuste.findFirst({
            where,
            select: SOLICITACAO_AJUSTE_SELECT,
        });

        if (!row) throw new HttpException('Solicitação de ajuste não encontrada.', 404);

        return this.rowToDto(row, user);
    }

    async update(id: number, dto: UpdateDistribuicaoSolicitacaoAjusteDto, user: PessoaFromJwt): Promise<RecordWithId> {
        if (!user.orgao_id) throw new HttpException('Usuário não possui órgão associado.', 400);

        return await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient) => {
                const solicitacao = await prismaTxn.distribuicaoRecursoSolicitacaoAjuste.findFirst({
                    where: { id, removido_em: null, orgao_gestor_id: user.orgao_id },
                    select: { id: true, status: true, distribuicao_recurso_id: true },
                });

                if (!solicitacao) throw new HttpException('Solicitação de ajuste não encontrada.', 404);

                if (solicitacao.status !== DistribuicaoSolicitacaoStatus.EmRegistro) {
                    throw new HttpException('Apenas solicitações em registro podem ser editadas.', 400);
                }

                const distribuicao = await prismaTxn.distribuicaoRecurso.findFirst({
                    where: { id: solicitacao.distribuicao_recurso_id, removido_em: null },
                    select: DISTRIBUICAO_SELECT_CAMPOS,
                });

                if (!distribuicao) throw new HttpException('Distribuição de recurso não encontrada.', 404);

                const campos_solicitados = this.buildCamposSolicitados(dto, distribuicao);

                if (Object.keys(campos_solicitados).length === 0) {
                    throw new HttpException('Nenhum campo foi informado para solicitar ajuste.', 400);
                }

                const { count } = await prismaTxn.distribuicaoRecursoSolicitacaoAjuste.updateMany({
                    where: {
                        id,
                        orgao_gestor_id: user.orgao_id,
                        removido_em: null,
                        status: DistribuicaoSolicitacaoStatus.EmRegistro,
                    },
                    data: {
                        campos_solicitados: campos_solicitados as unknown as Prisma.JsonObject,
                        informacoes_complementares: dto.informacoes_complementares ?? undefined,
                        atualizado_por: user.id,
                        atualizado_em: new Date(),
                    },
                });

                if (count === 0) {
                    throw new HttpException('Solicitação não encontrada ou já foi processada.', 409);
                }

                return { id };
            },
            { isolationLevel: 'ReadCommitted' }
        );
    }

    async remove(id: number, user: PessoaFromJwt): Promise<void> {
        if (!user.orgao_id) throw new HttpException('Usuário não possui órgão associado.', 400);

        await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient) => {
                const { count } = await prismaTxn.distribuicaoRecursoSolicitacaoAjuste.updateMany({
                    where: {
                        id,
                        orgao_gestor_id: user.orgao_id,
                        removido_em: null,
                        status: DistribuicaoSolicitacaoStatus.EmRegistro,
                    },
                    data: { removido_por: user.id, removido_em: new Date() },
                });

                if (count === 0) {
                    throw new HttpException('Solicitação não encontrada, já processada ou sem permissão.', 409);
                }
            },
            { isolationLevel: 'ReadCommitted' }
        );
    }

    async submeter(id: number, user: PessoaFromJwt): Promise<RecordWithId> {
        if (!user.orgao_id) throw new HttpException('Usuário não possui órgão associado.', 400);

        return await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient) => {
                const solicitacao = await prismaTxn.distribuicaoRecursoSolicitacaoAjuste.findFirst({
                    where: { id, removido_em: null, orgao_gestor_id: user.orgao_id },
                    select: {
                        id: true,
                        status: true,
                        distribuicao_recurso_id: true,
                        campos_solicitados: true,
                    },
                });

                if (!solicitacao) throw new HttpException('Solicitação de ajuste não encontrada.', 404);

                if (solicitacao.status !== DistribuicaoSolicitacaoStatus.EmRegistro) {
                    throw new HttpException('Apenas solicitações em registro podem ser submetidas.', 400);
                }

                const jaExistePendente = await prismaTxn.distribuicaoRecursoSolicitacaoAjuste.findFirst({
                    where: {
                        distribuicao_recurso_id: solicitacao.distribuicao_recurso_id,
                        status: DistribuicaoSolicitacaoStatus.Pendente,
                        removido_em: null,
                        id: { not: id },
                    },
                    select: { id: true },
                });

                if (jaExistePendente) {
                    throw new HttpException(
                        'Já existe uma solicitação pendente para esta distribuição. Aguarde a resolução antes de submeter.',
                        400
                    );
                }

                const campos = solicitacao.campos_solicitados as unknown as CamposSolicitados;
                if (!campos || Object.keys(campos).length === 0) {
                    throw new HttpException(
                        'A solicitação deve ter ao menos um campo para ajuste antes de ser submetida.',
                        400
                    );
                }

                const { count } = await prismaTxn.distribuicaoRecursoSolicitacaoAjuste.updateMany({
                    where: {
                        id,
                        orgao_gestor_id: user.orgao_id,
                        removido_em: null,
                        status: DistribuicaoSolicitacaoStatus.EmRegistro,
                    },
                    data: {
                        status: DistribuicaoSolicitacaoStatus.Pendente,
                        atualizado_por: user.id,
                        atualizado_em: new Date(),
                    },
                });

                if (count === 0) {
                    throw new HttpException('Solicitação já foi submetida ou processada.', 409);
                }

                const distribuicao = await prismaTxn.distribuicaoRecurso.findFirst({
                    where: { id: solicitacao.distribuicao_recurso_id, removido_em: null },
                    select: {
                        nome: true,
                        transferencia: { select: { id: true, identificador: true } },
                        orgao_gestor: { select: { sigla: true } },
                    },
                });

                if (distribuicao) {
                    await this.enviarEmailSolicitacaoCriada(prismaTxn, distribuicao);
                }

                return { id };
            },
            { isolationLevel: 'ReadCommitted' }
        );
    }

    async gestao(id: number, dto: GestaoDistribuicaoSolicitacaoAjusteDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const solicitacao = await this.findOne(id, user);

        if (!solicitacao) throw new HttpException('Solicitação de ajuste não encontrada.', 404);
        if (!solicitacao.pode_aprovar) {
            throw new HttpException('Você não tem permissão para aprovar esta solicitação.', 403);
        }

        if (solicitacao.status !== DistribuicaoSolicitacaoStatus.Pendente) {
            throw new HttpException('Apenas solicitações pendentes podem ser gerenciadas.', 400);
        }

        if (dto.status === DistribuicaoSolicitacaoStatus.Aprovada) {
            const campos = solicitacao.campos_solicitados as unknown as CamposSolicitados;

            // Valida que os valores "de" ainda correspondem ao estado atual da distribuição.
            const distribuicaoAtual = await this.prisma.distribuicaoRecurso.findFirst({
                where: { id: solicitacao.distribuicao_recurso_id, removido_em: null },
                select: DISTRIBUICAO_SELECT_CAMPOS,
            });
            if (!distribuicaoAtual) throw new HttpException('Distribuição de recurso não encontrada.', 404);

            const camposDivergentes: string[] = [];
            for (const [campo, mudanca] of Object.entries(campos)) {
                if (!DISTRIBUICAO_AJUSTE_CAMPOS.includes(campo)) continue;
                // Campos virtuais (DTO-only) não têm estado na tabela para validar.
                if (DISTRIBUICAO_AJUSTE_CAMPOS_VIRTUAIS.includes(campo)) continue;
                const rawValue = (distribuicaoAtual as Record<string, unknown>)[campo];
                const valorAtual = this.normalizeValue(
                    campo === 'dotacoes' ? this.normalizeDotacoes(rawValue) : rawValue
                );
                const valorDe = this.normalizeValue(mudanca.de);
                if (JSON.stringify(valorAtual) !== JSON.stringify(valorDe)) {
                    camposDivergentes.push(campo);
                }
            }
            if (camposDivergentes.length > 0) {
                throw new HttpException(
                    `Os seguintes campos foram alterados desde a solicitação e divergem do valor original: ${camposDivergentes.join(', ')}. Recuse ou peça nova solicitação.`,
                    409
                );
            }

            const updateDto: UpdateDistribuicaoRecursoDto = {
                registros_sei: (
                    (await this.distribuicaoRecursoService.findOne(solicitacao.distribuicao_recurso_id, user))
                        .registros_sei ?? []
                ).map((s) => ({
                    id: s.id,
                    nome: s.nome ?? undefined,
                    processo_sei: s.processo_sei,
                })),
            };

            for (const [campo, mudanca] of Object.entries(campos)) {
                if (!DISTRIBUICAO_AJUSTE_CAMPOS.includes(campo)) continue;
                (updateDto as Record<string, unknown>)[campo] = mudanca.para;
            }

            await this.distribuicaoRecursoService.update(solicitacao.distribuicao_recurso_id, updateDto, user, {
                fromSolicitacaoId: solicitacao.id,
            });
        }

        // Conditional update: only update if status is still Pendente (race guard)
        const { count } = await this.prisma.distribuicaoRecursoSolicitacaoAjuste.updateMany({
            where: {
                id,
                status: DistribuicaoSolicitacaoStatus.Pendente,
                removido_em: null,
            },
            data: {
                status: dto.status,
                resposta_motivo: dto.resposta_motivo ?? null,
                respondido_por: user.id,
                respondido_em: new Date(),
                atualizado_por: user.id,
                atualizado_em: new Date(),
            },
        });

        if (count === 0) {
            throw new HttpException('Solicitação já foi processada por outro usuário.', 409);
        }

        if (dto.status === DistribuicaoSolicitacaoStatus.Recusada) {
            await this.enviarEmailSolicitacaoRecusada(
                solicitacao.distribuicao_recurso_id,
                solicitacao.criado_por,
                dto.resposta_motivo ?? null
            );
        }

        return { id };
    }

    private buildOrgaoFilter(user: PessoaFromJwt): Prisma.DistribuicaoRecursoSolicitacaoAjusteWhereInput {
        if (user.hasSomeRoles(['CadastroDistribuicaoSolicitacaoAjuste.administrador'])) return {};
        if (!user.orgao_id) throw new HttpException('Usuário não possui órgão associado.', 400);
        return { orgao_gestor_id: user.orgao_id };
    }

    private buildCamposSolicitados(dto: Record<string, any>, distribuicao: Record<string, any>): CamposSolicitados {
        const campos: CamposSolicitados = {};

        for (const [key, paraValue] of Object.entries(dto)) {
            if (!DISTRIBUICAO_AJUSTE_CAMPOS.includes(key) || paraValue === undefined) continue;
            // Campos virtuais (DTO-only) não têm estado "de" na tabela; armazena apenas "para".
            if (DISTRIBUICAO_AJUSTE_CAMPOS_VIRTUAIS.includes(key)) {
                campos[key] = { de: null, para: this.normalizeValue(paraValue) };
                continue;
            }
            const deRaw = key === 'dotacoes' ? this.normalizeDotacoes(distribuicao[key]) : (distribuicao[key] ?? null);
            const de = this.normalizeValue(deRaw);
            const para = this.normalizeValue(paraValue);
            if (JSON.stringify(de) === JSON.stringify(para)) continue;
            campos[key] = { de, para };
        }

        return campos;
    }

    private normalizeDotacoes(value: unknown): string[] {
        if (!Array.isArray(value)) return [];
        return value.map((d: { dotacao: string }) => d.dotacao).sort();
    }

    /** Normaliza valores para armazenamento JSON-safe (Dates → ISO string, Decimal → number). */
    private normalizeValue(value: unknown): unknown {
        if (value === null || value === undefined) return null;
        if (value instanceof Date) return value.toISOString();
        if (typeof value === 'object' && 'toNumber' in value && typeof (value as any).toNumber === 'function')
            return (value as any).toNumber();
        return value;
    }

    private async enviarEmailSolicitacaoCriada(
        prismaTx: Prisma.TransactionClient,
        distribuicao: {
            orgao_gestor: { sigla: string };
            transferencia: { id: number; identificador: string };
            nome: string | null;
        }
    ): Promise<void> {
        try {
            const baseUrl = await this.smaeConfigService.getBaseUrl('URL_LOGIN_SMAE');

            const orgaoSeri = await prismaTx.orgao.findFirst({
                where: { removido_em: null, sigla: 'SERI' },
                select: { id: true },
            });

            if (!orgaoSeri) {
                this.logger.warn('Órgão SERI não encontrado para envio de e-mail de solicitação de ajuste.');
                return;
            }

            const gestores = await prismaTx.pessoa.findMany({
                where: {
                    desativado: false,
                    PessoaPerfil: {
                        some: {
                            perfil_acesso: { nome: CONST_PERFIL_CASA_CIVIL },
                        },
                    },
                    pessoa_fisica: { orgao_id: orgaoSeri.id },
                },
                select: { email: true },
            });

            const link = new URL(
                ['transferencias-voluntarias', distribuicao.transferencia.id, 'resumo'].join('/'),
                baseUrl
            ).toString();

            for (const gestor of gestores) {
                await prismaTx.emaildbQueue.create({
                    data: {
                        id: uuidv7(),
                        config_id: 1,
                        subject: `SMAE - Solicitação de ajuste na distribuição da transferência ${distribuicao.transferencia.identificador}`,
                        template: 'solicitacao-ajuste-criada.html',
                        to: gestor.email,
                        variables: {
                            orgao_sigla: distribuicao.orgao_gestor.sigla,
                            transferencia_identificador: distribuicao.transferencia.identificador,
                            distribuicao_nome: distribuicao.nome ?? '',
                            link,
                        },
                    },
                });
            }
        } catch (err) {
            this.logger.error('Erro ao enviar e-mail de solicitação de ajuste criada', err);
        }
    }

    private async enviarEmailSolicitacaoRecusada(
        distribuicao_recurso_id: number,
        criado_por: number,
        motivo: string | null
    ): Promise<void> {
        try {
            const baseUrl = await this.smaeConfigService.getBaseUrl('URL_LOGIN_SMAE');

            const distribuicao = await this.prisma.distribuicaoRecurso.findFirst({
                where: { id: distribuicao_recurso_id, removido_em: null },
                select: {
                    nome: true,
                    transferencia: { select: { id: true, identificador: true } },
                },
            });

            if (!distribuicao) return;

            const criador = await this.prisma.pessoa.findFirst({
                where: { id: criado_por, desativado: false },
                select: { email: true },
            });

            if (!criador) {
                this.logger.warn(
                    `Criador (id=${criado_por}) da solicitação de ajuste não encontrado ou desativado. E-mail de recusa não enviado.`
                );
                return;
            }

            const link = new URL(
                ['transferencias-voluntarias', distribuicao.transferencia.id, 'resumo'].join('/'),
                baseUrl
            ).toString();

            await this.prisma.emaildbQueue.create({
                data: {
                    id: uuidv7(),
                    config_id: 1,
                    subject: `SMAE - Solicitação de ajuste recusada na transferência ${distribuicao.transferencia.identificador}`,
                    template: 'solicitacao-ajuste-recusada.html',
                    to: criador.email,
                    variables: {
                        transferencia_identificador: distribuicao.transferencia.identificador,
                        distribuicao_nome: distribuicao.nome ?? '',
                        motivo: motivo ?? '',
                        link,
                    },
                },
            });
        } catch (err) {
            this.logger.error('Erro ao enviar e-mail de solicitação de ajuste recusada', err);
        }
    }

    private rowToDto(row: SolicitacaoAjusteRow, user: PessoaFromJwt): DistribuicaoSolicitacaoAjusteDto {
        // CONST_PERFIL_GESTOR_DIST_RECURSO, que é o gestor (pediu solicitação)
        const pode_editar =
            row.status === DistribuicaoSolicitacaoStatus.EmRegistro &&
            user.hasSomeRoles(['SMAE.CadastroDistribuicaoSolicitacaoAjuste.editar']);

        // CONST_PERFIL_CASA_CIVIL, quem é o admin real
        const pode_aprovar =
            row.status === DistribuicaoSolicitacaoStatus.Pendente &&
            user.hasSomeRoles(['CadastroDistribuicaoSolicitacaoAjuste.administrador']);

        return {
            id: row.id,
            distribuicao_recurso_id: row.distribuicao_recurso_id,
            orgao_gestor_id: row.orgao_gestor_id,
            status: row.status,
            campos_solicitados: row.campos_solicitados as Record<string, { de: unknown; para: unknown }>,
            informacoes_complementares: row.informacoes_complementares,
            resposta_motivo: row.resposta_motivo,
            respondido_por: row.respondido_por,
            respondido_em: row.respondido_em,
            criado_por: row.criado_por,
            criado_em: row.criado_em,
            atualizado_por: row.atualizado_por,
            atualizado_em: row.atualizado_em,
            criador: row.criador,
            orgao_gestor: row.orgao_gestor,
            pode_editar,
            pode_aprovar,
        };
    }
}
