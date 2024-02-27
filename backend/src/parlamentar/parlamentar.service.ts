import { Injectable } from '@nestjs/common';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { PrismaService } from '../prisma/prisma.service';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { CreateParlamentarDto } from './dto/create-parlamentar.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ParlamentarService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateParlamentarDto, user?: PessoaFromJwt): Promise<RecordWithId> {

        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const parlamentar = await prismaTxn.parlamentar.create({
                    data: {
                        ...dto,
                        criado_por: user ? user.id : undefined,
                        criado_em: new Date(Date.now()),
                        
                    },
                    select: { id: true },
                });

                return parlamentar;
            }
        );

        return created;
    }

    // async findAll(): Promise<BancadaDto[]> {
    //     const listActive = await this.prisma.bancada.findMany({
    //         where: {
    //             removido_em: null,
    //         },
    //         select: {
    //             id: true,
    //             nome: true,
    //             sigla: true,
    //             descricao: true
    //         },
    //         orderBy: [{ sigla: 'asc' }],
    //     });
    //     return listActive;
    // }

    // async findOne(id: number, user: PessoaFromJwt): Promise<BancadaOneDto> {
    //     return await this.prisma.bancada.findUniqueOrThrow({
    //         where: {
    //             id: id,
    //         },
    //     });
    // }

    // async update(id: number, dto: UpdateBancadaDto, user: PessoaFromJwt): Promise<RecordWithId> {
    //     if (dto.nome !== undefined) {
    //         const similarExists = await this.prisma.bancada.count({
    //             where: {
    //                 nome: { endsWith: dto.nome, mode: 'insensitive' },
    //                 removido_em: null,
    //                 NOT: { id: id },
    //             },
    //         });
    //         if (similarExists > 0)
    //             throw new HttpException(
    //                 'nome| Nome igual ou semelhante já existe em outro registro ativo',
    //                 400
    //             );
    //     }

    //     if (dto.sigla) {
    //         const similarExists = await this.prisma.orgao.count({
    //             where: {
    //                 sigla: { endsWith: dto.sigla, mode: 'insensitive' },
    //                 removido_em: null,
    //                 NOT: { id: id },
    //             },
    //         });
    //         if (similarExists > 0)
    //             throw new HttpException('sigla| Sigla igual ou semelhante já existe em outro registro ativo', 400);
    //     }

    //     await this.prisma.bancada.update({
    //         where: { id: id },
    //         data: {
    //             atualizado_por: user.id,
    //             atualizado_em: new Date(Date.now()),
    //             ...dto,
    //         },
    //     });

    //     return { id };
    // }

    // async remove(id: number, user: PessoaFromJwt) {
    //     // TODO verificar dependentes

    //     const deleted = await this.prisma.bancada.updateMany({
    //         where: { id: id },
    //         data: {
    //             removido_por: user.id,
    //             removido_em: new Date(Date.now()),
    //         },
    //     });

    //     return deleted;
    // }
}
