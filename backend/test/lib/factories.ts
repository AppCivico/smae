import { randomBytes } from 'crypto';
import { api, assertStatus, Sistema } from './api';
import { prisma } from './app';
import { loginAsSuperAdmin } from './auth';

let seq = 0;

/** Texto único por chamada (pid + sequência + aleatório): use em nomes/siglas/descrições. */
export function uniq(prefixo = 'e2e'): string {
    return `${prefixo} ${process.pid}-${++seq}-${randomBytes(2).toString('hex')}`;
}

export async function criarTipoOrgao(dados: { descricao?: string } = {}) {
    return prisma().tipoOrgao.create({
        data: { descricao: dados.descricao ?? uniq('tipo-orgao') },
    });
}

export async function criarOrgao(
    dados: { sigla?: string; descricao?: string; tipo_orgao_id?: number; parente_id?: number; nivel?: number } = {}
) {
    const tipo_orgao_id = dados.tipo_orgao_id ?? (await criarTipoOrgao()).id;
    return prisma().orgao.create({
        data: {
            sigla: dados.sigla ?? uniq('SIG'),
            descricao: dados.descricao ?? uniq('orgao'),
            tipo_orgao_id,
            parente_id: dados.parente_id,
            nivel: dados.nivel ?? (dados.parente_id ? 2 : 1),
        },
    });
}

type DadosPdm = Record<string, unknown>;

async function postComoSuperAdmin(path: string, sistema: Sistema, corpo: DadosPdm) {
    const res = await api(await loginAsSuperAdmin(), { sistema })
        .post(path)
        .send(corpo);
    assertStatus(res, 201);
    return res.body as { id: number; nome: string } & Record<string, unknown>;
}

/**
 * Cria via API (como superadmin) um Plano Setorial ou, com sistema 'ProgramaDeMetas', um PDM novo (tipo PDM_AS_PS).
 * Use o mesmo `sistema` nas chamadas seguintes que dependem dele.
 */
export async function criarPlanoSetorial(
    opts: { sistema?: 'PlanoSetorial' | 'ProgramaDeMetas'; dados?: DadosPdm } = {}
) {
    const sistema = opts.sistema ?? 'PlanoSetorial';
    return postComoSuperAdmin('/api/plano-setorial', sistema, {
        nome: uniq(sistema === 'PlanoSetorial' ? 'PS' : 'PDM'),
        prefeito: 'Prefeito E2E',
        equipe_tecnica: null,
        ...(sistema === 'ProgramaDeMetas' ? { orgao_admin_id: 1 } : {}),
        ...opts.dados,
    });
}

/** Cria via API (como superadmin) um PDM do módulo antigo (/api/pdm, sistema 'PDM'). */
export async function criarPdmAntigo(dados: DadosPdm = {}) {
    return postComoSuperAdmin('/api/pdm', 'PDM', {
        nome: uniq('PDM'),
        prefeito: 'Prefeito E2E',
        equipe_tecnica: null,
        nivel_orcamento: 'Meta',
        ...dados,
    });
}
