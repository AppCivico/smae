import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePessoaDto } from './dto/create-pessoa.dto';
import * as bcrypt from 'bcrypt';
import { Prisma, Pessoa } from '@prisma/client';

@Injectable()
export class PessoaService {

    constructor(private readonly prisma: PrismaService) { }

    pessoaComoLinha(pessoa: Pessoa) {
        return {
            nome_exibicao: pessoa.nome_exibicao,
            id: pessoa.id,
        }
    }

    async create(createPessoaDto: CreatePessoaDto) {
        createPessoaDto.email = createPessoaDto.email.toLocaleLowerCase();

        const emailExists = await this.prisma.pessoa.count({ where: { email: createPessoaDto.email } });
        if (emailExists > 0) {
            throw new HttpException('E-mail já tem conta', 400);
        }

        const data = {
            ...createPessoaDto,
            senha: await bcrypt.hash(createPessoaDto.senha, 12),
        } as Prisma.PessoaCreateInput;

        const created = await this.prisma.pessoa.create({ data });
        created.eh_super_admin
        console.log(created)

        return this.pessoaComoLinha(created);
    }

    findByEmail() {
        return `This action returns all pessoa`;
    }

}
