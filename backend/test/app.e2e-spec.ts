import { before, describe, it } from 'node:test';
import { api, assert, assertStatus, bootApp } from './lib';

describe('AppController', () => {
    before(async () => {
        await bootApp();
    });

    it('GET / responde 404', async () => {
        const res = await api().get('/');
        assert.equal(res.status, 404);
    });

    it('GET /api/ping responde 200 sem token', async () => {
        const res = await api().get('/api/ping');
        assertStatus(res, 200);
    });
});
