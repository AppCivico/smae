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

// Só as rotas de leitura e atualização local são testadas: a sincronização com o TransfereGov é externa
describe('transfere-gov', () => {
    let leitor: Sessao;
    let editor: Sessao;
    let semPrivilegio: Sessao;
    const ANO = 2031;

    before(async () => {
        await bootApp();
        leitor = await criarPessoaComPrivilegios(['TransfereGov.listar']);
        editor = await criarPessoaComPrivilegios(['TransfereGov.atualizar']);
        semPrivilegio = await criarPessoaSemPrivilegios();
    });

    function criarComunicado(publicado_em: string, titulo = uniq('Comunicado')) {
        return prisma().comunicadoTransfereGov.create({
            data: {
                numero: Math.floor(Math.random() * 1e6),
                ano: ANO,
                titulo,
                link: 'http://transfere.invalido/e2e',
                publicado_em: new Date(publicado_em),
                tipo: 'Geral',
            },
        });
    }

    function criarOportunidade(
        dados: { avaliacao?: 'Selecionada' | 'NaoSeAplica' | null; incorporada?: boolean } = {}
    ) {
        return prisma().transfereGovOportunidade.create({
            data: {
                hash: uniq('hash'),
                tipo: 'Voluntaria',
                avaliacao: dados.avaliacao ?? null,
                transferencia_incorporada: dados.incorporada ?? false,
                id_programa: 987654321012n,
                natureza_juridica_programa: 'Pública',
                cod_programa: 1234567890123n,
                nome_programa: uniq('Programa'),
                sit_programa: 'Ativo',
                ano_disponibilizacao: ANO,
                modalidade_programa: 'Convênio',
                acao_orcamentaria: '0001',
            },
        });
    }

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await api().get('/api/transfere-gov/lista'), 401);
            assertStatus(await api().get('/api/transfere-gov/transferencia'), 401);
            assertStatus(await api().patch('/api/transfere-gov/transferencia/1').send({}), 401);
        });

        it('403 na listagem sem TransfereGov.listar', async () => {
            const res = await api(semPrivilegio).get('/api/transfere-gov/lista');
            assertStatus(res, 403);
            assert.match(res.body.message, /TransfereGov\.listar/);
        });

        it('403 na atualização sem TransfereGov.atualizar, mesmo podendo listar', async () => {
            const op = await criarOportunidade();
            const res = await api(leitor)
                .patch(`/api/transfere-gov/transferencia/${op.id}`)
                .send({ avaliacao: 'Selecionada' });
            assertStatus(res, 403);
            assert.match(res.body.message, /TransfereGov\.atualizar/);
        });
    });

    describe('validação', () => {
        it('400 com ipp acima de 1000', async () => {
            assertStatus(await api(leitor).get('/api/transfere-gov/lista?ipp=1001'), 400);
        });

        it('400 com token de próxima página inválido', async () => {
            const res = await api(leitor).get('/api/transfere-gov/lista?token_proxima_pagina=abc');
            assertStatus(res, 400);
            assert.match(res.body.message, /next_page_token is invalid/);
        });

        it('400 com avaliação fora do enum', async () => {
            const op = await criarOportunidade();
            assertStatus(
                await api(editor).patch(`/api/transfere-gov/transferencia/${op.id}`).send({ avaliacao: 'Talvez' }),
                400
            );
        });

        it('400 com data fora do formato YYYY-MM-DD', async () => {
            assertStatus(await api(leitor).get('/api/transfere-gov/lista?data_inicio=01/05/2031'), 400);
        });
    });

    describe('comunicados', () => {
        it('filtra por período de publicação', async () => {
            const dentro = await criarComunicado(`${ANO}-05-10T12:00:00Z`);
            const fora = await criarComunicado(`${ANO}-06-10T12:00:00Z`);

            const res = await api(leitor).get(
                `/api/transfere-gov/lista?data_inicio=${ANO}-05-01&data_fim=${ANO}-05-31`
            );
            assertStatus(res, 200);
            const ids = res.body.linhas.map((l: { id: number }) => l.id);
            assert.ok(ids.includes(dentro.id));
            assert.ok(!ids.includes(fora.id));
        });

        it('pagina com token de próxima página', async () => {
            const ano = 2032;
            const sufixo = uniq('pag');
            for (let i = 0; i < 3; i++) {
                await prisma().comunicadoTransfereGov.create({
                    data: {
                        numero: 500000 + i,
                        ano,
                        titulo: `${sufixo} ${i}`,
                        link: 'http://transfere.invalido/e2e',
                        publicado_em: new Date(`${ano}-01-1${i + 1}T12:00:00Z`),
                        tipo: 'Geral',
                    },
                });
            }

            const primeira = await api(leitor).get(
                `/api/transfere-gov/lista?data_inicio=${ano}-01-01&data_fim=${ano}-01-31&ipp=2`
            );
            assertStatus(primeira, 200);
            assert.equal(primeira.body.linhas.length, 2);
            assert.equal(primeira.body.tem_mais, true);
            assert.ok(primeira.body.token_proxima_pagina);

            const segunda = await api(leitor).get(
                `/api/transfere-gov/lista?data_inicio=${ano}-01-01&data_fim=${ano}-01-31&token_proxima_pagina=${encodeURIComponent(primeira.body.token_proxima_pagina)}`
            );
            assertStatus(segunda, 200);
            assert.equal(segunda.body.linhas.length, 1);
            assert.equal(segunda.body.tem_mais, false);
        });
    });

    describe('transferências', () => {
        it('lista oportunidades não incorporadas e serializa id_programa como texto', async () => {
            const visivel = await criarOportunidade();
            const incorporada = await criarOportunidade({ incorporada: true });

            const res = await api(leitor).get(`/api/transfere-gov/transferencia?ano=${ANO}&tipo=Voluntaria&ipp=1000`);
            assertStatus(res, 200);
            const ids = res.body.linhas.map((l: { id: number }) => l.id);
            assert.ok(ids.includes(visivel.id));
            assert.ok(!ids.includes(incorporada.id));

            const linha = res.body.linhas.find((l: { id: number }) => l.id === visivel.id);
            assert.equal(linha.id_programa, '987654321012');
            assert.equal(linha.avaliacao, null);
        });

        it('404 ao atualizar oportunidade inexistente', async () => {
            assertStatus(
                await api(editor).patch('/api/transfere-gov/transferencia/999999').send({ avaliacao: 'Selecionada' }),
                404
            );
        });

        it('atualiza a avaliação e o filtro por avaliação reflete a mudança', async () => {
            const op = await criarOportunidade();

            const atualizada = await api(editor)
                .patch(`/api/transfere-gov/transferencia/${op.id}`)
                .send({ avaliacao: 'Selecionada' });
            assertStatus(atualizada, 200);
            assert.equal(atualizada.body.avaliacao, 'Selecionada');

            const selecionadas = await api(leitor).get(
                `/api/transfere-gov/transferencia?ano=${ANO}&avaliacao=Selecionada&ipp=1000`
            );
            assert.ok(selecionadas.body.linhas.some((l: { id: number }) => l.id === op.id));

            const naoAvaliadas = await api(leitor).get(
                `/api/transfere-gov/transferencia?ano=${ANO}&avaliacao=NaoAvaliada&ipp=1000`
            );
            assert.ok(!naoAvaliadas.body.linhas.some((l: { id: number }) => l.id === op.id));
        });
    });
});
