import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import {
    CreateCategoriaAssuntoVariavelDto,
    FilterCategoriaAssuntoVariavelDto,
    UpdateCategoriaAssuntoVariavelDto,
} from './dto/categoria-assunto-variavel.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';

@Injectable()
export class CategoriaAssuntoVariavelService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateCategoriaAssuntoVariavelDto, user: PessoaFromJwt) {
        if (await this.existeSemelhante((dto.nome))) {
            throw new HttpException('Nome igual ou semelhante já existe em outro registro ativo', 400);
        }
        return  await this.prisma.categoriaAssuntoVariavel.create({
            data: {
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                nome: dto.nome,
            },
            select: { id: true },
        });
    }

    async findAll(filters: FilterCategoriaAssuntoVariavelDto) {
        return await this.prisma.categoriaAssuntoVariavel.findMany({
            where: {
                removido_em: null,
                id: filters.id,
            },
            select: {
                id: true,
                nome: true,
                assunto_variavel:{
                    select :{
                        nome: true,
                        id: true,
                    }
                }
            },
            orderBy: { nome: 'asc' },
        });
    }

    async update(id: number, dto: UpdateCategoriaAssuntoVariavelDto, user: PessoaFromJwt) {
        if (await this.existeSemelhante(dto.nome,id)) {
            throw new HttpException('Nome igual ou semelhante já existe em outro registro ativo', 400);
        }
        await this.prisma.categoriaAssuntoVariavel.update({
            where: { id: id },
            data: {
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
                nome: dto.nome,
            },
        });

        return { id };
    }

    async remove(id: number, user: PessoaFromJwt) {
        const emUso = await this.prisma.assuntoVariavel.findMany({
            where: {
                categoria_assunto_variavel_id: id,
            },
            select: {
                id: true,
                nome: true ,
            },
        });

        if (emUso.length)
            throw new BadRequestException(
                'Registro em uso nos assuntos: ' + emUso.map((v) => v.nome).join(', ')
            );

        return await this.prisma.categoriaAssuntoVariavel.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });

    }

    async existeSemelhante(nome:string,id?:number){
        if (!id) {
            return await this.prisma.categoriaAssuntoVariavel.count({
                where: {
                    nome: { equals: nome, mode: 'insensitive' },
                    removido_em: null,
                },
            }) > 0;
        }else{
            return await this.prisma.categoriaAssuntoVariavel.count({
                where: {
                    nome: { equals: nome, mode: 'insensitive' },
                    removido_em: null,

                    NOT: { id: id },
                },
            });
        }
    }
}
