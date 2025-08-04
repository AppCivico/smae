import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { DotacaoService } from '../dotacao/dotacao.service';
import { PrismaService } from '../prisma/prisma.service';
import {
    CreateOrcamentoPlanejadoDto,
    FilterOrcamentoPlanejadoDto,
    UpdateOrcamentoPlanejadoDto,
} from './dto/orcamento-planejado.dto';
import { OrcamentoPlanejado } from './entities/orcamento-planejado.entity';
import { PlanoSetorialController } from '../pdm/pdm.controller';
import { TipoPdmType } from '../common/decorators/current-tipo-pdm';

@Injectable()
export class OrcamentoPlanejadoService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly dotacaoService: DotacaoService
    ) {}

    async create(tipo: TipoPdmType, dto: CreateOrcamentoPlanejadoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const dotacao = await this.prisma.dotacaoPlanejado.findFirst({
            where: { dotacao: dto.dotacao, ano_referencia: dto.ano_referencia },
            select: { id: true },
        });
        if (!dotacao) throw new HttpException('Dotação/projeto não foi ainda não foi importada no banco de dados', 400);

        const { meta_id, iniciativa_id, atividade_id } = await this.validaMetaIniAtv(dto);
        await user.verificaPermissaoOrcamentoPontoFocal(tipo, meta_id, this.prisma);

        const meta = await this.prisma.meta.findFirst({
            where: { id: meta_id, removido_em: null },
            select: { pdm_id: true, id: true },
        });
        if (meta === null) throw new HttpException('404', 404);

        const anoCount = await this.prisma.pdmOrcamentoConfig.count({
            where: { pdm_id: meta.pdm_id, ano_referencia: dto.ano_referencia, planejado_disponivel: true },
        });
        if (!anoCount)
            throw new HttpException('Ano de referencia não encontrado ou não está com o planejamento liberado', 400);

        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const now = new Date(Date.now());

                const countExisting = await prismaTxn.orcamentoPlanejado.count({
                    where: {
                        meta_id,
                        iniciativa_id,
                        atividade_id,
                        dotacao: dto.dotacao,
                        ano_referencia: dto.ano_referencia,
                        removido_em: null,
                    },
                });
                if (countExisting) {
                    // TODO puxar o rotulo do PDM
                    const categoria = atividade_id ? 'atividade' : iniciativa_id ? 'iniciativa' : 'meta';
                    throw new HttpException(
                        `Já existe um registro com a mesma dotação orçamentária associada na ${categoria}.`,
                        400
                    );
                }

                const orcamentoPlanejado = await prismaTxn.orcamentoPlanejado.create({
                    data: {
                        criado_por: user.id,
                        criado_em: now,
                        meta_id: meta_id!,
                        iniciativa_id,
                        atividade_id,
                        ano_referencia: dto.ano_referencia,
                        dotacao: dto.dotacao,
                        valor_planejado: dto.valor_planejado,
                    },
                    select: { id: true, valor_planejado: true, dotacao: true },
                });

                const dotacaoTx = await prismaTxn.dotacaoPlanejado.findFirst({
                    where: { id: dotacao.id },
                    select: { id: true },
                });
                if (!dotacaoTx)
                    throw new HttpException(
                        'Operação não pode ser realizada no momento. Dotação deixou de existir no meio da atualização.',
                        400
                    );

                // dispara a trigger
                await prismaTxn.dotacaoPlanejado.update({
                    where: { id: dotacao.id },
                    data: { id: dotacao.id },
                });

                return orcamentoPlanejado;
            },
            {
                isolationLevel: 'Serializable',
                maxWait: 5000,
                timeout: 100000,
            }
        );

        return created;
    }

    async update(
        tipo: TipoPdmType,
        id: number,
        dto: UpdateOrcamentoPlanejadoDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const orcamentoPlanejado = await this.prisma.orcamentoPlanejado.findFirst({
            where: { id: +id, removido_em: null },
        });
        if (!orcamentoPlanejado) throw new HttpException('Orçamento planejado não encontrado', 404);

        const { meta_id, iniciativa_id, atividade_id } = await this.validaMetaIniAtv(dto);
        await user.verificaPermissaoOrcamentoPontoFocal(tipo, meta_id, this.prisma);

        const meta = await this.prisma.meta.findFirstOrThrow({
            where: { id: meta_id, removido_em: null },
            select: { pdm_id: true, id: true },
        });

        const anoCount = await this.prisma.pdmOrcamentoConfig.count({
            where: {
                pdm_id: meta.pdm_id,
                ano_referencia: orcamentoPlanejado.ano_referencia,
                planejado_disponivel: true,
            },
        });
        if (!anoCount)
            throw new HttpException('Ano de referencia não encontrado ou não está com o planejamento liberado', 400);

        await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient) => {
                const orcamentoPlanejadoTx = await this.prisma.orcamentoPlanejado.findFirst({
                    where: { id: +id, removido_em: null },
                });
                if (!orcamentoPlanejadoTx)
                    throw new HttpException(
                        'Operação não pode ser realizada no momento. Registro deixou de existir no meio da atualização.',
                        400
                    );

                const dotacaoTx = await this.prisma.dotacaoPlanejado.findUnique({
                    where: {
                        ano_referencia_dotacao: {
                            ano_referencia: orcamentoPlanejado.ano_referencia,
                            dotacao: orcamentoPlanejado.dotacao,
                        },
                    },
                });
                if (!dotacaoTx)
                    throw new HttpException(
                        'Operação não pode ser realizada no momento. Dotação deixou de existir no meio da atualização.',
                        400
                    );

                const updated = await prismaTxn.orcamentoPlanejado.update({
                    where: {
                        id: orcamentoPlanejadoTx.id,
                    },
                    data: {
                        meta_id: meta_id!,
                        iniciativa_id,
                        atividade_id,
                        valor_planejado: dto.valor_planejado,
                    },
                    select: { id: true, dotacao: true, ano_referencia: true },
                });

                const countExisting = await prismaTxn.orcamentoPlanejado.count({
                    where: {
                        meta_id,
                        iniciativa_id,
                        atividade_id,
                        dotacao: updated.dotacao,
                        NOT: { id: updated.id },
                        ano_referencia: updated.ano_referencia,
                        removido_em: null,
                    },
                });
                if (countExisting) {
                    // TODO puxar o rotulo do PDM
                    const categoria = atividade_id ? 'atividade' : iniciativa_id ? 'iniciativa' : 'meta';
                    throw new HttpException(
                        `Já existe um registro com a mesma dotação orçamentária associada na ${categoria}.`,
                        400
                    );
                }

                // dispara a trigger
                await prismaTxn.dotacaoPlanejado.update({
                    where: { id: dotacaoTx.id },
                    data: { id: dotacaoTx.id },
                });
            },
            {
                isolationLevel: 'Serializable',
                maxWait: 5000,
                timeout: 100000,
            }
        );

        return { id: orcamentoPlanejado.id };
    }

    async validaMetaIniAtv(dto: { meta_id?: number; iniciativa_id?: number; atividade_id?: number }) {
        let meta_id: number | null = null;
        let iniciativa_id: number | null = null;
        let atividade_id: number | null = null;
        if (dto.atividade_id) {
            // prioridade buscar pela atividade
            const atividade = await this.prisma.atividade.findFirst({
                where: { id: dto.atividade_id, removido_em: null },
                select: { id: true, iniciativa_id: true, iniciativa: { select: { meta_id: true } } },
            });
            if (!atividade) throw new HttpException('atividade não encontrada', 400);
            atividade_id = atividade.id;
            iniciativa_id = atividade.iniciativa_id;
            meta_id = atividade.iniciativa.meta_id;
        } else if (dto.iniciativa_id) {
            const iniciativa = await this.prisma.iniciativa.findFirst({
                where: { id: dto.iniciativa_id, removido_em: null },
                select: { id: true, meta_id: true },
            });
            if (!iniciativa) throw new HttpException('iniciativa não encontrada', 400);
            iniciativa_id = iniciativa.id;
            meta_id = iniciativa.meta_id;
        } else if (dto.meta_id) {
            meta_id = dto.meta_id;
        }

        if (meta_id === undefined || meta_id == null)
            throw new HttpException('é necessário informar: meta, iniciativa ou atividade', 400);

        console.log({ meta_id, iniciativa_id, atividade_id });

        return { meta_id, iniciativa_id, atividade_id };
    }

    async findAll(
        tipo: TipoPdmType,
        filters: FilterOrcamentoPlanejadoDto,
        user: PessoaFromJwt
    ): Promise<OrcamentoPlanejado[]> {
        let filterIdIn: undefined | number[] = undefined;
        if (
            !user.hasSomeRoles([
                'CadastroMeta.administrador_orcamento',
                // TODO mais um local pra adicionar permissão de acordo com o nivel do PS
                ...PlanoSetorialController.OrcamentoWritePerms,
            ])
        )
            filterIdIn = await user.getMetaIdsFromAnyModel(this.prisma.view_meta_responsavel_orcamento);

        // TODO: basicamente aqui obriga a meta a ser passada, então da pra usar o findIds pra verificar as perms
        const meta = await this.prisma.meta.findFirst({
            where: { id: filters.meta_id, removido_em: null },
            select: { pdm_id: true },
        });
        if (!meta) throw new HttpException(`meta_id| Meta não foi encontrada`, 404);

        const queryRows = await this.prisma.orcamentoPlanejado.findMany({
            where: {
                meta_id: filters.meta_id,
                AND: [{ meta_id: filterIdIn ? { in: filterIdIn } : undefined }],
                removido_em: null,
                dotacao: filters?.dotacao,
                ano_referencia: filters.ano_referencia, // obrigatório para que o 'join' com a dotação seja feito sem complicações
            },
            select: {
                criador: { select: { nome_exibicao: true } },
                meta: { select: { id: true, codigo: true, titulo: true } },
                atividade: { select: { id: true, codigo: true, titulo: true } },
                iniciativa: { select: { id: true, codigo: true, titulo: true } },
                valor_planejado: true,
                ano_referencia: true,
                dotacao: true,
                criado_em: true,
                id: true,
            },
            orderBy: [{ meta_id: 'asc' }, { iniciativa_id: 'asc' }, { atividade_id: 'asc' }, { id: 'asc' }],
        });

        const dotacoesEncontradas: Record<string, boolean> = {};
        for (const op of queryRows) {
            if (dotacoesEncontradas[op.dotacao] == undefined) dotacoesEncontradas[op.dotacao] = true;
        }

        const dotacoesSomaInfo = await this.prisma.pdmDotacaoPlanejado.findMany({
            where: {
                pdm_id: meta.pdm_id,
                dotacao: { in: Object.keys(dotacoesEncontradas) },
                ano_referencia: filters.ano_referencia,
            },
            select: {
                soma_valor_planejado: true,
                pressao_orcamentaria: true,
                dotacao: true,
            },
        });
        const dotacoesSomaRef: Record<string, (typeof dotacoesSomaInfo)[0]> = {};
        for (const dotacao of dotacoesSomaInfo) {
            dotacoesSomaRef[dotacao.dotacao] = dotacao;
        }

        const dotacoesInfo = await this.prisma.dotacaoPlanejado.findMany({
            where: {
                dotacao: { in: Object.keys(dotacoesEncontradas) },
                ano_referencia: filters.ano_referencia,
            },
            select: {
                val_orcado_atualizado: true,
                val_orcado_inicial: true,
                saldo_disponivel: true,
                dotacao: true,
            },
        });
        const dotacoesRef: Record<string, (typeof dotacoesInfo)[0]> = {};
        for (const dotacao of dotacoesInfo) {
            dotacoesRef[dotacao.dotacao] = dotacao;
        }

        const rows: OrcamentoPlanejado[] = [];

        for (const orcamentoPlanejado of queryRows) {
            let pressao_orcamentaria: boolean | null = null;
            let pressao_orcamentaria_valor: string | null = null;
            let smae_soma_valor_planejado: string | null = null;

            let val_orcado_atualizado: string | null = null;
            let val_orcado_inicial: string | null = null;
            let saldo_disponivel: string | null = null;

            const dotacaoInfo = dotacoesRef[orcamentoPlanejado.dotacao];
            const dotacaoSomaInfo = dotacoesSomaRef[orcamentoPlanejado.dotacao] || {
                soma_valor_planejado: new Decimal(0),
                pressao_orcamentaria: false,
                dotacao: '',
            };

            if (dotacaoInfo) {
                pressao_orcamentaria = dotacaoSomaInfo.pressao_orcamentaria;
                if (pressao_orcamentaria) {
                    pressao_orcamentaria_valor = Number(
                        +dotacaoSomaInfo.soma_valor_planejado - +dotacaoInfo.val_orcado_atualizado
                    ).toFixed(2);
                }

                smae_soma_valor_planejado = dotacaoSomaInfo.soma_valor_planejado.toFixed(2);
                val_orcado_atualizado = dotacaoInfo.val_orcado_atualizado.toFixed(2);
                val_orcado_inicial = dotacaoInfo.val_orcado_inicial.toFixed(2);
                saldo_disponivel = dotacaoInfo.saldo_disponivel.toFixed(2);
            }

            rows.push({
                id: orcamentoPlanejado.id,
                ano_referencia: orcamentoPlanejado.ano_referencia,
                meta: orcamentoPlanejado.meta!,
                iniciativa: orcamentoPlanejado.iniciativa,
                atividade: orcamentoPlanejado.atividade,
                criado_em: orcamentoPlanejado.criado_em,
                criador: orcamentoPlanejado.criador,
                dotacao: orcamentoPlanejado.dotacao,
                valor_planejado: orcamentoPlanejado.valor_planejado,
                pressao_orcamentaria,
                pressao_orcamentaria_valor,

                // campos da dotação/sof
                smae_soma_valor_planejado,
                val_orcado_atualizado,
                val_orcado_inicial,
                saldo_disponivel,
                // campos pra ser populado depois
                projeto_atividade: '',
            });
        }
        await this.dotacaoService.setManyProjetoAtividade(rows);

        return rows;
    }

    async remove(tipo: TipoPdmType, id: number, user: PessoaFromJwt) {
        const orcamentoPlanejado = await this.prisma.orcamentoPlanejado.findFirst({
            where: { id: +id, removido_em: null },
        });
        if (!orcamentoPlanejado || orcamentoPlanejado.meta_id === null)
            throw new HttpException('Orçamento planejado não encontrado', 404);

        await user.verificaPermissaoOrcamentoPontoFocal(tipo, orcamentoPlanejado.meta_id, this.prisma);

        const now = new Date(Date.now());

        await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient) => {
                const linhasAfetadas = await prismaTxn.orcamentoPlanejado.updateMany({
                    where: { id: +id, removido_em: null }, // nao apagar duas vezes
                    data: { removido_em: now, removido_por: user.id },
                });

                if (linhasAfetadas.count == 1) {
                    const dotacaoAgora = await prismaTxn.dotacaoPlanejado.findFirstOrThrow({
                        where: {
                            dotacao: orcamentoPlanejado.dotacao,
                            ano_referencia: orcamentoPlanejado.ano_referencia,
                        },
                        select: { id: true },
                    });

                    // dispara a trigger
                    await prismaTxn.dotacaoPlanejado.update({
                        where: { id: dotacaoAgora.id },
                        data: { id: dotacaoAgora.id },
                    });
                }
            },
            {
                isolationLevel: 'Serializable',
            }
        );
    }
}
