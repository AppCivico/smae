import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrcamentoPlanejadoDto, FilterOrcamentoPlanejadoDto, UpdateOrcamentoPlanejadoDto } from './dto/orcamento-planejado.dto';
import { OrcamentoPlanejado } from './entities/orcamento-planejado.entity';

@Injectable()
export class OrcamentoPlanejadoService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateOrcamentoPlanejadoDto, user: PessoaFromJwt): Promise<RecordWithId> {

        const dotacao = await this.prisma.dotacaoPlanejado.findFirst({
            where: { dotacao: dto.dotacao, ano_referencia: dto.ano_referencia },
            select: { id: true }
        });
        if (!dotacao) throw new HttpException('Dotação não foi ainda não foi importada no banco de dados', 400);

        const { meta_id, iniciativa_id, atividade_id } = await this.validaMetaIniAtv(dto);

        const meta = await this.prisma.meta.findFirst({
            where: { id: meta_id!, removido_em: null },
            select: { pdm_id: true, id: true }
        });
        if (!meta) throw new HttpException('meta não encontrada', 400);

        const anoCount = await this.prisma.pdmOrcamentoConfig.count({
            where: { pdm_id: meta.pdm_id, ano_referencia: dto.ano_referencia, planejado_disponivel: true }
        });
        if (!anoCount) throw new HttpException('Ano de referencia não encontrado ou não está com o planejamento liberado', 400);

        const created = await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {

            const now = new Date(Date.now());

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
                select: { id: true, valor_planejado: true }
            });

            const dotacaoTx = await prismaTxn.dotacaoPlanejado.findFirst({
                where: { id: dotacao.id },
                select: { smae_soma_valor_planejado: true, empenho_liquido: true }
            });
            if (!dotacaoTx) throw new HttpException('Operação não pode ser realizada no momento. Dotação deixou de existir no meio da atualização.', 400);

            const smae_soma_valor_planejado = dotacaoTx.smae_soma_valor_planejado + orcamentoPlanejado.valor_planejado;
            await prismaTxn.dotacaoPlanejado.update({
                where: { id: dotacao.id },
                data: {
                    pressao_orcamentaria: smae_soma_valor_planejado > dotacaoTx.empenho_liquido,
                    smae_soma_valor_planejado: smae_soma_valor_planejado
                }
            });

            return orcamentoPlanejado;
        }, {
            isolationLevel: 'Serializable',
            maxWait: 5000,
            timeout: 100000
        });

        return created;
    }

    async update(id: number, dto: UpdateOrcamentoPlanejadoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const orcamentoPlanejado = await this.prisma.orcamentoPlanejado.findFirst({
            where: { id: +id, removido_em: null },
        });
        if (!orcamentoPlanejado) throw new HttpException('Orçamento planejado não encontrado', 404);
        console.log(dto);

        const { meta_id, iniciativa_id, atividade_id } = await this.validaMetaIniAtv(dto);

        const meta = await this.prisma.meta.findFirst({
            where: { id: meta_id!, removido_em: null },
            select: { pdm_id: true, id: true }
        });
        if (!meta) throw new HttpException('meta não encontrada', 400);

        const anoCount = await this.prisma.pdmOrcamentoConfig.count({
            where: { pdm_id: meta.pdm_id, ano_referencia: orcamentoPlanejado.ano_referencia, planejado_disponivel: true }
        });
        if (!anoCount) throw new HttpException('Ano de referencia não encontrado ou não está com o planejamento liberado', 400);

        const updated = await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {

            const now = new Date(Date.now());

            const orcamentoPlanejadoTx = await this.prisma.orcamentoPlanejado.findFirst({
                where: { id: +id, removido_em: null, },
            });
            if (!orcamentoPlanejadoTx) throw new HttpException('Operação não pode ser realizada no momento. Registro deixou de existir no meio da atualização.', 400);

            const dotacaoTx = await this.prisma.dotacaoPlanejado.findUnique({
                where: {
                    ano_referencia_dotacao: {
                        ano_referencia: orcamentoPlanejado.ano_referencia,
                        dotacao: orcamentoPlanejado.dotacao,
                    }
                },
            });
            if (!dotacaoTx) throw new HttpException('Operação não pode ser realizada no momento. Dotação deixou de existir no meio da atualização.', 400);

            const novo_saldo = dotacaoTx.smae_soma_valor_planejado - orcamentoPlanejadoTx.valor_planejado + dto.valor_planejado;
            const nova_pressao = novo_saldo > dotacaoTx.empenho_liquido;

            await prismaTxn.orcamentoPlanejado.update({
                where: {
                    id: orcamentoPlanejadoTx.id,
                },
                data: {
                    meta_id: meta_id!,
                    iniciativa_id,
                    atividade_id,
                    valor_planejado: dto.valor_planejado,
                },
            });

            await prismaTxn.dotacaoPlanejado.update({
                where: { id: dotacaoTx.id },
                data: {
                    pressao_orcamentaria: nova_pressao,
                    smae_soma_valor_planejado: novo_saldo
                }
            });

            return orcamentoPlanejadoTx;
        }, {
            isolationLevel: 'Serializable',
            maxWait: 5000,
            timeout: 100000
        });

        return updated;
    }

    async validaMetaIniAtv(dto: {
        meta_id?: number
        iniciativa_id?: number
        atividade_id?: number
    }) {
        let meta_id: number | undefined;
        let iniciativa_id: number | undefined;
        let atividade_id: number | undefined;
        if (dto.atividade_id) { // prioridade buscar pela atividade
            const atividade = await this.prisma.atividade.findFirst({
                where: { id: dto.atividade_id, removido_em: null },
                select: { id: true, iniciativa_id: true, iniciativa: { select: { meta_id: true } } }
            });
            if (!atividade)
                throw new HttpException('atividade não encontrada', 400);
            atividade_id = atividade.id;
            iniciativa_id = atividade.iniciativa_id;
            meta_id = atividade.iniciativa.meta_id;

        } else if (dto.iniciativa_id) {
            const iniciativa = await this.prisma.iniciativa.findFirst({
                where: { id: dto.iniciativa_id, removido_em: null },
                select: { id: true, meta_id: true }
            });
            if (!iniciativa)
                throw new HttpException('iniciativa não encontrada', 400);
            iniciativa_id = iniciativa.id;
            meta_id = iniciativa.meta_id;

        } else if (dto.meta_id) {
            meta_id = dto.meta_id;
        }

        if (meta_id === undefined)
            new HttpException('é necessário informar: meta, iniciativa ou atividade', 400);

        return { meta_id: meta_id, iniciativa_id, atividade_id };
    }

    async findAll(filters: FilterOrcamentoPlanejadoDto): Promise<OrcamentoPlanejado[]> {

        const queryRows = await this.prisma.orcamentoPlanejado.findMany({
            where: {
                dotacao: filters?.dotacao,
                meta_id: filters?.meta_id,
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
            orderBy: [
                { meta_id: 'asc' },
                { iniciativa_id: 'asc' },
                { atividade_id: 'asc' },
                { id: 'asc' }
            ]
        });

        const dotacoesEncontradas: Record<string, boolean> = {};
        for (const op of queryRows) {
            if (dotacoesEncontradas[op.dotacao] == undefined) dotacoesEncontradas[op.dotacao] = true;
        }
        const dotacoesInfo = await this.prisma.dotacaoPlanejado.findMany({
            where: {
                dotacao: { in: Object.keys(dotacoesEncontradas) },
                ano_referencia: filters.ano_referencia,
            },
            select: {
                pressao_orcamentaria: true,
                empenho_liquido: true,
                smae_soma_valor_planejado: true,
                dotacao: true,
            }
        });
        const dotacoesRef: Record<string, typeof dotacoesInfo[0]> = {};
        for (const dotacao of dotacoesInfo) {
            dotacoesRef[dotacao.dotacao] = dotacao;
        }

        const rows: OrcamentoPlanejado[] = [];

        for (const orcamentoPlanejado of queryRows) {

            let pressao_orcamentaria: boolean | null = null;
            let pressao_orcamentaria_valor: string | null = null;
            let smae_soma_valor_planejado: string | null = null;
            let empenho_liquido: string | null = null;

            let dotacaoInfo = dotacoesRef[orcamentoPlanejado.dotacao];
            if (dotacaoInfo) {
                pressao_orcamentaria = dotacaoInfo.pressao_orcamentaria;
                if (pressao_orcamentaria) {
                    pressao_orcamentaria_valor = Number(dotacaoInfo.smae_soma_valor_planejado - dotacaoInfo.empenho_liquido).toFixed(2);
                }

                smae_soma_valor_planejado = dotacaoInfo.smae_soma_valor_planejado.toFixed(2);
                empenho_liquido = dotacaoInfo.empenho_liquido.toFixed(2);
            }

            rows.push({
                id: orcamentoPlanejado.id,
                ano_referencia: orcamentoPlanejado.ano_referencia,
                meta: orcamentoPlanejado.meta,
                iniciativa: orcamentoPlanejado.iniciativa,
                atividade: orcamentoPlanejado.atividade,
                criado_em: orcamentoPlanejado.criado_em,
                criador: orcamentoPlanejado.criador,
                dotacao: orcamentoPlanejado.dotacao,
                valor_planejado: orcamentoPlanejado.valor_planejado,
                pressao_orcamentaria,
                pressao_orcamentaria_valor,
                smae_soma_valor_planejado,
                empenho_liquido,
            });

        }

        return rows;
    }

    async remove(id: number, user: PessoaFromJwt) {
        const orcamentoPlanejado = await this.prisma.orcamentoPlanejado.findFirst({
            where: { id: +id, removido_em: null },
        });
        if (!orcamentoPlanejado) throw new HttpException('Orçamento planejado não encontrado', 404);

        const now = new Date(Date.now());

        await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient) => {
            const linhasAfetadas = await prismaTxn.orcamentoPlanejado.updateMany({
                where: { id: +id, removido_em: null }, // nao apagar duas vezes
                data: { removido_em: now, removido_por: user.id }
            });

            if (linhasAfetadas.count == 1) {
                const dotacaoAgora = await prismaTxn.dotacaoPlanejado.findFirstOrThrow({
                    where: { dotacao: orcamentoPlanejado.dotacao, ano_referencia: orcamentoPlanejado.ano_referencia },
                    select: { smae_soma_valor_planejado: true, empenho_liquido: true, id: true }
                });

                const smae_soma_valor_planejado = dotacaoAgora.smae_soma_valor_planejado - orcamentoPlanejado.valor_planejado;
                await prismaTxn.dotacaoPlanejado.update({
                    where: { id: dotacaoAgora.id },
                    data: {
                        pressao_orcamentaria: smae_soma_valor_planejado > dotacaoAgora.empenho_liquido,
                        smae_soma_valor_planejado: smae_soma_valor_planejado
                    }
                });
            }
        }, {
            isolationLevel: 'Serializable',
        });

    }


}
