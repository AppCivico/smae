import { HttpException, Injectable } from '@nestjs/common';
import { DistribuicaoSolicitacaoStatus, Prisma } from '@prisma/client';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { DistribuicaoRecursoService } from './distribuicao-recurso.service';
import { CreateDistribuicaoSolicitacaoAjusteDto } from './dto/create-distribuicao-solicitacao-ajuste.dto';
import { FilterDistribuicaoSolicitacaoAjusteDto } from './dto/filter-distribuicao-solicitacao-ajuste.dto';
import { GestaoDistribuicaoSolicitacaoAjusteDto } from './dto/gestao-distribuicao-solicitacao-ajuste.dto';
import { UpdateDistribuicaoSolicitacaoAjusteDto } from './dto/update-distribuicao-solicitacao-ajuste.dto';
import { UpdateDistribuicaoRecursoDto } from './dto/update-distribuicao-recurso.dto';
import {
    DistribuicaoSolicitacaoAjusteDto,
    ListDistribuicaoSolicitacaoAjusteDto,
} from './entities/distribuicao-solicitacao-ajuste.entity';

type CamposSolicitados = Record<string, { de: any; para: any }>;

const DISTRIBUICAO_SELECT_CAMPOS = {
    id: true,
    orgao_gestor_id: true,
    objeto: true,
    nome: true,
    valor: true,
    valor_total: true,
    valor_contrapartida: true,
    custeio: true,
    pct_custeio: true,
    investimento: true,
    pct_investimento: true,
    valor_empenho: true,
    valor_liquidado: true,
    empenho: true,
    data_empenho: true,
    programa_orcamentario_estadual: true,
    programa_orcamentario_municipal: true,
    dotacao: true,
    proposta: true,
    contrato: true,
    convenio: true,
    assinatura_termo_aceite: true,
    assinatura_municipio: true,
    assinatura_estado: true,
    vigencia: true,
    conclusao_suspensiva: true,
    distribuicao_banco: true,
    distribuicao_agencia: true,
    distribuicao_conta: true,
    rubrica_de_receita: true,
    finalidade: true,
    gestor_contrato: true,
} as const;

@Injectable()
export class DistribuicaoSolicitacaoAjusteService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly distribuicaoRecursoService: DistribuicaoRecursoService
    ) {}

    async create(dto: CreateDistribuicaoSolicitacaoAjusteDto, user: PessoaFromJwt): Promise<RecordWithId> {
        if (!user.orgao_id) throw new HttpException('Usuário não possui órgão associado.', 400);

        return await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient) => {
                const distribuicao = await prismaTxn.distribuicaoRecurso.findFirst({
                    where: { id: dto.distribuicao_recurso_id, removido_em: null },
                    select: DISTRIBUICAO_SELECT_CAMPOS,
                });

                if (!distribuicao) throw new HttpException('Distribuição de recurso não encontrada.', 404);

                if (distribuicao.orgao_gestor_id !== user.orgao_id) {
                    throw new HttpException(
                        'Você não tem permissão para solicitar ajuste nesta distribuição de recurso.',
                        403
                    );
                }

                const solicitacaoPendente = await prismaTxn.distribuicaoRecursoSolicitacaoAjuste.findFirst({
                    where: {
                        distribuicao_recurso_id: dto.distribuicao_recurso_id,
                        status: DistribuicaoSolicitacaoStatus.Pendente,
                        removido_em: null,
                    },
                    select: { id: true },
                });

                if (solicitacaoPendente) {
                    throw new HttpException(
                        `Já existe uma solicitação de ajuste pendente para esta distribuição (id: ${solicitacaoPendente.id}). Edite a solicitação existente.`,
                        400
                    );
                }

                const campos_solicitados = this.buildCamposSolicitados(dto, distribuicao);

                if (Object.keys(campos_solicitados).length === 0) {
                    throw new HttpException('Nenhum campo foi informado para solicitar ajuste.', 400);
                }

                const solicitacao = await prismaTxn.distribuicaoRecursoSolicitacaoAjuste.create({
                    data: {
                        distribuicao_recurso_id: dto.distribuicao_recurso_id,
                        orgao_gestor_id: distribuicao.orgao_gestor_id,
                        status: DistribuicaoSolicitacaoStatus.Pendente,
                        campos_solicitados: campos_solicitados as unknown as Prisma.JsonObject,
                        criado_por: user.id,
                        criado_em: new Date(),
                        atualizado_por: user.id,
                        atualizado_em: new Date(),
                    },
                    select: { id: true },
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
            select: {
                id: true,
                distribuicao_recurso_id: true,
                orgao_gestor_id: true,
                status: true,
                campos_solicitados: true,
                resposta_motivo: true,
                respondido_por: true,
                respondido_em: true,
                criado_por: true,
                criado_em: true,
                atualizado_por: true,
                atualizado_em: true,
            },
        });

        return { linhas: rows.map((r) => this.rowToDto(r)) };
    }

    async findOne(id: number, user: PessoaFromJwt): Promise<DistribuicaoSolicitacaoAjusteDto> {
        const where: Prisma.DistribuicaoRecursoSolicitacaoAjusteWhereInput = {
            id,
            removido_em: null,
            ...this.buildOrgaoFilter(user),
        };

        const row = await this.prisma.distribuicaoRecursoSolicitacaoAjuste.findFirst({
            where,
            select: {
                id: true,
                distribuicao_recurso_id: true,
                orgao_gestor_id: true,
                status: true,
                campos_solicitados: true,
                resposta_motivo: true,
                respondido_por: true,
                respondido_em: true,
                criado_por: true,
                criado_em: true,
                atualizado_por: true,
                atualizado_em: true,
            },
        });

        if (!row) throw new HttpException('Solicitação de ajuste não encontrada.', 404);

        return this.rowToDto(row);
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

                if (solicitacao.status !== DistribuicaoSolicitacaoStatus.Pendente) {
                    throw new HttpException('Apenas solicitações pendentes podem ser editadas.', 400);
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

                await prismaTxn.distribuicaoRecursoSolicitacaoAjuste.update({
                    where: { id },
                    data: {
                        campos_solicitados: campos_solicitados as unknown as Prisma.JsonObject,
                        atualizado_por: user.id,
                        atualizado_em: new Date(),
                    },
                });

                return { id };
            },
            { isolationLevel: 'ReadCommitted' }
        );
    }

    async remove(id: number, user: PessoaFromJwt): Promise<void> {
        if (!user.orgao_id) throw new HttpException('Usuário não possui órgão associado.', 400);

        await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient) => {
                const solicitacao = await prismaTxn.distribuicaoRecursoSolicitacaoAjuste.findFirst({
                    where: { id, removido_em: null, orgao_gestor_id: user.orgao_id },
                    select: { id: true, status: true },
                });

                if (!solicitacao) throw new HttpException('Solicitação de ajuste não encontrada.', 404);

                if (solicitacao.status !== DistribuicaoSolicitacaoStatus.Pendente) {
                    throw new HttpException('Apenas solicitações pendentes podem ser removidas.', 400);
                }

                await prismaTxn.distribuicaoRecursoSolicitacaoAjuste.update({
                    where: { id },
                    data: { removido_por: user.id, removido_em: new Date() },
                });
            },
            { isolationLevel: 'ReadCommitted' }
        );
    }

    async gestao(id: number, dto: GestaoDistribuicaoSolicitacaoAjusteDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const solicitacao = await this.prisma.distribuicaoRecursoSolicitacaoAjuste.findFirst({
            where: { id, removido_em: null },
            select: { id: true, status: true, distribuicao_recurso_id: true, campos_solicitados: true },
        });

        if (!solicitacao) throw new HttpException('Solicitação de ajuste não encontrada.', 404);

        if (solicitacao.status !== DistribuicaoSolicitacaoStatus.Pendente) {
            throw new HttpException('Apenas solicitações pendentes podem ser gerenciadas.', 400);
        }

        if (dto.status === 'Aprovada') {
            const campos = solicitacao.campos_solicitados as unknown as CamposSolicitados;

            const distribuicaoAtual = await this.distribuicaoRecursoService.findOne(
                solicitacao.distribuicao_recurso_id,
                user
            );

            const updateDto: UpdateDistribuicaoRecursoDto = {
                // Preserva os registros_sei existentes para o update não os remover
                registros_sei: (distribuicaoAtual.registros_sei ?? []).map((s) => ({
                    id: s.id,
                    nome: s.nome ?? undefined,
                    processo_sei: s.processo_sei,
                })),
            };

            for (const [campo, mudanca] of Object.entries(campos)) {
                (updateDto as any)[campo] = mudanca.para;
            }

            await this.distribuicaoRecursoService.update(solicitacao.distribuicao_recurso_id, updateDto, user);
        }

        await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient) => {
                await prismaTxn.distribuicaoRecursoSolicitacaoAjuste.update({
                    where: { id },
                    data: {
                        status: dto.status,
                        resposta_motivo: dto.resposta_motivo ?? null,
                        respondido_por: user.id,
                        respondido_em: new Date(),
                        atualizado_por: user.id,
                        atualizado_em: new Date(),
                    },
                });
            },
            { isolationLevel: 'ReadCommitted' }
        );

        return { id };
    }

    private buildOrgaoFilter(user: PessoaFromJwt): Prisma.DistribuicaoRecursoSolicitacaoAjusteWhereInput {
        if (user.hasSomeRoles(['CadastroDistribuicaoSolicitacaoAjuste.administrador'])) return {};
        if (!user.orgao_id) throw new HttpException('Usuário não possui órgão associado.', 400);
        return { orgao_gestor_id: user.orgao_id };
    }

    private buildCamposSolicitados(dto: Record<string, any>, distribuicao: Record<string, any>): CamposSolicitados {
        const ignoredKeys = new Set(['distribuicao_recurso_id']);
        const campos: CamposSolicitados = {};

        for (const [key, paraValue] of Object.entries(dto)) {
            if (ignoredKeys.has(key) || paraValue === undefined) continue;
            campos[key] = { de: distribuicao[key] ?? null, para: paraValue };
        }

        return campos;
    }

    private rowToDto(row: {
        id: number;
        distribuicao_recurso_id: number;
        orgao_gestor_id: number;
        status: DistribuicaoSolicitacaoStatus;
        campos_solicitados: any;
        resposta_motivo: string | null;
        respondido_por: number | null;
        respondido_em: Date | null;
        criado_por: number;
        criado_em: Date;
        atualizado_por: number | null;
        atualizado_em: Date;
    }): DistribuicaoSolicitacaoAjusteDto {
        return {
            id: row.id,
            distribuicao_recurso_id: row.distribuicao_recurso_id,
            orgao_gestor_id: row.orgao_gestor_id,
            status: row.status,
            campos_solicitados: row.campos_solicitados as Record<string, { de: any; para: any }>,
            resposta_motivo: row.resposta_motivo,
            respondido_por: row.respondido_por,
            respondido_em: row.respondido_em,
            criado_por: row.criado_por,
            criado_em: row.criado_em,
            atualizado_por: row.atualizado_por,
            atualizado_em: row.atualizado_em,
        };
    }
}
