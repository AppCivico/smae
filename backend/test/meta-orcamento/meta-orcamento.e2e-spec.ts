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
import { anoUnico, criarAdminOrcamento, criarCenarioOrcamento, DOTACAO } from './fixtures';

describe('meta-orcamento', () => {
    let admin: Sessao;
    let semPrivilegio: Sessao;

    before(async () => {
        await bootApp();
        admin = await criarAdminOrcamento();
        semPrivilegio = await criarPessoaSemPrivilegios();
    });

    const novoPrevisto = (meta_id: number, ano_referencia: number, extra: Record<string, unknown> = {}) => ({
        meta_id,
        ano_referencia,
        custo_previsto: 1500.5,
        parte_dotacao: DOTACAO,
        ...extra,
    });

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await api().get('/api/meta-orcamento?meta_id=1&ano_referencia=2030'), 401);
            assertStatus(await api().post('/api/meta-orcamento').send({}), 401);
        });

        it('403 sem CadastroMeta.orcamento / PDM.tecnico_cp / PDM.admin_cp', async () => {
            const { meta, ano } = await criarCenarioOrcamento();
            const dados = novoPrevisto(meta.id, ano);
            assertStatus(await api(semPrivilegio).post('/api/meta-orcamento').send(dados), 403);
            assertStatus(
                await api(semPrivilegio).get(`/api/meta-orcamento?meta_id=${meta.id}&ano_referencia=${ano}`),
                403
            );
        });
    });

    describe('rotas alternativas', () => {
        it('orcamento-previsto é alias de meta-orcamento', async () => {
            const { meta, ano } = await criarCenarioOrcamento();
            const criado = await api(admin).post('/api/orcamento-previsto').send(novoPrevisto(meta.id, ano));
            assertStatus(criado, 201);

            const lista = await api(admin).get(`/api/orcamento-previsto?meta_id=${meta.id}&ano_referencia=${ano}`);
            assertStatus(lista, 200);
            assert.equal(lista.body.linhas[0].id, criado.body.id);
        });

        it('plano setorial exige CadastroPS.administrador (sem smae-sistemas: _PS)', async () => {
            const { meta, ano } = await criarCenarioOrcamento(anoUnico(), 'PS');
            const soMeta = await criarPessoaComPrivilegios(['CadastroMeta.orcamento']);
            assertStatus(
                await api(soMeta).post('/api/plano-setorial-orcamento-previsto').send(novoPrevisto(meta.id, ano)),
                403
            );

            const adminPs = await criarPessoaComPrivilegios(['CadastroPS.administrador']);
            const criado = await api(adminPs)
                .post('/api/plano-setorial-orcamento-previsto')
                .send(novoPrevisto(meta.id, ano));
            assertStatus(criado, 201);

            const lista = await api(adminPs).get(
                `/api/plano-setorial-orcamento-previsto?meta_id=${meta.id}&ano_referencia=${ano}`
            );
            assertStatus(lista, 200);
            assert.equal(lista.body.linhas.length, 1);
        });
    });

    describe('validação', () => {
        it('400 na listagem sem meta_id e ano_referencia', async () => {
            assertStatus(await api(admin).get('/api/meta-orcamento'), 400);
        });

        it('400 com custo_previsto negativo', async () => {
            const { meta, ano } = await criarCenarioOrcamento();
            const res = await api(admin)
                .post('/api/meta-orcamento')
                .send(novoPrevisto(meta.id, ano, { custo_previsto: -1 }));
            assertStatus(res, 400);
            assert.match(res.body.message.join(' '), /Custo precisa ser positivo/);
        });

        it('400 com parte_dotacao fora do formato', async () => {
            const { meta, ano } = await criarCenarioOrcamento();
            assertStatus(
                await api(admin)
                    .post('/api/meta-orcamento')
                    .send(novoPrevisto(meta.id, ano, { parte_dotacao: '123' })),
                400
            );
        });

        it('400 quando o ano não está habilitado para previsão no PDM', async () => {
            const { meta } = await criarCenarioOrcamento();
            const res = await api(admin).post('/api/meta-orcamento').send(novoPrevisto(meta.id, anoUnico()));
            assertStatus(res, 400);
            assert.match(res.body.message, /Ano de referencia não encontrado/);
        });
    });

    describe('regras de negócio', () => {
        it('cria, lista com custo formatado e edita gerando nova revisão', async () => {
            const { meta, ano } = await criarCenarioOrcamento();

            const criado = await api(admin).post('/api/meta-orcamento').send(novoPrevisto(meta.id, ano));
            assertStatus(criado, 201);

            const lista = await api(admin).get(`/api/meta-orcamento?meta_id=${meta.id}&ano_referencia=${ano}`);
            assertStatus(lista, 200);
            assert.equal(lista.body.linhas.length, 1);
            assert.equal(lista.body.linhas[0].id, criado.body.id);
            assert.equal(lista.body.linhas[0].custo_previsto, '1500.50');
            assert.equal(lista.body.linhas[0].parte_dotacao, DOTACAO);

            assertStatus(
                await api(admin)
                    .patch(`/api/meta-orcamento/${criado.body.id}`)
                    .send({ meta_id: meta.id, custo_previsto: 2000 }),
                202
            );

            const depois = await api(admin).get(`/api/meta-orcamento?meta_id=${meta.id}&ano_referencia=${ano}`);
            assert.equal(depois.body.linhas.length, 1, 'versão anterior não deve aparecer na listagem');
            assert.notEqual(depois.body.linhas[0].id, criado.body.id);
            assert.equal(depois.body.linhas[0].custo_previsto, '2000.00');
        });

        it('400 ao duplicar a mesma dotação na mesma meta e ano', async () => {
            const { meta, ano } = await criarCenarioOrcamento();
            assertStatus(await api(admin).post('/api/meta-orcamento').send(novoPrevisto(meta.id, ano)), 201);

            const duplicado = await api(admin).post('/api/meta-orcamento').send(novoPrevisto(meta.id, ano));
            assertStatus(duplicado, 400);
            assert.match(duplicado.body.message, /Já existe um registro com a mesma dotação/);
        });

        it('400 para usuário sem ser responsável pela meta', async () => {
            const { meta, ano } = await criarCenarioOrcamento();
            const naoResponsavel = await criarPessoaComPrivilegios(['CadastroMeta.orcamento']);
            const res = await api(naoResponsavel).post('/api/meta-orcamento').send(novoPrevisto(meta.id, ano));
            assertStatus(res, 400);
            assert.match(res.body.message, /Sem permissão para editar o orçamento na meta/);
        });

        it('listagem não mostra o previsto de metas em que a pessoa não é responsável', async () => {
            const { meta, ano } = await criarCenarioOrcamento();
            assertStatus(await api(admin).post('/api/meta-orcamento').send(novoPrevisto(meta.id, ano)), 201);

            const naoResponsavel = await criarPessoaComPrivilegios(['CadastroMeta.orcamento']);
            const lista = await api(naoResponsavel).get(`/api/meta-orcamento?meta_id=${meta.id}&ano_referencia=${ano}`);
            assertStatus(lista, 200);
            assert.equal(lista.body.linhas.length, 0);
        });

        it('zerado: só marca R$ 0,00 sem registros, e um novo registro limpa a marcação', async () => {
            const { meta, ano } = await criarCenarioOrcamento();
            const previsto = await api(admin).post('/api/meta-orcamento').send(novoPrevisto(meta.id, ano));
            assertStatus(previsto, 201);

            const comRegistro = await api(admin)
                .patch('/api/meta-orcamento/zerado')
                .send({ meta_id: meta.id, ano_referencia: ano, considerar_zero: true });
            assertStatus(comRegistro, 400);
            assert.match(comRegistro.body.message, /não ter nenhum registro de custo previsto/);

            assertStatus(await api(admin).delete(`/api/meta-orcamento/${previsto.body.id}`), 202);
            assertStatus(
                await api(admin)
                    .patch('/api/meta-orcamento/zerado')
                    .send({ meta_id: meta.id, ano_referencia: ano, considerar_zero: true }),
                202
            );

            const marcado = await api(admin).get(`/api/meta-orcamento?meta_id=${meta.id}&ano_referencia=${ano}`);
            assert.equal(marcado.body.previsto_eh_zero, true);
            assert.equal(marcado.body.previsto_eh_zero_criado_por.id, admin.pessoa.id);

            assertStatus(await api(admin).post('/api/meta-orcamento').send(novoPrevisto(meta.id, ano)), 201);
            const desmarcado = await api(admin).get(`/api/meta-orcamento?meta_id=${meta.id}&ano_referencia=${ano}`);
            assert.equal(desmarcado.body.previsto_eh_zero, false);
        });

        it('remove a linha (soft delete) e some da listagem', async () => {
            const { meta, ano } = await criarCenarioOrcamento();
            const criado = await api(admin).post('/api/meta-orcamento').send(novoPrevisto(meta.id, ano));
            assertStatus(criado, 201);

            assertStatus(await api(admin).delete(`/api/meta-orcamento/${criado.body.id}`), 202);
            const removido = await prisma().orcamentoPrevisto.findUniqueOrThrow({ where: { id: criado.body.id } });
            assert.ok(removido.removido_em);

            const lista = await api(admin).get(`/api/meta-orcamento?meta_id=${meta.id}&ano_referencia=${ano}`);
            assert.equal(lista.body.linhas.length, 0);
        });

        it('edita custo para zero', async () => {
            const { meta, ano } = await criarCenarioOrcamento();
            const criado = await api(admin).post('/api/meta-orcamento').send(novoPrevisto(meta.id, ano));
            assertStatus(criado, 201);

            assertStatus(
                await api(admin)
                    .patch(`/api/meta-orcamento/${criado.body.id}`)
                    .send({ meta_id: meta.id, custo_previsto: 0 }),
                202
            );

            const lista = await api(admin).get(`/api/meta-orcamento?meta_id=${meta.id}&ano_referencia=${ano}`);
            assert.equal(lista.body.linhas[0].custo_previsto, '0.00');
        });
    });
});
