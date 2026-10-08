import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarOrgao,
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    Sessao,
    uniq,
} from '../lib';
import { criaGlobal } from './_helpers';

describe('VariavelFormulaCompostaController (PDM, leitura)', () => {
    let metasLeitura: Sessao;
    let semPrivilegio: Sessao;

    before(async () => {
        await bootApp();
        metasLeitura = await criarPessoaComPrivilegios(['CadastroMeta.listar']);
        semPrivilegio = await criarPessoaSemPrivilegios();
    });

    it('401 sem token', async () => {
        assertStatus(await api().get('/api/formula-variavel/1/periodos'), 401);
        assertStatus(await api().get('/api/formula-variavel/1/series'), 401);
    });

    it('403 sem papel de metas', async () => {
        assertStatus(await api(semPrivilegio).get('/api/formula-variavel/1/periodos'), 403);
        assertStatus(await api(semPrivilegio).get('/api/formula-variavel/1/series'), 403);
    });

    it('400 com :id não numérico', async () => {
        assertStatus(await api(metasLeitura).get('/api/formula-variavel/abc/periodos'), 400);
    });
});

describe('VariavelGlobalFCController (plano-setorial-formula-composta)', () => {
    let admin: Sessao;
    let leitorPs: Sessao;
    let semPrivilegio: Sessao;
    let orgaoId: number;
    let variavel1: number;
    let variavel2: number;

    const novaFormula = (extra: Record<string, unknown> = {}) => ({
        titulo: uniq('Fórmula PS'),
        formula: '($_1 + $_2) / 2',
        formula_variaveis: [
            { referencia: '_1', janela: 1, variavel_id: variavel1, usar_serie_acumulada: false },
            { referencia: '_2', janela: 1, variavel_id: variavel2, usar_serie_acumulada: false },
        ],
        mostrar_monitoramento: true,
        nivel_regionalizacao: null,
        orgao_id: orgaoId,
        casas_decimais: 2,
        periodicidade: 'Mensal',
        regionalizavel: false,
        inicio_medicao: '2024-01-01',
        fim_medicao: '2024-03-01',
        unidade_medida_id: -1,
        ...extra,
    });

    before(async () => {
        await bootApp();
        orgaoId = (await criarOrgao()).id;
        admin = await criarPessoaComPrivilegios(['CadastroVariavelGlobal.administrador'], { orgao_id: orgaoId });
        leitorPs = await criarPessoaComPrivilegios(['CadastroMetaPS.listar'], { orgao_id: orgaoId });
        semPrivilegio = await criarPessoaSemPrivilegios();
        variavel1 = await criaGlobal(admin, orgaoId);
        variavel2 = await criaGlobal(admin, orgaoId);
    });

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await api().get('/api/plano-setorial-formula-composta'), 401);
            assertStatus(await api().post('/api/plano-setorial-formula-composta').send(novaFormula()), 401);
        });

        it('403 sem papel de variável global ou metas PS', async () => {
            assertStatus(await api(semPrivilegio).get('/api/plano-setorial-formula-composta'), 403);
            assertStatus(
                await api(semPrivilegio).post('/api/plano-setorial-formula-composta').send(novaFormula()),
                403
            );
        });

        it('leitor de metas PS lista as fórmulas', async () => {
            assertStatus(await api(leitorPs).get('/api/plano-setorial-formula-composta'), 200);
        });
    });

    describe('validação', () => {
        it('400 com corpo vazio', async () => {
            assertStatus(await api(admin).post('/api/plano-setorial-formula-composta').send({}), 400);
        });

        it('400 com fórmula que não pode ser interpretada', async () => {
            const res = await api(admin)
                .post('/api/plano-setorial-formula-composta')
                .send(novaFormula({ formula: '$_1 +' }));
            assertStatus(res, 400);
            assert.match(String(res.body.message), /formula não foi entendida/);
        });

        it('404 para fórmula inexistente', async () => {
            assertStatus(await api(admin).get('/api/plano-setorial-formula-composta/999999'), 404);
        });
    });

    describe('CRUD e vínculo de variáveis', () => {
        it('cria, lista por id, edita e remove a fórmula', async () => {
            const titulo = uniq('CRUD fórmula');
            const criada = await api(admin).post('/api/plano-setorial-formula-composta').send(novaFormula({ titulo }));
            assertStatus(criada, 201);
            const id: number = criada.body.id;

            const detalhe = await api(admin).get(`/api/plano-setorial-formula-composta/${id}`);
            assertStatus(detalhe, 200);
            assert.equal(detalhe.body.titulo, titulo);
            assert.equal(detalhe.body.periodicidade, 'Mensal');
            assert.equal(detalhe.body.inicio_medicao, '2024-01-01');
            assert.equal(detalhe.body.fim_medicao, '2024-03-01');

            const lista = await api(leitorPs).get('/api/plano-setorial-formula-composta').query({ id });
            assertStatus(lista, 200);
            assert.ok(lista.body.linhas.some((l: { id: number }) => l.id === id));

            const duplicada = await api(admin)
                .post('/api/plano-setorial-formula-composta')
                .send(novaFormula({ titulo }));
            assertStatus(duplicada, 400);
            assert.match(String(duplicada.body.message), /mesmo título/);

            const novoTitulo = uniq('CRUD fórmula editada');
            assertStatus(
                await api(admin).patch(`/api/plano-setorial-formula-composta/${id}`).send({ titulo: novoTitulo }),
                200
            );
            assert.equal((await api(admin).get(`/api/plano-setorial-formula-composta/${id}`)).body.titulo, novoTitulo);

            assertStatus(await api(admin).delete(`/api/plano-setorial-formula-composta/${id}`), 202);
            assertStatus(await api(admin).get(`/api/plano-setorial-formula-composta/${id}`), 404);
        });

        it('vincula variável com datas compatíveis e recusa as que não cobrem a fórmula', async () => {
            const criada = await api(admin).post('/api/plano-setorial-formula-composta').send(novaFormula());
            assertStatus(criada, 201);
            const id: number = criada.body.id;

            const cobre = await criaGlobal(admin, orgaoId, { titulo: uniq('Cobre') });
            assertStatus(
                await api(admin)
                    .patch(`/api/plano-setorial-formula-composta/${id}/associar-variavel`)
                    .send({ variavel_ids: [cobre] }),
                200
            );

            const vinculadas = await api(admin).get(`/api/plano-setorial-formula-composta/${id}/variaveis`);
            assertStatus(vinculadas, 200);
            assert.ok(vinculadas.body.linhas.some((l: { id: number }) => l.id === cobre));

            const iniciaDepois = await criaGlobal(admin, orgaoId, { inicio_medicao: '2024-02-01' });
            const recusaInicio = await api(admin)
                .patch(`/api/plano-setorial-formula-composta/${id}/associar-variavel`)
                .send({ variavel_ids: [iniciaDepois] });
            assertStatus(recusaInicio, 400);
            assert.match(String(recusaInicio.body.message), /inicia a medição em/);

            const terminaAntes = await criaGlobal(admin, orgaoId, { fim_medicao: '2024-02-01' });
            const recusaFim = await api(admin)
                .patch(`/api/plano-setorial-formula-composta/${id}/associar-variavel`)
                .send({ variavel_ids: [terminaAntes] });
            assertStatus(recusaFim, 400);
            assert.match(String(recusaFim.body.message), /termina a medição em/);
        });

        it(
            'desassocia a variável vinculada',
            {
                todo: 'BUG: DELETE desassociar-variavel de fórmula PS não remove o vínculo (consulta indicadorVariavel com o id da fórmula e sai sem apagar)',
            },
            async () => {
                const criada = await api(admin).post('/api/plano-setorial-formula-composta').send(novaFormula());
                assertStatus(criada, 201);
                const id: number = criada.body.id;
                const variavel = await criaGlobal(admin, orgaoId, { titulo: uniq('Desassociar') });
                assertStatus(
                    await api(admin)
                        .patch(`/api/plano-setorial-formula-composta/${id}/associar-variavel`)
                        .send({ variavel_ids: [variavel] }),
                    200
                );

                assertStatus(
                    await api(admin)
                        .delete(`/api/plano-setorial-formula-composta/${id}/desassociar-variavel`)
                        .send({ variavel_id: variavel }),
                    200
                );
                const vinculadas = await api(admin).get(`/api/plano-setorial-formula-composta/${id}/variaveis`);
                assert.equal(
                    vinculadas.body.linhas.some((l: { id: number }) => l.id === variavel),
                    false
                );
            }
        );

        it(
            'leitor de metas PS não deveria criar fórmula (somente leitura)',
            {
                todo: 'CONFIRMAR: leitor de metas PS (somente CadastroMetaPS.listar) cria fórmula PS, pois o POST em rota de escrita reutiliza ROLES_ACESSO_VARIAVEL_PS (lista de leitura)',
            },
            async () => {
                const res = await api(leitorPs).post('/api/plano-setorial-formula-composta').send(novaFormula());
                assertStatus(res, 403);
            }
        );
    });
});
