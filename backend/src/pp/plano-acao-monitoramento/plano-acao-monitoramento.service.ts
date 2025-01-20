import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { PrismaService } from '../../prisma/prisma.service';
import {
    CreatePlanoAcaoMonitoramentoDto,
    FilterPlanoAcaoMonitoramentoDto,
    UpdatePlanoAcaoMonitoramentoDto,
} from './dto/create-plano-acao-monitoramento.dto';
import { PlanoAcaoMonitoramentoDto } from './entities/plano-acao-monitoramento.entity';
import { Date2YMD } from '../../common/date2ymd';

@Injectable()
export class PlanoAcaoMonitoramentoService {
    constructor(private readonly prisma: PrismaService) {}

    async create(projetoId: number, dto: CreatePlanoAcaoMonitoramentoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const countProj = await this.prisma.planoAcao.count({
            where: {
                id: dto.plano_acao_id,
                projeto_risco: {
                    projeto_id: projetoId,
                },
            },
        });
        if (countProj == 0) throw new HttpException('Não foi encontrado nenhum plano de ação.', 404);

        const created = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const row = await prismaTx.planoAcaoMonitoramento.create({
                    data: {
                        criado_por: user.id,
                        criado_em: new Date(Date.now()),
                        data_afericao: dto.data_afericao,
                        descricao: dto.descricao,
                        plano_acao_id: dto.plano_acao_id,
                        ultima_revisao: false,
                    },
                    select: { id: true },
                });

                await this.updateUltimaRevisaoPelaDataAfericao(prismaTx, dto.plano_acao_id);

                return row;
            }
        );

        return created;
    }

    private async updateUltimaRevisaoPelaDataAfericao(prismaTx: Prisma.TransactionClient, plano_acao_id: number) {
        await prismaTx.$executeRaw`
        UPDATE plano_acao_monitoramento me
        SET ultima_revisao =
            me.id = (
                SELECT id
                FROM plano_acao_monitoramento
                WHERE plano_acao_id = ${plano_acao_id}
                AND removido_em IS NULL
                ORDER BY data_afericao desc, criado_em desc
                LIMIT 1
            )
        WHERE plano_acao_id = ${plano_acao_id}
        AND removido_em IS NULL`;
    }

    async update(
        projetoId: number,
        id: number,
        dto: UpdatePlanoAcaoMonitoramentoDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const self = await this.getPlanoAcao(id, projetoId);

        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            await prismaTx.planoAcaoMonitoramento.update({
                where: {
                    id: id,
                },
                data: {
                    ...dto,
                    atualizado_em: new Date(Date.now()),
                    atualizado_por: user.id,
                },
            });

            await this.updateUltimaRevisaoPelaDataAfericao(prismaTx, self.plano_acao_id);
        });

        return { id: self.id };
    }

    private async getPlanoAcao(id: number, projetoId: number) {
        const self = await this.prisma.planoAcaoMonitoramento.findFirst({
            where: {
                id: id,
                removido_em: null,
                plano_acao: {
                    projeto_risco: {
                        projeto_id: projetoId,
                    },
                },
            },
        });
        if (!self) throw new HttpException('Não foi encontrar o plano de ação.', 404);
        return self;
    }

    async findAll(
        projetoId: number,
        dto: FilterPlanoAcaoMonitoramentoDto,
        user: PessoaFromJwt
    ): Promise<PlanoAcaoMonitoramentoDto[]> {
        const listActive = await this.prisma.planoAcaoMonitoramento.findMany({
            where: {
                removido_em: null,
                ultima_revisao: dto.apenas_ultima_revisao ? true : undefined,
                plano_acao_id: dto.plano_acao_id,
                plano_acao: {
                    projeto_risco: {
                        projeto_id: projetoId,
                        id: dto.projeto_risco_id,
                    },
                },
            },
            orderBy: [{ data_afericao: 'desc' }, { criado_em: 'desc' }],
            select: {
                id: true,
                plano_acao_id: true,
                data_afericao: true,
                descricao: true,
                criado_em: true,
                criador: {
                    select: {
                        id: true,
                        nome_exibicao: true,
                    },
                },
                ultima_revisao: true,
            },
        });

        return listActive.map((row) => {
            return {
                ...row,
                data_afericao: Date2YMD.toString(row.data_afericao),
            };
        });
    }

    async remove(projetoId: number, id: number, user: PessoaFromJwt) {
        const self = await this.getPlanoAcao(id, projetoId);

        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            const updated = await prismaTx.planoAcaoMonitoramento.updateMany({
                where: {
                    id: id,
                    plano_acao: {
                        projeto_risco: {
                            projeto_id: projetoId,
                        },
                    },
                    removido_em: null,
                },
                data: {
                    removido_por: user.id,
                    removido_em: new Date(Date.now()),
                },
            });

            if (updated.count == 0)
                throw new HttpException(
                    'Nenhuma linha foi removida. Item pode já ter sido removido anteriormente.',
                    400
                );

            await this.updateUltimaRevisaoPelaDataAfericao(prismaTx, self.plano_acao_id);
        });
    }
}
