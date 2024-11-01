import { BadRequestException, ForbiddenException, HttpException, Injectable, Logger } from '@nestjs/common';
import { ModuloSistema, Pessoa, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { uuidv7 } from 'uuidv7';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FilterPrivDto } from '../auth/models/Privilegios.dto';
import { LoggerWithLog } from '../common/LoggerWithLog';
import { IdCodTituloDto } from '../common/dto/IdCodTitulo.dto';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { MathRandom } from '../common/math-random';
import { NovaSenhaDto } from '../minha-conta/models/nova-senha.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePessoaDto } from './dto/create-pessoa.dto';
import { DetalhePessoaDto } from './dto/detalhe-pessoa.dto';
import { FilterPermsPessoa2Priv, FilterPessoaDto } from './dto/filter-pessoa.dto';
import { PerfilAcessoPrivilegios } from './dto/perifl-acesso-privilegios.dto';
import {
    BuscaResponsabilidades,
    DetalheResponsabilidadeDto,
    ExecutaTransferenciaResponsabilidades,
} from './dto/responsabilidade-pessoa.dto';
import { UpdatePessoaDto } from './dto/update-pessoa.dto';
import { ListaPrivilegiosModulos } from './entities/ListaPrivilegiosModulos';
import { PessoaResponsabilidadesMetaService } from './pessoa.responsabilidades.metas.service';
import { ListaDePrivilegios } from '../common/ListaDePrivilegios';
import { Pessoa as PessoaDto } from './entities/pessoa.entity';

const BCRYPT_ROUNDS = 10;
const LISTA_PRIV_ADMIN: ListaDePrivilegios[] = ['CadastroPessoa.administrador', 'CadastroPessoa.administrador.MDO'];
@Injectable()
export class PessoaService {
    private readonly logger = new Logger(PessoaService.name);

    #maxQtdeSenhaInvalidaParaBlock: number;
    #urlLoginSMAE: string;
    #cpfObrigatorioSemRF: boolean;
    #matchEmailRFObrigatorio: string;
    constructor(
        private readonly prisma: PrismaService,
        private readonly pRespMetaService: PessoaResponsabilidadesMetaService
    ) {
        this.#maxQtdeSenhaInvalidaParaBlock = Number(process.env.MAX_QTDE_SENHA_INVALIDA_PARA_BLOCK) || 3;
        this.#urlLoginSMAE = process.env.URL_LOGIN_SMAE || '#/login-smae';
        this.#cpfObrigatorioSemRF = Number(process.env.CPF_OBRIGATORIO_SEM_RF) == 1;
        this.#matchEmailRFObrigatorio = process.env.MATCH_EMAIL_RF_OBRIGATORIO || '';
    }

    pessoaAsHash(pessoa: PessoaDto) {
        return {
            nome_exibicao: pessoa.nome_exibicao,
            id: pessoa.id,
        };
    }

    async senhaCorreta(senhaInformada: string, pessoa: Partial<Pessoa>) {
        if (!pessoa.senha) throw new Error('faltando senha');

        return await bcrypt.compare(senhaInformada, pessoa.senha);
    }

    async incrementarSenhaInvalida(pessoa: PessoaDto) {
        const updatedPessoa = await this.prisma.pessoa.update({
            where: { id: pessoa.id },
            data: {
                qtde_senha_invalida: { increment: 1 },
            },
            select: { qtde_senha_invalida: true },
        });

        if (updatedPessoa.qtde_senha_invalida >= this.#maxQtdeSenhaInvalidaParaBlock) {
            await this.criaNovaSenha(pessoa, false);
        }
    }

    async criaNovaSenha(pessoa: PessoaDto, solicitadoPeloUsuario: boolean) {
        const newPass = this.#generateRndPass(10);
        this.logger.log(`new password: ${newPass}`, pessoa);

        const data = {
            senha_bloqueada: true,
            senha_bloqueada_em: new Date(Date.now()),
            senha: await bcrypt.hash(newPass, BCRYPT_ROUNDS),
        };

        await this.prisma.$transaction(async (prisma: Prisma.TransactionClient) => {
            await prisma.pessoa.updateMany({
                where: { id: pessoa.id },
                data: data,
            });

            await this.enviaEmailNovaSenha(pessoa, newPass, solicitadoPeloUsuario, prisma);
        });
    }

    async enviaEmailNovaSenha(
        pessoa: PessoaDto,
        senha: string,
        solicitadoPeloUsuario: boolean,
        prisma: Prisma.TransactionClient
    ) {
        await prisma.emaildbQueue.create({
            data: {
                id: uuidv7(),
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
            },
        });
    }

    async enviaPrimeiraSenha(pessoa: Pessoa, senha: string, prisma: Prisma.TransactionClient) {
        const tosText = (await prisma.textoConfig.findFirstOrThrow({ where: { id: 1 } })).bemvindo_email;

        await prisma.emaildbQueue.create({
            data: {
                id: uuidv7(),
                config_id: 1,
                subject: 'Bem vindo ao SMAE - Senha para primeiro acesso',
                template: 'primeira-senha.html',
                to: pessoa.email,
                variables: {
                    nome_exibicao: pessoa.nome_exibicao,
                    tos: tosText,
                    link: this.#urlLoginSMAE + '?referencia=primeiro-acesso',
                    nova_senha: senha,
                },
            },
        });
    }

    async escreverNovaSenhaById(pessoaId: number, senha: string, keepSession?: boolean) {
        const data = {
            senha_bloqueada: false,
            senha_bloqueada_em: null,
            senha: await bcrypt.hash(senha, BCRYPT_ROUNDS),
            qtde_senha_invalida: 0,
        };

        this.logger.log(`escreverNovaSenhaById: ${pessoaId}`);
        const updated = await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient): Promise<boolean> => {
            const updatePassword = await prismaTx.pessoa.updateMany({
                where: { id: pessoaId },
                data: data,
            });
            if (updatePassword.count == 1) {
                if (!keepSession) {
                    this.logger.log(`escreverNovaSenhaById: sucesso, removendo sessões anteriores`);
                    await this.invalidarTodasSessoesAtivas(pessoaId, prismaTx);
                }
                return true;
            }

            this.logger.log(`escreverNovaSenhaById: senha já foi atualizada`);
            return false;
        });

        return updated;
    }

    private async verificarPrivilegiosCriacao(createPessoaDto: CreatePessoaDto, user: PessoaFromJwt) {
        if (createPessoaDto.orgao_id === undefined) {
            if (user.hasSomeRoles(LISTA_PRIV_ADMIN) === false) {
                throw new ForbiddenException(`Para criar pessoas sem órgão é necessário ser um administrador.`);
            }
        }

        if (
            createPessoaDto.orgao_id &&
            user.orgao_id &&
            user.hasSomeRoles(LISTA_PRIV_ADMIN) === false &&
            Number(createPessoaDto.orgao_id) != Number(user.orgao_id)
        ) {
            throw new ForbiddenException(`Você só pode criar pessoas para o seu próprio órgão.`);
        }

        if (user.hasSomeRoles(['SMAE.superadmin']) == false) {
            await this.verificarPerfilNaoContemAdmin(createPessoaDto.perfil_acesso_ids);
        }
    }

    private async verificarPrivilegiosEdicao(id: number, updatePessoaDto: UpdatePessoaDto, user: PessoaFromJwt) {
        const ehAdmin = user.hasSomeRoles(LISTA_PRIV_ADMIN);
        if (user.hasSomeRoles(['SMAE.superadmin']) == false && updatePessoaDto.perfil_acesso_ids) {
            const oldPessoaPerfis = (
                await this.prisma.pessoaPerfil.findMany({
                    where: { pessoa_id: id },
                    select: { perfil_acesso_id: true },
                })
            )
                .map((e) => e.perfil_acesso_id)
                .sort((a, b) => +a - +b)
                .join(',');
            const newPessoaPerfis = updatePessoaDto.perfil_acesso_ids.sort((a, b) => +a - +b).join(',');

            // verificar se realmente esta acontecendo uma mudança, pois o frontend sempre envia os dados
            if (newPessoaPerfis !== oldPessoaPerfis) {
                // verifica tbm se não está tentando remover o admin, mas nesse caso, tbm é necessário
                await this.verificarPerfilNaoContemAdmin(oldPessoaPerfis.split(',').map((n) => +n));

                // verifica se não está tentando adicionar admin
                await this.verificarPerfilNaoContemAdmin(updatePessoaDto.perfil_acesso_ids);
            }
        }

        const pessoaCurrentOrgao = await this.prisma.pessoaFisica.findFirst({
            where: {
                pessoa: {
                    some: {
                        id: id,
                    },
                },
            },
            select: { orgao_id: true },
        });

        this.logger.debug(`pessoaCurrentOrgao=${JSON.stringify(pessoaCurrentOrgao)}`);
        this.logger.debug(`updatePessoaDto=${JSON.stringify(updatePessoaDto)}`);
        this.logger.debug(`user=${JSON.stringify(user)}`);

        if (
            pessoaCurrentOrgao &&
            updatePessoaDto.orgao_id &&
            ehAdmin === false &&
            Number(pessoaCurrentOrgao.orgao_id) != Number(user.orgao_id)
        ) {
            throw new ForbiddenException(`Você só pode editar pessoas do seu próprio órgão.`);
        }

        if (
            pessoaCurrentOrgao &&
            updatePessoaDto.desativado === true &&
            user.hasSomeRoles(['CadastroPessoa.inativar']) &&
            ehAdmin === false &&
            Number(pessoaCurrentOrgao.orgao_id) != Number(user.orgao_id)
        ) {
            throw new ForbiddenException(`Você só pode inativar pessoas do seu próprio órgão.`);
        } else if (updatePessoaDto.desativado === true && user.hasSomeRoles(['CadastroPessoa.inativar']) === false) {
            throw new ForbiddenException(`Você não pode inativar pessoas.`);
        } else if (updatePessoaDto.desativado === true && !updatePessoaDto.desativado_motivo) {
            throw new ForbiddenException(`Você precisa informar o motivo para desativar uma pessoa.`);
        }

        if (
            pessoaCurrentOrgao &&
            updatePessoaDto.desativado === false &&
            user.hasSomeRoles(['CadastroPessoa.ativar']) &&
            ehAdmin === false &&
            Number(pessoaCurrentOrgao.orgao_id) != Number(user.orgao_id)
        ) {
            throw new ForbiddenException(`Você só pode ativar pessoas do seu próprio órgão.`);
        } else if (updatePessoaDto.desativado === false && user.hasSomeRoles(['CadastroPessoa.ativar']) === false) {
            throw new ForbiddenException(`Você não pode ativar pessoas.`);
        }

        if (pessoaCurrentOrgao == undefined && updatePessoaDto.orgao_id) {
            throw new ForbiddenException(
                `Atualização do órgão da pessoa não é possível, peça atualização no banco de dados.`
            );
        }
    }

    async verificarPerfilNaoContemAdmin(perfil_acesso_ids: number[]) {
        const rows = await this.prisma.perfilAcesso.findMany({
            where: {
                id: { in: perfil_acesso_ids },
            },
            select: {
                perfil_privilegio: {
                    select: {
                        privilegio: {
                            select: { codigo: true },
                        },
                    },
                },
            },
        });

        const codigos = rows.reduce((prev, r) => {
            return [...prev, ...r.perfil_privilegio.map((s) => s.privilegio.codigo)];
        }, []);

        if (codigos.includes('SMAE.superadmin'))
            throw new HttpException(
                'O seu usuário não pode adicionar ou remover permissões de outros usuários que são administradores do sistema, ou adicionar a permissão de administrador para um usuário já existente.',
                400
            );
    }

    private verificarCPFObrigatorio(dto: CreatePessoaDto | UpdatePessoaDto) {
        if (!this.#cpfObrigatorioSemRF) return;

        if (!dto.registro_funcionario && !dto.cpf) {
            throw new HttpException('cpf| CPF obrigatório para conta sem registro_funcionario', 400);
        }
    }

    private verificarRFObrigatorio(dto: CreatePessoaDto | UpdatePessoaDto) {
        if (
            this.#matchEmailRFObrigatorio &&
            !dto.registro_funcionario &&
            dto.email &&
            dto.email.endsWith('@' + this.#matchEmailRFObrigatorio)
        ) {
            throw new HttpException(
                `registro_funcionario| Registro de funcionário obrigatório para e-mails terminando @${this.#matchEmailRFObrigatorio}`,
                400
            );
        }

        if (!this.#cpfObrigatorioSemRF) return;

        if (!dto.cpf && !dto.registro_funcionario) {
            throw new HttpException(
                'registro_funcionario| Registro de funcionário obrigatório caso CPF não seja informado',
                400
            );
        }
    }

    async getDetail(pessoaId: number, user: PessoaFromJwt): Promise<DetalhePessoaDto> {
        const perfisVisiveis = await this.buscaPerfisVisiveis(user);

        const pessoa = await this.prisma.pessoa.findFirst({
            where: {
                id: pessoaId,
            },
            include: {
                pessoa_fisica: true,
                PessoaPerfil: {
                    select: {
                        perfil_acesso_id: true,
                    },
                },

                GruposDePaineisQueParticipo: {
                    select: {
                        grupo_painel: {
                            select: {
                                id: true,
                                nome: true,
                            },
                        },
                    },
                },
            },
        });
        if (!pessoa) throw new HttpException('Pessoa não encontrada', 404);

        const responsavel_pelos_projetos = await this.prisma.projeto.findMany({
            where: {
                responsavel_id: pessoa.id,
                removido_em: null,
            },
            orderBy: { nome: 'asc' },
            select: { id: true, codigo: true, nome: true },
        });

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
            orgao_id: pessoa.pessoa_fisica?.orgao_id || undefined,
            cargo: pessoa.pessoa_fisica?.cargo || null,
            registro_funcionario: pessoa.pessoa_fisica?.registro_funcionario || null,
            cpf: pessoa.pessoa_fisica?.cpf || null,
            perfil_acesso_ids: pessoa.PessoaPerfil.map((e) => e.perfil_acesso_id).filter((e) =>
                perfisVisiveis.includes(e)
            ),
            grupos: pessoa.GruposDePaineisQueParticipo.map((e) => e.grupo_painel),
            responsavel_pelos_projetos,
        };

        return listFixed;
    }

    async update(pessoaId: number, updatePessoaDto: UpdatePessoaDto, user: PessoaFromJwt) {
        const logger = LoggerWithLog('Pessoa: Editar');
        const sistema = user.assertOneModuloSistema('editar', 'pessoa');
        logger.log(`Editando Pessoa ID=${pessoaId}, pelo sistema ${sistema}`);

        if (updatePessoaDto.email) updatePessoaDto.email = updatePessoaDto.email.toLowerCase();

        const perfisVisiveis = await this.buscaPerfisVisiveis(user, sistema);
        this.verificaPerfilAcesso(updatePessoaDto, perfisVisiveis);

        await this.verificarPrivilegiosEdicao(pessoaId, updatePessoaDto, user);
        this.verificarCPFObrigatorio(updatePessoaDto);
        this.verificarRFObrigatorio(updatePessoaDto);

        const self = await this.prisma.pessoa.findFirstOrThrow({
            where: {
                id: pessoaId,
                AND: [{ id: { gt: 0 } }],
            },
            include: {
                pessoa_fisica: true,
                PessoaPerfil: {
                    include: {
                        perfil_acesso: {
                            include: {
                                perfil_privilegio: {
                                    include: {
                                        privilegio: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        const targetUserPrivileges = new Set(
            self.PessoaPerfil.flatMap((pp) => pp.perfil_acesso.perfil_privilegio.map((priv) => priv.privilegio.codigo))
        ) as Set<ListaDePrivilegios>;
        const editingUserPrivileges = new Set(user.privilegios);

        if (!user.hasSomeRoles(['SMAE.superadmin'])) {
            if (user.id == pessoaId) throw new ForbiddenException('Você não pode editar a si mesmo.');

            for (const priv of targetUserPrivileges) {
                if (!editingUserPrivileges.has(priv)) {
                    throw new BadRequestException('Você não pode editar um usuário com mais privilégios que você.');
                }
            }
        }

        const now = new Date(Date.now());

        await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient) => {
                const emailExists = updatePessoaDto.email
                    ? await prismaTx.pessoa.count({
                          where: {
                              email: updatePessoaDto.email,
                              NOT: {
                                  id: pessoaId,
                              },
                          },
                      })
                    : 0;
                if (emailExists > 0) {
                    throw new HttpException('email| E-mail está em uso em outra conta', 400);
                }

                if (updatePessoaDto.registro_funcionario) {
                    const registroFuncionarioExists = await prismaTx.pessoa.count({
                        where: {
                            NOT: { id: pessoaId },
                            pessoa_fisica: { registro_funcionario: updatePessoaDto.registro_funcionario },
                        },
                    });
                    if (registroFuncionarioExists > 0) {
                        throw new HttpException(
                            'registro_funcionario| Registro de funcionário já atrelado a outra conta',
                            400
                        );
                    }
                }

                if (updatePessoaDto.cpf) {
                    const registroFuncionarioExists = await prismaTx.pessoa.count({
                        where: {
                            NOT: { id: pessoaId },
                            pessoa_fisica: { cpf: updatePessoaDto.cpf },
                        },
                    });
                    if (registroFuncionarioExists > 0) {
                        throw new HttpException('cpf| CPF já atrelado a outra conta', 400);
                    }
                }

                const grupos_to_assign = [];

                const grupos = updatePessoaDto.grupos;
                delete updatePessoaDto.grupos;
                if (grupos) {
                    if (sistema != 'PDM') {
                        //throw new BadRequestException('Edição de grupos não é suportada fora do sistema do PDM');
                        logger.warn('Edição de grupos não é suportada fora do sistema do PDM');
                    } else {
                        for (const grupo of grupos) {
                            grupos_to_assign.push({ grupo_painel_id: grupo });
                        }

                        // apaga todos os grupos
                        await prismaTx.pessoaGrupoPainel.deleteMany({ where: { pessoa_id: pessoaId } });
                    }
                }

                if (
                    updatePessoaDto.orgao_id &&
                    self.pessoa_fisica &&
                    self.pessoa_fisica.orgao_id &&
                    self.pessoa_fisica.orgao_id != updatePessoaDto.orgao_id
                ) {
                    await this.trocouDeOrgao(prismaTx, { ...self, pessoa_fisica: self.pessoa_fisica }, now, logger);
                }

                await prismaTx.pessoa.update({
                    where: {
                        id: pessoaId,
                    },
                    data: {
                        nome_completo: updatePessoaDto.nome_completo,
                        nome_exibicao: updatePessoaDto.nome_exibicao,
                        email: updatePessoaDto.email,

                        pessoa_fisica: {
                            update: {
                                cargo: updatePessoaDto.cargo,
                                lotacao: updatePessoaDto.lotacao,
                                orgao_id: updatePessoaDto.orgao_id,
                                cpf: updatePessoaDto.cpf,
                                registro_funcionario: updatePessoaDto.registro_funcionario,
                            },
                        },
                        GruposDePaineisQueParticipo: grupos ? { createMany: { data: grupos_to_assign } } : undefined,
                    },
                });

                if (updatePessoaDto.desativado === true) {
                    logger.verbose(`Desativando usuário...`);
                    await prismaTx.pessoa.update({
                        where: {
                            id: pessoaId,
                        },
                        data: {
                            desativado: true,
                            desativado_motivo: updatePessoaDto.desativado_motivo,
                            desativado_por: Number(user.id),
                            desativado_em: now,
                        },
                    });
                } else if (updatePessoaDto.desativado === false) {
                    logger.verbose(`Reativando usuário...`);
                    await prismaTx.pessoa.update({
                        where: {
                            id: pessoaId,
                        },
                        data: {
                            desativado: false,
                            desativado_por: null,
                            desativado_em: null,
                            desativado_motivo: null,
                            atualizado_por: user.id,
                            atualizado_em: now,
                        },
                    });
                } else {
                    await prismaTx.pessoa.update({
                        where: {
                            id: pessoaId,
                        },
                        data: {
                            atualizado_por: user.id,
                            atualizado_em: now,
                        },
                    });
                }

                if (Array.isArray(updatePessoaDto.perfil_acesso_ids)) {
                    logger.verbose(`Perfis de acessos recebidos: ${JSON.stringify(updatePessoaDto.perfil_acesso_ids)}`);
                    const promises = [];

                    const perfilDeInteresse: ListaDePrivilegios[] = [
                        'PDM.coordenador_responsavel_cp',
                        'PS.tecnico_cp',
                        'SMAE.gestor_de_projeto',
                        'SMAE.colaborador_de_projeto',
                        'SMAE.espectador_de_painel_externo',
                        'SMAE.espectador_de_projeto',
                        'SMAE.GrupoVariavel.colaborador',
                    ] as const;
                    const privAntesUpdate = await this.carregaPrivPessoa(prismaTx, perfilDeInteresse, pessoaId);

                    await prismaTx.pessoaPerfil.deleteMany({
                        where: {
                            pessoa_id: pessoaId,
                            // só deve apagar os privilégios que tiverem relação ao modulo que a pessoa estava visualizando na tela
                            perfil_acesso_id: { in: perfisVisiveis },
                        },
                    });

                    const newPrivileges = new Set<string>();

                    for (const perm of updatePessoaDto.perfil_acesso_ids) {
                        if (perfisVisiveis.includes(perm) == false)
                            throw new BadRequestException(`Perm ${perm} não é permitida para o seu sistema`);

                        const perfilAcesso = await prismaTx.perfilAcesso.findUnique({
                            where: { id: perm },
                            include: {
                                perfil_privilegio: {
                                    include: {
                                        privilegio: true,
                                    },
                                },
                            },
                        });

                        if (!perfilAcesso) throw new BadRequestException(`Perfil de acesso ${perm} não encontrado`);

                        for (const priv of perfilAcesso.perfil_privilegio) {
                            if (
                                !user.hasSomeRoles(['SMAE.superadmin']) &&
                                !editingUserPrivileges.has(priv.privilegio.codigo as ListaDePrivilegios)
                            ) {
                                throw new ForbiddenException(
                                    `Você não pode adicionar o privilégio ${priv.privilegio.codigo} que você não possui.`
                                );
                            }
                            newPrivileges.add(priv.privilegio.codigo);
                        }

                        promises.push(
                            prismaTx.pessoaPerfil.create({ data: { perfil_acesso_id: +perm, pessoa_id: pessoaId } })
                        );
                    }

                    if (newPrivileges.size)
                        logger.log(`Novos privilégios: ${JSON.stringify(Array.from(newPrivileges))}`);

                    await Promise.all(promises);

                    const privDepoisUpdate = await this.carregaPrivPessoa(prismaTx, perfilDeInteresse, pessoaId);
                    await this.removeAcessoOuAbortaTx(
                        prismaTx,
                        perfilDeInteresse,
                        pessoaId,
                        privDepoisUpdate,
                        privAntesUpdate,
                        logger,
                        now
                    );

                    logger.log(`Recalculando pessoa_acesso_pdm(${pessoaId})...`);
                    await prismaTx.$queryRaw`select pessoa_acesso_pdm(${pessoaId}::int)`;
                }

                await logger.saveLogs(prismaTx, user.getLogData());
            },
            {
                // verificar o email dentro do contexto Serializable
                isolationLevel: 'Serializable',
                maxWait: 5000,
                timeout: 5000,
            }
        );

        return { id: pessoaId };
    }

    private async removeAcessoOuAbortaTx(
        prismaTx: Prisma.TransactionClient,
        perfilDeInteresse: ListaDePrivilegios[],
        pessoaId: number,
        privDepoisUpdate: { codigo: string }[],
        privAntesUpdate: { codigo: string }[],
        logger: LoggerWithLog,
        now: Date
    ) {
        const somePessoaCp = { some: { pessoa_id: pessoaId, coordenador_responsavel_cp: true } } as const;
        for (const priv of perfilDeInteresse) {
            if (!privDepoisUpdate.find((r) => r.codigo == priv) && privAntesUpdate.find((r) => r.codigo == priv)) {
                logger.log(`Privilégio ${priv} foi removido, removendo acesso das tabelas...`);

                if (priv == 'PDM.coordenador_responsavel_cp' || priv == 'PS.tecnico_cp') {
                    const metaResp = await prismaTx.meta.findMany({
                        where: {
                            removido_em: null,
                            pdm: {
                                ativo: true,
                            },
                            OR: [
                                { meta_responsavel: somePessoaCp },

                                // responsavel na iniciativa
                                {
                                    iniciativa: {
                                        some: {
                                            removido_em: null,
                                            iniciativa_responsavel: somePessoaCp,
                                        },
                                    },
                                },
                                // responsavel na atividade
                                {
                                    iniciativa: {
                                        some: {
                                            removido_em: null,
                                            atividade: {
                                                some: { atividade_responsavel: somePessoaCp },
                                            },
                                        },
                                    },
                                },
                            ],
                        },
                        select: {
                            id: true,
                            codigo: true,
                            titulo: true,
                        },
                    });
                    if (metaResp.length) {
                        throw new BadRequestException(
                            `Não é possível remover privilégio de coordenador CP, pois ainda é utilizado nas metas: ${metaResp.map(
                                (r) => {
                                    return `Meta ${r.codigo} - ${r.titulo}`;
                                }
                            )}`
                        );
                    }
                } else if (priv == 'SMAE.gestor_de_projeto') {
                    const projGestoResp = await prismaTx.projeto.findMany({
                        where: {
                            removido_em: null,
                            responsaveis_no_orgao_gestor: {
                                has: pessoaId,
                            },
                        },
                        select: {
                            id: true,
                            nome: true,
                        },
                    });
                    if (projGestoResp.length) {
                        throw new BadRequestException(
                            `Não é possível remover privilégio de Gestor de Projeto, pois ainda é utilizado nos projetos: ${projGestoResp.map(
                                (r) => {
                                    return `Projeto ${r.nome}`;
                                }
                            )}`
                        );
                    }
                } else if (priv == 'SMAE.colaborador_de_projeto') {
                    const projColab = await prismaTx.projeto.findMany({
                        where: {
                            removido_em: null,
                            responsavel_id: pessoaId,
                        },
                        select: {
                            id: true,
                            nome: true,
                        },
                    });
                    if (projColab.length) {
                        throw new BadRequestException(
                            `Não é possível remover privilégio de Colaborador de Projeto, pois ainda é utilizado nos projetos: ${projColab.map(
                                (r) => {
                                    return `Projeto ${r.nome}`;
                                }
                            )}`
                        );
                    }
                } else if (priv == 'SMAE.espectador_de_painel_externo') {
                    const gpp = await prismaTx.grupoPortfolioPessoa.findMany({
                        where: {
                            pessoa_id: pessoaId,
                            removido_em: null,
                        },
                        select: {
                            id: true,
                            grupo_portfolio: { select: { id: true, titulo: true } },
                        },
                    });
                    logger.verbose(`Removendo dos grupos portfólio: ${JSON.stringify(gpp)}`);

                    await prismaTx.grupoPortfolioPessoa.updateMany({
                        where: {
                            id: { in: gpp.map((r) => r.id) },
                            pessoa_id: pessoaId,
                        },
                        data: { removido_em: now },
                    });
                } else if (priv == 'SMAE.espectador_de_projeto') {
                    const gpe = await prismaTx.grupoPainelExternoPessoa.findMany({
                        where: {
                            pessoa_id: pessoaId,
                            removido_em: null,
                        },
                        select: {
                            id: true,
                            grupo_painel_externo: { select: { id: true, titulo: true } },
                        },
                    });
                    logger.verbose(`Removendo dos grupos de painel externo: ${JSON.stringify(gpe)}`);

                    await prismaTx.grupoPainelExternoPessoa.updateMany({
                        where: {
                            id: { in: gpe.map((r) => r.id) },
                            pessoa_id: pessoaId,
                        },
                        data: { removido_em: now },
                    });
                }
            }
        }
    }

    private async carregaPrivPessoa(
        prismaTx: Prisma.TransactionClient,
        perfilDeInteresse: ListaDePrivilegios[],
        pessoaId: number
    ) {
        return await prismaTx.privilegio.findMany({
            distinct: 'codigo',
            where: {
                codigo: { in: perfilDeInteresse },
                perfil_privilegio: {
                    some: {
                        perfil_acesso: {
                            pessoa_perfil: {
                                some: {
                                    pessoa_id: pessoaId,
                                },
                            },
                        },
                    },
                },
            },
        });
    }

    private async trocouDeOrgao(
        prismaTx: Prisma.TransactionClient,
        self: {
            pessoa_fisica: {
                orgao_id: number;
            };
        } & {
            id: number;
        },
        now: Date,
        logger: LoggerWithLog
    ) {
        const orgaoAntigo = self.pessoa_fisica.orgao_id;
        const orgaoAntigoStr = `órgão antigo ID ${orgaoAntigo}`;

        const curActivePdm = await prismaTx.pdm.findFirst({ where: { ativo: true }, select: { id: true } });
        if (curActivePdm) {
            const curResp = await this.pRespMetaService.buscaMetas(self.id, curActivePdm.id, prismaTx);
            if (curResp.length) {
                const getDesc = await prismaTx.meta.findMany({
                    where: { id: { in: curResp.map((r) => r.id) } },
                    select: { codigo: true, titulo: true, pdm: { select: { nome: true } } },
                });
                throw new BadRequestException(
                    `Mudança de órgão não pode ser efetuada antes de remover todas as responsabilidades, há responsabilidades em: ${getDesc
                        .map((r) => {
                            return `Meta ${r.codigo} - ${r.titulo} (PDM ${r.pdm.nome})`;
                        })
                        .join('\n')}`
                );
            }
        }

        {
            logger.log(`Trocou de órgão: removendo relacionamentos de grupoPortfolioPessoa no ${orgaoAntigoStr}`);
            await prismaTx.grupoPortfolioPessoa.updateMany({
                where: {
                    pessoa_id: self.id,
                    orgao_id: orgaoAntigo,
                    removido_em: null,
                },
                data: { removido_em: now },
            });
        }

        {
            logger.log(`Trocou de órgão: verificando o ${orgaoAntigoStr}`);

            const projetosSouGestor = await prismaTx.projeto.findMany({
                where: {
                    removido_em: null,
                    responsaveis_no_orgao_gestor: {
                        has: self.id,
                    },
                },
                select: {
                    tipo: true,
                    nome: true,
                },
            });

            if (projetosSouGestor.length) {
                throw new BadRequestException(
                    `Não é possível mudar de órgão, pois ainda é gestor em: ${projetosSouGestor
                        .map((r) => {
                            return `${r.tipo == 'PP' ? 'Projeto' : 'Obra'} ${r.nome}`;
                        })
                        .join('\n')}`
                );
            }
        }

        {
            logger.log(`Trocou de órgão: verificando o ${orgaoAntigoStr} se há responsabilidades em equipes`);

            const grupoQSouResp = await prismaTx.grupoResponsavelEquipeResponsavel.findMany({
                where: {
                    removido_em: null,
                    pessoa_id: self.id,
                },
                select: {
                    grupo_responsavel_equipe: {
                        select: {
                            titulo: true,
                        },
                    },
                },
            });

            if (grupoQSouResp.length) {
                throw new BadRequestException(
                    `Não é possível mudar de órgão, pois ainda é responsável na equipes: ${grupoQSouResp
                        .map((r) => {
                            return `${r.grupo_responsavel_equipe.titulo}`;
                        })
                        .join('\n')}`
                );
            }
        }

        {
            logger.log(`Trocou de órgão: verificando o ${orgaoAntigoStr} se há responsabilidades equipes`);

            const grupoQSouPart = await prismaTx.grupoResponsavelEquipeParticipante.findMany({
                where: {
                    removido_em: null,
                    pessoa_id: self.id,
                },
                select: {
                    grupo_responsavel_equipe: {
                        select: {
                            titulo: true,
                        },
                    },
                },
            });

            if (grupoQSouPart.length) {
                throw new BadRequestException(
                    `Não é possível mudar de órgão, pois ainda é participante na equipe: ${grupoQSouPart
                        .map((r) => {
                            return `${r.grupo_responsavel_equipe.titulo}`;
                        })
                        .join('\n')}`
                );
            }
        }
        {
            logger.log(`Trocou de órgão: removendo relacionamentos de projetoEquipe no ${orgaoAntigoStr}`);
            await prismaTx.projetoEquipe.updateMany({
                where: {
                    pessoa_id: self.id,
                    orgao_id: orgaoAntigo,
                    removido_em: null,
                },
                data: { removido_em: now },
            });
        }

        {
            logger.log(`Trocou de órgão: removendo relacionamentos de GrupoPainelExternoPessoa no ${orgaoAntigoStr}`);

            await prismaTx.grupoPainelExternoPessoa.updateMany({
                where: {
                    pessoa_id: self.id,
                    orgao_id: orgaoAntigo,
                    removido_em: null,
                },
                data: { removido_em: now },
            });
        }
    }

    private async listaPerfilAcessoIds(): Promise<number[]> {
        const rows = await this.prisma.perfilAcesso.findMany({
            select: { id: true },
            where: { removido_em: null },
        });
        return rows.map((r) => r.id);
    }

    private async listaPerfilAcessoIdsPorSistema(mod: ModuloSistema): Promise<number[]> {
        const rows = await this.prisma.perfilAcesso.findMany({
            where: {
                removido_em: null,
                modulos_sistemas: {
                    hasSome: ['SMAE', mod],
                },
            },
            select: { id: true },
        });
        return rows.map((r) => r.id);
    }

    async criarPessoa(createPessoaDto: CreatePessoaDto, user?: PessoaFromJwt) {
        const logger = LoggerWithLog('Pessoa: Criar');

        const visiblePriv: number[] = [];
        if (user) {
            visiblePriv.push(...(await this.buscaPerfisVisiveis(user)));
        }

        this.verificaPerfilAcesso(createPessoaDto, visiblePriv);

        if (user) {
            await this.verificarPrivilegiosCriacao(createPessoaDto, user);
        }
        this.verificarCPFObrigatorio(createPessoaDto);
        this.verificarRFObrigatorio(createPessoaDto);

        logger.log(`criarPessoa: ${JSON.stringify(createPessoaDto)}`);
        const newPass = this.#generateRndPass(10);
        this.logger.verbose(`senha gerada: ${newPass}`);

        createPessoaDto.email = createPessoaDto.email.toLocaleLowerCase();

        const pessoaData = {
            nome_completo: createPessoaDto.nome_completo,
            nome_exibicao: createPessoaDto.nome_exibicao,
            email: createPessoaDto.email,
            senha: await bcrypt.hash(newPass, BCRYPT_ROUNDS),
            senha_bloqueada: true,
            senha_bloqueada_em: new Date(Date.now()),
        } as Prisma.PessoaCreateInput;

        const pessoa = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const emailExists = await prismaTx.pessoa.count({ where: { email: createPessoaDto.email } });
                if (emailExists > 0) {
                    throw new HttpException('email| E-mail já tem conta', 400);
                }

                if (createPessoaDto.registro_funcionario) {
                    const registroFuncionarioExists = await prismaTx.pessoa.count({
                        where: { pessoa_fisica: { registro_funcionario: createPessoaDto.registro_funcionario } },
                    });
                    if (registroFuncionarioExists > 0) {
                        throw new HttpException(
                            'registro_funcionario| Registro de funcionário já atrelado a outra conta',
                            400
                        );
                    }
                }

                if (createPessoaDto.cpf) {
                    const registroFuncionarioExists = await prismaTx.pessoa.count({
                        where: { pessoa_fisica: { cpf: createPessoaDto.cpf } },
                    });
                    if (registroFuncionarioExists > 0) {
                        throw new HttpException('cpf| CPF já atrelado a outra conta', 400);
                    }
                }

                let pessoaFisica;
                if (createPessoaDto.orgao_id) {
                    pessoaFisica = await prismaTx.pessoaFisica.create({
                        data: {
                            orgao_id: createPessoaDto.orgao_id,
                            lotacao: createPessoaDto.lotacao,
                            cpf: createPessoaDto.cpf,
                            registro_funcionario: createPessoaDto.registro_funcionario,
                        },
                    });
                }

                const grupos_to_assign = [];
                if (createPessoaDto.grupos) {
                    const grupos = createPessoaDto.grupos;
                    delete createPessoaDto.grupos;

                    for (const grupo of grupos) {
                        grupos_to_assign.push({ grupo_painel_id: grupo });
                    }
                }

                const created = await prismaTx.pessoa.create({
                    data: {
                        ...pessoaData,
                        pessoa_fisica_id: pessoaFisica ? pessoaFisica.id : null,

                        GruposDePaineisQueParticipo: {
                            createMany: {
                                data: grupos_to_assign,
                            },
                        },
                    } as Prisma.PessoaCreateInput,
                });

                const promises = [];
                if (user && !user.hasSomeRoles(['SMAE.superadmin'])) {
                    const editingUserPrivileges = new Set(user.privilegios);

                    for (const permId of createPessoaDto.perfil_acesso_ids) {
                        const perfilAcesso = await prismaTx.perfilAcesso.findUnique({
                            where: { id: permId },
                            include: {
                                perfil_privilegio: {
                                    include: {
                                        privilegio: true,
                                    },
                                },
                            },
                        });

                        if (!perfilAcesso) throw new BadRequestException(`Perfil de acesso ${permId} não encontrado`);

                        for (const priv of perfilAcesso.perfil_privilegio) {
                            if (!editingUserPrivileges.has(priv.privilegio.codigo as ListaDePrivilegios)) {
                                throw new ForbiddenException(
                                    `Você não pode adicionar o privilégio ${priv.privilegio.codigo} que você não possui.`
                                );
                            }
                        }
                    }
                }

                for (const perm of createPessoaDto.perfil_acesso_ids) {
                    promises.push(
                        prismaTx.pessoaPerfil.create({ data: { perfil_acesso_id: +perm, pessoa_id: created.id } })
                    );
                }

                await Promise.all(promises);

                // se a pessoa não está suspensa, envia a senha
                const estaSuspenso = await this.carregaPrivPessoa(prismaTx, ['SMAE.login_suspenso'], created.id);
                if (!estaSuspenso.length) await this.enviaPrimeiraSenha(created, newPass, prismaTx);

                this.logger.log(`calculando pessoa_acesso_pdm...`);
                await prismaTx.$queryRaw`select pessoa_acesso_pdm(${created.id}::int)`;

                if (user) await logger.saveLogs(prismaTx, user.getLogData());
                return created;
            },
            {
                // verificar o email dentro do contexto Serializable
                isolationLevel: 'Serializable',
                maxWait: 5000,
                timeout: 5000,
            }
        );

        return { id: pessoa.id };
    }

    private verificaPerfilAcesso(dto: { perfil_acesso_ids?: number[] }, visiblePriv: number[]) {
        if (Array.isArray(dto.perfil_acesso_ids) === false) return;

        for (const id of dto.perfil_acesso_ids) {
            if (visiblePriv.includes(id) === false)
                throw new BadRequestException(
                    `Perfil de Acesso ID ${id} não está na lista dos perfis de acesso para o seu usuário neste sistema, carregados: ${visiblePriv.join(', ')}`
                );
        }
    }

    private async buscaPerfisVisiveis(user: PessoaFromJwt, cachedSistema?: ModuloSistema) {
        const ehAdmin = user.hasSomeRoles(LISTA_PRIV_ADMIN);

        if (ehAdmin) {
            return await this.listaPerfilAcessoIds();
        }

        const sistema = cachedSistema ?? user.assertOneModuloSistema('buscar', 'pessoa');
        return await this.listaPerfilAcessoIdsPorSistema(sistema);
    }

    async findAll(filters: FilterPessoaDto | undefined = undefined, user: PessoaFromJwt) {
        const visiblePriv = await this.buscaPerfisVisiveis(user);

        this.logger.log(`buscando pessoas...`);
        const selectColumns = {
            id: true,
            nome_completo: true,
            nome_exibicao: true,
            atualizado_em: true,
            desativado_em: true,
            desativado_motivo: true,
            desativado: true,
            email: true,
            pessoa_fisica: {
                select: {
                    lotacao: true,
                    orgao_id: true,
                },
            },
            PessoaPerfil: {
                select: {
                    perfil_acesso_id: true,
                },
            },
        };

        const filtrosExtra = this.filtrosPrivilegios(filters);
        if (filters?.orgao_id) {
            this.logger.log(`filtrando órgão é ${filters?.orgao_id}`);
        }

        const listActive = await this.prisma.pessoa.findMany({
            orderBy: [{ desativado: 'asc' }, { nome_exibicao: 'asc' }],
            where: {
                id: { gt: 0 },
                NOT: { pessoa_fisica_id: null },
                AND: filtrosExtra,
                pessoa_fisica: {
                    orgao_id: filters?.orgao_id,
                },
            },
            select: selectColumns,
        });

        const listFixed = listActive.map((p) => {
            return {
                id: p.id,
                nome_completo: p.nome_completo,
                nome_exibicao: p.nome_exibicao,
                atualizado_em: p.atualizado_em,
                desativado_motivo: p.desativado_motivo,
                desativado_em: p.desativado_em || undefined,
                desativado: p.desativado,
                email: p.email,
                lotacao: p.pessoa_fisica?.lotacao ? p.pessoa_fisica.lotacao : undefined,
                orgao_id: p.pessoa_fisica?.orgao_id || undefined,
                perfil_acesso_ids: p.PessoaPerfil.map((e) => e.perfil_acesso_id).filter((e) => visiblePriv.includes(e)),
            };
        });

        this.logger.log(`encontrado ${listFixed.length} resultados`);

        return listFixed;
    }

    private filtrosPrivilegios(filters: FilterPessoaDto | undefined): Prisma.PessoaWhereInput[] {
        const extraFilter: Prisma.PessoaWhereInput[] = [];

        for (const entry of Object.entries(FilterPermsPessoa2Priv)) {
            const [key, value] = entry;
            if ((filters as any)[key] === undefined) continue;

            const filterValue = (filters as any)[key] as boolean;
            const filterOperator = filterValue ? 'some' : 'none';

            extraFilter.push({
                PessoaPerfil: {
                    [filterOperator]: {
                        perfil_acesso: {
                            perfil_privilegio: {
                                some: {
                                    privilegio: {
                                        codigo: value,
                                    },
                                },
                            },
                        },
                    },
                },
            });
        }

        return [
            {
                AND: extraFilter,
            },
        ];
    }

    async findByEmailAsHash(email: string) {
        const pessoa = await this.findByEmail(email);
        if (!pessoa) return undefined;

        return this.pessoaAsHash(pessoa);
    }

    async findByEmail(email: string): Promise<PessoaDto | null> {
        return await this.findByInterno({ email });
    }

    async findById(id: number): Promise<PessoaDto | null> {
        return await this.findByInterno({ id });
    }

    async findBySessionId(sessionId: number) {
        return await this.findByInterno({ session_id: sessionId });
    }

    private async findByInterno(opts: {
        id?: number | undefined;
        session_id?: number | undefined;
        email?: string | undefined;
    }): Promise<PessoaDto | null> {
        const { id, session_id: sessionId, email } = opts;
        if (!id && !sessionId && !email) return null;

        const pessoa = await this.prisma.pessoa.findFirst({
            where: {
                PessoaSessoesAtivas: sessionId
                    ? {
                          some: {
                              id: sessionId,
                          },
                      }
                    : undefined,
                id: id ? id : undefined,
                email: email ? email.toLowerCase() : undefined,
                AND: [{ id: { gt: 0 } }],
            },
            include: { pessoa_fisica: true },
        });
        if (!pessoa) return null;

        return pessoa satisfies PessoaDto;
    }

    async newSessionForPessoa(id: number, ip: string): Promise<number> {
        return await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            const pessoaSessao = await prismaTx.pessoaSessao.create({
                data: {
                    criado_ip: ip,
                    pessoa_id: id,
                    criado_em: new Date(Date.now()),
                },
            });

            const pessoaSessaoAtiva = await prismaTx.pessoaSessaoAtiva.create({
                data: {
                    id: pessoaSessao.id,
                    pessoa_id: id,
                },
            });

            return pessoaSessaoAtiva.id;
        });
    }

    async invalidarSessao(id: number, ip: string) {
        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            await prismaTx.pessoaSessao.update({
                where: { id: id },
                data: {
                    removido_em: new Date(Date.now()),
                    removido_ip: ip,
                },
            });

            await prismaTx.pessoaSessaoAtiva.delete({ where: { id: id } });
        });
    }

    private async invalidarTodasSessoesAtivas(pessoaId: number, prismaTx: Prisma.TransactionClient) {
        await prismaTx.pessoaSessao.updateMany({
            where: { pessoa_id: pessoaId, removido_em: null },
            data: {
                removido_em: new Date(Date.now()),
            },
        });

        await prismaTx.pessoaSessaoAtiva.deleteMany({ where: { pessoa_id: pessoaId } });
    }

    #generateRndPass(pLength: number) {
        const keyListAlpha = 'abcdefghijklmnopqrstuvwxyz',
            keyListAlphaUpper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            keyListInt = '123456789',
            keyListSpec = '!@*-';
        let password = '';
        let len = Math.ceil(pLength / 2);
        len = len - 1;
        const lenSpec = pLength - 2 * len;

        for (let i = 0; i < len; i++) {
            if (MathRandom() > 0.8) {
                password += keyListAlpha.charAt(Math.floor(MathRandom() * keyListAlpha.length));
            } else {
                password += keyListAlphaUpper.charAt(Math.floor(MathRandom() * keyListAlphaUpper.length));
            }
            password += keyListInt.charAt(Math.floor(MathRandom() * keyListInt.length));
        }

        for (let i = 0; i < lenSpec; i++) password += keyListSpec.charAt(MathRandom(MathRandom() * keyListSpec.length));

        password = password
            .split('')
            .sort(function () {
                return 0.5 - MathRandom();
            })
            .join('');

        return password;
    }

    async listaPerfilAcessoParaPessoas(filter: FilterPrivDto, user: PessoaFromJwt): Promise<PerfilAcessoPrivilegios[]> {
        const ehAdmin = user.hasSomeRoles(LISTA_PRIV_ADMIN);

        if (filter.sistemas && !ehAdmin)
            throw new BadRequestException(
                'Você não tem permissão para filtrar por sistemas, apenas administradores podem fazer isso.'
            );

        console.log(filter.sistemas);
        const dados = await this.prisma.perfilAcesso.findMany({
            where: {
                removido_em: null,
                nome: { not: 'SYSADMIN' },
                modulos_sistemas: filter.sistemas
                    ? {
                          hasSome: filter.sistemas,
                      }
                    : ehAdmin
                      ? undefined
                      : {
                            hasSome: ['SMAE', ...user.modulo_sistema],
                        },
            },
            orderBy: { nome: 'asc' },
            select: {
                nome: true,
                descricao: true,
                id: true,
                modulos_sistemas: true,
                autogerenciavel: true,
                perfil_privilegio: {
                    select: {
                        privilegio: { select: { nome: true, codigo: true } },
                    },
                },
            },
        });

        // considera que pode editar tudo
        const dadosRetorno: PerfilAcessoPrivilegios[] = dados.map((r) => {
            return {
                ...r,
                pode_editar: true,
            };
        });
        if (ehAdmin) return dadosRetorno;

        const sistema = user.assertOneModuloSistema('buscar', 'perfil de acesso');

        // exceto a linha de administrador, que não pode ser editada se você não for administrador
        for (const r of dadosRetorno) {
            r.modulos_sistemas = [sistema];

            if (r.perfil_privilegio.some((v) => LISTA_PRIV_ADMIN.includes(v.privilegio.codigo as ListaDePrivilegios)))
                r.pode_editar = false;
        }

        return dadosRetorno;
    }

    async listaPrivilegiosModulos(
        pessoaId: number,
        filterModulos: ModuloSistema[] | undefined
    ): Promise<ListaPrivilegiosModulos> {
        if (!filterModulos) filterModulos = Object.keys(ModuloSistema) as ModuloSistema[];

        const filterModulosJson = filterModulos;

        const dados: ListaPrivilegiosModulos[] = await this.prisma.$queryRaw`
            WITH filter_modulos AS (
                SELECT ARRAY[${filterModulosJson}]::"ModuloSistema"[] AS modulos
            ),
            filtered_pessoa_perfil AS (
                SELECT pp.perfil_acesso_id
                FROM pessoa_perfil pp
                JOIN pessoa ON pessoa.id = pp.pessoa_id
                WHERE pp.pessoa_id = ${pessoaId} AND NOT pessoa.desativado
            ),
            filtered_perfil_acesso AS (
                SELECT id
                FROM perfil_acesso
                WHERE removido_em IS NULL
            ),
            perms AS (
                SELECT DISTINCT p.codigo AS cod_priv, m.codigo AS cod_modulos, unnest(m.modulo_sistema) AS modulo_sistema
                FROM filtered_pessoa_perfil pp
                JOIN filtered_perfil_acesso pa ON pp.perfil_acesso_id = pa.id
                JOIN perfil_privilegio priv ON priv.perfil_acesso_id = pa.id
                JOIN privilegio p ON p.id = priv.privilegio_id
                JOIN privilegio_modulo m ON p.modulo_id = m.id
                JOIN filter_modulos fm ON m.modulo_sistema && fm.modulos
            )
            SELECT
                array_agg(DISTINCT cod_priv) AS privilegios,
                array_agg(DISTINCT cod_modulos) AS modulos,
                array_agg(DISTINCT modulo_sistema) AS sistemas
            FROM perms;
        `;
        if (!dados[0] || dados[0].modulos === null || !Array.isArray(dados[0].modulos)) {
            throw new BadRequestException(`Seu usuário não tem mais permissões. Entre em contato com o administrador.`);
        }
        const ret = dados[0];
        //if (filterModulos.length == 2) {
        //const sistema = filterModulos.filter((v) => v != 'SMAE')[0];
        //this.filtraPrivilegiosSMAE(sistema, ret);
        //}
        if (!ret.modulos.includes('SMAE')) ret.modulos.push('SMAE');

        if (ret.privilegios.includes('SMAE.login_suspenso'))
            throw new BadRequestException('Seu usuário está suspenso. Entre em contato com o administrador.');

        return ret;
    }

    /**
     * Filtra os privilégios com base no sistema fornecido.
     *
     * No contexto dos sistemas de gerenciamento, as permissões (ou privilégios) determinam o que os usuários
     * podem ou não podem fazer. No caso específico dos sistemas marcados como `SMAE`, há uma regra de negócios
     * que define quais privilégios devem estar disponíveis dependendo do sistema em uso.
     *
     * A função `filtraPrivilegiosSMAE` é utilizada para garantir que apenas os privilégios relevantes para o
     * sistema atual sejam mantidos. Isso é necessário para evitar que os usuários vejam ou tentem acessar
     * funcionalidades que não são aplicáveis ao sistema que estão utilizando, o que poderia causar confusão
     * ou possíveis erros.
     *
     * Especificamente:
     *
     * 1. **MDO e Projetos**:
     *    - Se o sistema atual não for `MDO` ou `Projetos`, remove os privilégios que começam com `TipoAditivo.`,
     *          `ModalidadeContratacao.`, etc...
     *      Estes privilégios são específicos para `MDO` e `Projetos`, portanto, não devem aparecer em outros sistemas.
     *
     * 2. **PDM e PlanoSetorial**:
     *    - Se o sistema atual não for `PDM` ou `PlanoSetorial`, remove os privilégios que começam com `CadastroGrupoVariavel.`.
     *      Este privilégio é específico para `PDM` e `PlanoSetorial`, então, não deve aparecer em outros sistemas.
     *
     * Ao realizar esta filtragem, a função assegura que os privilégios apresentados aos usuários são relevantes
     * e específicos ao contexto do sistema que eles estão utilizando, melhorando assim a usabilidade e a segurança
     * do sistema.
     *
     * @param sistema - O sistema para filtrar os privilégios.
     * @param ret - A lista de privilégios e módulos.
     */
    private filtraPrivilegiosSMAE(sistema: ModuloSistema, ret: ListaPrivilegiosModulos) {
        /**
         * Remove os privilégios que começam com o prefixo fornecido.
         *
         * @param privilege - O prefixo dos privilégios a serem removidos.
         */
        const removePrivilegios = (privilege: string) => {
            ret.privilegios = ret.privilegios.filter((value) => !value.toString().startsWith(privilege));
        };

        if (!(sistema == 'MDO' || sistema == 'Projetos')) {
            removePrivilegios('TipoAditivo.');
            removePrivilegios('ModalidadeContratacao.');
        }

        if (!(sistema == 'PDM' || sistema == 'PlanoSetorial')) {
            removePrivilegios('CadastroGrupoVariavel.');
            removePrivilegios('CadastroUnidadeMedida.');
            removePrivilegios('CadastroVariavelCategorica.');
        }

        if (!(sistema == 'PlanoSetorial')) {
            removePrivilegios('FonteVariavel.');
            removePrivilegios('AssuntoVariavel.');
        }

        if (sistema == 'CasaCivil') {
            removePrivilegios('CadastroPainelExterno.');
            removePrivilegios('CadastroGrupoPainelExterno.');
            removePrivilegios('SMAE.espectador_de_painel_externo');
        }
    }

    async novaSenha(novaSenhaDto: NovaSenhaDto, user: PessoaFromJwt) {
        const pessoa = await this.prisma.pessoa.findFirstOrThrow({
            where: { id: user.id },
            select: { senha: true },
        });

        const isPasswordValid = await this.senhaCorreta(novaSenhaDto.senha_corrente, pessoa);
        if (!isPasswordValid) throw new BadRequestException('senha_corrente| Senha atual não confere');

        if (!(await this.escreverNovaSenhaById(user.id, novaSenhaDto.senha_nova, true))) {
            throw new BadRequestException('Senha não pode ser alterada no momento');
        }
    }

    async getResponsabilidades(dto: BuscaResponsabilidades, user: PessoaFromJwt): Promise<DetalheResponsabilidadeDto> {
        let metas: IdCodTituloDto[] | undefined;
        if (user.modulo_sistema.includes('PDM')) {
            metas = await this.pRespMetaService.buscaMetas(dto.pessoa_id, dto.pdm_id, this.prisma);
        }

        return {
            metas: metas ?? [],
        };
    }

    async executaTransferenciaResponsabilidades(
        dto: ExecutaTransferenciaResponsabilidades,
        user: PessoaFromJwt
    ): Promise<void> {
        const { origemPessoa, novaPessoa } = await this.buscaPessoasTransferencia(dto);

        const info = await this.getResponsabilidades({ pessoa_id: origemPessoa.id }, user);

        if (Array.isArray(dto.metas)) {
            for (const metaId of dto.metas) {
                if (!info.metas.find((v) => v.id === metaId))
                    throw new BadRequestException(
                        `Meta ID ${metaId} não pode ser transferida, pois não está na origem.`
                    );
            }
        }

        await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient) => {
                if (dto.metas.length) {
                    switch (dto.operacao) {
                        case 'copiar':
                            await this.pRespMetaService.copiarResponsabilidades(
                                origemPessoa.id,
                                novaPessoa!.id,
                                dto.metas,
                                prismaTx,
                                user
                            );
                            break;
                        case 'remover':
                            await this.pRespMetaService.removerResponsabilidades(
                                origemPessoa.id,
                                dto.metas,
                                prismaTx,
                                user
                            );
                            break;
                        case 'transferir':
                            await this.pRespMetaService.transferirResponsabilidades(
                                origemPessoa.id,
                                novaPessoa!.id,
                                dto.metas,
                                prismaTx,
                                user
                            );
                            break;
                        default:
                            dto.operacao satisfies never;
                    }
                }
            },
            { isolationLevel: 'Serializable' }
        );
    }

    private async buscaPessoasTransferencia(dto: ExecutaTransferenciaResponsabilidades) {
        const pessoas = await this.prisma.pessoa.findMany({
            where: {
                OR: [
                    { id: dto.origem_pessoa_id }, // a pessoa de origem pode estar desativada já
                    {
                        AND: dto.nova_pessoa_id ? { id: dto.nova_pessoa_id } : undefined,
                    },
                ],
            },
            select: {
                id: true,
                nome_completo: true,
                desativado: true,
                pessoa_fisica: {
                    select: {
                        orgao_id: true,
                    },
                },
            },
        });

        const origemPessoa = pessoas.find((pessoa) => pessoa.id === dto.origem_pessoa_id);
        const novaPessoa = dto.nova_pessoa_id ? pessoas.find((pessoa) => pessoa.id === dto.nova_pessoa_id) : undefined;

        if (!origemPessoa) throw new BadRequestException('Não foi possível encontrar a pessoa de origem');

        if (dto.operacao === 'transferir' || dto.operacao === 'copiar') {
            if (!novaPessoa)
                throw new BadRequestException('Não foi possível encontrar o usuário de destino. Não encontrado');

            if (novaPessoa.desativado)
                throw new BadRequestException('Usuário responsável pelo destino não pode estar desativado');

            if (!novaPessoa.pessoa_fisica?.orgao_id || !origemPessoa.pessoa_fisica?.orgao_id)
                throw new BadRequestException('Usuário de origem e destino precisam ter um órgão');

            if (novaPessoa.pessoa_fisica.orgao_id !== origemPessoa.pessoa_fisica.orgao_id)
                throw new BadRequestException('Usuário de origem e destino precisam pertencer ao mesmo órgão');
        }
        return { origemPessoa, novaPessoa };
    }
}
