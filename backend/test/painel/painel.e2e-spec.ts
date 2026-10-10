import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarPdmAntigo,
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    prisma,
    Sessao,
    uniq,
} from '../lib';

describe('painel (módulo PDM)', () => {
    let gestor: Sessao;
    let adminNoPdm: Sessao;
    let soVisualizar: Sessao;
    let soRelatorio: Sessao;
    let semPrivilegio: Sessao;
    let pdmId: number;

    const como = (s: Sessao) => api(s, { sistema: 'PDM' });
    const porId = (linhas: any[], id: number) => linhas.find((l) => l.id === id);

    const novoPainel = (extra: Record<string, unknown> = {}) => ({
        nome: uniq('Painel'),
        periodicidade: 'Mensal',
        mostrar_planejado_por_padrao: true,
        mostrar_acumulado_por_padrao: true,
        mostrar_indicador_por_padrao: true,
        ativo: true,
        ...extra,
    });

    async function criarPainel(extra: Record<string, unknown> = {}): Promise<number> {
        const res = await como(gestor).post('/api/painel').send(novoPainel(extra));
        assertStatus(res, 201);
        return res.body.id;
    }

    const criarMeta = () =>
        prisma().meta.create({ data: { pdm_id: pdmId, status: '', codigo: uniq('M'), titulo: uniq('Meta') } });

    const criarGrupo = async () => {
        const res = await como(gestor)
            .post('/api/grupo-paineis')
            .send({ nome: uniq('Grupo'), ativo: true });
        assertStatus(res, 201);
        return res.body.id as number;
    };

    before(async () => {
        await bootApp();
        gestor = await criarPessoaComPrivilegios([
            'CadastroPainel.visualizar',
            'CadastroPainel.inserir',
            'CadastroPainel.editar',
            'CadastroPainel.remover',
            'CadastroGrupoPaineis.inserir',
        ]);
        adminNoPdm = await criarPessoaComPrivilegios(['CadastroMeta.administrador_no_pdm']);
        soVisualizar = await criarPessoaComPrivilegios(['CadastroPainel.visualizar']);
        soRelatorio = await criarPessoaComPrivilegios(['Reports.executar.PDM']);
        semPrivilegio = await criarPessoaSemPrivilegios();

        const ativo = await prisma().pdm.findFirst({ where: { ativo: true, removido_em: null } });
        if (ativo) {
            pdmId = ativo.id;
        } else {
            pdmId = (await criarPdmAntigo()).id;
            await prisma().pdm.update({ where: { id: pdmId }, data: { ativo: true } });
        }
    });

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await api().get('/api/painel'), 401);
            assertStatus(await api().post('/api/painel').send(novoPainel()), 401);
        });

        it('403 sem privilégio em todas as rotas', async () => {
            const id = await criarPainel();

            const post = await como(semPrivilegio).post('/api/painel').send(novoPainel());
            assertStatus(post, 403);
            assert.match(post.body.message, /CadastroPainel\.inserir/);

            assertStatus(await como(semPrivilegio).get('/api/painel'), 403);
            assertStatus(await como(semPrivilegio).get(`/api/painel/${id}`), 403);
            assertStatus(await como(semPrivilegio).get('/api/painel/painel-da-meta?meta_id=1'), 403);

            const patch = await como(semPrivilegio).patch(`/api/painel/${id}`).send({ ativo: false });
            assertStatus(patch, 403);
            assert.match(patch.body.message, /CadastroPainel\.editar/);

            const del = await como(semPrivilegio).delete(`/api/painel/${id}`);
            assertStatus(del, 403);
            assert.match(del.body.message, /CadastroPainel\.remover/);

            assertStatus(await como(semPrivilegio).patch(`/api/painel/${id}/conteudo`).send({ metas: [] }), 403);
            assertStatus(await como(semPrivilegio).get(`/api/painel/${id}/conteudo/1/visualizacao`), 403);
            assertStatus(await como(semPrivilegio).get(`/api/painel/${id}/conteudo/1/serie`), 403);
        });

        it('com só CadastroPainel.visualizar lê o detalhe (200) mas não lista, cria, edita nem remove (403)', async () => {
            const id = await criarPainel();

            assertStatus(await como(soVisualizar).get(`/api/painel/${id}`), 200);
            assertStatus(await como(soVisualizar).get('/api/painel/painel-da-meta?meta_id=1'), 200);
            assertStatus(await como(soVisualizar).get('/api/painel'), 403);
            assertStatus(await como(soVisualizar).post('/api/painel').send(novoPainel()), 403);
            assertStatus(await como(soVisualizar).patch(`/api/painel/${id}`).send({ ativo: false }), 403);
            assertStatus(await como(soVisualizar).delete(`/api/painel/${id}`), 403);
        });

        it('Reports.executar.PDM só lista os painéis', async () => {
            assertStatus(await como(soRelatorio).get('/api/painel'), 200);
            assertStatus(await como(soRelatorio).post('/api/painel').send(novoPainel()), 403);
        });

        it('CadastroMeta.administrador_no_pdm cria, edita e remove sem CadastroPainel.*', async () => {
            const criado = await como(adminNoPdm).post('/api/painel').send(novoPainel());
            assertStatus(criado, 201);
            const id: number = criado.body.id;

            assertStatus(
                await como(adminNoPdm)
                    .patch(`/api/painel/${id}`)
                    .send({ nome: uniq('Admin') }),
                200
            );
            assertStatus(await como(adminNoPdm).delete(`/api/painel/${id}`), 202);
            assertStatus(await como(adminNoPdm).get(`/api/painel/${id}`), 403);
        });

        it('CadastroPainel pertence ao sistema PDM: com header Projetos a escrita dá 403', async () => {
            const pessoa = await criarPessoaComPrivilegios(['CadastroPainel.inserir', 'CadastroOrgao.inserir']);

            const fora = await api(pessoa, { sistema: 'Projetos' }).post('/api/painel').send(novoPainel());
            assertStatus(fora, 403);
            assert.match(fora.body.message, /CadastroPainel\.inserir/);

            assertStatus(await api(pessoa, { sistema: 'PDM' }).post('/api/painel').send(novoPainel()), 201);
        });
    });

    describe('validação', () => {
        it('400 com campos obrigatórios ausentes ou fora do tipo', async () => {
            const { nome: _nome, ...semNome } = novoPainel();
            assertStatus(await como(gestor).post('/api/painel').send(semNome), 400);
            assertStatus(
                await como(gestor)
                    .post('/api/painel')
                    .send(novoPainel({ nome: 123 })),
                400
            );
            assertStatus(
                await como(gestor)
                    .post('/api/painel')
                    .send(novoPainel({ nome: 'x'.repeat(300) })),
                400
            );

            const { ativo: _ativo, ...semAtivo } = novoPainel();
            assertStatus(await como(gestor).post('/api/painel').send(semAtivo), 400);

            for (const campo of [
                'ativo',
                'mostrar_planejado_por_padrao',
                'mostrar_acumulado_por_padrao',
                'mostrar_indicador_por_padrao',
            ]) {
                const res = await como(gestor)
                    .post('/api/painel')
                    .send(novoPainel({ [campo]: 'sim' }));
                assertStatus(res, 400);
            }
        });

        it('400 com periodicidade fora do enum e com grupos inválidos', async () => {
            const periodicidade = await como(gestor)
                .post('/api/painel')
                .send(novoPainel({ periodicidade: 'Diaria' }));
            assertStatus(periodicidade, 400);
            assert.match(JSON.stringify(periodicidade.body.message), /Precisa ser um dos seguintes valores/);

            assertStatus(
                await como(gestor)
                    .post('/api/painel')
                    .send(novoPainel({ grupos: [] })),
                400
            );
            assertStatus(
                await como(gestor)
                    .post('/api/painel')
                    .send(novoPainel({ grupos: 'x' })),
                400
            );
            assertStatus(
                await como(gestor)
                    .post('/api/painel')
                    .send(novoPainel({ grupos: ['a'] })),
                400
            );
        });

        it('400 em painel-da-meta sem meta_id e com :id não numérico', async () => {
            assertStatus(await como(soVisualizar).get('/api/painel/painel-da-meta'), 400);
            assertStatus(await como(soVisualizar).get('/api/painel/painel-da-meta?meta_id=abc'), 400);
            assertStatus(await como(soVisualizar).get('/api/painel/abc'), 400);
            assertStatus(await como(gestor).patch('/api/painel/abc').send({ ativo: false }), 400);
        });
    });

    describe('CRUD', () => {
        it('cria, lê, lista, edita e remove', async () => {
            const dados = novoPainel({ periodicidade: 'Trimestral', mostrar_planejado_por_padrao: false });
            const criado = await como(gestor).post('/api/painel').send(dados);
            assertStatus(criado, 201);
            const id: number = criado.body.id;
            assert.equal(typeof id, 'number');

            const noBanco = await prisma().painel.findUniqueOrThrow({ where: { id } });
            assert.equal(noBanco.pdm_id, pdmId);
            assert.equal(noBanco.criado_por, gestor.pessoa.id);

            const detalhe = await como(gestor).get(`/api/painel/${id}`);
            assertStatus(detalhe, 200);
            assert.equal(detalhe.body.nome, dados.nome);
            assert.equal(detalhe.body.ativo, true);
            assert.equal(detalhe.body.periodicidade, 'Trimestral');
            assert.equal(detalhe.body.mostrar_planejado_por_padrao, false);
            assert.equal(detalhe.body.mostrar_acumulado_por_padrao, true);
            assert.deepEqual(detalhe.body.painel_conteudo, []);

            const lista = await como(gestor).get('/api/painel');
            assertStatus(lista, 200);
            const linha = porId(lista.body.linhas, id);
            assert.equal(linha.nome, dados.nome);
            assert.equal(linha.periodicidade, 'Trimestral');

            const novoNome = uniq('Renomeado');
            const edicao = await como(gestor)
                .patch(`/api/painel/${id}`)
                .send({ nome: novoNome, periodicidade: 'Anual', mostrar_indicador_por_padrao: false });
            assertStatus(edicao, 200);
            assert.equal(edicao.body.id, id);
            const editado = (await como(gestor).get(`/api/painel/${id}`)).body;
            assert.equal(editado.nome, novoNome);
            assert.equal(editado.periodicidade, 'Anual');
            assert.equal(editado.mostrar_indicador_por_padrao, false);
            const aposEditar = await prisma().painel.findUniqueOrThrow({ where: { id } });
            assert.equal(aposEditar.atualizado_por, gestor.pessoa.id);

            assertStatus(await como(gestor).delete(`/api/painel/${id}`), 202);
            const removido = await prisma().painel.findUniqueOrThrow({ where: { id } });
            assert.ok(removido.removido_em);
            assert.equal(removido.removido_por, gestor.pessoa.id);
            const depois = await como(gestor).get('/api/painel');
            assert.equal(porId(depois.body.linhas, id), undefined);
        });

        it('lista só ativos por padrão e filtra por ativo e por meta_id', async () => {
            const ativo = await criarPainel({ ativo: true });
            const inativo = await criarPainel({ ativo: false });
            const semConteudo = await criarPainel({ ativo: true });
            const meta = await criarMeta();
            assertStatus(
                await como(gestor)
                    .patch(`/api/painel/${ativo}/conteudo`)
                    .send({ metas: [meta.id] }),
                200
            );

            const padrao = (await como(gestor).get('/api/painel')).body.linhas;
            assert.ok(porId(padrao, ativo));
            assert.equal(porId(padrao, inativo), undefined);

            const soInativos = (await como(gestor).get('/api/painel?ativo=false')).body.linhas;
            assert.ok(porId(soInativos, inativo));
            assert.equal(porId(soInativos, ativo), undefined);

            const daMeta = (await como(gestor).get(`/api/painel?meta_id=${meta.id}`)).body.linhas;
            assert.ok(porId(daMeta, ativo));
            assert.equal(porId(daMeta, semConteudo), undefined);
        });

        it('painel-da-meta só mostra painéis dos grupos da pessoa', async () => {
            const grupoId = await criarGrupo();
            const painelId = await criarPainel({ grupos: [grupoId] });
            const meta = await criarMeta();
            assertStatus(
                await como(gestor)
                    .patch(`/api/painel/${painelId}/conteudo`)
                    .send({ metas: [meta.id] }),
                200
            );

            const url = `/api/painel/painel-da-meta?meta_id=${meta.id}`;
            const antes = await como(soVisualizar).get(url);
            assertStatus(antes, 200);
            assert.equal(porId(antes.body.linhas, painelId), undefined);

            await prisma().pessoaGrupoPainel.create({
                data: { pessoa_id: soVisualizar.pessoa.id, grupo_painel_id: grupoId },
            });
            const depois = await como(soVisualizar).get(url);
            assert.ok(porId(depois.body.linhas, painelId));
            assert.equal(porId(depois.body.linhas, painelId).painel_conteudo[0].meta_id, meta.id);
        });
    });

    describe('regras de negócio', () => {
        it('400 com nome duplicado, ignorando maiúsculas, na criação e na edição', async () => {
            const nome = uniq('Duplicado');
            await criarPainel({ nome });

            const dup = await como(gestor)
                .post('/api/painel')
                .send(novoPainel({ nome: nome.toUpperCase() }));
            assertStatus(dup, 400);
            assert.match(dup.body.message, /igual ou semelhante/);

            const outro = await criarPainel();
            assertStatus(await como(gestor).patch(`/api/painel/${outro}`).send({ nome }), 400);
        });

        it('vincula o painel aos grupos informados na criação e no PATCH', async () => {
            const [a, b] = [await criarGrupo(), await criarGrupo()];
            const nome = uniq('Painel');
            const id = await criarPainel({ nome, grupos: [a] });
            const grupos = async () =>
                (await como(gestor).get(`/api/painel/${id}`)).body.grupos.map(
                    (g: { grupo_painel: { id: number } }) => g.grupo_painel.id
                );
            assert.deepEqual(await grupos(), [a]);

            assertStatus(
                await como(gestor)
                    .patch(`/api/painel/${id}`)
                    .send({ nome, grupos: [a, b] }),
                200
            );
            assert.deepEqual((await grupos()).sort(), [a, b].sort());
        });

        it(
            'PATCH com grupos substitui a lista de grupos do painel',
            {
                todo: 'BUG (a confirmar): PATCH /api/painel/:id: esperado grupos=[B] ao enviar grupos:[B] (como no painel-externo), veio [A,B]. Issue: https://github.com/AppCivico/smae/issues/691',
            },
            async () => {
                const [a, b] = [await criarGrupo(), await criarGrupo()];
                const nome = uniq('Painel');
                const id = await criarPainel({ nome, grupos: [a] });

                assertStatus(
                    await como(gestor)
                        .patch(`/api/painel/${id}`)
                        .send({ nome, grupos: [b] }),
                    200
                );
                const grupos = (await como(gestor).get(`/api/painel/${id}`)).body.grupos;
                assert.deepEqual(
                    grupos.map((g: { grupo_painel: { id: number } }) => g.grupo_painel.id),
                    [b]
                );
            }
        );

        it(
            'edita só o ativo sem reenviar o nome',
            async () => {
                await criarPainel();
                const id = await criarPainel();

                const res = await como(gestor).patch(`/api/painel/${id}`).send({ ativo: false });
                assertStatus(res, 200);
                const depois = await prisma().painel.findUniqueOrThrow({ where: { id } });
                assert.equal(depois.ativo, false);
            }
        );
    });

    describe('conteúdo do painel', () => {
        it('PATCH conteudo cria o conteúdo da meta com os detalhes, é idempotente e remove ao tirar a meta', async () => {
            const painelId = await criarPainel({ mostrar_acumulado_por_padrao: false });
            const meta = await criarMeta();
            const iniciativa = await prisma().iniciativa.create({
                data: { meta_id: meta.id, codigo: uniq('I'), titulo: uniq('Iniciativa'), compoe_indicador_meta: false },
            });
            const url = `/api/painel/${painelId}/conteudo`;

            const criado = await como(gestor)
                .patch(url)
                .send({ metas: [meta.id] });
            assertStatus(criado, 200);
            assert.equal(criado.body.deleted.length, 0);
            assert.equal(criado.body.created.length, 1);
            assert.equal(criado.body.created[0].meta_id, meta.id);
            const conteudoId: number = criado.body.created[0].id;

            const repetido = await como(gestor)
                .patch(url)
                .send({ metas: [meta.id] });
            assertStatus(repetido, 200);
            assert.deepEqual(repetido.body, { created: [], deleted: [] });

            const detalhe = (await como(gestor).get(`/api/painel/${painelId}`)).body;
            assert.equal(detalhe.painel_conteudo.length, 1);
            const conteudo = detalhe.painel_conteudo[0];
            assert.equal(conteudo.id, conteudoId);
            assert.equal(conteudo.meta.titulo, meta.titulo);
            assert.equal(conteudo.mostrar_acumulado, false);
            assert.equal(conteudo.periodicidade, 'Mensal');
            assert.equal(conteudo.detalhes.length, 1);
            assert.equal(conteudo.detalhes[0].tipo, 'Iniciativa');
            assert.equal(conteudo.detalhes[0].iniciativa.id, iniciativa.id);

            const removido = await como(gestor).patch(url).send({ metas: [] });
            assertStatus(removido, 200);
            assert.deepEqual(removido.body, { created: [], deleted: [{ id: conteudoId, meta_id: meta.id }] });
            const aposRemover = (await como(gestor).get(`/api/painel/${painelId}`)).body;
            assert.deepEqual(aposRemover.painel_conteudo, []);
        });

        it('400 com metas fora do formato e 404 em painel inexistente', async () => {
            const painelId = await criarPainel();
            assertStatus(await como(gestor).patch(`/api/painel/${painelId}/conteudo`).send({}), 400);
            assertStatus(await como(gestor).patch(`/api/painel/${painelId}/conteudo`).send({ metas: 'x' }), 400);
            assertStatus(
                await como(gestor)
                    .patch(`/api/painel/${painelId}/conteudo`)
                    .send({ metas: ['a'] }),
                400
            );
            assertStatus(await como(gestor).patch('/api/painel/999999/conteudo').send({ metas: [] }), 404);
        });

        it('lê e edita a visualização, e valida o período ao montar a série', async () => {
            const painelId = await criarPainel();
            const meta = await criarMeta();
            const criado = await como(gestor)
                .patch(`/api/painel/${painelId}/conteudo`)
                .send({ metas: [meta.id] });
            const conteudoId: number = criado.body.created[0].id;
            const base = `/api/painel/${painelId}/conteudo/${conteudoId}`;

            const inicial = await como(soVisualizar).get(`${base}/visualizacao`);
            assertStatus(inicial, 200);
            assert.equal(inicial.body.id, conteudoId);
            assert.equal(inicial.body.periodicidade, 'Mensal');
            assert.equal(inicial.body.periodo, 'Todos');
            assert.equal(inicial.body.mostrar_planejado, true);

            const serie = await como(soVisualizar).get(`${base}/serie`);
            assertStatus(serie, 200);
            assert.equal(serie.body.meta.id, meta.id);
            assert.ok(serie.body.ordem_series.includes('Realizado'));

            const edicao = await como(gestor)
                .patch(`${base}/visualizacao`)
                .send({ periodo: 'Anteriores', periodicidade: 'Semestral', mostrar_planejado: false });
            assertStatus(edicao, 200);
            assert.deepEqual(edicao.body, { id: conteudoId });
            const editado = (await como(soVisualizar).get(`${base}/visualizacao`)).body;
            assert.equal(editado.periodo, 'Anteriores');
            assert.equal(editado.periodicidade, 'Semestral');
            assert.equal(editado.mostrar_planejado, false);

            const semValor = await como(soVisualizar).get(`${base}/serie`);
            assertStatus(semValor, 400);
            assert.match(semValor.body.message, /periodo_valor/);

            assertStatus(await como(gestor).patch(`${base}/visualizacao`).send({ periodo: 'EntreDatas' }), 200);
            const semDatas = await como(soVisualizar).get(`${base}/serie`);
            assertStatus(semDatas, 400);
            assert.match(semDatas.body.message, /periodos/);

            const entreDatas = {
                periodo: 'EntreDatas',
                periodo_inicio: '2024-01-01',
                periodo_fim: '2024-06-30',
                periodo_valor: 6,
            };
            assertStatus(await como(gestor).patch(`${base}/visualizacao`).send(entreDatas), 200);
            assertStatus(await como(soVisualizar).get(`${base}/serie`), 200);
        });

        it('400 ao editar a visualização com valores inválidos ou com conteúdo de outro painel', async () => {
            const painelId = await criarPainel();
            const outroPainel = await criarPainel();
            const meta = await criarMeta();
            const criado = await como(gestor)
                .patch(`/api/painel/${painelId}/conteudo`)
                .send({ metas: [meta.id] });
            const conteudoId: number = criado.body.created[0].id;

            const url = `/api/painel/${painelId}/conteudo/${conteudoId}/visualizacao`;
            assertStatus(await como(gestor).patch(url).send({ periodo: 'Sempre' }), 400);
            assertStatus(await como(gestor).patch(url).send({ periodicidade: 'Diaria' }), 400);
            assertStatus(await como(gestor).patch(url).send({ mostrar_planejado: 'x' }), 400);
            assertStatus(await como(gestor).patch(url).send({ periodo_inicio: 'ontem' }), 400);

            const alheio = await como(gestor)
                .patch(`/api/painel/${outroPainel}/conteudo/${conteudoId}/visualizacao`)
                .send({ mostrar_planejado: false });
            assertStatus(alheio, 400);
            assert.match(alheio.body.message, /painel_conteudo inválido/);
        });

        it('PATCH detalhes liga o indicador da meta e dos detalhes', async () => {
            const painelId = await criarPainel();
            const meta = await criarMeta();
            const iniciativa = await prisma().iniciativa.create({
                data: { meta_id: meta.id, codigo: uniq('I'), titulo: uniq('Iniciativa'), compoe_indicador_meta: false },
            });
            const criado = await como(gestor)
                .patch(`/api/painel/${painelId}/conteudo`)
                .send({ metas: [meta.id] });
            const conteudoId: number = criado.body.created[0].id;
            const url = `/api/painel/${painelId}/conteudo/${conteudoId}/detalhes`;

            const antes = (await como(gestor).get(`/api/painel/${painelId}`)).body.painel_conteudo[0];
            assert.equal(antes.mostrar_indicador, true);
            assert.equal(antes.detalhes[0].mostrar_indicador, false);
            const detalheId: number = antes.detalhes[0].id;
            assert.equal(antes.detalhes[0].iniciativa.id, iniciativa.id);

            const res = await como(gestor)
                .patch(url)
                .send({ mostrar_indicador_meta: false, detalhes: [{ id: detalheId, mostrar_indicador: true }] });
            assertStatus(res, 200);
            assert.equal(res.body.updated.length, 2);

            const depois = (await como(gestor).get(`/api/painel/${painelId}`)).body.painel_conteudo[0];
            assert.equal(depois.mostrar_indicador, false);
            assert.equal(depois.detalhes[0].mostrar_indicador, true);

            const invalido = await como(gestor)
                .patch(url)
                .send({ detalhes: [{ id: detalheId, mostrar_indicador: 'x' }] });
            assertStatus(invalido, 400);

            const outroPainel = await criarPainel();
            const alheio = await como(gestor)
                .patch(`/api/painel/${outroPainel}/conteudo/${conteudoId}/detalhes`)
                .send({ detalhes: [] });
            assertStatus(alheio, 400);
            assert.match(alheio.body.message, /painel_conteudo inválido/);
        });

        it(
            'PATCH detalhes só com mostrar_indicador_meta (detalhes é opcional no DTO)',
            async () => {
                const painelId = await criarPainel();
                const meta = await criarMeta();
                const criado = await como(gestor)
                    .patch(`/api/painel/${painelId}/conteudo`)
                    .send({ metas: [meta.id] });
                const conteudoId: number = criado.body.created[0].id;

                const res = await como(gestor)
                    .patch(`/api/painel/${painelId}/conteudo/${conteudoId}/detalhes`)
                    .send({ mostrar_indicador_meta: false });
                assertStatus(res, 200);
            }
        );
    });
});
