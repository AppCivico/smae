import { before, describe, it } from 'node:test';
import { api, assert, assertStatus, bootApp, criarPessoaSemPrivilegios, prisma, Sessao } from '../lib';
import { criarCenarioOrcamento, DOTACAO } from '../meta-orcamento/fixtures';

// Rotas que chamam o SOF (valor-realizado*, e valor-planejado sem cache) não são testadas além da validação
describe('dotacao', () => {
    let logado: Sessao;

    before(async () => {
        await bootApp();
        logado = await criarPessoaSemPrivilegios();
    });

    const rotas = [
        '/api/dotacao/valor-planejado',
        '/api/dotacao/valor-realizado',
        '/api/dotacao/valor-realizado-processo',
        '/api/dotacao/valor-realizado-nota-empenho',
    ];

    describe('autenticação', () => {
        it('401 sem token em todas as rotas', async () => {
            for (const rota of rotas) assertStatus(await api().patch(rota).send({}), 401);
        });

        it('não exige privilégio: qualquer sessão passa do guard e chega na validação', async () => {
            const res = await api(logado).patch('/api/dotacao/valor-planejado').send({ ano: 2012 });
            assertStatus(res, 400);
        });
    });

    describe('validação', () => {
        it('400 sem pdm_id nem portfolio_id', async () => {
            const res = await api(logado).patch('/api/dotacao/valor-planejado').send({ ano: 2012, dotacao: DOTACAO });
            assertStatus(res, 400);
            assert.match(res.body.message.join(' '), /pdm_id ou portfolio_id/);
        });

        it('400 com pdm_id e portfolio_id juntos', async () => {
            const res = await api(logado)
                .patch('/api/dotacao/valor-planejado')
                .send({ ano: 2012, dotacao: DOTACAO, pdm_id: 1, portfolio_id: 2 });
            assertStatus(res, 400);
        });

        it('400 com dotação fora do formato', async () => {
            const res = await api(logado)
                .patch('/api/dotacao/valor-planejado')
                .send({ ano: 2012, pdm_id: 1, dotacao: '16.10.12' });
            assertStatus(res, 400);
            assert.match(res.body.message.join(' '), /Dotação não está no formato esperado/);
        });

        it('400 com ano abaixo do mínimo', async () => {
            const res = await api(logado)
                .patch('/api/dotacao/valor-planejado')
                .send({ ano: 1999, pdm_id: 1, dotacao: DOTACAO });
            assertStatus(res, 400);
        });

        it('400 com processo que não é SEI nem SINPROC', async () => {
            const res = await api(logado)
                .patch('/api/dotacao/valor-realizado-processo')
                .send({ ano: 2012, pdm_id: 1, processo: '123' });
            assertStatus(res, 400);
            assert.match(res.body.message.join(' '), /Processo não está no formato esperado/);
        });

        it('400 com nota de empenho fora do formato 000000/AAAA', async () => {
            const res = await api(logado)
                .patch('/api/dotacao/valor-realizado-nota-empenho')
                .send({ ano: 2012, pdm_id: 1, nota_empenho: '12345' });
            assertStatus(res, 400);
            assert.match(res.body.message.join(' '), /Nota não está no formato esperado/);
        });
    });

    describe('valor planejado com cache', () => {
        it('devolve a dotação já sincronizada do banco, sem consultar o SOF', async () => {
            const { pdm } = await criarCenarioOrcamento();
            const ano = 2012;
            const dotacao = await prisma().dotacaoPlanejado.create({
                data: {
                    informacao_valida: true,
                    ano_referencia: ano,
                    mes_utilizado: 12,
                    dotacao: DOTACAO,
                    val_orcado_inicial: 5000,
                    val_orcado_atualizado: 4800.5,
                    saldo_disponivel: 3000,
                },
            });

            const res = await api(logado)
                .patch('/api/dotacao/valor-planejado')
                .send({ ano, pdm_id: pdm.id, dotacao: DOTACAO });
            assertStatus(res, 200);
            assert.equal(res.body.id, dotacao.id);
            assert.equal(res.body.informacao_valida, true);
            assert.equal(res.body.mes_utilizado, 12);
            assert.equal(res.body.val_orcado_inicial, '5000.00');
            assert.equal(res.body.val_orcado_atualizado, '4800.50');
            assert.equal(res.body.saldo_disponivel, '3000.00');
        });
    });
});
