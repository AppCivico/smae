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
import { criaGlobal, novaGlobal, SerieCorpo, valorDaSerie } from './_helpers';

describe('variavel', () => {
    describe('IndicadorVariavelPDMController (indicador-variavel)', () => {
        let metasEscrita: Sessao;
        let metasLeitura: Sessao;
        let globalAdmin: Sessao;
        let semPrivilegio: Sessao;

        before(async () => {
            await bootApp();
            metasEscrita = await criarPessoaComPrivilegios(['CadastroMeta.administrador_no_pdm']);
            metasLeitura = await criarPessoaComPrivilegios(['CadastroMeta.listar']);
            globalAdmin = await criarPessoaComPrivilegios(['CadastroVariavelGlobal.administrador']);
            semPrivilegio = await criarPessoaSemPrivilegios();
        });

        it('401 sem token', async () => {
            assertStatus(await api().get('/api/indicador-variavel'), 401);
            assertStatus(await api().post('/api/indicador-variavel').send({}), 401);
        });

        it('403 sem papel de PDM: leitura e escrita', async () => {
            const lista = await api(semPrivilegio).get('/api/indicador-variavel');
            assertStatus(lista, 403);

            const cria = await api(metasLeitura).post('/api/indicador-variavel').send({});
            assertStatus(cria, 403);
            assert.match(cria.body.message, /CadastroMeta\.administrador_no_pdm/);
        });

        it('403 para administrador de variável global na listagem de PDM', async () => {
            assertStatus(await api(globalAdmin).get('/api/indicador-variavel').query({ id: 1 }), 403);
            assertStatus(await api(globalAdmin).patch('/api/indicador-variavel-serie').send({ valores: [] }), 403);
        });

        it('400 com corpo vazio na criação de variável do PDM', async () => {
            const res = await api(metasEscrita).post('/api/indicador-variavel').send({});
            assertStatus(res, 400);
            assert.ok(Array.isArray(res.body.message));
        });

        it('400 com :id não numérico', async () => {
            assertStatus(await api(metasLeitura).get('/api/indicador-variavel/abc'), 400);
        });

        it('leitura: listagem 200 e 404 para id inexistente', async () => {
            const lista = await api(metasLeitura).get('/api/indicador-variavel').query({ id: 999999 });
            assertStatus(lista, 200);
            assert.deepEqual(lista.body.linhas, []);

            assertStatus(await api(metasLeitura).get('/api/indicador-variavel/999999'), 404);
        });
    });

    describe('VariavelGlobalController (variavel)', () => {
        let admin: Sessao;
        let adminOrgaoA: Sessao;
        let adminOrgaoB: Sessao;
        let participante: Sessao;
        let leitorPs: Sessao;
        let semPrivilegio: Sessao;
        let orgaoA: { id: number };
        let orgaoB: { id: number };

        before(async () => {
            await bootApp();
            orgaoA = await criarOrgao();
            orgaoB = await criarOrgao();
            admin = await criarPessoaComPrivilegios([
                'CadastroVariavelGlobal.administrador',
                'CadastroVariavelCategorica.administrador',
            ]);
            adminOrgaoA = await criarPessoaComPrivilegios(['CadastroVariavelGlobal.administrador_no_orgao'], {
                orgao_id: orgaoA.id,
            });
            adminOrgaoB = await criarPessoaComPrivilegios(['CadastroVariavelGlobal.administrador_no_orgao'], {
                orgao_id: orgaoB.id,
            });
            participante = await criarPessoaComPrivilegios(['SMAE.GrupoVariavel.participante'], {
                orgao_id: orgaoA.id,
            });
            leitorPs = await criarPessoaComPrivilegios(['CadastroMetaPS.listar']);
            semPrivilegio = await criarPessoaSemPrivilegios();
        });

        const mensagem = (res: { body: { message?: unknown } }): string => String(res.body.message);

        describe('autenticação e privilégios', () => {
            it('401 sem token', async () => {
                assertStatus(await api().get('/api/variavel'), 401);
                assertStatus(await api().post('/api/variavel').send(novaGlobal(orgaoA.id)), 401);
                assertStatus(await api().delete('/api/variavel/1'), 401);
            });

            it('403 em todas as rotas de escrita sem CadastroVariavelGlobal', async () => {
                const cliente = api(leitorPs);
                const criar = await cliente.post('/api/variavel').send(novaGlobal(orgaoA.id));
                assertStatus(criar, 403);
                assert.match(mensagem(criar), /CadastroVariavelGlobal\.administrador/);

                assertStatus(await cliente.patch('/api/variavel/1').send({ titulo: uniq() }), 403);
                assertStatus(await cliente.delete('/api/variavel/1'), 403);
                assertStatus(await cliente.patch('/api/variavel-serie').send({ valores: [] }), 403);
                assertStatus(await cliente.post('/api/variavel/gerador-regionalizado').send({}), 403);
                assertStatus(await cliente.post('/api/processa-variaveis-globais-suspensas'), 403);
            });

            it('403 sem nenhum privilégio de variável na listagem', async () => {
                assertStatus(await api(semPrivilegio).get('/api/variavel'), 403);
            });

            it('leitor de metas PS lista e vê pode_editar=false', async () => {
                const id = await criaGlobal(admin, orgaoA.id);
                const lista = await api(leitorPs).get('/api/variavel').query({ id });
                assertStatus(lista, 200);
                const linha = lista.body.linhas.find((l: { id: number }) => l.id === id);
                assert.equal(linha.pode_editar, false);
                assert.equal(linha.pode_excluir, false);
            });
        });

        describe('validação', () => {
            it('400 sem inicio_medicao (obrigatório para global)', async () => {
                const res = await api(admin)
                    .post('/api/variavel')
                    .send(novaGlobal(orgaoA.id, { inicio_medicao: undefined }));
                assertStatus(res, 400);
                assert.match(mensagem(res), /Início da medição é obrigatório/);
            });

            it('400 com inicio_medicao que não é dia 1', async () => {
                const res = await api(admin)
                    .post('/api/variavel')
                    .send(novaGlobal(orgaoA.id, { inicio_medicao: '2024-01-15' }));
                assertStatus(res, 400);
                assert.match(mensagem(res), /primeiro dia do mês/);
            });

            it('400 com fim_medicao anterior ao início', async () => {
                const res = await api(admin)
                    .post('/api/variavel')
                    .send(novaGlobal(orgaoA.id, { fim_medicao: '2023-12-01' }));
                assertStatus(res, 400);
                assert.match(mensagem(res), /Fim da medição deve ser maior/);
            });

            it('400 sem órgão proprietário', async () => {
                const dados = novaGlobal(orgaoA.id);
                delete (dados as Record<string, unknown>).orgao_proprietario_id;
                const res = await api(admin).post('/api/variavel').send(dados);
                assertStatus(res, 400);
                assert.match(mensagem(res), /Órgão proprietário é obrigatório/);
            });

            it('400 sem unidade de medida nem categórica', async () => {
                const dados = novaGlobal(orgaoA.id);
                delete (dados as Record<string, unknown>).unidade_medida_id;
                const res = await api(admin).post('/api/variavel').send(dados);
                assertStatus(res, 400);
                assert.match(mensagem(res), /Unidade de medida é obrigatória/);
            });

            it('400 sem valor_base', async () => {
                const dados = novaGlobal(orgaoA.id);
                delete (dados as Record<string, unknown>).valor_base;
                const res = await api(admin).post('/api/variavel').send(dados);
                assertStatus(res, 400);
                assert.match(mensagem(res), /Valor base é obrigatório/);
            });

            it('400 com periodicidade inválida e com casas_decimais acima do máximo', async () => {
                assertStatus(
                    await api(admin)
                        .post('/api/variavel')
                        .send(novaGlobal(orgaoA.id, { periodicidade: 'Diaria' })),
                    400
                );
                assertStatus(
                    await api(admin)
                        .post('/api/variavel')
                        .send(novaGlobal(orgaoA.id, { casas_decimais: 13 })),
                    400
                );
            });

            it('categórica ignora acumulativa=true e grava como não acumulativa', async () => {
                const categorica = await api(admin)
                    .post('/api/variavel-categorica')
                    .send({
                        tipo: 'Qualitativa',
                        titulo: uniq('Categórica acumulativa'),
                        valores: [{ titulo: 'Sim', valor_variavel: 1, ordem: 1 }],
                    });
                assertStatus(categorica, 201);

                const res = await api(admin)
                    .post('/api/variavel')
                    .send(novaGlobal(orgaoA.id, { variavel_categorica_id: categorica.body.id, acumulativa: true }));
                assertStatus(res, 201);
                assert.equal((await api(admin).get(`/api/variavel/${res.body.id}`)).body.acumulativa, false);
            });

            it('400 ao criar global para outro órgão sem ser administrador geral', async () => {
                const res = await api(adminOrgaoB).post('/api/variavel').send(novaGlobal(orgaoA.id));
                assertStatus(res, 400);
                assert.match(mensagem(res), /próprio órgão/);
            });

            it('400 com :id não numérico', async () => {
                assertStatus(await api(admin).get('/api/variavel/abc'), 400);
            });
        });

        describe('CRUD e listagem', () => {
            it('cria, detalha, lista e edita título', async () => {
                const titulo = uniq('CRUD global');
                const id = await criaGlobal(admin, orgaoA.id, { titulo });

                const detalhe = await api(admin).get(`/api/variavel/${id}`);
                assertStatus(detalhe, 200);
                assert.equal(detalhe.body.titulo, titulo);
                assert.equal(detalhe.body.tipo, 'Global');
                assert.equal(detalhe.body.periodicidade, 'Mensal');
                assert.equal(detalhe.body.orgao_proprietario.id, orgaoA.id);
                assert.equal(detalhe.body.inicio_medicao, '2024-01-01');
                assert.equal(detalhe.body.fim_medicao, '2024-03-01');
                assert.equal(detalhe.body.pode_editar, true);
                assert.equal(detalhe.body.pode_excluir, true);
                assert.equal(typeof detalhe.body.codigo, 'string');

                const lista = await api(admin).get('/api/variavel').query({ id });
                assertStatus(lista, 200);
                const linha = lista.body.linhas.find((l: { id: number }) => l.id === id);
                assert.equal(linha.titulo, titulo);
                assert.equal(linha.codigo, detalhe.body.codigo);

                const novoTitulo = uniq('CRUD global editada');
                assertStatus(await api(admin).patch(`/api/variavel/${id}`).send({ titulo: novoTitulo }), 200);
                assert.equal((await api(admin).get(`/api/variavel/${id}`)).body.titulo, novoTitulo);
            });

            it('filtra períodos válidos por data_inicio e data_fim', async () => {
                const id = await criaGlobal(admin, orgaoA.id);

                const todos = await api(admin).get(`/api/variavel/${id}/periodos-validos`);
                assertStatus(todos, 200);
                assert.deepEqual(todos.body.periodos_validos, ['2024-01-01', '2024-02-01', '2024-03-01']);

                const filtrados = await api(admin)
                    .get(`/api/variavel/${id}/periodos-validos`)
                    .query({ data_inicio: '2024-02-01' });
                assert.deepEqual(filtrados.body.periodos_validos, ['2024-02-01', '2024-03-01']);
            });

            it('404 para variável inexistente', async () => {
                assertStatus(await api(admin).get('/api/variavel/999999'), 404);
            });

            it('categórica: força casas_decimais 0, polaridade Neutra e não acumulativa', async () => {
                const categorica = await api(admin)
                    .post('/api/variavel-categorica')
                    .send({
                        tipo: 'Binaria',
                        titulo: uniq('Sim ou não global'),
                        valores: [
                            { titulo: 'Não', valor_variavel: 0, ordem: 1 },
                            { titulo: 'Sim', valor_variavel: 1, ordem: 2 },
                        ],
                    });
                assertStatus(categorica, 201);

                const id = await criaGlobal(admin, orgaoA.id, {
                    variavel_categorica_id: categorica.body.id,
                    casas_decimais: 4,
                    unidade_medida_id: undefined,
                    valor_base: undefined,
                });
                const detalhe = await api(admin).get(`/api/variavel/${id}`);
                assertStatus(detalhe, 200);
                assert.equal(detalhe.body.variavel_categorica_id, categorica.body.id);
                assert.equal(detalhe.body.casas_decimais, 0);
                assert.equal(detalhe.body.polaridade, 'Neutra');
                assert.equal(detalhe.body.acumulativa, false);
            });
        });

        describe('série e validação de valores', () => {
            let variavelId: number;

            before(async () => {
                variavelId = await criaGlobal(admin, orgaoA.id, { titulo: uniq('Série global') });
            });

            const serie = async (sessao: Sessao = admin) => {
                const res = await api(sessao).get(`/api/variavel/${variavelId}/serie`);
                assertStatus(res, 200);
                return res.body as SerieCorpo;
            };

            it('grava o valor realizado com o token de referência e lê de volta', async () => {
                const antes = await serie();
                const token = valorDaSerie(antes, '2024-02-01', 'R_')?.referencia;
                assert.ok(token, 'série do período 2024-02 deveria ter token de Realizado');

                const res = await api(admin)
                    .patch('/api/variavel-serie')
                    .send({ valores: [{ referencia: token, valor: '1.5' }] });
                assertStatus(res, 204);

                const depois = await serie();
                assert.equal(valorDaSerie(depois, '2024-02-01', 'R_')?.valor_nominal, '1.5');
            });

            it('400 com mais casas decimais que casas_decimais (2)', async () => {
                const token = valorDaSerie(await serie(), '2024-03-01', 'R_')?.referencia;
                const res = await api(admin)
                    .patch('/api/variavel-serie')
                    .send({ valores: [{ referencia: token, valor: '1.234' }] });
                assertStatus(res, 400);
                assert.match(mensagem(res), /mais que 2 casas decimais/);
            });

            it('400 com token que não pertence a quem envia', async () => {
                const outroAdmin = await criarPessoaComPrivilegios(['CadastroVariavelGlobal.administrador']);
                const token = valorDaSerie(await serie(), '2024-03-01', 'R_')?.referencia;
                const res = await api(outroAdmin)
                    .patch('/api/variavel-serie')
                    .send({ valores: [{ referencia: token, valor: '2' }] });
                assertStatus(res, 400);
                assert.match(mensagem(res), /Token criado por outro usuário/);
            });

            it('400 com token mal formado', async () => {
                const res = await api(admin)
                    .patch('/api/variavel-serie')
                    .send({ valores: [{ referencia: 'lixo', valor: '2' }] });
                assertStatus(res, 400);
            });

            it('400 para categórica quando o valor não existe na lista de valores', async () => {
                const categorica = await api(admin)
                    .post('/api/variavel-categorica')
                    .send({
                        tipo: 'Binaria',
                        titulo: uniq('Binária da série'),
                        valores: [
                            { titulo: 'Não', valor_variavel: 0, ordem: 1 },
                            { titulo: 'Sim', valor_variavel: 1, ordem: 2 },
                        ],
                    });
                assertStatus(categorica, 201);
                const id = await criaGlobal(admin, orgaoA.id, {
                    variavel_categorica_id: categorica.body.id,
                    unidade_medida_id: undefined,
                    valor_base: undefined,
                });

                const corpo = (await api(admin).get(`/api/variavel/${id}/serie`)).body as SerieCorpo;
                const token = valorDaSerie(corpo, '2024-01-01', 'R_')?.referencia;
                const invalido = await api(admin)
                    .patch('/api/variavel-serie')
                    .send({ valores: [{ referencia: token, valor: '7' }] });
                assertStatus(invalido, 400);
                assert.match(mensagem(invalido), /não é permitido para a variável categórica/);

                const valido = await api(admin)
                    .patch('/api/variavel-serie')
                    .send({ valores: [{ referencia: token, valor: '1' }] });
                assertStatus(valido, 204);
            });
        });

        describe('permissão de edição e remoção', () => {
            it('dono do órgão remove a própria variável (202) e ela some do detalhe', async () => {
                const id = await criaGlobal(adminOrgaoA, orgaoA.id);

                const detalhe = await api(adminOrgaoA).get(`/api/variavel/${id}`);
                assertStatus(detalhe, 200);
                assert.equal(detalhe.body.pode_excluir, true);

                assertStatus(await api(adminOrgaoA).delete(`/api/variavel/${id}`), 202);

                const banco = await prisma().variavel.findUniqueOrThrow({ where: { id } });
                assert.ok(banco.removido_em);
                assert.equal(banco.removido_por, adminOrgaoA.pessoa.id);
                assertStatus(await api(adminOrgaoA).get(`/api/variavel/${id}`), 404);
            });

            it('administrador de outro órgão não consegue remover (403)', async () => {
                const id = await criaGlobal(admin, orgaoA.id, { orgao_proprietario_id: orgaoA.id });

                const detalhe = await api(adminOrgaoB).get(`/api/variavel/${id}`);
                assertStatus(detalhe, 200);
                assert.equal(detalhe.body.pode_editar, false);
                assert.equal(detalhe.body.pode_excluir, false);

                const res = await api(adminOrgaoB).delete(`/api/variavel/${id}`);
                assertStatus(res, 403);
                assert.match(mensagem(res), /permissão para remover/);

                assertStatus(await api(admin).get(`/api/variavel/${id}`), 200);
            });

            it('participante cria no próprio órgão, mas não remove nem edita (403)', async () => {
                const id = await criaGlobal(participante, orgaoA.id);

                const detalhe = await api(participante).get(`/api/variavel/${id}`);
                assertStatus(detalhe, 200);
                assert.equal(detalhe.body.pode_editar, false);

                const remocao = await api(participante).delete(`/api/variavel/${id}`);
                assertStatus(remocao, 403);
                assert.match(mensagem(remocao), /permissão para remover/);

                const edicao = await api(participante).patch(`/api/variavel/${id}`).send({ titulo: uniq() });
                assertStatus(edicao, 403);
            });

            it('participante não cria variável de outro órgão', async () => {
                const res = await api(participante).post('/api/variavel').send(novaGlobal(orgaoB.id));
                assertStatus(res, 400);
                assert.match(mensagem(res), /próprio órgão/);
            });
        });

        describe('rotas auxiliares e cópias do plano setorial', () => {
            let variavel: number;

            before(async () => {
                variavel = await criaGlobal(admin, orgaoA.id, { titulo: uniq('Auxiliar') });
            });

            it('401 sem token e 403 sem papel de metas PS ou variável global', async () => {
                assertStatus(await api().get('/api/proxy/pdm-e-planos-setoriais'), 401);
                assertStatus(await api().get(`/api/plano-setorial-indicador-variavel/${variavel}/serie`), 401);

                assertStatus(await api(semPrivilegio).get('/api/proxy/pdm-e-planos-setoriais'), 403);
                assertStatus(await api(semPrivilegio).get('/api/proxy/pdm-e-planos-setoriais/metas'), 403);
                assertStatus(
                    await api(semPrivilegio).get('/api/plano-setorial-indicador-variavel').query({ id: variavel }),
                    403
                );
                assertStatus(await api(semPrivilegio).get(`/api/variavel/${variavel}/relacionados`), 403);
                assertStatus(await api(leitorPs).post('/api/processa-variaveis-suspensas-pdm-legacy'), 403);
            });

            it('proxy de PDMs e planos setoriais responde a leitor de metas PS', async () => {
                const pdms = await api(leitorPs).get('/api/proxy/pdm-e-planos-setoriais');
                assertStatus(pdms, 200);
                assert.ok(Array.isArray(pdms.body.linhas));

                const metas = await api(leitorPs).get('/api/proxy/pdm-e-planos-setoriais/metas');
                assertStatus(metas, 200);
                assert.ok(Array.isArray(metas.body.linhas));

                const iniciativas = await api(leitorPs)
                    .get('/api/proxy/pdm-e-planos-setoriais/metas/iniciativas-atividades')
                    .query({ meta_ids: '999999,999998' });
                assertStatus(iniciativas, 404);
                assert.match(String(iniciativas.body.message), /não encontrada/);

                assertStatus(
                    await api(leitorPs).get('/api/proxy/pdm-e-planos-setoriais/metas/iniciativas-atividades'),
                    400
                );
            });

            it('cópias do plano setorial devolvem o mesmo período que a rota de variável', async () => {
                const lista = await api(admin).get('/api/plano-setorial-indicador-variavel').query({ id: variavel });
                assertStatus(lista, 200);
                assert.ok(lista.body.linhas.some((l: { id: number }) => l.id === variavel));

                const copia = await api(admin).get(
                    `/api/plano-setorial-indicador-variavel/${variavel}/periodos-validos`
                );
                const original = await api(admin).get(`/api/variavel/${variavel}/periodos-validos`);
                assertStatus(copia, 200);
                assert.deepEqual(copia.body.periodos_validos, original.body.periodos_validos);

                const serie = await api(admin).get(`/api/plano-setorial-indicador-variavel/${variavel}/serie`);
                assertStatus(serie, 200);
                assert.ok(Array.isArray(serie.body.linhas));
            });

            it('relacionados exigem administração ou participação em variável global', async () => {
                assertStatus(await api(leitorPs).get(`/api/variavel/${variavel}/relacionados`), 403);
                assertStatus(await api(admin).get(`/api/variavel/${variavel}/relacionados`), 200);
            });
        });
    });
});
