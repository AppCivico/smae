import { HttpException, Injectable } from '@nestjs/common';
import { PessoaAcessoPdm, Prisma } from '@prisma/client';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { Date2YMD } from '../../common/date2ymd';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { FechamentoDto, FilterFechamentoDto, MfListFechamentoDto } from './../metas/dto/mf-meta-fechamento.dto';

@Injectable()
export class MetasFechamentoService {
    constructor(private readonly prisma: PrismaService) {}

    private async carregaCicloPorId(ciclo_fisico_id: number) {
        const ret = await this.prisma.cicloFisico.findFirst({
            where: { id: ciclo_fisico_id },
            select: {
                data_ciclo: true,
            },
        });
        if (!ret) {
            throw new HttpException(`Ciclo não encontrado no PDM`, 404);
        }

        return ret;
    }

    async getMetaFechamento(
        dto: FilterFechamentoDto,
        config: PessoaAcessoPdm | null,
        user: PessoaFromJwt | null
    ): Promise<MfListFechamentoDto> {
        return this.getMetaFechamentoInterno(dto);
    }

    async getMetaFechamentoInterno(dto: FilterFechamentoDto): Promise<MfListFechamentoDto> {
        const analisesResult = await this.prisma.metaCicloFisicoFechamento.findMany({
            where: {
                ciclo_fisico_id: dto.ciclo_fisico_id,
                meta_id: dto.meta_id,
                ultima_revisao: dto.apenas_ultima_revisao ? true : undefined,
            },
            orderBy: {
                criado_em: 'desc',
            },
            select: {
                ultima_revisao: true,
                comentario: true,
                criado_em: true,
                meta_id: true,
                referencia_data: true,
                pessoaCriador: {
                    select: { nome_exibicao: true },
                },
                id: true,
            },
        });

        return {
            fechamentos: analisesResult.map((r) => {
                return {
                    comentario: r.comentario || '',
                    referencia_data: Date2YMD.toString(r.referencia_data),
                    ultima_revisao: r.ultima_revisao,
                    criado_em: r.criado_em,
                    meta_id: r.meta_id,
                    id: r.id,
                    criador: { nome_exibicao: r.pessoaCriador.nome_exibicao },
                };
            }),
        };
    }

    async addMetaFechamento(dto: FechamentoDto, config: PessoaAcessoPdm, user: PessoaFromJwt): Promise<RecordWithId> {
        if (config.perfil == 'ponto_focal') {
            throw new HttpException('Você não pode criar Fechamentos.', 400);
        }

        return this.addMetaFechamentoInterno(dto, user);
    }

    async addMetaFechamentoInterno(dto: FechamentoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const now = new Date(Date.now());
        const ciclo = await this.carregaCicloPorId(dto.ciclo_fisico_id);

        const id = await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient): Promise<number> => {
            await prismaTxn.metaCicloFisicoFechamento.updateMany({
                where: {
                    ciclo_fisico_id: dto.ciclo_fisico_id,
                    meta_id: dto.meta_id,
                    ultima_revisao: true,
                },
                data: {
                    ultima_revisao: false,
                },
            });

            const cfq = await prismaTxn.metaCicloFisicoFechamento.create({
                data: {
                    ciclo_fisico_id: dto.ciclo_fisico_id,

                    ultima_revisao: true,
                    criado_por: user.id,
                    criado_em: now,
                    referencia_data: ciclo.data_ciclo,
                    comentario: dto.comentario,
                    meta_id: dto.meta_id,
                },
                select: { id: true },
            });

            return cfq.id;
        });

        return { id: id };
    }
}
