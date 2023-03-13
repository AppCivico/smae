import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Prisma, ProjetoFase, ProjetoOrigemTipo, ProjetoStatus } from '@prisma/client';
import { DateTime } from 'luxon';
import { IdCodTituloDto } from 'src/common/dto/IdCodTitulo.dto';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';

import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../../upload/upload.service';
import { PlanoAcao, PlanoAcaoDetailDto } from '../plano-de-acao/entities/plano-acao.entity';
import { CreatePlanoAcaoDto } from './dto/create-plano-acao.dto';
import { FilterPlanoAcaoDto } from './dto/filter-plano-acao.dto';
import { UpdatePlanoAcaoDto } from './dto/update-plano-acao.dto';

@Injectable()
export class PlanoAcaoService {
    private readonly logger = new Logger(PlanoAcaoService.name);
    constructor(private readonly prisma: PrismaService) { }

    async create(projetoId: number, dto: CreatePlanoAcaoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const projeto = await this.prisma.projeto.findFirst({
            where: { id: projetoId },
            select: { id: true }
        });
        if (!projeto) throw new HttpException('Projeto| Inválido', 400);

        const projeto_risco = await this.prisma.projetoRisco.findFirst({
            where: {
                id: dto.projeto_risco_id,
                projeto_id: projetoId
            },
            select: {id: true}
        });
        if (!projeto_risco) throw new HttpException('Projeto_risco| Inválido', 400);

        const plano_acao = await this.prisma.planoAcao.create({
            data: {
                ...dto,

                criado_em: new Date(Date.now()),
                criado_por: user.id
            },
            select: {id: true}
        })

        return {id: plano_acao.id}
    }

    async findAll(projetoId: number, filters: FilterPlanoAcaoDto, user: PessoaFromJwt): Promise<PlanoAcao[]> {
        return await this.prisma.planoAcao.findMany({
            where: {
                projeto_risco: {
                    projeto_id: projetoId
                },
                ...filters
            },
            select: {
                id: true,
                contramedida: true,
                prazo_contramedida: true,
                custo: true,
                custo_percentual: true,
                medidas_de_contingencia: true,
            }
        });
    }

    async findOne(projetoId: number, plano_acao_id: number, user: PessoaFromJwt): Promise<PlanoAcaoDetailDto> {
        const plano_acao = await this.prisma.planoAcao.findFirst({
            where: {
                id: plano_acao_id,
                projeto_risco: {
                    projeto_id: projetoId
                }
            },
            select: {
                id: true,
                contramedida: true,
                prazo_contramedida: true,
                custo: true,
                custo_percentual: true,
                medidas_de_contingencia: true,
            }
        });
        if (!plano_acao) throw new HttpException('plano_acao| inválido', 400);

        return plano_acao;
    }

    async update(plano_acao_id: number, dto: UpdatePlanoAcaoDto, user: PessoaFromJwt) {
        return await this.prisma.planoAcao.update({
            where: {id: plano_acao_id},
            data: {
                ...dto
            },
            select: {id: true}
        });
    }
}
