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
    criarDotacaoPlanejada,
    DOTACAO,
} from '../meta-orcamento/fixtures';

describe('orcamento-planejado', () => {
    let admin: Sessao;
    let semPrivilegio: Sessao;

    before(async () => {
        await bootApp();
        admin = await criarAdminOrcamento();
        semPrivilegio = await criarPessoaSemPrivilegios();
    });

    const novoPlanejado = (meta_id: number, ano_referencia: number, extra: Record<string, unknown> = {}) => ({
        meta_id,
        ano_referencia,
        dotacao: DOTACAO,
        valor_planejado: 1000.5,
        ...extra,
    });

    async function cenarioComDotacao(valores: { atualizado: number; saldo?: number } = { atualizado: 5000 }) {
        const cenario = await criarCenarioOrcamento();
        await criarDotacaoPlanejada(cenario.ano, valores);
        return cenario;
    }

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await api().get('/api/orcamento-planejado?meta_id=1&ano_referencia=2030'), 401);
            assertStatus(await api().post('/api/orcamento-planejado').send({}), 401);
        });

        it('403 sem CadastroMeta.orcamento / PDM.tecnico_cp / PDM.admin_cp', async () => {
            const { meta, ano } = await cenarioComDotacao();
            assertStatus(
                await api(semPrivilegio).post('/api/orcamento-planejado').send(novoPlanejado(meta.id, ano)),
                403
            );
            assertStatus(
                await api(semPrivilegio).get(`/api/orcamento-planejado?meta_id=${meta.id}&ano_referencia=${ano}`),
                403
            );
        });

        it('403 na rota de Plano Setorial para quem só tem CadastroMeta.orcamento', async () => {
            const { meta, ano } = await cenarioComDotacao();
            const soMeta = await criarPessoaComPrivilegios(['CadastroMeta.orcamento']);
            const res = await api(soMeta)
                .post('/api/plano-setorial-orcamento-planejado')
                .send(novoPlanejado(meta.id, ano));
            assertStatus(res, 403);
        });
    });

    describe('plano setorial (sem smae-sistemas: _PS)', () => {
        it('400 com smae-sistemas de outro módulo: o filtro de sessão zera os privilégios de PS', async () => {
            const { meta, ano } = await cenarioComDotacao();
            const adminPs = await criarPessoaComPrivilegios(['CadastroPS.administrador']);
            const res = await api(adminPs, { sistema: 'Projetos' }).get(
                `/api/plano-setorial-orcamento-planejado?meta_id=${meta.id}&ano_referencia=${ano}`
            );
            assertStatus(res, 400);
            assert.match(res.body.message, /não tem mais permissões/);
        });

        it('cria e lista pela rota de Plano Setorial com CadastroPS.administrador', async () => {
            const cenario = await criarCenarioOrcamento(anoUnico(), 'PS');
            await criarDotacaoPlanejada(cenario.ano, { atualizado: 3000 });
            const adminPs = await criarPessoaComPrivilegios(['CadastroPS.administrador']);

            const criado = await api(adminPs)
                .post('/api/plano-setorial-orcamento-planejado')
                .send(novoPlanejado(cenario.meta.id, cenario.ano));
            assertStatus(criado, 201);

            const lista = await api(adminPs).get(
                `/api/plano-setorial-orcamento-planejado?meta_id=${cenario.meta.id}&ano_referencia=${cenario.ano}`
            );
            assertStatus(lista, 200);
            assert.equal(lista.body.linhas.length, 1);
            assert.equal(lista.body.linhas[0].id, criado.body.id);
        });
    });

    describe('validação', () => {
        it('400 com valor_planejado zero ou negativo', async () => {
            const { meta, ano } = await cenarioComDotacao();
            const res = await api(admin)
                .post('/api/orcamento-planejado')
                .send(novoPlanejado(meta.id, ano, { valor_planejado: 0 }));
            assertStatus(res, 400);
            assert.match(res.body.message.join(' '), /Investimento precisa ser positivo/);
        });

        it('400 com dotação fora do formato', async () => {
            const { meta, ano } = await cenarioComDotacao();
            assertStatus(
                await api(admin)
                    .post('/api/orcamento-planejado')
                    .send(novoPlanejado(meta.id, ano, { dotacao: '16.10' })),
                400
            );
        });

        it('400 na listagem sem meta_id', async () => {
            assertStatus(await api(admin).get('/api/orcamento-planejado?ano_referencia=2030'), 400);
        });
    });

    describe('regras de negócio', () => {
        it('400 quando a dotação ainda não foi importada para o ano', async () => {
            const { meta } = await criarCenarioOrcamento();
            const res = await api(admin).post('/api/orcamento-planejado').send(novoPlanejado(meta.id, anoUnico()));
            assertStatus(res, 400);
            assert.match(res.body.message, /não foi importada no banco de dados/);
        });

        it('400 quando o planejamento do ano não está liberado no PDM', async () => {
            const { meta, pdm, ano } = await cenarioComDotacao();
            await prisma().pdmOrcamentoConfig.updateMany({
                where: { pdm_id: pdm.id, ano_referencia: ano },
                data: { planejado_disponivel: false },
            });
            const res = await api(admin).post('/api/orcamento-planejado').send(novoPlanejado(meta.id, ano));
            assertStatus(res, 400);
            assert.match(res.body.message, /não está com o planejamento liberado/);
        });

        it('cria, lista com saldo do SOF e remove', async () => {
            const { meta, ano } = await cenarioComDotacao({ atualizado: 5000, saldo: 4200 });

            const criado = await api(admin).post('/api/orcamento-planejado').send(novoPlanejado(meta.id, ano));
            assertStatus(criado, 201);

            const lista = await api(admin).get(`/api/orcamento-planejado?meta_id=${meta.id}&ano_referencia=${ano}`);
            assertStatus(lista, 200);
            assert.equal(lista.body.linhas.length, 1);
            const linha = lista.body.linhas[0];
            assert.equal(linha.id, criado.body.id);
            assert.equal(linha.dotacao, DOTACAO);
            assert.equal(linha.val_orcado_atualizado, '5000.00');
            assert.equal(linha.saldo_disponivel, '4200.00');
            assert.equal(linha.criador.nome_exibicao, admin.pessoa.nome_exibicao);

            assertStatus(await api(admin).delete(`/api/orcamento-planejado/${criado.body.id}`), 202);
            const depois = await api(admin).get(`/api/orcamento-planejado?meta_id=${meta.id}&ano_referencia=${ano}`);
            assert.equal(depois.body.linhas.length, 0);
        });

        it('soma o planejado da dotação no PDM e acusa pressão orçamentária acima do atualizado', async () => {
            const { meta, pdm, ano } = await cenarioComDotacao({ atualizado: 5000 });
            const outraMeta = await prisma().meta.create({
                data: { pdm_id: pdm.id, status: 'Ativo', codigo: uniq('MET'), titulo: uniq('Meta') },
            });

            assertStatus(
                await api(admin)
                    .post('/api/orcamento-planejado')
                    .send(novoPlanejado(meta.id, ano, { valor_planejado: 3000 })),
                201
            );
            const sozinho = await api(admin).get(`/api/orcamento-planejado?meta_id=${meta.id}&ano_referencia=${ano}`);
            assert.equal(sozinho.body.linhas[0].smae_soma_valor_planejado, '3000.00');
            assert.equal(sozinho.body.linhas[0].pressao_orcamentaria, false);

            assertStatus(
                await api(admin)
                    .post('/api/orcamento-planejado')
                    .send(novoPlanejado(outraMeta.id, ano, { valor_planejado: 3000 })),
                201
            );
            const estourado = await api(admin).get(`/api/orcamento-planejado?meta_id=${meta.id}&ano_referencia=${ano}`);
            assert.equal(estourado.body.linhas[0].smae_soma_valor_planejado, '6000.00');
            assert.equal(estourado.body.linhas[0].pressao_orcamentaria, true);
            assert.equal(estourado.body.linhas[0].pressao_orcamentaria_valor, '1000.00');
        });

        it('400 ao duplicar a dotação na mesma meta e ano', async () => {
            const { meta, ano } = await cenarioComDotacao();
            assertStatus(await api(admin).post('/api/orcamento-planejado').send(novoPlanejado(meta.id, ano)), 201);

            const duplicado = await api(admin).post('/api/orcamento-planejado').send(novoPlanejado(meta.id, ano));
            assertStatus(duplicado, 400);
            assert.match(duplicado.body.message, /Já existe um registro com a mesma dotação/);
        });

        it('edita o valor planejado e a listagem reflete o novo valor', async () => {
            const { meta, ano } = await cenarioComDotacao();
            const criado = await api(admin).post('/api/orcamento-planejado').send(novoPlanejado(meta.id, ano));
            assertStatus(criado, 201);

            const editado = await api(admin)
                .patch(`/api/orcamento-planejado/${criado.body.id}`)
                .send({ meta_id: meta.id, valor_planejado: 2500 });
            assertStatus(editado, 200);
            assert.equal(editado.body.id, criado.body.id);

            const lista = await api(admin).get(`/api/orcamento-planejado?meta_id=${meta.id}&ano_referencia=${ano}`);
            assert.equal(lista.body.linhas[0].valor_planejado, '2500');
        });

        it('filtra a listagem pela dotação', async () => {
            const { meta, ano } = await cenarioComDotacao();
            assertStatus(await api(admin).post('/api/orcamento-planejado').send(novoPlanejado(meta.id, ano)), 201);

            const outra = await api(admin).get(
                `/api/orcamento-planejado?meta_id=${meta.id}&ano_referencia=${ano}&dotacao=99.99.99.999.9999.9.999.99999999.99`
            );
            assertStatus(outra, 200);
            assert.equal(outra.body.linhas.length, 0);
        });

        it('404 ao remover id inexistente', async () => {
            assertStatus(await api(admin).delete('/api/orcamento-planejado/999999'), 404);
        });
    });
});
