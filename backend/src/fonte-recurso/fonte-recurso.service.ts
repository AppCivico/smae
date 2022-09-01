import { HttpException, Injectable, Logger } from '@nestjs/common';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFonteRecursoDto } from './dto/create-fonte-recurso.dto';
import { UpdateFonteRecursoDto } from './dto/update-fonte-recurso.dto';

@Injectable()
export class FonteRecursoService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createFonteRecursoDto: CreateFonteRecursoDto, user: PessoaFromJwt) {
        const similarExists = await this.prisma.fonteRecurso.count({
            where: {
                fonte: { endsWith: createFonteRecursoDto.fonte, mode: 'insensitive' },
                removido_em: null
            }
        });
        if (similarExists > 0)
            throw new HttpException('fonte| Fonte igual ou semelhante já existe em outro registro ativo', 400);

        if (createFonteRecursoDto.sigla) {
            const similarExists = await this.prisma.fonteRecurso.count({
                where: {
                    sigla: { endsWith: createFonteRecursoDto.sigla, mode: 'insensitive' },
                    removido_em: null,

                }
            });
            if (similarExists > 0)
                throw new HttpException('sigla| Sigla igual ou semelhante já existe em outro registro ativo', 400);
        }

        const created = await this.prisma.fonteRecurso.create({
            data: {
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                ...createFonteRecursoDto,
            },
            select: { id: true }
        });

        return created;
    }

    async findAll() {
        let listActive = await this.prisma.fonteRecurso.findMany({
            where: {
                removido_em: null,
            },
            select: {
                id: true,
                fonte: true,
                sigla: true,
            }
        });
        return listActive;
    }

    async update(id: number, updateFonteRecursoDto: UpdateFonteRecursoDto, user: PessoaFromJwt) {
        if (updateFonteRecursoDto.fonte !== undefined) {
            const similarExists = await this.prisma.fonteRecurso.count({
                where: {
                    fonte: { endsWith: updateFonteRecursoDto.fonte, mode: 'insensitive' },
                    removido_em: null,
                    NOT: { id: id }
                }
            });
            if (similarExists > 0)
                throw new HttpException('fonte| Fonte igual ou semelhante já existe em outro registro ativo', 400);
        }
        if (updateFonteRecursoDto.sigla) {
            const similarExists = await this.prisma.fonteRecurso.count({
                where: {
                    sigla: { endsWith: updateFonteRecursoDto.sigla, mode: 'insensitive' },
                    removido_em: null,
                    NOT: { id: id }
                }
            });
            if (similarExists > 0)
                throw new HttpException('sigla| Sigla igual ou semelhante já existe em outro registro ativo', 400);
        }

        await this.prisma.fonteRecurso.update({
            where: { id: id },
            data: {
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
                ...updateFonteRecursoDto,
            }
        });

        return { id };
    }

    async remove(id: number, user: PessoaFromJwt) {
        const created = await this.prisma.fonteRecurso.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            }
        });

        return created;
    }
}
