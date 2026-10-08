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
} from '../../lib';

const listaDoUsuario = async (sessao: Sessao, sistema: 'CasaCivil' | 'MDO', query = '') => {
    const res = await api(sessao, { sistema }).get(`/api/relatorios${query}`);
    assertStatus(res, 200);
    return res.body.linhas as {
        id: number;
        fonte: string;
        pode_remover: boolean;
        visibilidade_tipo: string;
        criador: { nome_exibicao: string };
        modelo: { id: number; nome: string; removido: boolean } | null;
        eh_publico: boolean;
        visibilidade_tipo_label: string | null;
    }[];
};

describe('relatorios', () => {
    let executor: Sessao;
    let outroExecutor: Sessao;
    let removedor: Sessao;
    let escopoDemandas: Sessao;
    let escopoRemocaoDemandas: Sessao;
    let multiMdo: Sessao;
    let admin: Sessao;
    let semPrivilegio: Sessao;

    before(async () => {
        await bootApp();
        executor = await criarPessoaComPrivilegios(['Reports.executar.CasaCivil']);
        outroExecutor = await criarPessoaComPrivilegios(['Reports.executar.CasaCivil']);
        removedor = await criarPessoaComPrivilegios(['Reports.executar.CasaCivil', 'Reports.remover.CasaCivil']);
        escopoDemandas = await criarPessoaComPrivilegios(['Reports.executar.CasaCivil:Demandas']);
        escopoRemocaoDemandas = await criarPessoaComPrivilegios([
            'Reports.executar.CasaCivil:Demandas',
            'Reports.remover.CasaCivil:Demandas',
        ]);
        multiMdo = await criarPessoaComPrivilegios(['Reports.executar.CasaCivil', 'Reports.executar.MDO']);
        admin = await criarPessoaComPrivilegios(['Reports.executar.CasaCivil', 'Reports.modelo_admin.CasaCivil']);
        semPrivilegio = await criarPessoaSemPrivilegios();
    });

    async function pedirRelatorio(sessao: Sessao, sistema: 'CasaCivil' | 'MDO', corpo: Record<string, unknown>) {
        const res = await api(sessao, { sistema }).post('/api/relatorios').send(corpo);
        assertStatus(res, 201);
        return res.body.id as number;
    }

    const parlamentares = (extra: Record<string, unknown> = {}) => ({
        fonte: 'Parlamentares',
        parametros: {},
        ...extra,
    });

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await api().post('/api/relatorios').send(parlamentares()), 401);
            assertStatus(await api().get('/api/relatorios'), 401);
            assertStatus(await api().delete('/api/relatorios/1'), 401);
        });

        it('400 sem header smae-sistemas: criar e listar exigem um sistema', async () => {
            const criar = await api(executor).post('/api/relatorios').send(parlamentares());
            assertStatus(criar, 400);
            assert.match(criar.body.message, /foi enviando mais de um sistema/);

            assertStatus(await api(executor).get('/api/relatorios'), 400);
        });

        it('403 sem nenhum privilégio de executar', async () => {
            const res = await api(semPrivilegio, { sistema: 'CasaCivil' })
                .post('/api/relatorios')
                .send(parlamentares());
            assertStatus(res, 403);
            assert.match(res.body.message, /Reports\.executar\.CasaCivil/);
        });

        it('403 para fonte que o usuário só executa em outra fonte do mesmo sistema', async () => {
            const res = await api(escopoDemandas, { sistema: 'CasaCivil' })
                .post('/api/relatorios')
                .send(parlamentares());
            assertStatus(res, 403);
            assert.match(res.body.message, /não tem permissão para executar este relatório/);
        });

        it('400 quando a fonte não pertence ao sistema da requisição', async () => {
            const res = await api(multiMdo, { sistema: 'MDO' }).post('/api/relatorios').send(parlamentares());
            assertStatus(res, 400);
            assert.match(res.body.message, /Fonte Parlamentares não pertence ao sistema MDO/);
        });

        it('executa a fonte do sistema MDO quando o header é MDO', async () => {
            const portfolio = await prisma().portfolio.create({
                data: { titulo: uniq('Portfólio MdO'), tipo_projeto: 'MDO' },
                select: { id: true },
            });
            const parametros = { portfolio_id: portfolio.id, periodo_inicio: '2024-01-01', periodo_fim: '2024-12-31' };
            const id = await pedirRelatorio(multiMdo, 'MDO', { fonte: 'ObraStatus', parametros });
            const linha = (await listaDoUsuario(multiMdo, 'MDO', `?id=${id}`))[0];
            assert.equal(linha.fonte, 'ObraStatus');
        });

        it(
            '400 por portfolio_id ausente em ObraStatus com datas opcionais',
            {
                todo: 'BUG: POST /api/relatorios {fonte: ObraStatus, parametros: {}} devolve 500 (DateTransform em src/auth/transforms/date.transform.ts recebe undefined); esperado 400 por portfolio_id obrigatório',
            },
            async () => {
                assertStatus(
                    await api(multiMdo, { sistema: 'MDO' })
                        .post('/api/relatorios')
                        .send({ fonte: 'ObraStatus', parametros: {} }),
                    400
                );
            }
        );
    });

    describe('validação', () => {
        it('400 com fonte fora do enum', async () => {
            const res = await api(executor, { sistema: 'CasaCivil' })
                .post('/api/relatorios')
                .send({ fonte: 'FonteInexistente', parametros: {} });
            assertStatus(res, 400);
        });

        it('400 com parâmetro que não existe no enum da fonte', async () => {
            const res = await api(executor, { sistema: 'CasaCivil' })
                .post('/api/relatorios')
                .send(parlamentares({ parametros: { cargo: 'NaoExiste' } }));
            assertStatus(res, 400);
        });

        it('400 com visibilidade_tipo desconhecida e com modelo_id que não é número', async () => {
            const cliente = api(executor, { sistema: 'CasaCivil' });

            assertStatus(
                await cliente.post('/api/relatorios').send(parlamentares({ visibilidade_tipo: 'todos' })),
                400
            );
            assertStatus(await cliente.post('/api/relatorios').send(parlamentares({ modelo_id: 'abc' })), 400);
        });
    });

    describe('enfileirar e listar', () => {
        it('cria o relatório, enfileira a task e devolve a linha com os campos do pedido', async () => {
            const id = await pedirRelatorio(executor, 'CasaCivil', parlamentares());

            const tarefa = await prisma().task_queue.findFirst({
                where: { type: 'run_report', params: { path: ['relatorio_id'], equals: id } },
                select: { id: true },
            });
            assert.ok(tarefa, 'task run_report não foi enfileirada');

            const linha = (await listaDoUsuario(executor, 'CasaCivil', `?id=${id}`))[0];
            assert.equal(linha.id, id);
            assert.equal(linha.fonte, 'Parlamentares');
            assert.equal(linha.criador.nome_exibicao, executor.pessoa.nome_exibicao);
            assert.equal(linha.visibilidade_tipo, 'privado');
            assert.equal(linha.pode_remover, false);
        });

        it('privado: outra pessoa com a mesma permissão não vê o relatório', async () => {
            const id = await pedirRelatorio(executor, 'CasaCivil', parlamentares());

            const linhas = await listaDoUsuario(outroExecutor, 'CasaCivil', `?id=${id}`);
            assert.equal(linhas.length, 0);
        });

        it('público vale pelo deprecated eh_publico e aparece para outras pessoas', async () => {
            const id = await pedirRelatorio(executor, 'CasaCivil', parlamentares({ eh_publico: true }));

            const linha = (await listaDoUsuario(outroExecutor, 'CasaCivil', `?id=${id}`))[0];
            assert.ok(linha, 'relatório público não aparece para outra pessoa');
            assert.equal(linha.visibilidade_tipo, 'publico');
        });

        it('meu_orgao: visível só para quem é do órgão do criador', async () => {
            const orgao = await criarOrgao();
            const criador = await criarPessoaComPrivilegios(['Reports.executar.CasaCivil'], { orgao_id: orgao.id });
            const colega = await criarPessoaComPrivilegios(['Reports.executar.CasaCivil'], { orgao_id: orgao.id });

            const id = await pedirRelatorio(criador, 'CasaCivil', parlamentares({ visibilidade_tipo: 'meu_orgao' }));

            const doOrgao = (await listaDoUsuario(colega, 'CasaCivil', `?id=${id}`))[0];
            assert.equal(doOrgao.visibilidade_tipo_label, 'Restrito ao órgão');
            assert.equal((await listaDoUsuario(outroExecutor, 'CasaCivil', `?id=${id}`)).length, 0);
        });

        it('filtra por fonte e não traz relatórios de outra fonte', async () => {
            const id = await pedirRelatorio(executor, 'CasaCivil', parlamentares());

            const daFonte = await listaDoUsuario(executor, 'CasaCivil', '?fonte=Parlamentares');
            assert.ok(daFonte.some((l) => l.id === id));

            const deOutra = await listaDoUsuario(executor, 'CasaCivil', '?fonte=Demandas');
            assert.equal(
                deOutra.some((l) => l.id === id),
                false
            );
        });

        it('escopo por fonte: quem executa só Demandas enxerga só Demandas', async () => {
            const demanda = await pedirRelatorio(escopoDemandas, 'CasaCivil', { fonte: 'Demandas', parametros: {} });
            const parl = await pedirRelatorio(executor, 'CasaCivil', parlamentares({ eh_publico: true }));

            const linhas = await listaDoUsuario(escopoDemandas, 'CasaCivil');
            assert.ok(linhas.some((l) => l.id === demanda));
            assert.equal(
                linhas.some((l) => l.id === parl),
                false
            );
        });

        it('GET /relatorios/visibilidade-tipos devolve os três escopos com rótulo', async () => {
            const res = await api(executor, { sistema: 'CasaCivil' }).get('/api/relatorios/visibilidade-tipos');
            assertStatus(res, 200);
            const porTipo = Object.fromEntries(
                res.body.linhas.map((l: { tipo: string; label: string }) => [l.tipo, l.label])
            );
            assert.deepEqual(porTipo, { publico: 'Público', privado: 'Privado', meu_orgao: 'Restrito ao órgão' });
        });
    });

    describe('modelo_id', () => {
        it('usa um modelo da mesma fonte e o devolve na listagem', async () => {
            const modelo = await api(admin, { sistema: 'CasaCivil' })
                .post('/api/relatorio-modelo')
                .send({
                    nome: uniq('Modelo relatório'),
                    fonte: 'Parlamentares',
                    visibilidade_tipo: 'publico',
                    config: { arquivos: [{ arquivo: 'parlamentares.csv' }] },
                });
            assertStatus(modelo, 201);

            const id = await pedirRelatorio(executor, 'CasaCivil', parlamentares({ modelo_id: modelo.body.id }));
            const linha = (await listaDoUsuario(executor, 'CasaCivil', `?id=${id}`))[0];
            assert.equal(linha.modelo?.id, modelo.body.id);
            assert.equal(linha.modelo?.removido, false);
        });

        it('400 quando o modelo é de outra fonte', async () => {
            const modelo = await api(admin, { sistema: 'CasaCivil' })
                .post('/api/relatorio-modelo')
                .send({
                    nome: uniq('Modelo demandas'),
                    fonte: 'Demandas',
                    visibilidade_tipo: 'publico',
                    config: { arquivos: [{ arquivo: 'demandas.csv' }] },
                });
            assertStatus(modelo, 201);

            const res = await api(executor, { sistema: 'CasaCivil' })
                .post('/api/relatorios')
                .send(parlamentares({ modelo_id: modelo.body.id }));
            assertStatus(res, 400);
            assert.match(res.body.message, /incompatível com a fonte Parlamentares/);
        });

        it('400 quando o modelo é privado de outra pessoa, como se não existisse', async () => {
            const modelo = await api(admin, { sistema: 'CasaCivil' })
                .post('/api/relatorio-modelo')
                .send({
                    nome: uniq('Modelo privado'),
                    fonte: 'Parlamentares',
                    config: { arquivos: [{ arquivo: 'parlamentares.csv' }] },
                });
            assertStatus(modelo, 201);

            const res = await api(executor, { sistema: 'CasaCivil' })
                .post('/api/relatorios')
                .send(parlamentares({ modelo_id: modelo.body.id }));
            assertStatus(res, 400);
            assert.match(res.body.message, /não encontrado/);
        });
    });

    describe('remoção', () => {
        it('403 sem Reports.remover da fonte', async () => {
            const id = await pedirRelatorio(executor, 'CasaCivil', parlamentares());
            const res = await api(executor, { sistema: 'CasaCivil' }).delete(`/api/relatorios/${id}`);
            assertStatus(res, 403);
            assert.match(res.body.message, /Reports\.remover\.CasaCivil/);
        });

        it('204 com Reports.remover e o relatório some da listagem', async () => {
            const id = await pedirRelatorio(executor, 'CasaCivil', parlamentares());

            assertStatus(await api(removedor, { sistema: 'CasaCivil' }).delete(`/api/relatorios/${id}`), 204);

            const linhas = await listaDoUsuario(executor, 'CasaCivil', `?id=${id}`);
            assert.equal(linhas.length, 0);
            const registro = await prisma().relatorio.findUniqueOrThrow({
                where: { id },
                select: { removido_em: true, removido_por: true },
            });
            assert.ok(registro.removido_em);
            assert.equal(registro.removido_por, removedor.pessoa.id);
        });

        it('escopo: remover de Demandas não remove relatório de Parlamentares', async () => {
            const id = await pedirRelatorio(executor, 'CasaCivil', parlamentares());

            const res = await api(escopoRemocaoDemandas, { sistema: 'CasaCivil' }).delete(`/api/relatorios/${id}`);
            assertStatus(res, 403);
            assert.match(res.body.message, /não tem permissão para remover este relatório/);
        });
    });
});
