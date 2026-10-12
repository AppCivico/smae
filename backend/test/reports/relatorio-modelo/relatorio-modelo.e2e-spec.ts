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
    Sistema,
    uniq,
} from '../../lib';

interface Arquivo {
    arquivo: string;
    colunas: string[];
}

async function arquivoDaFonte(sessao: Sessao, sistema: Sistema, fonte: string, arquivo: string): Promise<Arquivo> {
    const res = await api(sessao, { sistema }).get(`/api/relatorio-modelo/colunas?fonte=${fonte}`);
    assertStatus(res, 200);
    const achado = res.body.arquivos.find((a: { arquivo: string }) => a.arquivo === arquivo);
    assert.ok(achado, `${arquivo} não aparece nas colunas de ${fonte}`);
    return { arquivo, colunas: achado.colunas.map((c: { name: string }) => c.name) };
}

const config = (
    a: Arquivo,
    colunas: { coluna: string; label?: string }[] = a.colunas.slice(0, 2).map((coluna) => ({ coluna }))
) => ({
    arquivos: [{ arquivo: a.arquivo, colunas }],
});

const corpo = (fonte: string, a: Arquivo, extra: Record<string, unknown> = {}) => ({
    nome: uniq('Modelo'),
    fonte,
    config: config(a),
    ...extra,
});

describe('relatorio-modelo', () => {
    let executor: Sessao;
    let admin: Sessao;
    let outroAdmin: Sessao;
    let removedor: Sessao;
    let escopoDemandas: Sessao;
    let adminMdo: Sessao;
    let gpProjetos: Sessao;
    let semPrivilegio: Sessao;
    let parlamentares: Arquivo;
    let demandas: Arquivo;
    let obraStatus: Arquivo;
    let projetoStatus: Arquivo;

    before(async () => {
        await bootApp();
        executor = await criarPessoaComPrivilegios(['Reports.executar.CasaCivil']);
        admin = await criarPessoaComPrivilegios(['Reports.executar.CasaCivil', 'Reports.modelo_admin.CasaCivil']);
        outroAdmin = await criarPessoaComPrivilegios(['Reports.executar.CasaCivil', 'Reports.modelo_admin.CasaCivil']);
        removedor = await criarPessoaComPrivilegios([
            'Reports.executar.CasaCivil',
            'Reports.modelo_admin.CasaCivil',
            'Reports.remover.CasaCivil',
        ]);
        escopoDemandas = await criarPessoaComPrivilegios([
            'Reports.executar.CasaCivil:Demandas',
            'Reports.modelo_admin.CasaCivil',
        ]);
        adminMdo = await criarPessoaComPrivilegios(['Reports.executar.MDO', 'Reports.modelo_admin.MDO']);
        gpProjetos = await criarPessoaComPrivilegios(['Reports.executar.Projetos', 'Reports.modelo_admin.Projetos']);
        semPrivilegio = await criarPessoaSemPrivilegios();

        parlamentares = await arquivoDaFonte(admin, 'CasaCivil', 'Parlamentares', 'parlamentares.csv');
        demandas = await arquivoDaFonte(admin, 'CasaCivil', 'Demandas', 'demandas.csv');
        obraStatus = await arquivoDaFonte(adminMdo, 'MDO', 'ObraStatus', 'obra-status.csv');
        projetoStatus = await arquivoDaFonte(gpProjetos, 'Projetos', 'ProjetoStatus', 'projeto-status.csv');
    });

    async function criarModelo(sessao: Sessao, sistema: Sistema, dados: Record<string, unknown>) {
        const res = await api(sessao, { sistema }).post('/api/relatorio-modelo').send(dados);
        assertStatus(res, 201);
        return res.body.id as number;
    }

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await api().get('/api/relatorio-modelo'), 401);
            assertStatus(await api().post('/api/relatorio-modelo').send({}), 401);
        });

        it('400 sem header smae-sistemas: a listagem exige um sistema', async () => {
            const res = await api(admin).get('/api/relatorio-modelo');
            assertStatus(res, 400);
            assert.match(res.body.message, /foi enviando mais de um sistema/);
        });

        it('403 sem Reports.modelo_admin: quem só executa não cria, edita nem remove', async () => {
            const id = await criarModelo(admin, 'CasaCivil', corpo('Parlamentares', parlamentares));

            const criar = await api(executor, { sistema: 'CasaCivil' })
                .post('/api/relatorio-modelo')
                .send(corpo('Parlamentares', parlamentares));
            assertStatus(criar, 403);
            assert.match(criar.body.message, /Reports\.modelo_admin\.CasaCivil/);

            assertStatus(
                await api(executor, { sistema: 'CasaCivil' })
                    .patch(`/api/relatorio-modelo/${id}`)
                    .send({ nome: uniq() }),
                403
            );
            assertStatus(await api(executor, { sistema: 'CasaCivil' }).delete(`/api/relatorio-modelo/${id}`), 403);
        });

        it('403 sem nenhum privilégio de executar: usuário comum não lista modelos', async () => {
            const res = await api(semPrivilegio, { sistema: 'CasaCivil' }).get('/api/relatorio-modelo');
            assertStatus(res, 403);
            assert.match(res.body.message, /Reports\.executar\.CasaCivil/);
        });

        it('privilégios de MdO somem com header Projetos: sem nada restante, 400', async () => {
            const res = await api(adminMdo, { sistema: 'Projetos' })
                .post('/api/relatorio-modelo')
                .send(corpo('ProjetoStatus', projetoStatus));
            assertStatus(res, 400);
            assert.match(res.body.message, /não tem mais permissões/);
        });

        it('modelo_admin de MdO não vale como administração de Projetos: 403 da guarda', async () => {
            const executaProjetos = await criarPessoaComPrivilegios([
                'Reports.executar.Projetos',
                'Reports.modelo_admin.MDO',
            ]);
            const res = await api(executaProjetos, { sistema: 'Projetos' })
                .post('/api/relatorio-modelo')
                .send(corpo('ProjetoStatus', projetoStatus));
            assertStatus(res, 403);
            assert.match(res.body.message, /Reports\.modelo_admin\.Projetos/);
        });

        it('GP de Projetos e gestor de MdO criam modelos do próprio sistema', async () => {
            await criarModelo(gpProjetos, 'Projetos', corpo('ProjetoStatus', projetoStatus));
            await criarModelo(adminMdo, 'MDO', corpo('ObraStatus', obraStatus));
        });

        it('modelo_admin sem executar a fonte não cria modelo dela', async () => {
            const soAdmin = await criarPessoaComPrivilegios(['Reports.modelo_admin.MDO']);
            const res = await api(soAdmin, { sistema: 'MDO' })
                .post('/api/relatorio-modelo')
                .send(corpo('ObraStatus', obraStatus));
            assertStatus(res, 403);
            assert.match(res.body.message, /gerenciar modelos desta fonte/);
        });

        it('privilégio escopado por fonte administra só a fonte liberada', async () => {
            const parl = await api(escopoDemandas, { sistema: 'CasaCivil' })
                .post('/api/relatorio-modelo')
                .send(corpo('Parlamentares', parlamentares));
            assertStatus(parl, 403);
            assert.match(parl.body.message, /gerenciar modelos desta fonte/);

            await criarModelo(escopoDemandas, 'CasaCivil', corpo('Demandas', demandas));
        });
    });

    describe('validação', () => {
        it('400 com corpo vazio', async () => {
            assertStatus(await api(admin, { sistema: 'CasaCivil' }).post('/api/relatorio-modelo').send({}), 400);
        });

        it('400 com nome vazio, sem config ou com fonte fora da lista', async () => {
            const cliente = api(admin, { sistema: 'CasaCivil' });

            const semNome = await cliente
                .post('/api/relatorio-modelo')
                .send(corpo('Parlamentares', parlamentares, { nome: '  ' }));
            assertStatus(semNome, 400);
            assert.match(JSON.stringify(semNome.body.message), /nome não pode ser vazio/);

            const semConfig = await cliente
                .post('/api/relatorio-modelo')
                .send({ nome: uniq(), fonte: 'Parlamentares' });
            assertStatus(semConfig, 400);
            assert.match(JSON.stringify(semConfig.body.message), /config é obrigatório/);

            const fonteInvalida = await cliente
                .post('/api/relatorio-modelo')
                .send(corpo('FonteQueNaoExiste', parlamentares));
            assertStatus(fonteInvalida, 400);
            assert.match(JSON.stringify(fonteInvalida.body.message), /fonte precisa ser/);
        });

        it('400 com visibilidade_tipo desconhecida', async () => {
            const res = await api(admin, { sistema: 'CasaCivil' })
                .post('/api/relatorio-modelo')
                .send(corpo('Parlamentares', parlamentares, { visibilidade_tipo: 'todos' }));
            assertStatus(res, 400);
        });

        it('400 quando o arquivo não é produzido pela fonte', async () => {
            const res = await api(admin, { sistema: 'CasaCivil' })
                .post('/api/relatorio-modelo')
                .send(corpo('Parlamentares', parlamentares, { config: { arquivos: [{ arquivo: 'nao-existe.csv' }] } }));
            assertStatus(res, 400);
            assert.match(res.body.message, /não é produzido pela fonte Parlamentares/);
        });

        it('400 quando a coluna não existe no arquivo', async () => {
            const res = await api(admin, { sistema: 'CasaCivil' })
                .post('/api/relatorio-modelo')
                .send(
                    corpo('Parlamentares', parlamentares, {
                        config: config(parlamentares, [{ coluna: 'coluna_inexistente' }]),
                    })
                );
            assertStatus(res, 400);
            assert.match(res.body.message, /coluna_inexistente.*não existe no arquivo/);
        });

        it('400 com filtro eq sem valor e com in sem valores', async () => {
            const cliente = api(admin, { sistema: 'CasaCivil' });
            const coluna = parlamentares.colunas[0];

            const semValor = await cliente.post('/api/relatorio-modelo').send(
                corpo('Parlamentares', parlamentares, {
                    config: { arquivos: [{ arquivo: parlamentares.arquivo, filtros: [{ coluna, op: 'eq' }] }] },
                })
            );
            assertStatus(semValor, 400);
            assert.match(JSON.stringify(semValor.body.message), /valor é obrigatório/);

            const listaVazia = await cliente.post('/api/relatorio-modelo').send(
                corpo('Parlamentares', parlamentares, {
                    config: {
                        arquivos: [{ arquivo: parlamentares.arquivo, filtros: [{ coluna, op: 'in', valores: [] }] }],
                    },
                })
            );
            assertStatus(listaVazia, 400);
            assert.match(JSON.stringify(listaVazia.body.message), /lista vazia/);
        });

        it('400 para fonte que ainda não declara colunas customizáveis', async () => {
            const pdm = await criarPessoaComPrivilegios(['Reports.executar.PDM', 'Reports.modelo_admin.PDM']);
            const res = await api(pdm, { sistema: 'PDM' })
                .post('/api/relatorio-modelo')
                .send({ nome: uniq(), fonte: 'Orcamento', config: { arquivos: [{ arquivo: 'executado.csv' }] } });
            assertStatus(res, 400);
            assert.match(res.body.message, /ainda não declara colunas customizáveis/);
        });
    });

    describe('CRUD', () => {
        it('cria, detalha, lista, edita e remove', async () => {
            const nome = `  ${uniq('Modelo')}  `;
            const colunas = parlamentares.colunas.slice(0, 2).map((coluna) => ({ coluna }));
            const criado = await api(admin, { sistema: 'CasaCivil' })
                .post('/api/relatorio-modelo')
                .send({
                    nome,
                    descricao: 'modelo de teste',
                    fonte: 'Parlamentares',
                    config: { arquivos: [{ arquivo: parlamentares.arquivo, colunas }] },
                });
            assertStatus(criado, 201);
            const id: number = criado.body.id;

            const detalhe = await api(admin, { sistema: 'CasaCivil' }).get(`/api/relatorio-modelo/${id}`);
            assertStatus(detalhe, 200);
            assert.equal(detalhe.body.nome, nome.trim());
            assert.equal(detalhe.body.fonte, 'Parlamentares');
            assert.equal(detalhe.body.visibilidade_tipo, 'privado');
            assert.equal(detalhe.body.pode_editar, true);
            assert.equal(detalhe.body.criador.nome_exibicao, admin.pessoa.nome_exibicao);
            assert.deepEqual(
                detalhe.body.config.arquivos[0].colunas.map((c: { coluna: string }) => c.coluna),
                colunas.map((c) => c.coluna)
            );

            const lista = await api(admin, { sistema: 'CasaCivil' }).get('/api/relatorio-modelo?fonte=Parlamentares');
            assertStatus(lista, 200);
            const linha = lista.body.linhas.find((l: { id: number }) => l.id === id);
            assert.ok(linha, 'modelo criado não aparece na listagem da fonte');
            assert.equal(linha.pode_remover, true);

            const novoNome = uniq('Renomeado');
            assertStatus(
                await api(admin, { sistema: 'CasaCivil' })
                    .patch(`/api/relatorio-modelo/${id}`)
                    .send({ nome: novoNome }),
                200
            );
            const editado = await api(admin, { sistema: 'CasaCivil' }).get(`/api/relatorio-modelo/${id}`);
            assert.equal(editado.body.nome, novoNome);

            assertStatus(await api(admin, { sistema: 'CasaCivil' }).delete(`/api/relatorio-modelo/${id}`), 204);
            assertStatus(await api(admin, { sistema: 'CasaCivil' }).get(`/api/relatorio-modelo/${id}`), 404);
            const depois = await api(admin, { sistema: 'CasaCivil' }).get('/api/relatorio-modelo?fonte=Parlamentares');
            assert.equal(
                depois.body.linhas.some((l: { id: number }) => l.id === id),
                false
            );
        });

        it('fonte não muda no PATCH', async () => {
            const id = await criarModelo(admin, 'CasaCivil', corpo('Parlamentares', parlamentares));
            assertStatus(
                await api(admin, { sistema: 'CasaCivil' })
                    .patch(`/api/relatorio-modelo/${id}`)
                    .send({ fonte: 'Demandas' }),
                200
            );
            const detalhe = await api(admin, { sistema: 'CasaCivil' }).get(`/api/relatorio-modelo/${id}`);
            assert.equal(detalhe.body.fonte, 'Parlamentares');
        });

        it('nome repetido na mesma fonte é 400, mas a outra fonte aceita', async () => {
            const cliente = api(admin, { sistema: 'CasaCivil' });
            const nome = uniq('Mesmo nome');
            await criarModelo(admin, 'CasaCivil', corpo('Parlamentares', parlamentares, { nome }));

            const repetido = await cliente
                .post('/api/relatorio-modelo')
                .send(corpo('Parlamentares', parlamentares, { nome }));
            assertStatus(repetido, 400);
            assert.match(repetido.body.message, /Já existe um modelo com o nome/);

            await criarModelo(admin, 'CasaCivil', corpo('Demandas', demandas, { nome }));
        });

        it('PATCH para um nome já usado na mesma fonte é 400', async () => {
            const ocupado = uniq('Ocupado');
            await criarModelo(admin, 'CasaCivil', corpo('Parlamentares', parlamentares, { nome: ocupado }));
            const id = await criarModelo(admin, 'CasaCivil', corpo('Parlamentares', parlamentares));

            const res = await api(admin, { sistema: 'CasaCivil' })
                .patch(`/api/relatorio-modelo/${id}`)
                .send({ nome: ocupado });
            assertStatus(res, 400);
            assert.match(res.body.message, /Já existe um modelo com o nome/);
        });
    });

    describe('edição e remoção: criador x Reports.remover', () => {
        it('só o criador edita: outro admin do mesmo perfil leva 403', async () => {
            const id = await criarModelo(admin, 'CasaCivil', corpo('Parlamentares', parlamentares));

            const negado = await api(outroAdmin, { sistema: 'CasaCivil' })
                .patch(`/api/relatorio-modelo/${id}`)
                .send({ descricao: 'alterado por outro' });
            assertStatus(negado, 403);
            assert.match(negado.body.message, /Somente o criador do modelo pode alterá-lo/);

            assertStatus(
                await api(admin, { sistema: 'CasaCivil' })
                    .patch(`/api/relatorio-modelo/${id}`)
                    .send({ descricao: 'x' }),
                200
            );
        });

        it('Reports.remover da fonte permite editar e remover modelo de terceiros', async () => {
            const id = await criarModelo(admin, 'CasaCivil', corpo('Parlamentares', parlamentares));

            const semRemover = await api(outroAdmin, { sistema: 'CasaCivil' }).delete(`/api/relatorio-modelo/${id}`);
            assertStatus(semRemover, 403);
            assert.match(semRemover.body.message, /não tem permissão para remover este modelo/);

            assertStatus(
                await api(removedor, { sistema: 'CasaCivil' })
                    .patch(`/api/relatorio-modelo/${id}`)
                    .send({ descricao: 'x' }),
                200
            );
            assertStatus(await api(removedor, { sistema: 'CasaCivil' }).delete(`/api/relatorio-modelo/${id}`), 204);
        });
    });

    describe('visibilidade', () => {
        it('modelo privado não aparece para outras pessoas', async () => {
            const id = await criarModelo(admin, 'CasaCivil', corpo('Parlamentares', parlamentares));

            assertStatus(await api(outroAdmin, { sistema: 'CasaCivil' }).get(`/api/relatorio-modelo/${id}`), 404);
            const lista = await api(outroAdmin, { sistema: 'CasaCivil' }).get(
                '/api/relatorio-modelo?fonte=Parlamentares'
            );
            assert.equal(
                lista.body.linhas.some((l: { id: number }) => l.id === id),
                false
            );
        });

        it('modelo público aparece para outras pessoas, sem poder editá-lo', async () => {
            const id = await criarModelo(
                admin,
                'CasaCivil',
                corpo('Parlamentares', parlamentares, { visibilidade_tipo: 'publico' })
            );

            const detalhe = await api(outroAdmin, { sistema: 'CasaCivil' }).get(`/api/relatorio-modelo/${id}`);
            assertStatus(detalhe, 200);
            assert.equal(detalhe.body.visibilidade_tipo, 'publico');
            assert.equal(detalhe.body.pode_editar, false);
        });

        it('meu_orgao: vale só para quem é do órgão do criador', async () => {
            const orgao = await criarOrgao();
            const perfil = ['Reports.executar.CasaCivil', 'Reports.modelo_admin.CasaCivil'] as const;
            const criador = await criarPessoaComPrivilegios([...perfil], { orgao_id: orgao.id });
            const colega = await criarPessoaComPrivilegios([...perfil], { orgao_id: orgao.id });

            const id = await criarModelo(
                criador,
                'CasaCivil',
                corpo('Parlamentares', parlamentares, { visibilidade_tipo: 'meu_orgao' })
            );

            const doOrgao = await api(colega, { sistema: 'CasaCivil' }).get(`/api/relatorio-modelo/${id}`);
            assertStatus(doOrgao, 200);
            assert.equal(doOrgao.body.pode_editar, false);

            assertStatus(await api(admin, { sistema: 'CasaCivil' }).get(`/api/relatorio-modelo/${id}`), 404);
        });

        it('escopo por fonte: quem só executa Demandas não vê modelo de Parlamentares', async () => {
            const id = await criarModelo(
                admin,
                'CasaCivil',
                corpo('Parlamentares', parlamentares, { visibilidade_tipo: 'publico' })
            );

            assertStatus(await api(escopoDemandas, { sistema: 'CasaCivil' }).get(`/api/relatorio-modelo/${id}`), 404);

            const fontes = await api(escopoDemandas, { sistema: 'CasaCivil' }).get('/api/relatorio-modelo/fontes');
            assertStatus(fontes, 200);
            const nomes = fontes.body.linhas.map((l: { fonte: string }) => l.fonte);
            assert.ok(nomes.includes('Demandas'));
            assert.equal(nomes.includes('Parlamentares'), false);
        });
    });

    describe('colunas', () => {
        it('400 sem fonte em GET /colunas', async () => {
            assertStatus(await api(admin, { sistema: 'CasaCivil' }).get('/api/relatorio-modelo/colunas'), 400);
        });

        it('usar um modelo não exige poder administrá-lo: colunas entregues com o rótulo do modelo', async () => {
            const [primeira, segunda] = parlamentares.colunas;
            const id = await criarModelo(
                admin,
                'CasaCivil',
                corpo('Parlamentares', parlamentares, {
                    visibilidade_tipo: 'publico',
                    config: config(parlamentares, [
                        { coluna: segunda, label: 'Rótulo do modelo' },
                        { coluna: primeira },
                    ]),
                })
            );

            const entregue = await api(executor, { sistema: 'CasaCivil' }).get(`/api/relatorio-modelo/${id}/colunas`);
            assertStatus(entregue, 200);
            const arquivo = entregue.body.arquivos.find(
                (a: { arquivo: string }) => a.arquivo === parlamentares.arquivo
            );
            assert.deepEqual(
                arquivo.colunas.map((c: { name: string }) => c.name),
                [segunda, primeira]
            );
            assert.equal(arquivo.colunas[0].label, 'Rótulo do modelo');
            assert.notEqual(arquivo.colunas[0].label_original, 'Rótulo do modelo');
        });

        it('POST /:id/colunas com parâmetros responde 200 e descreve o modelo', async () => {
            const id = await criarModelo(
                admin,
                'CasaCivil',
                corpo('Parlamentares', parlamentares, { visibilidade_tipo: 'publico' })
            );
            const res = await api(admin, { sistema: 'CasaCivil' })
                .post(`/api/relatorio-modelo/${id}/colunas`)
                .send({ parametros: {} });
            assertStatus(res, 200);
            assert.ok(res.body.arquivos.some((a: { arquivo: string }) => a.arquivo === parlamentares.arquivo));
        });
    });
});
