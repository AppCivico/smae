import { AuthService } from '../../src/auth/auth.service';
import { ListaDePrivilegios } from '../../src/common/ListaDePrivilegios';
import { prisma, getApp } from './app';
import { uniq } from './factories';

export interface Sessao {
    pessoa: { id: number; email: string; nome_exibicao: string; orgao_id: number };
    token: string;
}

export const SUPERADMIN_EMAIL = 'superadmin@admin.com';

/** Privilégio (módulo SMAE) que nenhuma rota exige: pessoa com zero privilégios recebe 400, não 403. */
export const PRIVILEGIO_INOFENSIVO: ListaDePrivilegios = 'Config.editar';

export async function criarToken(pessoaId: number): Promise<string> {
    const sessao = await getApp().get(AuthService).criarSession(pessoaId, '127.0.0.1');
    return sessao.access_token;
}

let superAdmin: Promise<Sessao> | undefined;

/** Sessão do superadmin do seed (perfis "Administrador(a) Geral do SMAE" + SYSADMIN). */
export function loginAsSuperAdmin(): Promise<Sessao> {
    if (!superAdmin) {
        superAdmin = (async () => {
            const p = await prisma().pessoa.findUniqueOrThrow({
                where: { email: SUPERADMIN_EMAIL },
                select: { id: true, email: true, nome_exibicao: true, pessoa_fisica: { select: { orgao_id: true } } },
            });
            return {
                pessoa: {
                    id: p.id,
                    email: p.email,
                    nome_exibicao: p.nome_exibicao,
                    orgao_id: p.pessoa_fisica!.orgao_id,
                },
                token: await criarToken(p.id),
            };
        })();
    }
    return superAdmin;
}

export interface CriarPessoaOpts {
    /** Default: órgão 1, criado pelo seed. */
    orgao_id?: number;
    nome?: string;
}

/**
 * Cria um perfil de acesso só com `privilegios`, uma pessoa com esse perfil e devolve a sessão.
 * Códigos inexistentes no seed falham na hora (confira src/common/ListaDePrivilegios.ts e prisma/seed.ts).
 */
export async function criarPessoaComPrivilegios(
    privilegios: ListaDePrivilegios[],
    opts: CriarPessoaOpts = {}
): Promise<Sessao> {
    if (!privilegios.length) throw new Error('use criarPessoaSemPrivilegios() para o caso de 403');
    const db = prisma();
    const encontrados = await db.privilegio.findMany({
        where: { codigo: { in: privilegios } },
        select: { id: true, codigo: true },
    });
    const faltando = privilegios.filter((c) => !encontrados.some((e) => e.codigo === c));
    if (faltando.length) throw new Error(`privilégio(s) não existem no seed: ${faltando.join(', ')}`);

    const nome = opts.nome ?? uniq('pessoa');
    const email = `${nome.replace(/[^a-zA-Z0-9]+/g, '.').toLowerCase()}@e2e.test`;
    const orgao_id = opts.orgao_id ?? 1;

    const pessoa = await db.$transaction(async (tx) => {
        const perfil = await tx.perfilAcesso.create({
            data: { nome: uniq('perfil'), descricao: `e2e: ${privilegios.join(', ')}`, autogerenciavel: false },
        });
        await tx.perfilPrivilegio.createMany({
            data: encontrados.map((p) => ({ perfil_acesso_id: perfil.id, privilegio_id: p.id })),
        });
        return tx.pessoa.create({
            data: {
                email,
                nome_exibicao: nome,
                nome_completo: nome,
                senha: '*',
                senha_bloqueada: false,
                pessoa_fisica: { create: { orgao_id, cargo: '', cpf: '', lotacao: '' } },
                PessoaPerfil: { create: { perfil_acesso_id: perfil.id } },
            },
            select: { id: true },
        });
    });

    return {
        pessoa: { id: pessoa.id, email, nome_exibicao: nome, orgao_id },
        token: await criarToken(pessoa.id),
    };
}

/** Pessoa autenticada que não passa em nenhum @Roles: use para testar 403. */
export function criarPessoaSemPrivilegios(opts: CriarPessoaOpts = {}): Promise<Sessao> {
    return criarPessoaComPrivilegios([PRIVILEGIO_INOFENSIVO], opts);
}
