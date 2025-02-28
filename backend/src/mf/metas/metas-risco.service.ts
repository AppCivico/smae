import { HttpException, Injectable } from '@nestjs/common';
import { PessoaAcessoPdm, Prisma } from '@prisma/client';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { Date2YMD } from '../../common/date2ymd';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { HtmlSanitizer } from '../../common/html-sanitizer';
import { PrismaService } from '../../prisma/prisma.service';
import { FilterRiscoDto, MfListRiscoDto, RiscoDto } from './../metas/dto/mf-meta-risco.dto';

@Injectable()
export class MetasRiscoService {
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

    async getMetaRisco(
        dto: FilterRiscoDto,
        config: PessoaAcessoPdm | null,
        user: PessoaFromJwt | null
    ): Promise<MfListRiscoDto> {
        return this.getMetaRiscoInterno(dto);
    }

    async getMetaRiscoInterno(dto: FilterRiscoDto): Promise<MfListRiscoDto> {
        const analisesResult = await this.prisma.metaCicloFisicoRisco.findMany({
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
                detalhamento: true,
                ponto_de_atencao: true,
                referencia_data: true,
                criado_em: true,
                meta_id: true,
                pessoaCriador: {
                    select: { nome_exibicao: true },
                },
                id: true,
            },
        });

        return {
            riscos: analisesResult.map((r) => {
                return {
                    detalhamento: r.detalhamento || '',
                    ponto_de_atencao: r.ponto_de_atencao || '',
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

    async addMetaRisco(dto: RiscoDto, config: PessoaAcessoPdm, user: PessoaFromJwt): Promise<RecordWithId> {
        if (config.perfil == 'ponto_focal') {
            throw new HttpException('Você não pode adicionar analise de risco.', 400);
        }

        return this.addMetaRiscoInterno(dto, user);
    }

    async addMetaRiscoInterno(dto: RiscoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const now = new Date(Date.now());
        const ciclo = await this.carregaCicloPorId(dto.ciclo_fisico_id);

        const id = await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient): Promise<number> => {
            await prismaTxn.metaCicloFisicoRisco.updateMany({
                where: {
                    ciclo_fisico_id: dto.ciclo_fisico_id,
                    meta_id: dto.meta_id,
                    ultima_revisao: true,
                },
                data: {
                    ultima_revisao: false,
                },
            });

            dto.ponto_de_atencao = HtmlSanitizer(dto.ponto_de_atencao);
            dto.detalhamento = HtmlSanitizer(dto.detalhamento);

            const cfq = await prismaTxn.metaCicloFisicoRisco.create({
                data: {
                    ciclo_fisico_id: dto.ciclo_fisico_id,

                    ultima_revisao: true,
                    criado_por: user.id,
                    criado_em: now,
                    referencia_data: ciclo.data_ciclo,
                    ponto_de_atencao: dto.ponto_de_atencao,
                    detalhamento: dto.detalhamento,
                    meta_id: dto.meta_id,
                },
                select: { id: true },
            });

            return cfq.id;
        });

        return { id: id };
    }
}
