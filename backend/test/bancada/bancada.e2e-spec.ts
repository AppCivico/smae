import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    prisma,
    Sessao,
    uniq,
} from '../lib';

describe('bancada', () => {
    let gestor: Sessao;
    let editor: Sessao;
    let semPrivilegio: Sessao;
    let partidos: number[];

    before(async () => {
        await bootApp();
        gestor = await criarPessoaComPrivilegios([
            'CadastroBancada.inserir',
            'CadastroBancada.editar',
            'CadastroBancada.remover',
        ]);
        editor = await criarPessoaComPrivilegios(['CadastroBancada.editar']);
        semPrivilegio = await criarPessoaSemPrivilegios();
        partidos = [];
        for (let i = 0; i < 3; i++) {
            const partido = await prisma().partido.create({
                data: { nome: uniq('Partido'), sigla: uniq('PT').replace(/\s/g, ''), numero: 10 + i },
            });
            partidos.push(partido.id);
        }
    });

    const novaBancada = (extra: Record<string, unknown> = {}) => ({
        nome: uniq('Bancada'),
        sigla: uniq('BC').replace(/\s/g, ''),
        descricao: 'Bancada de teste',
        partido_ids: [],
        ...extra,
    });

    it('401 sem token', async () => {
        assertStatus(await api().get('/api/bancada'), 401);
        assertStatus(await api().post('/api/bancada').send(novaBancada()), 401);
        assertStatus(await api().get('/api/bancada/1'), 401);
        assertStatus(await api().patch('/api/bancada/1').send({ nome: uniq() }), 401);
        assertStatus(await api().delete('/api/bancada/1'), 401);
    });

    it('403 sem o privilégio de cada rota; a listagem só exige sessão', async () => {
        assertStatus(await api(semPrivilegio).get('/api/bancada'), 200);

        const criar = await api(semPrivilegio).post('/api/bancada').send(novaBancada());
        assertStatus(criar, 403);
        assert.match(criar.body.message, /CadastroBancada\.inserir/);

        const detalhe = await api(semPrivilegio).get('/api/bancada/1');
        assertStatus(detalhe, 403);
        assert.match(detalhe.body.message, /CadastroBancada\.editar/);

        const editar = await api(semPrivilegio).patch('/api/bancada/1').send({ nome: uniq() });
        assertStatus(editar, 403);
        assert.match(editar.body.message, /CadastroBancada\.editar/);

        const remover = await api(semPrivilegio).delete('/api/bancada/1');
        assertStatus(remover, 403);
        assert.match(remover.body.message, /CadastroBancada\.remover/);
    });

    it('400 com corpo inválido ou partido inexistente', async () => {
        const semSigla = novaBancada();
        delete (semSigla as { sigla?: string }).sigla;
        assertStatus(await api(gestor).post('/api/bancada').send(semSigla), 400);
        assertStatus(
            await api(gestor)
                .post('/api/bancada')
                .send(novaBancada({ partido_ids: 'x' })),
            400
        );

        const inexistente = await api(gestor)
            .post('/api/bancada')
            .send(novaBancada({ partido_ids: [999999] }));
        assertStatus(inexistente, 400);
        assert.match(inexistente.body.message, /partido 999999 inválido/);
    });

    it('cria bancada com partidos e devolve os dados no GET por id', async () => {
        const dados = novaBancada({ partido_ids: partidos.slice(0, 2) });
        const criado = await api(gestor).post('/api/bancada').send(dados);
        assertStatus(criado, 201);
        const id: number = criado.body.id;

        const lista = await api(gestor).get('/api/bancada');
        const linha = lista.body.linhas.find((l: { id: number }) => l.id === id);
        assert.equal(linha.nome, dados.nome);
        assert.equal(linha.sigla, dados.sigla);
        assert.deepEqual(
            linha.partidos.map((p: { partido_id: number }) => p.partido_id).sort(),
            [...dados.partido_ids].sort()
        );

        const detalhe = await api(gestor).get(`/api/bancada/${id}`);
        assertStatus(detalhe, 200);
        assert.deepEqual(detalhe.body.partidos.map((p: { id: number }) => p.id).sort(), [...dados.partido_ids].sort());
        assert.ok(detalhe.body.partidos[0].sigla);
    });

    it('400 com nome ou sigla igual a outra bancada ativa, sem diferenciar maiúsculas', async () => {
        const base = novaBancada();
        assertStatus(await api(gestor).post('/api/bancada').send(base), 201);

        const mesmoNome = await api(gestor)
            .post('/api/bancada')
            .send(novaBancada({ nome: base.nome.toUpperCase() }));
        assertStatus(mesmoNome, 400);
        assert.match(mesmoNome.body.message, /Nome igual ou semelhante/);

        const mesmaSigla = await api(gestor)
            .post('/api/bancada')
            .send(novaBancada({ sigla: base.sigla.toLowerCase() }));
        assertStatus(mesmaSigla, 400);
        assert.match(mesmaSigla.body.message, /Sigla igual ou semelhante/);
    });

    it('PATCH edita nome e descrição, e recusa nome de outra bancada', async () => {
        const alvo = await api(gestor).post('/api/bancada').send(novaBancada());
        const outra = novaBancada();
        assertStatus(await api(gestor).post('/api/bancada').send(outra), 201);

        const novoNome = uniq('Renomeada');
        assertStatus(
            await api(editor).patch(`/api/bancada/${alvo.body.id}`).send({ nome: novoNome, descricao: 'nova' }),
            200
        );
        const depois = await api(gestor).get(`/api/bancada/${alvo.body.id}`);
        assert.equal(depois.body.nome, novoNome);
        assert.equal(depois.body.descricao, 'nova');

        const colisao = await api(editor).patch(`/api/bancada/${alvo.body.id}`).send({ nome: outra.nome });
        assertStatus(colisao, 400);
        assert.match(colisao.body.message, /Nome igual ou semelhante/);
    });

    it(
        'todo: BUG PATCH aceita sigla já usada por outra bancada',
        { todo: 'BUG: bancada.service.update checa sigla na tabela orgao' },
        async () => {
            const base = await api(gestor).post('/api/bancada').send(novaBancada());
            const outra = await api(gestor).post('/api/bancada').send(novaBancada());
            const siglaBase = (await api(gestor).get(`/api/bancada/${base.body.id}`)).body.sigla;

            assertStatus(await api(gestor).patch(`/api/bancada/${outra.body.id}`).send({ sigla: siglaBase }), 400);
        }
    );

    it(
        'todo: BUG PATCH com a mesma quantidade de partidos ignora a troca',
        { todo: 'BUG: update compara só o tamanho de partido_ids' },
        async () => {
            const criado = await api(gestor)
                .post('/api/bancada')
                .send(novaBancada({ partido_ids: [partidos[0]] }));
            assertStatus(
                await api(gestor)
                    .patch(`/api/bancada/${criado.body.id}`)
                    .send({ partido_ids: [partidos[1]] }),
                200
            );

            const depois = await api(gestor).get(`/api/bancada/${criado.body.id}`);
            assert.deepEqual(
                depois.body.partidos.map((p: { id: number }) => p.id),
                [partidos[1]]
            );
        }
    );

    it('DELETE remove a bancada da listagem', async () => {
        const criado = await api(gestor).post('/api/bancada').send(novaBancada());
        assertStatus(await api(gestor).delete(`/api/bancada/${criado.body.id}`), 202);

        const lista = await api(gestor).get('/api/bancada');
        assert.equal(
            lista.body.linhas.some((l: { id: number }) => l.id === criado.body.id),
            false
        );
    });
});
