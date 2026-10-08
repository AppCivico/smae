import { before, describe, it } from 'node:test';
import { api, assert, assertStatus, bootApp, criarPdmAntigo, criarPessoaSemPrivilegios, Sessao, uniq } from '../lib';

describe('upload.diretorio', () => {
    let usuario: Sessao;

    before(async () => {
        await bootApp();
        usuario = await criarPessoaSemPrivilegios();
    });

    const listar = async (pdmId: number) => {
        const res = await api(usuario).get(`/api/diretorio?pdm_id=${pdmId}`);
        assertStatus(res, 200);
        // todo PDM novo já nasce com o diretório raiz "/"
        return (res.body.linhas as { id: number; caminho: string }[]).filter((d) => d.caminho !== '/');
    };

    describe('autenticação e validação', () => {
        it('401 sem token', async () => {
            assertStatus(await api().get('/api/diretorio?pdm_id=1'), 401);
            assertStatus(await api().patch('/api/diretorio').send({ pdm_id: 1, caminho: 'a' }), 401);
            assertStatus(await api().delete('/api/diretorio/1'), 401);
        });

        it('qualquer usuário logado acessa, sem privilégio específico', async () => {
            const pdm = await criarPdmAntigo();
            assertStatus(
                await api(usuario)
                    .patch('/api/diretorio')
                    .send({ pdm_id: pdm.id, caminho: uniq('livre') }),
                204
            );
        });

        it('400 sem caminho ou sem nenhum dono (projeto, transferência ou pdm)', async () => {
            const pdm = await criarPdmAntigo();
            assertStatus(await api(usuario).patch('/api/diretorio').send({ pdm_id: pdm.id }), 400);

            const semDono = await api(usuario).patch('/api/diretorio').send({ caminho: 'a' });
            assertStatus(semDono, 400);
            assert.match(semDono.body.message, /Pelo menos um dos campos/);

            const listaSemFiltro = await api(usuario).get('/api/diretorio');
            assertStatus(listaSemFiltro, 400);
        });

        it('400 com mais de um dono ao mesmo tempo', async () => {
            const res = await api(usuario).patch('/api/diretorio').send({ pdm_id: 1, projeto_id: 1, caminho: 'a' });
            assertStatus(res, 400);
            assert.match(res.body.message, /mutuamente exclusivos/);

            assertStatus(await api(usuario).get('/api/diretorio?pdm_id=1&transferencia_id=1'), 400);
        });

        it('400 com :id não numérico e 404 com diretório inexistente', async () => {
            assertStatus(await api(usuario).delete('/api/diretorio/abc'), 400);
            const res = await api(usuario).delete('/api/diretorio/999999999');
            assertStatus(res, 404);
            assert.match(res.body.message, /Diretório não encontrado/);
        });
    });

    describe('árvore de diretórios', () => {
        it('cria cada nível do caminho normalizado e não duplica ao repetir', async () => {
            const pdm = await criarPdmAntigo();
            const raiz = uniq('raiz').replace(/ /g, '-');

            assertStatus(
                await api(usuario)
                    .patch('/api/diretorio')
                    .send({ pdm_id: pdm.id, caminho: `${raiz}//docs/2024/` }),
                204
            );
            const caminhos = (await listar(pdm.id)).map((d) => d.caminho).sort();
            assert.deepEqual(caminhos, [`/${raiz}/`, `/${raiz}/docs/`, `/${raiz}/docs/2024/`]);

            assertStatus(
                await api(usuario)
                    .patch('/api/diretorio')
                    .send({ pdm_id: pdm.id, caminho: `/${raiz}/docs/2024` }),
                204
            );
            assert.deepEqual((await listar(pdm.id)).map((d) => d.caminho).sort(), [
                `/${raiz}/`,
                `/${raiz}/docs/`,
                `/${raiz}/docs/2024/`,
            ]);
        });

        it('troca caracteres reservados do caminho por _', async () => {
            const pdm = await criarPdmAntigo();
            assertStatus(await api(usuario).patch('/api/diretorio').send({ pdm_id: pdm.id, caminho: 'a:b*c?d' }), 204);
            assert.deepEqual(
                (await listar(pdm.id)).map((d) => d.caminho),
                ['/a_b_c_d/']
            );
        });

        it('cada pdm enxerga só os próprios diretórios', async () => {
            const pdmA = await criarPdmAntigo();
            const pdmB = await criarPdmAntigo();
            assertStatus(await api(usuario).patch('/api/diretorio').send({ pdm_id: pdmA.id, caminho: 'so-do-a' }), 204);

            assert.deepEqual(
                (await listar(pdmA.id)).map((d) => d.caminho),
                ['/so-do-a/']
            );
            assert.deepEqual(await listar(pdmB.id), []);
        });

        it('remover um diretório leva os filhos junto, mas preserva o pai', async () => {
            const pdm = await criarPdmAntigo();
            assertStatus(await api(usuario).patch('/api/diretorio').send({ pdm_id: pdm.id, caminho: 'a/b/c' }), 204);
            assertStatus(await api(usuario).patch('/api/diretorio').send({ pdm_id: pdm.id, caminho: 'a/bb' }), 204);

            const antes = await listar(pdm.id);
            const alvo = antes.find((d) => d.caminho === '/a/b/');
            assert.ok(alvo, 'diretório /a/b/ não foi criado');

            assertStatus(await api(usuario).delete(`/api/diretorio/${alvo.id}`), 204);

            const depois = (await listar(pdm.id)).map((d) => d.caminho).sort();
            assert.deepEqual(depois, ['/a/', '/a/bb/']);
        });
    });
});
