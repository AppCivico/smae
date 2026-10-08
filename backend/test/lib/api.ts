import supertest = require('supertest');
import { strict as assert } from 'node:assert';
import { ModuloSistema } from '@prisma/client';
import { getApp } from './app';

export type Requisicao = supertest.Test;
export type Resposta = supertest.Response;

export type Sistema = Exclude<ModuloSistema, 'SMAE'>;

export interface ApiOpts {
    /** Envia `smae-sistemas: SMAE,<sistema>`, como o frontend. */
    sistema?: Sistema;
}

/** Cliente HTTP da app de teste. `auth`: token ou sessão de loginAsSuperAdmin/criarPessoa*. Paths começam com /api. */
export function api(auth?: string | { token: string }, opts: ApiOpts = {}) {
    const token = typeof auth === 'string' ? auth : auth?.token;
    const server = getApp().getHttpServer();
    const req = (method: 'get' | 'post' | 'patch' | 'put' | 'delete') => {
        return (path: string): Requisicao => {
            let r = supertest(server)[method](path);
            if (token) r = r.set('Authorization', `Bearer ${token}`);
            if (opts.sistema) r = r.set('smae-sistemas', `SMAE,${opts.sistema}`);
            return r;
        };
    };
    return { get: req('get'), post: req('post'), patch: req('patch'), put: req('put'), delete: req('delete') };
}

/** Falha mostrando o corpo da resposta, o que poupa uma rodada de debug quando o status vem errado. */
export function assertStatus(res: Resposta, esperado: number): void {
    if (res.status === esperado) return;
    const corpo = res.text && res.text.length > 2000 ? res.text.slice(0, 2000) + '...' : res.text;
    const req = (res as unknown as { req?: { method?: string; path?: string } }).req;
    assert.fail(`${req?.method} ${req?.path}: esperado HTTP ${esperado}, veio ${res.status}\n${corpo}`);
}
