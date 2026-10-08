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

const SISTEMA_PP = 'Projetos' as const;
const SISTEMA_MDO = 'MDO' as const;

describe('atualizacao-em-lote', () => {
    let admin: Sessao;
    let adminOutroOrgao: Sessao;
    let soListaBase: Sessao;
    let semPrivilegio: Sessao;

    before(async () => {
        await bootApp();
        admin = await criarPessoaComPrivilegios(['SMAE.AtualizacaoEmLote', 'Projeto.administrador']);
        adminOutroOrgao = await criarPessoaComPrivilegios(
            ['SMAE.AtualizacaoEmLote', 'Projeto.administrador_no_orgao'],
            {
                orgao_id: (await criarOrgao()).id,
            }
        );
        soListaBase = await criarPessoaComPrivilegios(['SMAE.AtualizacaoEmLote']);
        semPrivilegio = await criarPessoaSemPrivilegios();
    });

    const novaAtualizacao = (extra: Record<string, unknown> = {}) => ({
        tipo: 'ProjetoPP',
        ids: [910001, 910002],
        ops: [{ col: 'objetivo', tipo_operacao: 'Set', valor: uniq('Objetivo') }],
        ...extra,
    });

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await api().get('/api/atualizacao-em-lote').query({ tipo: 'ProjetoPP' }), 401);
            assertStatus(await api().post('/api/atualizacao-em-lote').send(novaAtualizacao()), 401);
        });

        it('403 sem privilégio de atualização em lote (tabela @Roles)', async () => {
            const res = await api(semPrivilegio, { sistema: SISTEMA_PP })
                .post('/api/atualizacao-em-lote')
                .send(novaAtualizacao());
            assertStatus(res, 403);
        });

        it('400 quando o privilégio de módulo existe, mas não o do tipo (ProjetoPP)', async () => {
            const lista = await api(soListaBase, { sistema: SISTEMA_PP })
                .get('/api/atualizacao-em-lote')
                .query({ tipo: 'ProjetoPP' });
            assertStatus(lista, 400);
            assert.match(lista.body.message, /sem permissão para acessar atualizações em lote do tipo ProjetoPP/);

            const cria = await api(soListaBase, { sistema: SISTEMA_PP })
                .post('/api/atualizacao-em-lote')
                .send(novaAtualizacao());
            assertStatus(cria, 400);
            assert.match(cria.body.message, /sem permissão para acessar atualizações em lote do tipo ProjetoPP/);
        });

        it('400 sem smae-sistemas: o endpoint exige um único sistema', async () => {
            const cria = await api(admin).post('/api/atualizacao-em-lote').send(novaAtualizacao());
            assertStatus(cria, 400);
            assert.match(cria.body.message, /foi enviando mais de um sistema/);

            const lista = await api(admin).get('/api/atualizacao-em-lote').query({ tipo: 'ProjetoPP' });
            assertStatus(lista, 400);
            assert.match(lista.body.message, /foi enviando mais de um sistema/);
        });

        it('400 para tipo ProjetoMDO sem Projeto/ProjetoMDO administrador', async () => {
            const res = await api(soListaBase, { sistema: SISTEMA_MDO })
                .get('/api/atualizacao-em-lote')
                .query({ tipo: 'ProjetoMDO' });
            assertStatus(res, 400);
        });
    });

    describe('validação', () => {
        const cliente = () => api(admin, { sistema: SISTEMA_PP });

        it('400 na listagem sem tipo, com tipo desconhecido ou com ipp acima de 500', async () => {
            assertStatus(await cliente().get('/api/atualizacao-em-lote'), 400);
            assertStatus(await cliente().get('/api/atualizacao-em-lote').query({ tipo: 'Inexistente' }), 400);
            assertStatus(await cliente().get('/api/atualizacao-em-lote').query({ tipo: 'ProjetoPP', ipp: 501 }), 400);
        });

        it('400 com ids vazios', async () => {
            assertStatus(
                await cliente()
                    .post('/api/atualizacao-em-lote')
                    .send(novaAtualizacao({ ids: [] })),
                400
            );
        });

        it('400 com ids não inteiros', async () => {
            assertStatus(
                await cliente()
                    .post('/api/atualizacao-em-lote')
                    .send(novaAtualizacao({ ids: ['x'] })),
                400
            );
        });

        it('400 com coluna fora de Projeto', async () => {
            const res = await cliente()
                .post('/api/atualizacao-em-lote')
                .send(novaAtualizacao({ ops: [{ col: 'coluna_inexistente', tipo_operacao: 'Set', valor: 'x' }] }));
            assertStatus(res, 400);
        });

        it('400 com valor de tipo errado para a coluna', async () => {
            const res = await cliente()
                .post('/api/atualizacao-em-lote')
                .send(
                    novaAtualizacao({ ops: [{ col: 'grupo_portfolio', tipo_operacao: 'Set', valor: 'nao-e-lista' }] })
                );
            assertStatus(res, 400);
            assert.match(String(res.body.message), /Operação na coluna "grupo_portfolio" inválida/);
        });

        it('400 com dois Substituir na mesma coluna', async () => {
            const res = await cliente()
                .post('/api/atualizacao-em-lote')
                .send(
                    novaAtualizacao({
                        ops: [
                            { col: 'objetivo', tipo_operacao: 'Set', valor: 'a' },
                            { col: 'objetivo', tipo_operacao: 'Set', valor: 'b' },
                        ],
                    })
                );
            assertStatus(res, 400);
            assert.match(String(res.body.message), /duplicada/);
        });
    });

    describe('criação e consulta', () => {
        const cliente = () => api(admin, { sistema: SISTEMA_PP });

        it('cria em status Pendente e devolve o detalhe com os IDs alvo', async () => {
            const ops = [{ col: 'objetivo', tipo_operacao: 'Set', valor: uniq('Objetivo novo') }];
            const ids = [910010, 910011, 910012];
            const criado = await cliente().post('/api/atualizacao-em-lote').send({ tipo: 'ProjetoPP', ids, ops });
            assertStatus(criado, 201);
            const id: number = criado.body.id;

            const detalhe = await cliente().get(`/api/atualizacao-em-lote/${id}`);
            assertStatus(detalhe, 200);
            assert.equal(detalhe.body.id, id);
            assert.equal(detalhe.body.tipo, 'ProjetoPP');
            assert.equal(detalhe.body.status, 'Pendente');
            assert.equal(detalhe.body.modulo_sistema, SISTEMA_PP);
            assert.equal(detalhe.body.n_total, ids.length);
            assert.equal(detalhe.body.n_sucesso, 0);
            assert.deepEqual(detalhe.body.target_ids, ids);
            assert.deepEqual(detalhe.body.operacao, ops);
            assert.equal(detalhe.body.operacao_processada.items[0].col, 'objetivo');
            assert.equal(detalhe.body.operacao_processada.items[0].tipo_operacao, 'Set');
            assert.equal(detalhe.body.criador.id, admin.pessoa.id);
            assert.equal(detalhe.body.orgao.id, admin.pessoa.orgao_id);
        });

        it('a listagem por tipo inclui a atualização criada, com paginação', async () => {
            const ids: number[] = [];
            for (let i = 0; i < 3; i++) {
                const criado = await cliente()
                    .post('/api/atualizacao-em-lote')
                    .send(novaAtualizacao({ ids: [920000 + i] }));
                assertStatus(criado, 201);
                ids.push(criado.body.id);
            }

            const primeira = await cliente().get('/api/atualizacao-em-lote').query({ tipo: 'ProjetoPP', ipp: 2 });
            assertStatus(primeira, 200);
            assert.equal(primeira.body.linhas.length, 2);
            assert.equal(primeira.body.tem_mais, true);
            assert.equal(typeof primeira.body.token_paginacao, 'string');
            assert.equal(primeira.body.total_registros >= 3, true);

            const segunda = await cliente()
                .get('/api/atualizacao-em-lote')
                .query({ tipo: 'ProjetoPP', ipp: 2, token_proxima_pagina: primeira.body.token_paginacao });
            assertStatus(segunda, 200);
            assert.equal(segunda.body.pagina_corrente, 2);

            const vistos: number[] = [...primeira.body.linhas, ...segunda.body.linhas].map((l: { id: number }) => l.id);
            assert.equal(new Set(vistos).size, vistos.length);
            assert.ok(
                ids.every((i) => vistos.includes(i)),
                'as três criadas por último são as primeiras da listagem'
            );
        });

        it('filtra por status e não devolve atualizações de outro tipo', async () => {
            const res = await cliente()
                .get('/api/atualizacao-em-lote')
                .query({ tipo: 'ProjetoPP', status: 'Concluido' });
            assertStatus(res, 200);
            assert.equal(res.body.total_registros, 0);
        });

        it('400 ao ver atualização de outro órgão (administrador no órgão)', async () => {
            const criado = await cliente().post('/api/atualizacao-em-lote').send(novaAtualizacao());
            assertStatus(criado, 201);

            const outro = await api(adminOutroOrgao, { sistema: SISTEMA_PP }).get(
                `/api/atualizacao-em-lote/${criado.body.id}`
            );
            assertStatus(outro, 400);
            assert.match(outro.body.message, /órgão diferente/);

            const listaOutroOrgao = await api(adminOutroOrgao, { sistema: SISTEMA_PP })
                .get('/api/atualizacao-em-lote')
                .query({ tipo: 'ProjetoPP' });
            assertStatus(listaOutroOrgao, 200);
            assert.equal(
                listaOutroOrgao.body.linhas.some((l: { id: number }) => l.id === criado.body.id),
                false
            );
        });

        it('404 para id inexistente', async () => {
            assertStatus(await cliente().get('/api/atualizacao-em-lote/999999'), 404);
        });
    });
});
