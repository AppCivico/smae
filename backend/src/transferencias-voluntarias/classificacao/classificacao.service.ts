import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateClassificacaoDto } from './dto/create-classificacao.dto';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { ClassificacaoDto } from './entities/classificacao.dto';

@Injectable()
export class ClassificacaoService {
    constructor(private readonly prisma: PrismaService) {}
    async create(dto: CreateClassificacaoDto, user: PessoaFromJwt) {
        return await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                if (await this.prisma.classificacao.count({
                            where: {
                                nome: { equals: dto.nome, mode: 'insensitive' },
                                transferencia_tipo_id : dto.transferencia_tipo_id,
                                removido_em: null,
                            }, }) >0 ) {
                    throw new HttpException('nome| Nome igual ou semelhante já existe em outro registro ativo', 400);
                }
                return  await prismaTxn.classificacao.create({
                    data: {
                        nome: dto.nome,
                        transferencia_tipo_id: dto.transferencia_tipo_id,
                        //transferencia_tipo_id: 9,
                        criado_por: user.id,
                        criado_em: new Date(Date.now()),
                    },
                    select: { id: true },
                });
            }
        );
    }
    async findAll(): Promise<ClassificacaoDto[]> {
        return await this.prisma.classificacao.findMany({
            where: { removido_em: null },
            orderBy: { nome: 'asc' },
            select: {
                id: true,
                nome: true,
                transferencia_tipo_id: true,
                transferenciaTipo: true
            },
        });
    }

    async findOne(id: number): Promise<ClassificacaoDto> {
        return await this.prisma.classificacao.findFirstOrThrow({
            where :{id: id},
            select :{
                id: true,
                nome: true,
                transferencia_tipo_id: true,
                transferenciaTipo: true
            }
        });
    }



    async update(
        id: number,
        dto: ClassificacaoDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const updated = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const classificacao = await prismaTxn.classificacao.update({
                    where: { id },
                    data: {
                        nome: dto.nome,
                        transferencia_tipo_id: dto.transferencia_tipo_id,
                        atualizado_por: user.id,
                        atualizado_em: new Date(Date.now()),
                    },
                    select: {
                        nome: true,
                        transferenciaTipo: true,
                    },
                });

                const similarExists = await this.prisma.classificacao.count({
                    where: {
                        nome: { endsWith: classificacao.nome, mode: 'insensitive' },
                        transferencia_tipo_id: classificacao.transferenciaTipo.id,
                        removido_em: null,
                    },
                });
                if (similarExists > 1) throw new HttpException('Já existe um registro com estes campos.', 400);

                return { id };
            }
        );

        return updated;
    }
    async remove(id: number, user: PessoaFromJwt) {
        await this.prisma.classificacao.update({
            where: { id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });
    }
}
