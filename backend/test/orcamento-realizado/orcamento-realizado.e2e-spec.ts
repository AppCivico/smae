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
import {
    anoUnico,
    criarAdminOrcamento,
    criarCenarioOrcamento,
    criarDotacaoRealizada,
    DOTACAO,
} from '../meta-orcamento/fixtures';

describe('orcamento-realizado', () => {
    let admin: Sessao;
    let semPrivilegio: Sessao;

    before(async () => {
        await bootApp();
        admin = await criarAdminOrcamento();
        semPrivilegio = await criarPessoaSemPrivilegios();
    });

    const novoRealizado = (meta_id: number, ano_referencia: number, extra: Record<string, unknown> = {}) => ({
        meta_id,
        ano_referencia,
        dotacao: DOTACAO,
        itens: [{ mes: 12, valor_empenho: 800, valor_liquidado: 300 }],
        ...extra,
    });

    async function cenarioComDotacao(empenho = 1000, liquidado = 500) {
        const cenario = await criarCenarioOrcamento();
        await criarDotacaoRealizada(cenario.ano, { empenho, liquidado });
        return cenario;
    }

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await api().get('/api/orcamento-realizado?meta_id=1&ano_referencia=2030'), 401);
            assertStatus(await api().post('/api/orcamento-realizado').send({}), 401);
        });

        it('403 sem CadastroMeta.orcamento / PDM.tecnico_cp / PDM.admin_cp', async () => {
            const { meta, ano } = await cenarioComDotacao();
            assertStatus(
                await api(semPrivilegio).post('/api/orcamento-realizado').send(novoRealizado(meta.id, ano)),
                403
            );
            assertStatus(
                await api(semPrivilegio).get(`/api/orcamento-realizado?meta_id=${meta.id}&ano_referencia=${ano}`),
                403
            );
            assertStatus(await api(semPrivilegio).delete('/api/orcamento-realizado/em-lote').send({ ids: [] }), 403);
        });

        it('403 no cron de Plano Setorial sem SMAE.superadmin', async () => {
            const adminPs = await criarPessoaComPrivilegios(['CadastroPS.administrador']);
            assertStatus(await api(adminPs).post('/api/plano-setorial-orcamento-realizado/cron/executar'), 403);
        });
    });

    describe('plano setorial (sem smae-sistemas: _PS)', () => {
        it('cria e lista pela rota de Plano Setorial com CadastroPS.administrador', async () => {
            const cenario = await criarCenarioOrcamento(anoUnico(), 'PS');
            await criarDotacaoRealizada(cenario.ano, { empenho: 1000, liquidado: 500 });
            const adminPs = await criarPessoaComPrivilegios(['CadastroPS.administrador']);

            const criado = await api(adminPs)
                .post('/api/plano-setorial-orcamento-realizado')
                .send(novoRealizado(cenario.meta.id, cenario.ano));
            assertStatus(criado, 201);

            const lista = await api(adminPs).get(
                `/api/plano-setorial-orcamento-realizado?meta_id=${cenario.meta.id}&ano_referencia=${cenario.ano}`
            );
            assertStatus(lista, 200);
            assert.equal(lista.body.linhas.length, 1);
            assert.equal(lista.body.linhas[0].id, criado.body.id);
        });
    });

    describe('validação', () => {
        it('400 com itens vazio', async () => {
            const { meta, ano } = await cenarioComDotacao();
            const res = await api(admin)
                .post('/api/orcamento-realizado')
                .send(novoRealizado(meta.id, ano, { itens: [] }));
            assertStatus(res, 400);
        });

        it('400 com mês fora de 1 a 12', async () => {
            const { meta, ano } = await cenarioComDotacao();
            const res = await api(admin)
                .post('/api/orcamento-realizado')
                .send(novoRealizado(meta.id, ano, { itens: [{ mes: 13, valor_empenho: 1, valor_liquidado: 1 }] }));
            assertStatus(res, 400);
            assert.match(res.body.message.join(' '), /Mês informado precisa ser entre 1 e 12/);
        });

        it('400 com dotação fora do formato', async () => {
            const { meta, ano } = await cenarioComDotacao();
            assertStatus(
                await api(admin)
                    .post('/api/orcamento-realizado')
                    .send(novoRealizado(meta.id, ano, { dotacao: '1.2' })),
                400
            );
        });

        it('400 com percentual acima de 100', async () => {
            const { meta, ano } = await cenarioComDotacao();
            const res = await api(admin)
                .post('/api/orcamento-realizado')
                .send(
                    novoRealizado(meta.id, ano, {
                        itens: [{ mes: 12, valor_empenho: 1, valor_liquidado: 1, percentual_empenho: 101 }],
                    })
                );
            assertStatus(res, 400);
        });

        it('400 na listagem sem meta_id', async () => {
            assertStatus(await api(admin).get('/api/orcamento-realizado?ano_referencia=2030'), 400);
        });
    });

    describe('regras de negócio', () => {
        it('400 quando a dotação não existe no SOF importado para o ano', async () => {
            const { meta, ano } = await criarCenarioOrcamento();
            const res = await api(admin).post('/api/orcamento-realizado').send(novoRealizado(meta.id, ano));
            assertStatus(res, 400);
            assert.match(res.body.message, /Dotação não foi foi encontrado no banco de dados/);
        });

        it('400 quando o ano não está com a execução liberada', async () => {
            const { meta, pdm, ano } = await cenarioComDotacao();
            await prisma().pdmOrcamentoConfig.updateMany({
                where: { pdm_id: pdm.id, ano_referencia: ano },
                data: { execucao_disponivel: false },
            });
            const res = await api(admin).post('/api/orcamento-realizado').send(novoRealizado(meta.id, ano));
            assertStatus(res, 400);
            assert.match(res.body.message, /não está com a execução liberada/);
        });

        it('400 quando o liquidado é maior que o empenho', async () => {
            const { meta, ano } = await cenarioComDotacao();
            const res = await api(admin)
                .post('/api/orcamento-realizado')
                .send(novoRealizado(meta.id, ano, { itens: [{ mes: 12, valor_empenho: 100, valor_liquidado: 300 }] }));
            assertStatus(res, 400);
            assert.match(res.body.message, /liquidado não pode ser maior do que valor empenhado/);
        });

        it('400 quando o percentual informado não confere com o valor do SOF', async () => {
            const { meta, ano } = await cenarioComDotacao(1000, 500);
            const res = await api(admin)
                .post('/api/orcamento-realizado')
                .send(
                    novoRealizado(meta.id, ano, {
                        itens: [{ mes: 12, valor_empenho: 800, valor_liquidado: 300, percentual_empenho: 50 }],
                    })
                );
            assertStatus(res, 400);
            assert.match(res.body.message, /não confere com valor esperado/);
        });

        it('cria, lista e remove um registro de execução', async () => {
            const { meta, ano } = await cenarioComDotacao();

            const criado = await api(admin).post('/api/orcamento-realizado').send(novoRealizado(meta.id, ano));
            assertStatus(criado, 201);

            const lista = await api(admin).get(`/api/orcamento-realizado?meta_id=${meta.id}&ano_referencia=${ano}`);
            assertStatus(lista, 200);
            assert.equal(lista.body.linhas.length, 1);
            assert.equal(lista.body.linhas[0].id, criado.body.id);
            assert.equal(lista.body.linhas[0].dotacao, DOTACAO);
            assert.equal(lista.body.linhas[0].soma_valor_empenho, '800.00');
            assert.equal(lista.body.linhas[0].smae_soma_valor_empenho, '800.00');
            assert.equal(lista.body.linhas[0].itens[0].valor_liquidado, '300.00');

            assertStatus(await api(admin).delete(`/api/orcamento-realizado/${criado.body.id}`), 202);
            const depois = await api(admin).get(`/api/orcamento-realizado?meta_id=${meta.id}&ano_referencia=${ano}`);
            assert.equal(depois.body.linhas.length, 0);
        });

        it('400 quando as metas do PDM somam mais empenho que o SOF e a segunda não é gravada', async () => {
            const { meta, pdm, ano } = await cenarioComDotacao(1000, 500);
            const outraMeta = await prisma().meta.create({
                data: { pdm_id: pdm.id, status: 'Ativo', codigo: uniq('MET'), titulo: uniq('Meta') },
            });

            const primeira = await api(admin)
                .post('/api/orcamento-realizado')
                .send(novoRealizado(meta.id, ano, { itens: [{ mes: 12, valor_empenho: 600, valor_liquidado: 100 }] }));
            assertStatus(primeira, 201);

            const estourada = await api(admin)
                .post('/api/orcamento-realizado')
                .send(
                    novoRealizado(outraMeta.id, ano, { itens: [{ mes: 12, valor_empenho: 600, valor_liquidado: 100 }] })
                );
            assertStatus(estourada, 400);
            assert.match(estourada.body.message, /excede o total do empenho no SOF/);

            const naOutra = await api(admin).get(
                `/api/orcamento-realizado?meta_id=${outraMeta.id}&ano_referencia=${ano}`
            );
            assert.equal(naOutra.body.linhas.length, 0);
        });

        it('400 ao duplicar a dotação na mesma meta e ano', async () => {
            const { meta, ano } = await cenarioComDotacao();
            assertStatus(await api(admin).post('/api/orcamento-realizado').send(novoRealizado(meta.id, ano)), 201);

            const duplicado = await api(admin).post('/api/orcamento-realizado').send(novoRealizado(meta.id, ano));
            assertStatus(duplicado, 400);
            assert.match(duplicado.body.message, /Já existe um registro com a mesma dotação/);
        });

        it('edita os itens e recalcula a soma do registro', async () => {
            const { meta, ano } = await cenarioComDotacao();
            const criado = await api(admin).post('/api/orcamento-realizado').send(novoRealizado(meta.id, ano));
            assertStatus(criado, 201);

            const editado = await api(admin)
                .patch(`/api/orcamento-realizado/${criado.body.id}`)
                .send({ meta_id: meta.id, itens: [{ mes: 12, valor_empenho: 600, valor_liquidado: 200 }] });
            assertStatus(editado, 200);

            const lista = await api(admin).get(`/api/orcamento-realizado?meta_id=${meta.id}&ano_referencia=${ano}`);
            assert.equal(lista.body.linhas.length, 1);
            assert.equal(lista.body.linhas[0].soma_valor_empenho, '600.00');
            assert.equal(lista.body.linhas[0].soma_valor_liquidado, '200.00');
        });

        it('remove em lote e rejeita lote acima do limite', async () => {
            const { meta, ano } = await cenarioComDotacao();
            const a = await api(admin).post('/api/orcamento-realizado').send(novoRealizado(meta.id, ano));
            assertStatus(a, 201);

            const grande = Array.from({ length: 11 }, (_, i) => ({ id: 900000 + i }));
            const excedeu = await api(admin).delete('/api/orcamento-realizado/em-lote').send({ ids: grande });
            assertStatus(excedeu, 400);
            assert.match(excedeu.body.message, /Máximo permitido é de/);

            assertStatus(
                await api(admin)
                    .delete('/api/orcamento-realizado/em-lote')
                    .send({ ids: [{ id: a.body.id }] }),
                202
            );
            const lista = await api(admin).get(`/api/orcamento-realizado?meta_id=${meta.id}&ano_referencia=${ano}`);
            assert.equal(lista.body.linhas.length, 0);
        });

        it('compartilhados-no-pdm exige a dotação e lista as metas que usam a dotação', async () => {
            const { meta, pdm, ano } = await cenarioComDotacao();
            const semDotacao = await api(admin).get(
                `/api/orcamento-realizado/compartilhados-no-pdm?pdm_id=${pdm.id}&ano_referencia=${ano}`
            );
            assertStatus(semDotacao, 400);
            assert.match(semDotacao.body.message, /É necessário enviar a dotação/);

            const criado = await api(admin).post('/api/orcamento-realizado').send(novoRealizado(meta.id, ano));
            assertStatus(criado, 201);

            const compartilhados = await api(admin).get(
                `/api/orcamento-realizado/compartilhados-no-pdm?pdm_id=${pdm.id}&ano_referencia=${ano}&dotacao=${DOTACAO}`
            );
            assertStatus(compartilhados, 200);
            assert.ok(compartilhados.body.linhas.some((l: { id: number }) => l.id === criado.body.id));
        });
    });
});
