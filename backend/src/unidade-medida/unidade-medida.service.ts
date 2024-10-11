import { HttpException, Injectable } from '@nestjs/common';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUnidadeMedidaDto } from './dto/create-unidade-medida.dto';
import { UpdateUnidadeMedidaDto } from './dto/update-unidade-medida.dto';
import { CONST_VAR_SEM_UN_MEDIDA } from '../common/consts';

@Injectable()
export class UnidadeMedidaService {
    constructor(private readonly prisma: PrismaService) {}

    async create(createUnidadeMedidaDto: CreateUnidadeMedidaDto, user: PessoaFromJwt) {
        const similarDescExists = await this.prisma.unidadeMedida.count({
            where: {
                descricao: { endsWith: createUnidadeMedidaDto.descricao, mode: 'insensitive' },
                removido_em: null,
            },
        });
        if (similarDescExists > 0)
            throw new HttpException('descricao| Descrição igual ou semelhante já existe em outro registro ativo', 400);

        const similarSiglaExists = await this.prisma.unidadeMedida.count({
            where: {
                sigla: { endsWith: createUnidadeMedidaDto.sigla, mode: 'insensitive' },
                removido_em: null,
            },
        });
        if (similarSiglaExists > 0)
            throw new HttpException('sigla| Sigla igual ou semelhante já existe em outro registro ativo', 400);

        const created = await this.prisma.unidadeMedida.create({
            data: {
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                ...createUnidadeMedidaDto,
            },
            select: { id: true },
        });

        return created;
    }

    async findAll() {
        const listActive = await this.prisma.unidadeMedida.findMany({
            where: {
                removido_em: null,
                AND: { id: { not: CONST_VAR_SEM_UN_MEDIDA } },
            },
            select: { id: true, descricao: true, sigla: true },
            orderBy: { descricao: 'asc' },
        });

        return listActive;
    }

    async update(id: number, updateUnidadeMedidaDto: UpdateUnidadeMedidaDto, user: PessoaFromJwt) {
        const self = await this.prisma.unidadeMedida.findFirst({
            where: { id: id, AND: { id: { not: CONST_VAR_SEM_UN_MEDIDA } } },
            select: { id: true },
        });
        if (!self) throw new HttpException('Unidade de órgão não encontrado', 404);

        if (updateUnidadeMedidaDto.descricao !== undefined) {
            const similarDescExists = await this.prisma.unidadeMedida.count({
                where: {
                    descricao: { endsWith: updateUnidadeMedidaDto.descricao, mode: 'insensitive' },
                    removido_em: null,
                    NOT: { id: id },
                },
            });
            if (similarDescExists > 0)
                throw new HttpException(
                    'descricao| Descrição igual ou semelhante já existe em outro registro ativo',
                    400
                );

            const similarSiglaExists = await this.prisma.unidadeMedida.count({
                where: {
                    sigla: { endsWith: updateUnidadeMedidaDto.sigla, mode: 'insensitive' },
                    removido_em: null,
                    NOT: { id: id },
                },
            });
            if (similarSiglaExists > 0)
                throw new HttpException('sigla| Sigla igual ou semelhante já existe em outro registro ativo', 400);
        }

        await this.prisma.unidadeMedida.update({
            where: { id: id },
            data: {
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
                ...updateUnidadeMedidaDto,
            },
        });

        return { id };
    }

    async remove(id: number, user: PessoaFromJwt) {
        const self = await this.prisma.unidadeMedida.findFirst({ where: { id: id }, select: { id: true } });
        if (!self) throw new HttpException('Unidade de medida não encontrada', 404);

        // TODO verificar apenas em PDM ativos?
        const existsDown = await this.prisma.variavel.count({
            where: {
                unidade_medida_id: id,
                removido_em: null,
            },
        });
        if (existsDown > 0)
            throw new HttpException(`Não é possível remover: Há ${existsDown} variáveis dependentes.`, 400);

        const created = await this.prisma.unidadeMedida.updateMany({
            where: { id: id, removido_em: null, AND: { id: { not: CONST_VAR_SEM_UN_MEDIDA } } },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });

        return created;
    }
}
