import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import {
    CreateAssuntoVariavelDto,
    FilterAssuntoVariavelDto,
    UpdateAssuntoVariavelDto,
} from './dto/assunto-variavel.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';

@Injectable()
export class AssuntoVariavelService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateAssuntoVariavelDto, user: PessoaFromJwt) {
        if (await this.existeSemelhante(dto.nome)){
            throw new HttpException('Nome igual ou semelhante já existe em outro registro ativo', 400);
        }

        if (!await this.existeCategoria(dto.categoria_assunto_variavel_id)){
                throw new HttpException('Categoria de assunto não encontrada!', 400);
        }
        return await this.prisma.assuntoVariavel.create({
            data: {
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                nome: dto.nome,
                categoria_assunto_variavel_id: dto.categoria_assunto_variavel_id
            },
            select: { id: true },
        });
    }

    async findAll(filters: FilterAssuntoVariavelDto) {
        return  await this.prisma.assuntoVariavel.findMany({
            where: {
                removido_em: null,
                id: filters.id,
            },
            select: {
                id: true,
                nome: true,
                categoria_assunto_variavel_id:true,
                categoria_assunto_variavel:{
                    select :{
                        nome: true,
                        id: true,
                    }
                }
            },
            orderBy: { nome: 'asc' },
        });
    }

    async update(id: number, dto: UpdateAssuntoVariavelDto, user: PessoaFromJwt) {

        if (await this.existeSemelhante(dto.nome, id)){
            throw new HttpException('Nome igual ou semelhante já existe em outro registro ativo', 400);
        }

        if (!await this.existeCategoria(dto.categoria_assunto_variavel_id)){
            throw new HttpException('Categoria de assunto não encontrada!', 400);
        }

        await this.prisma.assuntoVariavel.update({
            where: { id: id },
            data: {
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
                nome: dto.nome,
                categoria_assunto_variavel_id: dto.categoria_assunto_variavel_id,
            },
        });

        return { id };
    }

    async remove(id: number, user: PessoaFromJwt) {
        const emUso = await this.prisma.variavelAssuntoVariavel.findMany({
            where: {
                assunto_variavel_id: id,
            },
            select: {
                id: true,
                variavel: { select: { titulo: true } },
            },
        });
        if (emUso.length)
            throw new BadRequestException(
                'Registro em uso em variáveis: ' + emUso.map((v) => v.variavel.titulo).join(', ')
            );

        return await this.prisma.assuntoVariavel.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });
    }

    async existeCategoria(id_categoria:number){
        return await  this.prisma.categoriaAssuntoVariavel.count({
            where : {
                id: {equals: id_categoria}
            }
        }) > 0;
    }

    async existeSemelhante(nome:string,id?:number){
        if (!id) {
            return await this.prisma.assuntoVariavel.count({
                where: {
                    nome: { equals: nome, mode: 'insensitive' },
                    removido_em: null,
                },
            }) > 0;
        }else{
            return this.prisma.assuntoVariavel.count({
                where: {
                    nome: { equals: nome, mode: 'insensitive' },
                    removido_em: null,
                    NOT: { id: id },
                },
            });
        }
    }
}
