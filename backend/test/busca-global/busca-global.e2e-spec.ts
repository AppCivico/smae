import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    Sessao,
} from '../lib';

describe('busca-global', () => {
    let consulta: Sessao;
    let semPrivilegio: Sessao;
    let editorDeTransferencia: Sessao;

    before(async () => {
        await bootApp();
        // Menu.cc_consulta_geral é derivado: só vem junto com CadastroTransferencia.administrador
        consulta = await criarPessoaComPrivilegios(['CadastroTransferencia.administrador']);
        editorDeTransferencia = await criarPessoaComPrivilegios(['CadastroTransferencia.editar']);
        semPrivilegio = await criarPessoaSemPrivilegios();
    });

    it('401 sem token e 403 sem Menu.cc_consulta_geral', async () => {
        assertStatus(await api().post('/api/busca-global/proximidades-table').send({ lat: -23.5, lon: -46.6 }), 401);

        const res = await api(semPrivilegio)
            .post('/api/busca-global/proximidades-table')
            .send({ lat: -23.5, lon: -46.6 });
        assertStatus(res, 403);
        assert.match(res.body.message, /Menu\.cc_consulta_geral/);

        assertStatus(
            await api(editorDeTransferencia)
                .post('/api/busca-global/proximidades-table')
                .send({ lat: -23.5, lon: -46.6 }),
            403
        );
    });

    it('400 sem modo de busca, com dois modos ao mesmo tempo, ou com limites fora do permitido', async () => {
        const semModo = await api(consulta).post('/api/busca-global/proximidades-table').send({});
        assertStatus(semModo, 400);
        assert.match(semModo.body.message, /Forneça um dos seguintes modos/);

        assertStatus(
            await api(consulta)
                .post('/api/busca-global/proximidades-table')
                .send({ lat: -23.5, lon: -46.6, regiao_id: 1 }),
            400
        );
        assertStatus(
            await api(consulta).post('/api/busca-global/proximidades-table').send({ lat: 95, lon: -46.6 }),
            400
        );
        assertStatus(
            await api(consulta)
                .post('/api/busca-global/proximidades-table')
                .send({ lat: -23.5, lon: -46.6, raio_km: 0.05 }),
            400
        );
        assertStatus(
            await api(consulta)
                .post('/api/busca-global/proximidades-table')
                .send({ lat: -23.5, lon: -46.6, raio: 20000 }),
            400
        );
    });

    it('201 por ponto com a tabela unificada: cabeçalhos e linhas', async () => {
        const res = await api(consulta)
            .post('/api/busca-global/proximidades-table')
            .send({ lat: -23.5505, lon: -46.6333, raio: 500 });
        assertStatus(res, 201);
        assert.equal(res.body.headers.mainColumn, 'Endereço');
        assert.equal(res.body.headers.col3, 'Órgão');
        assert.ok(Array.isArray(res.body.rows));
        for (const linha of res.body.rows) {
            assert.ok(linha.row_id);
            assert.ok(Array.isArray(linha.dynamic_metadados));
        }
    });
});
