import { before, describe, it } from 'node:test';
import { api, assert, assertStatus, bootApp, criarPessoaComPrivilegios, prisma, Sessao } from '../lib';

// os avisos não têm @Roles: qualquer sessão cria e edita. O envio de e-mail é feito pelo cron, desligado nos testes.
describe('aviso-email', () => {
    let usuario: Sessao;

    before(async () => {
        await bootApp();
        usuario = await criarPessoaComPrivilegios(['CadastroOrgao.inserir']);
    });

    const novoAviso = (extra: Record<string, unknown> = {}) => ({
        numero: 3,
        numero_periodo: 'Dias',
        tipo: 'CronogramaTerminoPlanejado',
        ativo: true,
        com_copia: ['copia@e2e.test'],
        recorrencia_dias: 0,
        ...extra,
    });

    const tarefaCronograma = async () => (await prisma().tarefaCronograma.create({ data: {} })).id;

    it('401 sem token', async () => {
        assertStatus(await api().post('/api/aviso-email').send(novoAviso()), 401);
        assertStatus(await api().get('/api/aviso-email'), 401);
        assertStatus(await api().patch('/api/aviso-email/1').send({ numero: 1 }), 401);
        assertStatus(await api().delete('/api/aviso-email/1'), 401);
    });

    it('400 com número fora de 1 a 1000, período ou tipo inválidos e e-mail de cópia inválido', async () => {
        assertStatus(
            await api(usuario)
                .post('/api/aviso-email')
                .send(novoAviso({ numero: 0 })),
            400
        );
        assertStatus(
            await api(usuario)
                .post('/api/aviso-email')
                .send(novoAviso({ numero_periodo: 'Horas' })),
            400
        );
        assertStatus(
            await api(usuario)
                .post('/api/aviso-email')
                .send(novoAviso({ tipo: 'Outro' })),
            400
        );
        assertStatus(
            await api(usuario)
                .post('/api/aviso-email')
                .send(novoAviso({ com_copia: ['nao-e-email'] })),
            400
        );
    });

    it('400 de término planejado sem tarefa, ou com tarefa e cronograma ao mesmo tempo', async () => {
        const semVinculo = await api(usuario).post('/api/aviso-email').send(novoAviso());
        assertStatus(semVinculo, 400);
        assert.match(semVinculo.body.message, /Faltando tarefa_cronograma_id/);

        const ambos = await api(usuario)
            .post('/api/aviso-email')
            .send(novoAviso({ tarefa_cronograma_id: await tarefaCronograma(), tarefa_id: 1 }));
        assertStatus(ambos, 400);
        assert.match(ambos.body.message, /não pode ser de ambos/);
    });

    it('400 de nota com nota_jwt inválido', async () => {
        const res = await api(usuario)
            .post('/api/aviso-email')
            .send(novoAviso({ tipo: 'Nota' }));
        assertStatus(res, 400);
        assert.match(res.body.message, /nota_id inválido/);
    });

    it('cria, lista, edita e remove; segundo aviso para o mesmo cronograma é recusado', async () => {
        const cronograma = await tarefaCronograma();
        const criado = await api(usuario)
            .post('/api/aviso-email')
            .send(novoAviso({ tarefa_cronograma_id: cronograma, com_copia: ['a@e2e.test', 'b@e2e.test'] }));
        assertStatus(criado, 201);
        const id: number = criado.body.id;

        const repetido = await api(usuario)
            .post('/api/aviso-email')
            .send(novoAviso({ tarefa_cronograma_id: cronograma }));
        assertStatus(repetido, 400);
        assert.match(repetido.body.message, /Já existe um aviso/);

        const lista = await api(usuario).get('/api/aviso-email');
        assertStatus(lista, 200);
        const linha = lista.body.linhas.find((l: { id: number }) => l.id === id);
        assert.ok(linha, 'aviso criado deveria aparecer na listagem');
        assert.equal(linha.numero, 3);
        assert.equal(linha.numero_periodo, 'Dias');
        assert.deepEqual(linha.com_copia, ['a@e2e.test', 'b@e2e.test']);

        assertStatus(await api(usuario).patch(`/api/aviso-email/${id}`).send({ numero: 2, ativo: false }), 200);
        const atualizado = await prisma().avisoEmail.findUniqueOrThrow({ where: { id } });
        assert.equal(atualizado.numero, 2);
        assert.equal(atualizado.ativo, false);

        assertStatus(await api(usuario).delete(`/api/aviso-email/${id}`), 202);
        const depois = await api(usuario).get('/api/aviso-email');
        assert.equal(
            depois.body.linhas.some((l: { id: number }) => l.id === id),
            false
        );
    });

    it('404 ao editar aviso inexistente', async () => {
        assertStatus(await api(usuario).patch('/api/aviso-email/999999').send({ numero: 2 }), 404);
    });
});
