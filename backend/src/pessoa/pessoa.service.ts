import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePessoaDto } from './dto/create-pessoa.dto';
import * as bcrypt from 'bcrypt';
import { Prisma, Pessoa } from '@prisma/client';

@Injectable()
export class PessoaService {

    constructor(private readonly prisma: PrismaService) { }

    pessoaAsHash(pessoa: Pessoa) {
        return {
            nome_exibicao: pessoa.nome_exibicao,
            id: pessoa.id,
        }
    }

    async create(createPessoaDto: CreatePessoaDto) {
        createPessoaDto.email = createPessoaDto.email.toLocaleLowerCase();

        const emailExists = await this.prisma.pessoa.count({ where: { email: createPessoaDto.email } });
        if (emailExists > 0) {
            throw new HttpException('email| E-mail já tem conta', 400);
        }

        const data = {
            ...createPessoaDto,
            senha: await bcrypt.hash(createPessoaDto.senha, 12),
        } as Prisma.PessoaCreateInput;

        const created = await this.prisma.pessoa.create({ data });

        return this.pessoaAsHash(created);
    }

    async findByEmailAsHash(email: string) {
        const pessoa = await this.findByEmail(email);
        if (!pessoa) return undefined;

        return this.pessoaAsHash(pessoa);
    }

    async findByEmail(email: string) {
        const pessoa = await this.prisma.pessoa.findUnique({ where: { email: email } });
        return pessoa;
    }


    async findById(id: number) {
        const pessoa = await this.prisma.pessoa.findUnique({ where: { id: id } });
        return pessoa;
    }

    async findBySessionId(id: number) {
        const pessoaSession = await this.prisma.pessoaSessaoAtiva.findUnique({ where: { id: id } });
        if (!pessoaSession) return undefined;

        const pessoa = await this.prisma.pessoa.findUnique({ where: { id: pessoaSession.pessoa_id } });
        return pessoa;
    }

    async newSessionForPessoa(id: number): Promise<number> {
        const pessoaSessao = await this.prisma.pessoaSessaoAtiva.create({ data: { pessoa_id: id } });
        return pessoaSessao.id;
    }

}
