import { HttpException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePessoaDto } from './dto/create-pessoa.dto';
import * as bcrypt from 'bcrypt';
import { Prisma, Pessoa, PrismaClient, PrismaPromise, PerfilAcesso } from '@prisma/client';
import { ListaPrivilegiosModulos } from 'src/pessoa/entities/ListaPrivilegiosModulos';
import { PerfilAcessoPrivilegios } from 'src/pessoa/dto/perifl-acesso-privilegios.dto';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { UpdatePessoaDto } from 'src/pessoa/dto/update-pessoa.dto';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class PessoaService {
    private readonly logger = new Logger(PessoaService.name);


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
        this.logger.log(`new password: ${newPass}`, pessoa);

        let data = {
            senha_bloqueada: true,
            senha_bloqueada_em: new Date(Date.now()),
            senha: await bcrypt.hash(newPass, BCRYPT_ROUNDS)
        };

        await this.prisma.$transaction(async (prisma: Prisma.TransactionClient) => {
            await prisma.pessoa.updateMany({
                where: { id: pessoa.id },
                data: data
            });

            await this.enviaEmailNovaSenha(pessoa, newPass, solicitadoPeloUsuario, prisma);
        });
    }

    async enviaEmailNovaSenha(pessoa: Pessoa, senha: string, solicitadoPeloUsuario: boolean, prisma: Prisma.TransactionClient) {
        await prisma.emaildbQueue.create({
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
            senha: await bcrypt.hash(senha, BCRYPT_ROUNDS),
            qtde_senha_invalida: 0,
        };

        this.logger.log(`escreverNovaSenhaById: ${pessoaId}`);
        const updated = await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<any> => {
            const updatePassword = await this.prisma.pessoa.updateMany({
                where: { id: pessoaId, senha_bloqueada: true },
                data: data
            });
            if (updatePassword.count == 1) {
                this.logger.log(`escreverNovaSenhaById: sucesso, removendo sessões anteriores`);
                await this.#invalidarTodasSessoesAtivas(pessoaId, prisma);
                return true;
            }

            this.logger.log(`escreverNovaSenhaById: senha já foi atualizada`);
            return false;
        });

        return updated;
    }

    async verificarPrivilegiosCriacao(createPessoaDto: CreatePessoaDto, user: PessoaFromJwt) {
        if (createPessoaDto.orgao_id === undefined) {
            if (user.hasSomeRoles(['CadastroPessoa.inserir:administrador']) === false) {
                throw new UnauthorizedException(`Para criar pessoas sem órgão é necessário ser um administrador.`);
            }
        }

        if (
            createPessoaDto.orgao_id &&
            user.hasSomeRoles(['CadastroPessoa.inserir:apenas-mesmo-orgao']) &&
            Number(createPessoaDto.orgao_id) != Number(user.orgao_id)
        ) {
            throw new UnauthorizedException(`Você só pode criar pessoas para o seu próprio órgão.`);
        }

    }

    async verificarPrivilegiosEdicao(updatePessoaDto: UpdatePessoaDto, user: PessoaFromJwt) {

        let pessoaCurrentOrgao = await this.prisma.pessoaFisica.findFirst({
            where: {
                pessoa: {
                    some: {
                        id: updatePessoaDto.id
                    }
                }
            },
            select: { orgao_id: true }
        });

        if (
            pessoaCurrentOrgao &&
            updatePessoaDto.orgao_id &&
            user.hasSomeRoles(['CadastroPessoa.editar:apenas-mesmo-orgao']) &&
            Number(pessoaCurrentOrgao.orgao_id) != Number(user.orgao_id)
        ) {
            throw new UnauthorizedException(`Você só pode editar pessoas do seu próprio órgão.`);
        }

        if (
            pessoaCurrentOrgao &&
            updatePessoaDto.desativado === true
            &&
            user.hasSomeRoles(['CadastroPessoa.inativar:apenas-mesmo-orgao']) &&
            Number(pessoaCurrentOrgao.orgao_id) != Number(user.orgao_id)
        ) {
            throw new UnauthorizedException(`Você só pode inativar pessoas do seu próprio órgão.`);
        } else if (updatePessoaDto.desativado === true
            &&
            user.hasSomeRoles(['CadastroPessoa.inativar']) === false
        ) {
            throw new UnauthorizedException(`Você só não pode inativar pessoas.`);
        } else if (updatePessoaDto.desativado === true && !updatePessoaDto.desativado_motivo) {
            throw new UnauthorizedException(`Você precisa informar o motivo para desativar uma pessoa.`);
        }

        if (
            pessoaCurrentOrgao &&
            updatePessoaDto.desativado === false
            &&
            user.hasSomeRoles(['CadastroPessoa.ativar:apenas-mesmo-orgao']) &&
            Number(pessoaCurrentOrgao.orgao_id) != Number(user.orgao_id)
        ) {
            throw new UnauthorizedException(`Você só pode ativar pessoas do seu próprio órgão.`);
        } else if (updatePessoaDto.desativado === false
            &&
            user.hasSomeRoles(['CadastroPessoa.ativar']) === false
        ) {
            throw new UnauthorizedException(`Você só não pode ativar pessoas.`);
        }

    }

    async getDetail(pessoaId: number, user: PessoaFromJwt) {
        let pessoa = await this.prisma.pessoa.findFirst({
            where: {
                id: pessoaId
            },
            include: {
                pessoa_fisica: {
                    select: {
                        lotacao: true,
                        orgao: {
                            select: {
                                sigla: true,
                                id: true,
                            }
                        }
                    }
                },
                PessoaPerfil: {
                    select: {
                        id: true
                    }
                },
            }
        });
        if (!pessoa) throw new HttpException('Pessoa não encontrada', 404)

        const listFixed = {
            id: pessoa.id,
            nome_completo: pessoa.nome_completo,
            nome_exibicao: pessoa.nome_exibicao,
            atualizado_em: pessoa.atualizado_em,
            desativado_em: pessoa.desativado_em || undefined,
            desativado: pessoa.desativado,
            desativado_motivo: pessoa.desativado_motivo,
            email: pessoa.email,
            lotacao: pessoa.pessoa_fisica?.lotacao ? pessoa.pessoa_fisica.lotacao : undefined,
            orgao: pessoa.pessoa_fisica?.orgao ? {
                id: pessoa.pessoa_fisica.orgao.id,
                sigla: pessoa.pessoa_fisica.orgao.sigla,
            } : undefined,
            pessoa_perfil_ids: pessoa.PessoaPerfil.map((e) => e.id)
        };

        return listFixed;
    }

    async update(pessoaId: number, updatePessoaDto: UpdatePessoaDto, user: PessoaFromJwt) {
        updatePessoaDto.id = pessoaId;
        await this.verificarPrivilegiosEdicao(updatePessoaDto, user);

        await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<Pessoa> => {

            const emailExists = updatePessoaDto.email ? await this.prisma.pessoa.count({
                where: {
                    email: updatePessoaDto.email,
                    NOT: {
                        id: pessoaId
                    }
                }
            }) : 0;
            if (emailExists > 0) {
                throw new HttpException('email| E-mail está em uso em outra conta', 400);
            }


            const updated = await prisma.pessoa.update({
                where: {
                    id: pessoaId,
                },
                data: {
                    nome_completo: updatePessoaDto.nome_completo,
                    nome_exibicao: updatePessoaDto.nome_exibicao,
                    email: updatePessoaDto.email,

                    pessoa_fisica: {
                        update: {
                            lotacao: updatePessoaDto.lotacao,
                            orgao_id: updatePessoaDto.orgao_id,
                        }
                    }
                }
            });

            if (updatePessoaDto.desativado === true) {
                await prisma.pessoa.update({
                    where: {
                        id: pessoaId,
                    },
                    data: {
                        desativado: true,
                        desativado_motivo: updatePessoaDto.desativado_motivo,
                        desativado_por: Number(user.id),
                        desativado_em: new Date(Date.now()),
                    }
                });
            } else if (updatePessoaDto.desativado === false) {
                await prisma.pessoa.update({
                    where: {
                        id: pessoaId,
                    },
                    data: {
                        desativado: false,
                        desativado_por: null,
                        desativado_em: null,
                        desativado_motivo: null,
                        atualizado_por: Number(user.id),
                        atualizado_em: new Date(Date.now()),
                    }
                });
            } else {

                await prisma.pessoa.update({
                    where: {
                        id: pessoaId,
                    },
                    data: {
                        atualizado_por: Number(user.id),
                        atualizado_em: new Date(Date.now()),
                    }
                });
            }

            if (Array.isArray(updatePessoaDto.perfil_acesso_ids)) {
                let promises = [];

                await prisma.pessoaPerfil.deleteMany({
                    where: { pessoa_id: pessoaId }
                });

                for (const perm of updatePessoaDto.perfil_acesso_ids) {
                    promises.push(prisma.pessoaPerfil.create({ data: { perfil_acesso_id: perm, pessoa_id: pessoaId } }))
                }
                await Promise.all(promises);
            }


            return updated;
        }, {
            // verificar o email dentro do contexto Serializable
            isolationLevel: 'Serializable',
            maxWait: 5000,
            timeout: 5000,
        });


    }

    async criarPessoa(createPessoaDto: CreatePessoaDto, user: PessoaFromJwt) {

        await this.verificarPrivilegiosCriacao(createPessoaDto, user);

        this.logger.log(`criarPessoa: ${JSON.stringify(createPessoaDto)}`);
        let newPass = this.#generateRndPass(10);
        this.logger.log(`senha gerada: ${newPass}`);

        createPessoaDto.email = createPessoaDto.email.toLocaleLowerCase();

        const pessoaData = {
            nome_completo: createPessoaDto.nome_completo,
            nome_exibicao: createPessoaDto.nome_exibicao,
            email: createPessoaDto.email,
            senha: await bcrypt.hash(newPass, BCRYPT_ROUNDS),
        } as Prisma.PessoaCreateInput;

        const pessoa = await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<Pessoa> => {

            const emailExists = await this.prisma.pessoa.count({ where: { email: createPessoaDto.email } });
            if (emailExists > 0) {
                throw new HttpException('email| E-mail já tem conta', 400);
            }

            let pessoaFisica;
            if (createPessoaDto.orgao_id) {
                pessoaFisica = await prisma.pessoaFisica.create({
                    data: {
                        orgao_id: createPessoaDto.orgao_id,
                        lotacao: createPessoaDto.lotacao
                    }
                });
            }

            const created = await prisma.pessoa.create({
                data: {
                    ...pessoaData,
                    pessoa_fisica_id: pessoaFisica ? pessoaFisica.id : null,
                } as Prisma.PessoaCreateInput
            });

            let promises = [];
            for (const perm of createPessoaDto.perfil_acesso_ids) {
                promises.push(prisma.pessoaPerfil.create({ data: { perfil_acesso_id: perm, pessoa_id: created.id } }))
            }
            promises.push(this.enviaPrimeiraSenha(created, newPass, prisma));
            await Promise.all(promises);

            return created;
        }, {
            // verificar o email dentro do contexto Serializable
            isolationLevel: 'Serializable',
            maxWait: 5000,
            timeout: 5000,
        });

        return this.pessoaAsHash(pessoa);
    }

    async findAll() {
        let listActive = await this.prisma.pessoa.findMany({
            orderBy: {
                atualizado_em: 'desc'
            },
            select: {
                id: true,
                nome_completo: true,
                nome_exibicao: true,
                atualizado_em: true,
                desativado_em: true,
                desativado: true,
                email: true,
                pessoa_fisica: {
                    select: {
                        lotacao: true,
                        orgao: {
                            select: {
                                sigla: true,
                                id: true,
                            }
                        }
                    }
                },
            }
        });

        const listFixed = listActive.map((p) => {
            return {
                id: p.id,
                nome_completo: p.nome_completo,
                nome_exibicao: p.nome_exibicao,
                atualizado_em: p.atualizado_em,
                desativado_em: p.desativado_em || undefined,
                desativado: p.desativado,
                email: p.email,
                lotacao: p.pessoa_fisica?.lotacao ? p.pessoa_fisica.lotacao : undefined,
                orgao: p.pessoa_fisica?.orgao ? {
                    id: p.pessoa_fisica.orgao.id,
                    sigla: p.pessoa_fisica.orgao.sigla,
                } : undefined,
            }
        });

        return listFixed;
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

    async findBySessionId(sessionId: number) {
        const pessoa = await this.prisma.pessoa.findMany({
            where: {
                PessoaSessoesAtivas: {
                    some: {
                        id: sessionId
                    }
                }
            },
            select: {
                id: true,
                nome_completo: true,
                email: true,
                nome_exibicao: true,
                senha_bloqueada: true,
                pessoa_fisica: true
            }
        });
        if (!pessoa) return undefined;

        return pessoa[0];
    }

    async newSessionForPessoa(id: number): Promise<number> {
        const pessoaSessao = await this.prisma.pessoaSessaoAtiva.create({ data: { pessoa_id: id } });
        return pessoaSessao.id;
    }

    async invalidarSessao(id: number) {
        await this.prisma.pessoaSessaoAtiva.delete({ where: { id: id } });
    }

    async #invalidarTodasSessoesAtivas(pessoaId: number, prisma: Prisma.TransactionClient) {
        await prisma.pessoaSessaoAtiva.deleteMany({ where: { pessoa_id: pessoaId } });
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

    async listaPerfilAcesso(): Promise<PerfilAcessoPrivilegios[]> {

        const dados = await this.prisma.perfilAcesso.findMany({
            orderBy: { nome: "asc" },
            select: {
                nome: true,
                descricao: true,
                id: true,
                perfil_privilegio: {
                    select: { privilegio: { select: { nome: true } } }
                }
            }
        });

        return dados as PerfilAcessoPrivilegios[];
    }

    async listaPrivilegiosModulos(pessoaId: number): Promise<ListaPrivilegiosModulos> {
        const dados: ListaPrivilegiosModulos[] = await this.prisma.$queryRaw`
            with perms as (
            select p.codigo as cod_priv, m.codigo as cod_modulos
            from pessoa_perfil pp
            join perfil_acesso pa on pp.perfil_acesso_id = pa.id
            join perfil_privilegio priv on priv.perfil_acesso_id = pa.id
            join privilegio p on p.id = priv.privilegio_id
            join modulo m on p.modulo_id = m.id
            where pp.pessoa_id = ${pessoaId})
            select array_agg(distinct cod_priv) as privilegios, array_agg(distinct cod_modulos) as modulos from perms;
        `;

        return dados[0];
    }

}
