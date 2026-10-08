import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    loginAsSuperAdmin,
    prisma,
    Sessao,
    uniq,
} from '../lib';

describe('task', () => {
    let admin: Sessao;
    let semPrivilegio: Sessao;

    before(async () => {
        await bootApp();
        admin = await loginAsSuperAdmin();
        semPrivilegio = await criarPessoaSemPrivilegios();
    });

    const criarEcho = async (sessao: Sessao = admin, echo = uniq('echo')) => {
        const res = await api(sessao).post('/api/task').send({ type: 'echo', params: { echo } });
        assertStatus(res, 201);
        return { id: res.body.id as number, echo };
    };

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(
                await api()
                    .post('/api/task')
                    .send({ type: 'echo', params: { echo: 'x' } }),
                401
            );
            assertStatus(await api().get('/api/task/1'), 401);
            assertStatus(await api().patch('/api/task/run-in-foreground/1'), 401);
        });

        it('403 sem SMAE.superadmin', async () => {
            const post = await api(semPrivilegio)
                .post('/api/task')
                .send({ type: 'echo', params: { echo: 'x' } });
            assertStatus(post, 403);
            assert.match(post.body.message, /SMAE\.superadmin/);
            assertStatus(await api(semPrivilegio).get('/api/task/1'), 403);
            assertStatus(await api(semPrivilegio).patch('/api/task/run-in-foreground/1'), 403);
        });
    });

    describe('validação', () => {
        it('400 com tipo de tarefa desconhecido', async () => {
            const res = await api(admin)
                .post('/api/task')
                .send({ type: 'tipo_inexistente', params: { echo: 'x' } });
            assertStatus(res, 400);
        });

        it('400 sem params ou com params inválidos para o tipo echo', async () => {
            const semParams = await api(admin).post('/api/task').send({ type: 'echo' });
            assertStatus(semParams, 400);

            assertStatus(await api(admin).post('/api/task').send({ type: 'echo', params: {} }), 400);
            assertStatus(
                await api(admin)
                    .post('/api/task')
                    .send({ type: 'echo', params: { echo: 123 } }),
                400
            );
        });

        it('400 com :id não numérico', async () => {
            assertStatus(await api(admin).get('/api/task/abc'), 400);
            assertStatus(await api(admin).patch('/api/task/run-in-foreground/abc'), 400);
        });
    });

    describe('fila e execução', () => {
        it('cria task echo pendente e consulta pelo id', async () => {
            const { id, echo } = await criarEcho();

            const linha = await prisma().task_queue.findUniqueOrThrow({ where: { id } });
            assert.equal(linha.type, 'echo');
            assert.equal(linha.status, 'pending');
            assert.equal(linha.pessoa_id, admin.pessoa.id);
            assert.deepEqual(linha.params, { echo });

            const res = await api(admin).get(`/api/task/${id}`);
            assertStatus(res, 200);
            assert.equal(res.body.id, id);
            assert.equal(res.body.tipo, 'echo');
            assert.equal(res.body.status, 'pending');
            assert.deepEqual(res.body.params, { echo });
            assert.equal(res.body.terminou_em, null);
        });

        it('executa em foreground, devolve o echo e marca como completed', async () => {
            const { id, echo } = await criarEcho();

            const exec = await api(admin).patch(`/api/task/run-in-foreground/${id}`);
            assertStatus(exec, 200);
            assert.deepEqual(exec.body, { echo, taskId: String(id) });

            const res = await api(admin).get(`/api/task/${id}`);
            assertStatus(res, 200);
            assert.equal(res.body.status, 'completed');
            assert.deepEqual(res.body.output, { echo, taskId: String(id) });
            assert.ok(res.body.terminou_em);
            assert.equal(res.body.erro_mensagem, null);
        });

        it('404 em id inexistente (consulta e execução)', async () => {
            assertStatus(await api(admin).get('/api/task/999999999'), 404);
            assertStatus(await api(admin).patch('/api/task/run-in-foreground/999999999'), 404);
        });

        it('GET só enxerga task da própria pessoa', async () => {
            const outroSuper = await criarPessoaComPrivilegios(['SMAE.superadmin']);
            const { id } = await criarEcho();

            assertStatus(await api(outroSuper).get(`/api/task/${id}`), 404);
            assertStatus(await api(admin).get(`/api/task/${id}`), 200);
        });

        it('mesma task pendente do mesmo usuário reaproveita o id', async () => {
            const { id, echo } = await criarEcho();
            const repetida = await api(admin).post('/api/task').send({ type: 'echo', params: { echo } });
            assertStatus(repetida, 201);
            assert.equal(repetida.body.id, id);
        });
    });
});
