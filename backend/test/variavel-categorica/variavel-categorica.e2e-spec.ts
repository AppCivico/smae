import { before, describe, it } from 'node:test';
import { CONST_VAR_SEM_UN_MEDIDA } from '../../src/common/consts';
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

type ValorDto = { id?: number; titulo: string; valor_variavel: number; ordem?: number; descricao?: string };

describe('variavel-categorica', () => {
    let gestor: Sessao;
    let leitorMetas: Sessao;
    let semPrivilegio: Sessao;
    let globalAdmin: Sessao;

    before(async () => {
        await bootApp();
        gestor = await criarPessoaComPrivilegios(['CadastroVariavelCategorica.administrador']);
        leitorMetas = await criarPessoaComPrivilegios(['CadastroMetaPS.listar']);
        semPrivilegio = await criarPessoaSemPrivilegios();
        globalAdmin = await criarPessoaComPrivilegios([
            'CadastroVariavelGlobal.administrador',
            'CadastroVariavelCategorica.administrador',
        ]);
    });

    const qualitativa = (valores: ValorDto[] = [{ titulo: 'Alto', valor_variavel: 1, ordem: 1 }]) => ({
        tipo: 'Qualitativa',
        titulo: uniq('Categorica'),
        valores,
    });

    const buscaNaLista = async (id: number, filtro: Record<string, string> = {}) => {
        const lista = await api(gestor)
            .get('/api/variavel-categorica')
            .query({ id, ...filtro });
        assertStatus(lista, 200);
        return lista.body.linhas.find((l: { id: number }) => l.id === id);
    };

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await api().get('/api/variavel-categorica'), 401);
            assertStatus(await api().post('/api/variavel-categorica').send(qualitativa()), 401);
        });

        it('403 sem CadastroVariavelCategorica.administrador (escrita)', async () => {
            const criar = await api(leitorMetas).post('/api/variavel-categorica').send(qualitativa());
            assertStatus(criar, 403);
            assert.match(criar.body.message, /CadastroVariavelCategorica\.administrador/);

            assertStatus(await api(leitorMetas).patch('/api/variavel-categorica/1').send({ titulo: uniq() }), 403);
            assertStatus(await api(leitorMetas).delete('/api/variavel-categorica/1'), 403);
        });

        it('403 para quem não lista metas nem administra categóricas', async () => {
            assertStatus(await api(semPrivilegio).get('/api/variavel-categorica'), 403);
        });

        it('leitor de metas PS lista, mas não cria', async () => {
            assertStatus(await api(leitorMetas).get('/api/variavel-categorica'), 200);
        });
    });

    describe('validação', () => {
        it('400 com tipo inválido, sem titulo ou valores vazios', async () => {
            const cliente = api(gestor);
            assertStatus(await cliente.post('/api/variavel-categorica').send({ ...qualitativa(), tipo: 'Outra' }), 400);
            assertStatus(
                await cliente.post('/api/variavel-categorica').send({ ...qualitativa(), titulo: undefined }),
                400
            );
            assertStatus(await cliente.post('/api/variavel-categorica').send({ ...qualitativa(), valores: [] }), 400);
        });

        it('400 ao criar tipo Cronograma (só o sistema cria)', async () => {
            const res = await api(gestor)
                .post('/api/variavel-categorica')
                .send({ ...qualitativa(), tipo: 'Cronograma' });
            assertStatus(res, 400);
            assert.match(res.body.message, /cronograma não pode ser criado/);
        });

        it('400 com valor_variavel repetido', async () => {
            const res = await api(gestor)
                .post('/api/variavel-categorica')
                .send(
                    qualitativa([
                        { titulo: 'A', valor_variavel: 1, ordem: 1 },
                        { titulo: 'B', valor_variavel: 1, ordem: 2 },
                    ])
                );
            assertStatus(res, 400);
            assert.match(res.body.message, /Valores devem ser únicos/);
        });

        it('400 com ordem repetida', async () => {
            const res = await api(gestor)
                .post('/api/variavel-categorica')
                .send(
                    qualitativa([
                        { titulo: 'A', valor_variavel: 1, ordem: 1 },
                        { titulo: 'B', valor_variavel: 2, ordem: 1 },
                    ])
                );
            assertStatus(res, 400);
            assert.match(res.body.message, /ordem devem ser únicos/);
        });

        it('binária precisa de exatamente 0 e 1', async () => {
            const cliente = api(gestor);
            const dois = (valores: ValorDto[]) => ({ tipo: 'Binaria', titulo: uniq('Bin'), valores });

            const comDoisValoresErrados = await cliente.post('/api/variavel-categorica').send(
                dois([
                    { titulo: 'Não', valor_variavel: 0, ordem: 1 },
                    { titulo: 'Talvez', valor_variavel: 2, ordem: 2 },
                ])
            );
            assertStatus(comDoisValoresErrados, 400);
            assert.match(comDoisValoresErrados.body.message, /exatamente 0 e 1/);

            const comTresValores = await cliente.post('/api/variavel-categorica').send(
                dois([
                    { titulo: 'Não', valor_variavel: 0, ordem: 1 },
                    { titulo: 'Sim', valor_variavel: 1, ordem: 2 },
                    { titulo: 'Outro', valor_variavel: 2, ordem: 3 },
                ])
            );
            assertStatus(comTresValores, 400);
            assert.match(comTresValores.body.message, /exatamente 2 valores/);
        });
    });

    describe('CRUD e filtros', () => {
        it('cria, lista por id e por tipo, edita e remove', async () => {
            const titulo = uniq('Faixa');
            const criado = await api(gestor)
                .post('/api/variavel-categorica')
                .send({
                    tipo: 'Qualitativa',
                    titulo,
                    descricao: 'descrição inicial',
                    valores: [
                        { titulo: 'Baixo', valor_variavel: 1, ordem: 1 },
                        { titulo: 'Médio', valor_variavel: 2, ordem: 2, descricao: 'intermediário' },
                        { titulo: 'Alto', valor_variavel: 3, ordem: 3 },
                    ],
                });
            assertStatus(criado, 201);
            const id: number = criado.body.id;

            const linha = await buscaNaLista(id);
            assert.equal(linha.titulo, titulo);
            assert.equal(linha.tipo, 'Qualitativa');
            assert.equal(linha.descricao, 'descrição inicial');
            assert.deepEqual(
                linha.valores.map((v: { titulo: string; valor_variavel: number }) => [v.titulo, v.valor_variavel]),
                [
                    ['Baixo', 1],
                    ['Médio', 2],
                    ['Alto', 3],
                ]
            );

            const filtradaPorTipo = await api(gestor).get('/api/variavel-categorica').query({ tipo: 'Qualitativa' });
            assertStatus(filtradaPorTipo, 200);
            assert.ok(filtradaPorTipo.body.linhas.some((l: { id: number }) => l.id === id));
            assert.ok(filtradaPorTipo.body.linhas.every((l: { tipo: string }) => l.tipo === 'Qualitativa'));

            const altoId = linha.valores.find((v: { valor_variavel: number }) => v.valor_variavel === 3).id;
            const novoTitulo = uniq('Faixa editada');
            const editado = await api(gestor)
                .patch(`/api/variavel-categorica/${id}`)
                .send({
                    titulo: novoTitulo,
                    descricao: null,
                    valores: [
                        { id: altoId, titulo: 'Muito alto', valor_variavel: 3, ordem: 3 },
                        ...linha.valores
                            .filter((v: { id: number }) => v.id !== altoId)
                            .map((v: { id: number; titulo: string; valor_variavel: number; ordem: number }) => ({
                                id: v.id,
                                titulo: v.titulo,
                                valor_variavel: v.valor_variavel,
                                ordem: v.ordem,
                            })),
                    ],
                });
            assertStatus(editado, 200);

            const depois = await buscaNaLista(id);
            assert.equal(depois.titulo, novoTitulo);
            assert.equal(depois.descricao, null);
            assert.equal(depois.valores.find((v: { id: number }) => v.id === altoId).titulo, 'Muito alto');

            assertStatus(await api(gestor).delete(`/api/variavel-categorica/${id}`), 202);
            assert.equal(await buscaNaLista(id), undefined);
        });

        it('tipo não muda ao editar (o DTO de edição não aceita tipo)', async () => {
            const criado = await api(gestor).post('/api/variavel-categorica').send(qualitativa());
            assertStatus(criado, 201);

            const res = await api(gestor)
                .patch(`/api/variavel-categorica/${criado.body.id}`)
                .send({ titulo: uniq('Tipo'), tipo: 'Binaria' });
            assertStatus(res, 200);
            assert.equal((await buscaNaLista(criado.body.id)).tipo, 'Qualitativa');
        });

        it(
            'edição parcial sem titulo atualiza só a descrição',
            {
                todo: 'BUG: PATCH sem titulo responde 400 "Título undefined já está em uso" (checagem de duplicidade não ignora titulo ausente)',
            },
            async () => {
                const criado = await api(gestor).post('/api/variavel-categorica').send(qualitativa());
                assertStatus(criado, 201);

                assertStatus(
                    await api(gestor)
                        .patch(`/api/variavel-categorica/${criado.body.id}`)
                        .send({ descricao: 'só descrição' }),
                    200
                );
                assert.equal((await buscaNaLista(criado.body.id)).descricao, 'só descrição');
            }
        );

        it('400 ao usar título de outra categórica, na criação e na edição', async () => {
            const titulo = uniq('Unico');
            const primeira = await api(gestor)
                .post('/api/variavel-categorica')
                .send({ ...qualitativa(), titulo });
            assertStatus(primeira, 201);

            const duplicada = await api(gestor)
                .post('/api/variavel-categorica')
                .send({ ...qualitativa(), titulo });
            assertStatus(duplicada, 400);
            assert.match(duplicada.body.message, /já está em uso/);

            const outra = await api(gestor).post('/api/variavel-categorica').send(qualitativa());
            assertStatus(outra, 201);
            const naEdicao = await api(gestor).patch(`/api/variavel-categorica/${outra.body.id}`).send({ titulo });
            assertStatus(naEdicao, 400);
            assert.match(naEdicao.body.message, /já está em uso/);
        });

        it('400 ao editar categórica inexistente', async () => {
            const res = await api(gestor).patch('/api/variavel-categorica/999999').send({ titulo: uniq() });
            assertStatus(res, 400);
            assert.match(res.body.message, /não encontrada/);
        });

        it('400 ao remover categórica em uso por variável com valor lançado', async () => {
            const criada = await api(gestor)
                .post('/api/variavel-categorica')
                .send({
                    tipo: 'Binaria',
                    titulo: uniq('Em uso'),
                    valores: [
                        { titulo: 'Não', valor_variavel: 0, ordem: 1 },
                        { titulo: 'Sim', valor_variavel: 1, ordem: 2 },
                    ],
                });
            assertStatus(criada, 201);

            const orgao = (await criarOrgao()).id;
            const variavel = await api(globalAdmin)
                .post('/api/variavel')
                .send({
                    titulo: uniq('Variável categórica'),
                    orgao_proprietario_id: orgao,
                    periodicidade: 'Mensal',
                    acumulativa: false,
                    casas_decimais: 0,
                    unidade_medida_id: CONST_VAR_SEM_UN_MEDIDA,
                    valor_base: '0',
                    inicio_medicao: '2024-01-01',
                    fim_medicao: '2024-02-01',
                    variavel_categorica_id: criada.body.id,
                });
            assertStatus(variavel, 201);

            const serie = await api(globalAdmin).get(`/api/variavel/${variavel.body.id}/serie`);
            const token = serie.body.linhas[0].series.find((s: { referencia: string }) =>
                s.referencia.startsWith('R_')
            ).referencia;
            assertStatus(
                await api(globalAdmin)
                    .patch('/api/variavel-serie')
                    .send({ valores: [{ referencia: token, valor: '1' }] }),
                204
            );

            const remocao = await api(gestor).delete(`/api/variavel-categorica/${criada.body.id}`);
            assertStatus(remocao, 400);
            assert.match(String(remocao.body.message), /em uso em 1 valores de variáveis/);
        });

        it('binária criada e listada com os valores 0 e 1', async () => {
            const criado = await api(gestor)
                .post('/api/variavel-categorica')
                .send({
                    tipo: 'Binaria',
                    titulo: uniq('Sim ou não'),
                    valores: [
                        { titulo: 'Sim', valor_variavel: 1, ordem: 2 },
                        { titulo: 'Não', valor_variavel: 0, ordem: 1 },
                    ],
                });
            assertStatus(criado, 201);

            const linha = await buscaNaLista(criado.body.id, { tipo: 'Binaria' });
            assert.deepEqual(
                linha.valores.map((v: { valor_variavel: number }) => v.valor_variavel),
                [0, 1]
            );
        });
    });
});
