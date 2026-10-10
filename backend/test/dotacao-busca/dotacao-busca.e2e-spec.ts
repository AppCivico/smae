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
} from '../lib';
import { anoUnico, criarCenarioOrcamento, DOTACAO } from '../meta-orcamento/fixtures';

describe('dotacao-busca', () => {
    let consulta: Sessao;
    let semPrivilegio: Sessao;

    before(async () => {
        await bootApp();
        // Menu.cc_consulta_geral é virtual: a sessão só ganha quando a pessoa tem CadastroTransferencia.administrador
        consulta = await criarPessoaComPrivilegios(['CadastroTransferencia.administrador']);
        semPrivilegio = await criarPessoaSemPrivilegios();
    });

    describe('autenticação e validação', () => {
        it('401 sem token', async () => {
            assertStatus(await api().get(`/api/dotacao-busca?query=${DOTACAO}`), 401);
        });

        it('403 sem Menu.cc_consulta_geral', async () => {
            assertStatus(await api(semPrivilegio).get(`/api/dotacao-busca?query=${DOTACAO}`), 403);
            const editor = await criarPessoaComPrivilegios(['CadastroTransferencia.editar']);
            const res = await api(editor).get(`/api/dotacao-busca?query=${DOTACAO}`);
            assertStatus(res, 403);
            assert.match(res.body.message, /Menu\.cc_consulta_geral/);
        });

        it('400 sem query', async () => {
            assertStatus(await api(consulta).get('/api/dotacao-busca'), 400);
        });

        it('400 com limit acima de 1000', async () => {
            assertStatus(await api(consulta).get(`/api/dotacao-busca?query=${DOTACAO}&limit=1001`), 400);
        });
    });

    describe('busca', () => {
        it('encontra a execução orçamentária da meta pela dotação completa e pela parte inicial', async () => {
            const { meta, pdm, ano } = await criarCenarioOrcamento(anoUnico());
            const realizado = await prisma().orcamentoRealizado.create({
                data: {
                    meta_id: meta.id,
                    ano_referencia: ano,
                    mes_utilizado: 12,
                    dotacao: DOTACAO,
                    soma_valor_empenho: 800,
                    soma_valor_liquidado: 300,
                    criado_por: consulta.pessoa.id,
                },
            });

            for (const query of [DOTACAO, '16.10.12']) {
                const res = await api(consulta).get(`/api/dotacao-busca?query=${query}&ano=${ano}`);
                assertStatus(res, 200);
                const achado = res.body.pdm_ps.find(
                    (l: { orcamento_realizado_id: number }) => l.orcamento_realizado_id === realizado.id
                );
                assert.ok(achado, `dotação ${query} deveria encontrar o registro`);
                assert.equal(achado.pdm_id, pdm.id);
                assert.equal(achado.meta_id, meta.id);
                assert.deepEqual(achado.dotacoes_encontradas, [DOTACAO]);
            }
        });

        it('não encontra registros de outro ano', async () => {
            const { meta, ano } = await criarCenarioOrcamento(anoUnico());
            const realizado = await prisma().orcamentoRealizado.create({
                data: {
                    meta_id: meta.id,
                    ano_referencia: ano,
                    mes_utilizado: 12,
                    dotacao: DOTACAO,
                    soma_valor_empenho: 1,
                    soma_valor_liquidado: 1,
                    criado_por: consulta.pessoa.id,
                },
            });

            const res = await api(consulta).get(`/api/dotacao-busca?query=${DOTACAO}&ano=${ano + 1}`);
            assertStatus(res, 200);
            assert.equal(
                res.body.pdm_ps.some(
                    (l: { orcamento_realizado_id: number }) => l.orcamento_realizado_id === realizado.id
                ),
                false
            );
        });
    });
});
