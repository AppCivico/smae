import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarOrgao,
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    prisma,
    Sessao,
    uniq,
} from '../lib';

describe('grupo-painel-externo (exige smae-sistemas nas escritas)', () => {
    let admin: Sessao;
    let adminNoOrgao: Sessao;
    let semPrivilegio: Sessao;
    let espectador: Sessao;
    let outroEspectador: Sessao;

    const como = (s: Sessao) => api(s, { sistema: 'PDM' });
    const porId = (linhas: any[], id: number) => linhas.find((l) => l.id === id);

    const novoGrupo = (extra: Record<string, unknown> = {}) => ({
        titulo: uniq('Grupo externo'),
        orgao_id: 1,
        participantes: [] as number[],
        ...extra,
    });

    before(async () => {
        await bootApp();
        admin = await criarPessoaComPrivilegios(['CadastroGrupoPainelExterno.administrador']);
        adminNoOrgao = await criarPessoaComPrivilegios(['CadastroGrupoPainelExterno.administrador_no_orgao']);
        semPrivilegio = await criarPessoaSemPrivilegios();
        espectador = await criarPessoaComPrivilegios(['SMAE.espectador_de_painel_externo']);
        outroEspectador = await criarPessoaComPrivilegios(['SMAE.espectador_de_painel_externo']);
    });

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await api().get('/api/grupo-painel-externo'), 401);
            assertStatus(await api().post('/api/grupo-painel-externo').send(novoGrupo()), 401);
        });

        it('403 sem CadastroGrupoPainelExterno.administrador nem administrador_no_orgao', async () => {
            const post = await como(semPrivilegio).post('/api/grupo-painel-externo').send(novoGrupo());
            assertStatus(post, 403);
            assert.match(post.body.message, /CadastroGrupoPainelExterno\.administrador/);

            assertStatus(await como(semPrivilegio).get('/api/grupo-painel-externo'), 403);
            assertStatus(await como(semPrivilegio).patch('/api/grupo-painel-externo/1').send({ titulo: uniq() }), 403);
            assertStatus(await como(semPrivilegio).delete('/api/grupo-painel-externo/1'), 403);
        });

        it('400 ao escrever sem o header smae-sistemas', async () => {
            const res = await api(admin).post('/api/grupo-painel-externo').send(novoGrupo());
            assertStatus(res, 400);
            assert.match(res.body.message, /mais de um sistema/);
        });
    });

    describe('validação', () => {
        it('400 sem titulo, sem participantes ou com participantes fora do formato', async () => {
            const { titulo: _titulo, ...semTitulo } = novoGrupo();
            assertStatus(await como(admin).post('/api/grupo-painel-externo').send(semTitulo), 400);

            const { participantes: _participantes, ...semParticipantes } = novoGrupo();
            assertStatus(await como(admin).post('/api/grupo-painel-externo').send(semParticipantes), 400);

            for (const participantes of ['x', ['a'], [1.5]]) {
                const res = await como(admin).post('/api/grupo-painel-externo').send(novoGrupo({ participantes }));
                assertStatus(res, 400);
            }
        });

        it('400 com :id não numérico', async () => {
            assertStatus(await como(admin).patch('/api/grupo-painel-externo/abc').send({ titulo: uniq() }), 400);
        });

        it(
            'cria sem orgao_id e usa o órgão do criador',
            async () => {
                const { orgao_id: _orgao, ...semOrgao } = novoGrupo();
                const res = await como(adminNoOrgao).post('/api/grupo-painel-externo').send(semOrgao);
                assertStatus(res, 201);
                const grupo = await prisma().grupoPainelExterno.findUniqueOrThrow({ where: { id: res.body.id } });
                assert.equal(grupo.orgao_id, adminNoOrgao.pessoa.orgao_id);
            }
        );
    });

    describe('regras de negócio', () => {
        it('400 quando o participante não tem SMAE.espectador_de_painel_externo', async () => {
            const comum = await criarPessoaComPrivilegios(['CadastroOrgao.inserir']);
            const res = await como(admin)
                .post('/api/grupo-painel-externo')
                .send(novoGrupo({ participantes: [comum.pessoa.id] }));
            assertStatus(res, 400);
            assert.match(res.body.message, /não pode ser participante/);
        });

        it('400 com título duplicado (sem diferenciar maiúsculas) na criação e na edição', async () => {
            const titulo = uniq('Duplicado');
            assertStatus(await como(admin).post('/api/grupo-painel-externo').send(novoGrupo({ titulo })), 201);

            const dup = await como(admin)
                .post('/api/grupo-painel-externo')
                .send(novoGrupo({ titulo: titulo.toUpperCase() }));
            assertStatus(dup, 400);
            assert.match(dup.body.message, /Título já está em uso/);

            const outro = await como(admin).post('/api/grupo-painel-externo').send(novoGrupo());
            assertStatus(await como(admin).patch(`/api/grupo-painel-externo/${outro.body.id}`).send({ titulo }), 400);
        });

        it('400 com órgão inexistente', async () => {
            const res = await como(admin)
                .post('/api/grupo-painel-externo')
                .send(novoGrupo({ orgao_id: 999999 }));
            assertStatus(res, 400);
            assert.match(res.body.message, /Órgão não encontrado/);
        });

        it('administrador_no_orgao só cria, edita e remove no próprio órgão', async () => {
            const outroOrgao = await criarOrgao();
            const fora = await como(adminNoOrgao)
                .post('/api/grupo-painel-externo')
                .send(novoGrupo({ orgao_id: outroOrgao.id }));
            assertStatus(fora, 400);
            assert.match(fora.body.message, /mesmo órgão/);

            const proprio = await como(adminNoOrgao)
                .post('/api/grupo-painel-externo')
                .send(novoGrupo({ orgao_id: 1 }));
            assertStatus(proprio, 201);
            assertStatus(
                await como(adminNoOrgao).patch(`/api/grupo-painel-externo/${proprio.body.id}`).send({ titulo: uniq() }),
                200
            );

            const alheio = await como(admin)
                .post('/api/grupo-painel-externo')
                .send(novoGrupo({ orgao_id: outroOrgao.id }));
            assertStatus(alheio, 201);
            const edicao = await como(adminNoOrgao)
                .patch(`/api/grupo-painel-externo/${alheio.body.id}`)
                .send({ titulo: uniq() });
            assertStatus(edicao, 400);
            assert.match(edicao.body.message, /mesmo órgão/);
            const remocao = await como(adminNoOrgao).delete(`/api/grupo-painel-externo/${alheio.body.id}`);
            assertStatus(remocao, 400);
            assert.match(remocao.body.message, /mesmo órgão/);
        });

        it('404 ao editar grupo inexistente', async () => {
            assertStatus(await como(admin).patch('/api/grupo-painel-externo/999999').send({ titulo: uniq() }), 404);
        });
    });

    describe('CRUD', () => {
        it('cria com participantes, lista, filtra por id, edita participantes e remove', async () => {
            const dados = novoGrupo({ participantes: [espectador.pessoa.id, espectador.pessoa.id] });
            const criado = await como(admin).post('/api/grupo-painel-externo').send(dados);
            assertStatus(criado, 201);
            const id: number = criado.body.id;
            assert.equal(typeof id, 'number');

            const lista = await como(admin).get('/api/grupo-painel-externo');
            assertStatus(lista, 200);
            const linha = porId(lista.body.linhas, id);
            assert.equal(linha.titulo, dados.titulo);
            assert.equal(linha.orgao_id, 1);
            assert.ok(linha.criado_em);
            assert.deepEqual(linha.paineis, []);
            assert.deepEqual(linha.participantes, [
                { id: espectador.pessoa.id, nome_exibicao: espectador.pessoa.nome_exibicao },
            ]);

            const filtrada = await como(admin).get(`/api/grupo-painel-externo?id=${id}`);
            assertStatus(filtrada, 200);
            assert.deepEqual(
                filtrada.body.linhas.map((l: { id: number }) => l.id),
                [id]
            );

            const novoTitulo = uniq('Renomeado');
            const edicao = await como(admin)
                .patch(`/api/grupo-painel-externo/${id}`)
                .send({ titulo: novoTitulo, participantes: [outroEspectador.pessoa.id] });
            assertStatus(edicao, 200);
            assert.equal(edicao.body.id, id);

            const depois = porId((await como(admin).get('/api/grupo-painel-externo')).body.linhas, id);
            assert.equal(depois.titulo, novoTitulo);
            assert.deepEqual(
                depois.participantes.map((p: { id: number }) => p.id),
                [outroEspectador.pessoa.id]
            );

            const soTitulo = await como(admin).patch(`/api/grupo-painel-externo/${id}`).send({ titulo: uniq() });
            assertStatus(soTitulo, 200);
            const mantido = porId((await como(admin).get('/api/grupo-painel-externo')).body.linhas, id);
            assert.equal(mantido.participantes.length, 1);

            assertStatus(await como(admin).delete(`/api/grupo-painel-externo/${id}`), 202);
            const removido = await prisma().grupoPainelExterno.findUniqueOrThrow({ where: { id } });
            assert.ok(removido.removido_em);
            assert.equal(removido.removido_por, admin.pessoa.id);
            const aposRemover = await como(admin).get('/api/grupo-painel-externo');
            assert.equal(porId(aposRemover.body.linhas, id), undefined);
        });

        it('retornar_uso=true lista os painéis externos vinculados', async () => {
            const grupo = await como(admin).post('/api/grupo-painel-externo').send(novoGrupo());
            assertStatus(grupo, 201);
            const gestorPaineis = await criarPessoaComPrivilegios(['CadastroPainelExterno.inserir']);
            const titulo = uniq('Painel');
            const painel = await como(gestorPaineis)
                .post('/api/painel-externo')
                .send({ titulo, link: 'https://painel.e2e.test/x', descricao: null, grupos: [grupo.body.id] });
            assertStatus(painel, 201);

            const semUso = porId((await como(admin).get('/api/grupo-painel-externo')).body.linhas, grupo.body.id);
            assert.deepEqual(semUso.paineis, []);

            const comUso = await como(admin).get('/api/grupo-painel-externo?retornar_uso=true');
            assert.deepEqual(porId(comUso.body.linhas, grupo.body.id).paineis, [{ id: painel.body.id, titulo }]);
        });

        it(
            'edita o orgao_id do grupo',
            async () => {
                const outroOrgao = await criarOrgao();
                const criado = await como(admin).post('/api/grupo-painel-externo').send(novoGrupo());
                assertStatus(criado, 201);

                const res = await como(admin)
                    .patch(`/api/grupo-painel-externo/${criado.body.id}`)
                    .send({ orgao_id: outroOrgao.id });
                assertStatus(res, 200);
                const grupo = await prisma().grupoPainelExterno.findUniqueOrThrow({ where: { id: criado.body.id } });
                assert.equal(grupo.orgao_id, outroOrgao.id);
            }
        );
    });
});
