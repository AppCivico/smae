import { HttpException, Injectable, Logger } from '@nestjs/common';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { PrismaService } from '../../prisma/prisma.service';
import { PlanoAcao, PlanoAcaoDetailDto } from '../plano-de-acao/entities/plano-acao.entity';
import { CreatePlanoAcaoDto } from './dto/create-plano-acao.dto';
import { FilterPlanoAcaoDto } from './dto/filter-plano-acao.dto';
import { UpdatePlanoAcaoDto } from './dto/update-plano-acao.dto';
import { Date2YMD } from '../../common/date2ymd';

@Injectable()
export class PlanoAcaoService {
    private readonly logger = new Logger(PlanoAcaoService.name);
    constructor(private readonly prisma: PrismaService) {}

    async create(projetoId: number, dto: CreatePlanoAcaoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const projeto = await this.prisma.projeto.findFirst({
            where: {
                id: projetoId,
                portfolio: { modelo_clonagem: false },
            },
            select: { id: true },
        });
        if (!projeto) throw new HttpException('Projeto| Inválido', 400);

        const projeto_risco = await this.prisma.projetoRisco.findFirst({
            where: {
                id: dto.projeto_risco_id,
                projeto_id: projetoId,
                removido_em: null,
            },
            select: { id: true },
        });
        if (!projeto_risco) throw new HttpException('Projeto_risco| Inválido', 400);

        const plano_acao = await this.prisma.planoAcao.create({
            data: {
                ...dto,
                medidas_de_contingencia: dto.medidas_de_contingencia || '',

                criado_em: new Date(Date.now()),
                criado_por: user.id,
            },
            select: { id: true },
        });

        return { id: plano_acao.id };
    }

    async findAll(
        projetoId: number,
        filters: FilterPlanoAcaoDto,
        user: PessoaFromJwt | undefined
    ): Promise<PlanoAcao[]> {
        const rows = await this.prisma.planoAcao.findMany({
            where: {
                projeto_risco: {
                    projeto_id: projetoId,
                },
                removido_em: null,
                ...filters,
            },
            orderBy: { id: 'asc' },
            select: {
                id: true,
                contramedida: true,
                prazo_contramedida: true,
                custo: true,
                custo_percentual: true,
                medidas_de_contingencia: true,
                responsavel: true,
                contato_do_responsavel: true,
                data_termino: true,
                orgao: {
                    select: {
                        id: true,
                        sigla: true,
                    },
                },
                projeto_risco: {
                    select: {
                        id: true,
                        codigo: true,
                    },
                },
            },
        });

        return rows.map((row) => {
            return {
                ...row,
                prazo_contramedida: Date2YMD.toStringOrNull(row.prazo_contramedida),
                data_termino: Date2YMD.toStringOrNull(row.data_termino),
            };
        });
    }

    async findOne(projetoId: number, plano_acao_id: number, user: PessoaFromJwt): Promise<PlanoAcaoDetailDto> {
        const plano_acao = await this.prisma.planoAcao.findFirst({
            where: {
                id: plano_acao_id,
                projeto_risco: {
                    projeto_id: projetoId,
                },
                removido_em: null,
            },
            select: {
                id: true,
                contramedida: true,
                prazo_contramedida: true,
                custo: true,
                custo_percentual: true,
                medidas_de_contingencia: true,
                responsavel: true,
                contato_do_responsavel: true,
                data_termino: true,
                orgao: {
                    select: {
                        id: true,
                        sigla: true,
                    },
                },
            },
        });
        if (!plano_acao) throw new HttpException('plano_acao| inválido', 400);

        return {
            ...plano_acao,
            prazo_contramedida: Date2YMD.toStringOrNull(plano_acao.prazo_contramedida),
            data_termino: Date2YMD.toStringOrNull(plano_acao.data_termino),
        };
    }

    async update(plano_acao_id: number, dto: UpdatePlanoAcaoDto, user: PessoaFromJwt) {
        return await this.prisma.planoAcao.update({
            where: { id: plano_acao_id },
            data: {
                ...dto,

                atualizado_em: new Date(Date.now()),
                atualizado_por: user.id,
            },
            select: { id: true },
        });
    }

    async remove(plano_acao_id: number, user: PessoaFromJwt) {
        return await this.prisma.planoAcao.updateMany({
            where: {
                id: plano_acao_id,
            },
            data: {
                removido_em: new Date(Date.now()),
                removido_por: user.id,
            },
        });
    }
}
