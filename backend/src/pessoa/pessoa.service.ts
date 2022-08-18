import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePessoaDto } from './dto/create-pessoa.dto';
import * as bcrypt from 'bcrypt';
import { Prisma, Pessoa, PrismaClient, PrismaPromise } from '@prisma/client';

@Injectable()
export class PessoaService {
    #maxQtdeSenhaInvalidaParaBlock: number
    #urlLoginSMAE: string
    constructor(private readonly prisma: PrismaService) {
        this.#maxQtdeSenhaInvalidaParaBlock = Number(process.env.MAX_QTDE_SENHA_INVALIDA_PARA_BLOCK) || 3
        this.#urlLoginSMAE = process.env.URL_LOGIN_SMAE || '#/login-smae';
    }

    pessoaAsHash(pessoa: Pessoa) {
        return {
            nome_exibicao: pessoa.nome_exibicao,
            id: pessoa.id,
        }
    }

    async senhaCorreta(senhaInformada: string, pessoa: Pessoa) {
        return await bcrypt.compare(senhaInformada, pessoa.senha);
    }

    async incrementarSenhaInvalida(pessoa: Pessoa) {
        const updatedPessoa = await this.prisma.pessoa.update({
            where: { id: pessoa.id },
            data: {
                qtde_senha_invalida: { increment: 1 }
            },
            select: { qtde_senha_invalida: true }
        });

        if (updatedPessoa.qtde_senha_invalida >= this.#maxQtdeSenhaInvalidaParaBlock) {
            await this.criaNovaSenha(pessoa, false);
        }
    }

    async criaNovaSenha(pessoa: Pessoa, solicitadoPeloUsuario: boolean) {
        let newPass = this.#generateRndPass(10);
        console.log(`new password: ${newPass}`, pessoa);

        let data = {
            senha_bloqueada: true,
            senha_bloqueada_em: new Date(Date.now()),
            senha: await bcrypt.hash(newPass, 12)
        };

        await this.prisma.pessoa.updateMany({
            where: { id: pessoa.id },
            data: data
        });

        await this.enviaEmailNovaSenha(pessoa, newPass, solicitadoPeloUsuario);
    }

    async enviaEmailNovaSenha(pessoa: Pessoa, senha: string, solicitadoPeloUsuario: boolean) {
        await this.prisma.emaildbQueue.create({
            data: {
                config_id: 1,
                subject: solicitadoPeloUsuario ? 'Nova senha solicitada' : 'Nova senha para liberar acesso',
                template: 'nova-senha.html',
                to: pessoa.email,
                variables: {
                    tentativas: this.#maxQtdeSenhaInvalidaParaBlock,
                    link: this.#urlLoginSMAE,
                    nova_senha: senha,
                    solicitadoPeloUsuario: solicitadoPeloUsuario,
                },
            }
        });

    }

    async enviaPrimeiraSenha(pessoa: Pessoa, senha: string, prisma: Prisma.TransactionClient) {
        await prisma.emaildbQueue.create({
            data: {
                config_id: 1,
                subject: 'Bem vindo ao SMAE - Senha para primeiro acesso',
                template: 'primeira-senha.html',
                to: pessoa.email,
                variables: {
                    nome_exibicao: pessoa.nome_exibicao,
                    link: this.#urlLoginSMAE,
                    nova_senha: senha,
                },
            }
        });
    }

    async escreverNovaSenhaById(pessoaId: number, senha: string) {

        let data = {
            senha_bloqueada: false,
            senha_bloqueada_em: undefined,
            senha: await bcrypt.hash(senha, 12)
        };

        const updated = await this.prisma.pessoa.updateMany({
            where: { id: pessoaId, senha_bloqueada: true },
            data: data
        });
        return updated.count;
    }

    async create(createPessoaDto: CreatePessoaDto) {
        let newPass = this.#generateRndPass(10);
        console.log(`new password: ${newPass}`);
        createPessoaDto.email = createPessoaDto.email.toLocaleLowerCase();

        const emailExists = await this.prisma.pessoa.count({ where: { email: createPessoaDto.email } });
        if (emailExists > 0) {
            throw new HttpException('email| E-mail já tem conta', 400);
        }

        const data = {
            ...createPessoaDto,
            senha: await bcrypt.hash(newPass, 12),
        } as Prisma.PessoaCreateInput;

        const pessoa = await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<Pessoa> => {
            const created = await prisma.pessoa.create({ data });
            await this.enviaPrimeiraSenha(created, newPass, prisma);
            return created;
        });

        return this.pessoaAsHash(pessoa);
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

    async invalidarSessao(id: number) {
        await this.prisma.pessoaSessaoAtiva.delete({ where: { id: id } });
    }

    async invalidarTodasSessoesAtivas(pessoaId: number) {
        await this.prisma.pessoaSessaoAtiva.deleteMany({ where: { pessoa_id: pessoaId } });
    }

    #generateRndPass(pLength: number) {

        var keyListAlpha = "abcdefghijklmnopqrstuvwxyz",
            keyListAlphaUpper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
            keyListInt = "123456789",
            keyListSpec = "!@*-",
            password = '';
        var len = Math.ceil(pLength / 2);
        len = len - 1;
        var lenSpec = pLength - 2 * len;

        for (let i = 0; i < len; i++) {
            if (Math.random() > 0.8) {
                password += keyListAlpha.charAt(Math.floor(Math.random() * keyListAlpha.length));
            } else {
                password += keyListAlphaUpper.charAt(Math.floor(Math.random() * keyListAlphaUpper.length));
            }
            password += keyListInt.charAt(Math.floor(Math.random() * keyListInt.length));
        }

        for (let i = 0; i < lenSpec; i++)
            password += keyListSpec.charAt(Math.floor(Math.random() * keyListSpec.length));

        password = password.split('').sort(function () { return 0.5 - Math.random() }).join('');

        return password;
    }

}
