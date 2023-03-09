import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePlanoAcaoMonitoramentoDto, FilterPlanoAcaoMonitoramentoDto } from './dto/create-plano-acao-monitoramento.dto';
import { PlanoAcaoMonitoramentoDto } from './entities/plano-acao-monitoramento.entity';


@Injectable()
export class PlanoAcaoMonitoramentoService {
    constructor(private readonly prisma: PrismaService) { }

    async create(projetoId: number, dto: CreatePlanoAcaoMonitoramentoDto, user: PessoaFromJwt): Promise<RecordWithId> {

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


    async findAll(projetoId: number, dto: FilterPlanoAcaoMonitoramentoDto, user: PessoaFromJwt): Promise<PlanoAcaoMonitoramentoDto[]> {
        const listActive = await this.prisma.planoAcaoMonitoramento.findMany({
            where: {
                removido_em: null,
                ultima_revisao: dto.apenas_ultima_revisao ? true : undefined,
                plano_acao_id: dto.plano_acao_id
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

        await this.prisma.planoAcaoMonitoramento.updateMany({
            where: { id: id, removido_em: null },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });

    }
}
