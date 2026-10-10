import { before, describe, it } from 'node:test';
import {
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
import {
    cancelarDistribuicao,
    casaCivil,
    completarTransferencia,
    criarDistribuicao,
    criarParlamentar,
    criarTransferencia,
    criarTransferenciaComOrcamento as transferenciaComOrcamento,
    distribuicaoInicial,
    vincularParlamentar,
} from '../_helpers';

describe('distribuicao-recurso', () => {
    let gestor: Sessao;
    let gestorPerfil: Sessao;
    let semPrivilegio: Sessao;
    let orgaoOutro: number;

    before(async () => {
        await bootApp();
        gestor = await criarPessoaComPrivilegios([
            'CadastroTransferencia.inserir',
            'CadastroTransferencia.listar',
            'CadastroTransferencia.editar',
            'CadastroTransferencia.remover',
            'CadastroDistribuicaoStatus.inserir',
        ]);
        // SMAE.PerfilGestorDistribuicaoRecurso é virtual: vem de SMAE.CadastroDistribuicaoSolicitacaoAjuste.inserir (sem .administrador)
        gestorPerfil = await criarPessoaComPrivilegios([
            'SMAE.CadastroDistribuicaoSolicitacaoAjuste.inserir',
            'CadastroTransferencia.listar',
            'CadastroTransferencia.remover',
        ]);
        semPrivilegio = await criarPessoaSemPrivilegios();
        orgaoOutro = (await criarOrgao()).id;
    });

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await casaCivil().post('/api/distribuicao-recurso').send({}), 401);
            assertStatus(await casaCivil().get('/api/distribuicao-recurso/1'), 401);
            assertStatus(await casaCivil().patch('/api/distribuicao-recurso/1').send({}), 401);
            assertStatus(await casaCivil().delete('/api/distribuicao-recurso/1'), 401);
        });

        it('403 sem CadastroTransferencia.inserir / listar / editar / remover', async () => {
            const criar = await casaCivil(semPrivilegio).post('/api/distribuicao-recurso').send({});
            assertStatus(criar, 403);
            assert.match(criar.body.message, /CadastroTransferencia\.inserir/);

            const { id } = await transferenciaComOrcamento(gestor);
            assertStatus(await casaCivil(semPrivilegio).get(`/api/distribuicao-recurso/${id}`), 403);
            assertStatus(await casaCivil(semPrivilegio).patch(`/api/distribuicao-recurso/${id}`).send({}), 403);
            assertStatus(await casaCivil(semPrivilegio).delete(`/api/distribuicao-recurso/${id}`), 403);
        });

        it('listagem não exige privilégio específico', async () => {
            const res = await casaCivil(semPrivilegio).get('/api/distribuicao-recurso');
            assertStatus(res, 200);
            assert.ok(Array.isArray(res.body.linhas));
        });

        it('perfil gestor de distribuição não acessa distribuição de outro órgão', async () => {
            const { id } = await transferenciaComOrcamento(gestor, orgaoOutro);
            const distribuicao = (await distribuicaoInicial(id)).id;

            const leitura = await casaCivil(gestorPerfil).get(`/api/distribuicao-recurso/${distribuicao}`);
            assertStatus(leitura, 403);
            assert.match(leitura.body.message, /permissão para acessar/);

            const remocao = await casaCivil(gestorPerfil).delete(`/api/distribuicao-recurso/${distribuicao}`);
            assertStatus(remocao, 403);
            assert.match(remocao.body.message, /permissão para remover/);
        });

        it('perfil gestor acessa distribuição do próprio órgão', async () => {
            const { inicial } = await transferenciaComOrcamento(gestor, 1);
            assertStatus(await casaCivil(gestorPerfil).get(`/api/distribuicao-recurso/${inicial.id}`), 200);
        });
    });

    describe('validação', () => {
        it('400 com corpo vazio', async () => {
            assertStatus(await casaCivil(gestor).post('/api/distribuicao-recurso').send({}), 400);
        });

        it('400 quando valores monetários não são string', async () => {
            const { id } = await transferenciaComOrcamento(gestor);
            await cancelarDistribuicao(gestor, (await distribuicaoInicial(id)).id);
            assertStatus(await criarDistribuicao(gestor, id, { custeio: 100, investimento: 0, contrapartida: 0 }, { valor: 100 }), 400);
        });

        it('400 quando repasse diferente de custeio + investimento', async () => {
            const { id } = await transferenciaComOrcamento(gestor);
            const res = await criarDistribuicao(gestor, id, { custeio: 100, investimento: 0, contrapartida: 0 }, { valor: '999.00' });
            assertStatus(res, 400);
            assert.match(res.body.message, /Valor do repasse deve ser a soma/);
        });

        it('400 quando valor total diferente de repasse + contrapartida', async () => {
            const { id } = await transferenciaComOrcamento(gestor);
            const res = await criarDistribuicao(gestor, id, { custeio: 100, investimento: 0, contrapartida: 0 }, { valor_total: '999.00' });
            assertStatus(res, 400);
            assert.match(res.body.message, /Valor total deve ser a soma/);
        });

        it('400 com órgão gestor ou transferência inexistentes', async () => {
            const { id } = await transferenciaComOrcamento(gestor);
            const semOrgao = await criarDistribuicao(gestor, id, { custeio: 1, investimento: 0, contrapartida: 0 }, { orgao_gestor_id: 999999 });
            assertStatus(semOrgao, 400);
            assert.match(semOrgao.body.message, /Órgão gestor inválido/);

            const semTransf = await criarDistribuicao(gestor, 999999, { custeio: 1, investimento: 0, contrapartida: 0 });
            assertStatus(semTransf, 400);
            assert.match(semTransf.body.message, /Transferência não encontrada/);
        });

        it('400 com processo SEI repetido na mesma distribuição', async () => {
            const { id } = await transferenciaComOrcamento(gestor);
            const sei = '00000.000001/2026-00';
            const res = await criarDistribuicao(
                gestor,
                id,
                { custeio: 1, investimento: 0, contrapartida: 0 },
                { registros_sei: [{ processo_sei: sei }, { processo_sei: sei }] }
            );
            assertStatus(res, 400);
            assert.match(res.body.message, /Processo SEI duplicado/);
        });

        it('400 com nome igual ou semelhante na mesma transferência', async () => {
            const { id } = await transferenciaComOrcamento(gestor);
            await cancelarDistribuicao(gestor, (await distribuicaoInicial(id)).id);
            const nome = uniq('Nome repetido');
            assertStatus(await criarDistribuicao(gestor, id, { custeio: 10, investimento: 0, contrapartida: 0 }, { nome }), 201);
            const repetido = await criarDistribuicao(gestor, id, { custeio: 10, investimento: 0, contrapartida: 0 }, { nome });
            assertStatus(repetido, 400);
            assert.match(repetido.body.message, /Nome de distribuição, igual ou semelhante/);
        });
    });

    describe('limites na criação', () => {
        it('400 quando a soma de custeio passa do custeio da transferência (distribuição inicial contabilizada)', async () => {
            const { id } = await transferenciaComOrcamento(gestor);
            const res = await criarDistribuicao(gestor, id, { custeio: 600, investimento: 0, contrapartida: 0 });
            assertStatus(res, 400);
            assert.match(res.body.message, /Soma de custeio de todas as distribuições/);
        });

        it('201 quando a distribuição inicial foi cancelada e libera o limite', async () => {
            const { id, inicial } = await transferenciaComOrcamento(gestor);
            await cancelarDistribuicao(gestor, inicial.id);
            assertStatus(await criarDistribuicao(gestor, id, { custeio: 1000, investimento: 500, contrapartida: 100 }), 201);
        });

        it('400 quando distribuição sem status ainda conta no limite', async () => {
            const { id, inicial } = await transferenciaComOrcamento(gestor);
            await prisma().distribuicaoRecursoStatus.deleteMany({ where: { distribuicao_id: inicial.id } });
            const res = await criarDistribuicao(gestor, id, { custeio: 600, investimento: 0, contrapartida: 0 });
            assertStatus(res, 400);
            assert.match(res.body.message, /Soma de custeio/);
        });
    });

    describe('valor de parlamentar', () => {
        it('valida vínculo, soma do repasse e limite por parlamentar', async () => {
            const id = await criarTransferencia(gestor);
            const parlamentar = await criarParlamentar();
            const outro = await criarParlamentar();
            assertStatus(await vincularParlamentar(gestor, id, parlamentar.id), 200);
            const linha = await prisma().transferenciaParlamentar.findFirstOrThrow({
                where: { transferencia_id: id, parlamentar_id: parlamentar.id },
            });
            assertStatus(
                await completarTransferencia(gestor, id, { custeio: 1000, investimento: 500, contrapartida: 100 }, {
                    parlamentares: [{ id: linha.id, parlamentar_id: parlamentar.id, valor: '800.00' }],
                }),
                200
            );
            await cancelarDistribuicao(gestor, (await distribuicaoInicial(id)).id);

            const naoVinculado = await criarDistribuicao(gestor, id, { custeio: 100, investimento: 0, contrapartida: 0 }, {
                parlamentares: [{ parlamentar_id: outro.id, valor: '50.00' }],
            });
            assertStatus(naoVinculado, 400);
            assert.match(naoVinculado.body.message, /não encontrado\(s\) na transferência/);

            const acimaDoRepasse = await criarDistribuicao(gestor, id, { custeio: 100, investimento: 0, contrapartida: 0 }, {
                parlamentares: [{ parlamentar_id: parlamentar.id, valor: '200.00' }],
            });
            assertStatus(acimaDoRepasse, 400);
            assert.match(acimaDoRepasse.body.message, /não pode superar o valor de repasse da distribuição/);

            const primeira = await criarDistribuicao(gestor, id, { custeio: 500, investimento: 0, contrapartida: 0 }, {
                parlamentares: [{ parlamentar_id: parlamentar.id, valor: '500.00' }],
            });
            assertStatus(primeira, 201);
            const valorLinha = await prisma().distribuicaoParlamentar.findFirstOrThrow({
                where: { distribuicao_recurso_id: primeira.body.id, parlamentar_id: parlamentar.id },
            });
            assert.equal(Number(valorLinha.valor), 500);

            const estourou = await criarDistribuicao(gestor, id, { custeio: 400, investimento: 0, contrapartida: 0 }, {
                parlamentares: [{ parlamentar_id: parlamentar.id, valor: '400.00' }],
            });
            assertStatus(estourou, 400);
            assert.match(estourou.body.message, /soma dos valores do parlamentar em todas as distruições/);
        });
    });

    describe('CRUD', () => {
        it('cria, busca, lista pela transferência, edita e remove', async () => {
            const { id, inicial } = await transferenciaComOrcamento(gestor);
            await cancelarDistribuicao(gestor, inicial.id);

            const objeto = uniq('objeto distribuição');
            const criada = await criarDistribuicao(gestor, id, { custeio: 600, investimento: 0, contrapartida: 0 }, { objeto });
            assertStatus(criada, 201);
            const distribuicao: number = criada.body.id;

            const detalhe = await casaCivil(gestor).get(`/api/distribuicao-recurso/${distribuicao}`);
            assertStatus(detalhe, 200);
            assert.equal(detalhe.body.objeto, objeto);
            assert.equal(Number(detalhe.body.custeio), 600);

            const lista = await casaCivil(gestor).get(`/api/distribuicao-recurso?transferencia_id=${id}`);
            assertStatus(lista, 200);
            assert.ok(lista.body.linhas.some((l: { id: number }) => l.id === distribuicao));

            const novoObjeto = uniq('objeto editado');
            assertStatus(await casaCivil(gestor).patch(`/api/distribuicao-recurso/${distribuicao}`).send({ objeto: novoObjeto }), 200);
            assert.equal((await casaCivil(gestor).get(`/api/distribuicao-recurso/${distribuicao}`)).body.objeto, novoObjeto);

            assertStatus(await casaCivil(gestor).delete(`/api/distribuicao-recurso/${distribuicao}`), 202);
            const removida = await prisma().distribuicaoRecurso.findUniqueOrThrow({ where: { id: distribuicao } });
            assert.ok(removida.removido_em);
        });

        it('400 com :id não numérico', async () => {
            assertStatus(await casaCivil(gestor).get('/api/distribuicao-recurso/abc'), 400);
        });

        it('404 ao buscar distribuição inexistente', async () => {
            assertStatus(await casaCivil(gestor).get('/api/distribuicao-recurso/999999'), 404);
        });
    });

    describe('limites na edição', () => {
        it('PATCH que estoura o custeio da transferência responde 400, e a soma passa a valer para novas criações', async () => {
            const { id, inicial } = await transferenciaComOrcamento(gestor);
            await cancelarDistribuicao(gestor, inicial.id);
            const d1 = await criarDistribuicao(gestor, id, { custeio: 400, investimento: 0, contrapartida: 0 });
            assertStatus(d1, 201);

            const subir = await casaCivil(gestor)
                .patch(`/api/distribuicao-recurso/${d1.body.id}`)
                .send({ custeio: '1200.00', valor: '1200.00', valor_total: '1200.00' });
            assertStatus(subir, 400);
            assert.match(subir.body.message, /Soma de custeio de todas as distribuições/);

            assertStatus(
                await casaCivil(gestor)
                    .patch(`/api/distribuicao-recurso/${d1.body.id}`)
                    .send({ custeio: '700.00', valor: '700.00', valor_total: '700.00' }),
                200
            );
            const depois = await criarDistribuicao(gestor, id, { custeio: 400, investimento: 0, contrapartida: 0 });
            assertStatus(depois, 400);
            assert.match(depois.body.message, /Soma de custeio/);
        });
    });
});
