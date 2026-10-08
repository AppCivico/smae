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

async function numeroLivre(): Promise<number> {
    const usados = new Set(
        (await prisma().partido.findMany({ where: { removido_em: null }, select: { numero: true } })).map(
            (p) => p.numero
        )
    );
    for (let n = 1; n <= 99; n++) if (!usados.has(n)) return n;
    throw new Error('sem número de partido livre');
}

const sigla = () => uniq('P').slice(0, 20);

async function criarPartido(extra: Record<string, unknown> = {}) {
    return {
        nome: uniq('Partido'),
        sigla: sigla(),
        numero: await numeroLivre(),
        ...extra,
    };
}

async function criarMandatoDoPartido(partido_id: number) {
    const eleicao = await prisma().eleicao.findFirstOrThrow({ where: { removido_em: null } });
    const parlamentar = await prisma().parlamentar.create({
        data: { nome: uniq('Parlamentar'), nome_popular: uniq('Popular') },
    });
    return prisma().parlamentarMandato.create({
        data: {
            parlamentar_id: parlamentar.id,
            eleicao_id: eleicao.id,
            partido_candidatura_id: partido_id,
            partido_atual_id: partido_id,
            eleito: true,
            cargo: 'Vereador',
            uf: 'SP',
        },
    });
}

describe('partido', () => {
    let gestor: Sessao;
    let semPrivilegio: Sessao;

    before(async () => {
        await bootApp();
        gestor = await criarPessoaComPrivilegios([
            'CadastroPartido.inserir',
            'CadastroPartido.editar',
            'CadastroPartido.remover',
        ]);
        semPrivilegio = await criarPessoaSemPrivilegios();
    });

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await api().get('/api/partido'), 401);
            assertStatus(await api().get('/api/partido/1'), 401);
            assertStatus(
                await api()
                    .post('/api/partido')
                    .send(await criarPartido()),
                401
            );
            assertStatus(await api().patch('/api/partido/1').send({ nome: uniq() }), 401);
            assertStatus(await api().delete('/api/partido/1'), 401);
        });

        it('403 sem CadastroPartido.*, a listagem só exige sessão', async () => {
            const criado = await api(gestor)
                .post('/api/partido')
                .send(await criarPartido());
            assertStatus(criado, 201);
            const id = criado.body.id;

            assertStatus(await api(semPrivilegio).get('/api/partido'), 200);
            assertStatus(await api(semPrivilegio).get(`/api/partido/${id}`), 403);
            assertStatus(
                await api(semPrivilegio)
                    .post('/api/partido')
                    .send(await criarPartido()),
                403
            );
            assertStatus(await api(semPrivilegio).patch(`/api/partido/${id}`).send({ nome: uniq() }), 403);
            assertStatus(await api(semPrivilegio).delete(`/api/partido/${id}`), 403);
        });
    });

    describe('validação', () => {
        it('400 com numero acima de 99, numero ausente, nome ausente ou fundacao inválida', async () => {
            const base = await criarPartido();
            assertStatus(
                await api(gestor)
                    .post('/api/partido')
                    .send({ ...base, numero: 100 }),
                400
            );
            assertStatus(
                await api(gestor)
                    .post('/api/partido')
                    .send({ ...base, numero: undefined }),
                400
            );
            assertStatus(await api(gestor).post('/api/partido').send({ sigla: base.sigla, numero: base.numero }), 400);
            assertStatus(
                await api(gestor)
                    .post('/api/partido')
                    .send({ ...base, fundacao: 'não é data' }),
                400
            );
        });
    });

    describe('CRUD', () => {
        it('cria com observação e fundação, lê por id, lista e edita', async () => {
            const dados = await criarPartido({ observacao: 'Partido de teste', fundacao: '1980-01-15' });
            const criado = await api(gestor).post('/api/partido').send(dados);
            assertStatus(criado, 201);
            const id: number = criado.body.id;

            const lido = await api(gestor).get(`/api/partido/${id}`);
            assertStatus(lido, 200);
            assert.equal(lido.body.nome, dados.nome);
            assert.equal(lido.body.sigla, dados.sigla);
            assert.equal(lido.body.numero, dados.numero);
            assert.equal(lido.body.observacao, 'Partido de teste');
            assert.equal(String(lido.body.fundacao).slice(0, 10), '1980-01-15');

            const lista = await api(gestor).get('/api/partido');
            assert.deepEqual(
                lista.body.linhas.find((l: { id: number }) => l.id === id),
                { id, nome: dados.nome, sigla: dados.sigla, numero: dados.numero }
            );

            const novo = await criarPartido();
            assertStatus(
                await api(gestor).patch(`/api/partido/${id}`).send({ nome: novo.nome, numero: novo.numero }),
                200
            );
            const editado = await api(gestor).get(`/api/partido/${id}`);
            assert.equal(editado.body.nome, novo.nome);
            assert.equal(editado.body.numero, novo.numero);
        });

        it('404 ao ler ou editar id inexistente', async () => {
            assertStatus(await api(gestor).get('/api/partido/999999'), 404);
            assertStatus(await api(gestor).patch('/api/partido/999999').send({ nome: uniq() }), 404);
        });

        it('remoção é soft delete: some da listagem, aparece com incluir_removidos=true', async () => {
            const criado = await api(gestor)
                .post('/api/partido')
                .send(await criarPartido());
            assertStatus(criado, 201);
            const id: number = criado.body.id;

            assertStatus(await api(gestor).delete(`/api/partido/${id}`), 202);

            const lista = await api(gestor).get('/api/partido');
            assert.equal(
                lista.body.linhas.some((l: { id: number }) => l.id === id),
                false
            );
            const comRemovidos = await api(gestor).get('/api/partido').query({ incluir_removidos: true });
            assert.ok(comRemovidos.body.linhas.some((l: { id: number }) => l.id === id));
        });

        it(
            'GET por id não devolve partido removido',
            { todo: 'BUG: GET /partido/:id usa findUniqueOrThrow sem filtrar removido_em' },
            async () => {
                const criado = await api(gestor)
                    .post('/api/partido')
                    .send(await criarPartido());
                assertStatus(criado, 201);
                assertStatus(await api(gestor).delete(`/api/partido/${criado.body.id}`), 202);

                assertStatus(await api(gestor).get(`/api/partido/${criado.body.id}`), 404);
            }
        );
    });

    describe('unicidade entre registros ativos', () => {
        it('400 com nome, sigla ou numero já usados por outro partido ativo', async () => {
            const base = await criarPartido();
            assertStatus(await api(gestor).post('/api/partido').send(base), 201);

            const nomeDup = await api(gestor)
                .post('/api/partido')
                .send({ ...base, nome: base.nome.toUpperCase(), sigla: sigla(), numero: await numeroLivre() });
            assertStatus(nomeDup, 400);
            assert.match(nomeDup.body.message, /Nome igual ou semelhante/);

            const siglaDup = await api(gestor)
                .post('/api/partido')
                .send({ ...(await criarPartido()), sigla: base.sigla });
            assertStatus(siglaDup, 400);
            assert.match(siglaDup.body.message, /Sigla igual ou semelhante/);

            const numeroDup = await api(gestor)
                .post('/api/partido')
                .send({ ...(await criarPartido()), numero: base.numero });
            assertStatus(numeroDup, 400);
            assert.match(numeroDup.body.message, /Número igual já existe/);
        });

        it('400 ao editar numero para o de outro partido ativo', async () => {
            const a = await criarPartido();
            assertStatus(await api(gestor).post('/api/partido').send(a), 201);
            const criadoB = await api(gestor)
                .post('/api/partido')
                .send(await criarPartido());
            assertStatus(criadoB, 201);

            const res = await api(gestor).patch(`/api/partido/${criadoB.body.id}`).send({ numero: a.numero });
            assertStatus(res, 400);
            assert.match(res.body.message, /Número igual já existe/);
        });

        it(
            'PATCH com sigla de outro partido é recusado',
            { todo: 'BUG: partido update confere a sigla na tabela orgao, não na tabela partido' },
            async () => {
                const a = await criarPartido();
                assertStatus(await api(gestor).post('/api/partido').send(a), 201);
                const b = await criarPartido();
                const criadoB = await api(gestor).post('/api/partido').send(b);
                assertStatus(criadoB, 201);

                assertStatus(await api(gestor).patch(`/api/partido/${criadoB.body.id}`).send({ sigla: a.sigla }), 400);
            }
        );

        it('400 ao remover partido com mandato, liberado depois que o mandato é removido', async () => {
            const criado = await api(gestor)
                .post('/api/partido')
                .send(await criarPartido());
            assertStatus(criado, 201);
            const mandato = await criarMandatoDoPartido(criado.body.id);

            const res = await api(gestor).delete(`/api/partido/${criado.body.id}`);
            assertStatus(res, 400);
            assert.match(res.body.message, /possui mandato/);

            await prisma().parlamentarMandato.update({ where: { id: mandato.id }, data: { removido_em: new Date() } });
            assertStatus(await api(gestor).delete(`/api/partido/${criado.body.id}`), 202);
        });
    });
});
