import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePlanoAcaoMonitoramentoDto, FilterPlanoAcaoMonitoramentoDto, UpdatePlanoAcaoMonitoramentoDto } from './dto/create-plano-acao-monitoramento.dto';
import { PlanoAcaoMonitoramentoDto } from './entities/plano-acao-monitoramento.entity';


@Injectable()
export class PlanoAcaoMonitoramentoService {
    constructor(private readonly prisma: PrismaService) { }

    async create(projetoId: number, dto: CreatePlanoAcaoMonitoramentoDto, user: PessoaFromJwt): Promise<RecordWithId> {

        const countProj = await this.prisma.planoAcao.count({
            where: {
                id: dto.plano_acao_id,
                projeto_risco: {
                    projeto_id: projetoId,
                }
            }
        });
        if (countProj == 0) throw new HttpException("Não foi encontrado nenhum plano de ação.", 404);

        const created = await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {

            await prismaTx.planoAcaoMonitoramento.updateMany({
                where: {
                    ultima_revisao: true,
                    plano_acao_id: dto.plano_acao_id,
                },
                data: {
                    ultima_revisao: false,
                }
            });

            const row = await prismaTx.planoAcaoMonitoramento.create({
                data: {
                    criado_por: user.id,
                    criado_em: new Date(Date.now()),
                    data_afericao: dto.data_afericao,
                    descricao: dto.descricao,
                    plano_acao_id: dto.plano_acao_id,
                    ultima_revisao: true
                },
                select: { id: true },
            });

            return row;
        });

        return created;
    }

    async update(projetoId: number, id: number, dto: UpdatePlanoAcaoMonitoramentoDto, user: PessoaFromJwt): Promise<RecordWithId> {

        const self = await this.prisma.planoAcaoMonitoramento.findFirst({
            where: {
                id: id,
                removido_em: null,
                plano_acao: {
                    projeto_risco: {
                        projeto_id: projetoId,
                    }
                }
            }
        });
        if (!self) throw new HttpException("Não foi encontrar o plano de ação.", 404);

        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {

            await prismaTx.planoAcaoMonitoramento.update({
                where: {
                    id: id,
                },
                data: {
                    ...dto,
                    atualizado_em: new Date(Date.now()),
                    atualizado_por: user.id,
                }
            });

        });

        return { id: self.id };
    }


    async findAll(projetoId: number, dto: FilterPlanoAcaoMonitoramentoDto, user: PessoaFromJwt): Promise<PlanoAcaoMonitoramentoDto[]> {
        const listActive = await this.prisma.planoAcaoMonitoramento.findMany({
            where: {
                removido_em: null,
                ultima_revisao: dto.apenas_ultima_revisao ? true : undefined,
                plano_acao_id: dto.plano_acao_id,
                plano_acao: {
                    projeto_risco: {
                        projeto_id: projetoId,
                    }
                },
            },
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

        return listActive
    }

    async remove(projetoId: number, id: number, user: PessoaFromJwt) {

        const updated = await this.prisma.planoAcaoMonitoramento.updateMany({
            where: {
                id: id,
                plano_acao: {
                    projeto_risco: {
                        projeto_id: projetoId,
                    }
                },
                removido_em: null,
            },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });

        if (updated.count == 0)
            throw new HttpException("Nenhuma linha foi removida. Item pode já ter sido removido anteriormente.", 400);
    }
}
