import { before, describe, it } from 'node:test';
import { assert, assertStatus, bootApp, criarOrgao, criarPessoaComPrivilegios, prisma, Sessao, uniq } from '../../lib';
import { casaCivil, criarTransferenciaComOrcamento } from '../_helpers';

describe('distribuicao-solicitacao-ajuste (fluxo gestor -> Casa Civil)', () => {
    let orgaoGestor: { id: number };
    let gestor: Sessao;
    let outroGestor: Sessao;
    let admin: Sessao;

    before(async () => {
        await bootApp();
        orgaoGestor = await criarOrgao();
        const privilegios = [
            'SMAE.CadastroDistribuicaoSolicitacaoAjuste.inserir',
            'SMAE.CadastroDistribuicaoSolicitacaoAjuste.editar',
            'SMAE.CadastroDistribuicaoSolicitacaoAjuste.listar',
            'SMAE.CadastroDistribuicaoSolicitacaoAjuste.remover',
        ] as const;
        gestor = await criarPessoaComPrivilegios([...privilegios], { orgao_id: orgaoGestor.id });
        outroGestor = await criarPessoaComPrivilegios([...privilegios], { orgao_id: (await criarOrgao()).id });
        admin = await criarPessoaComPrivilegios([
            'SMAE.CadastroDistribuicaoSolicitacaoAjuste.listar',
            'CadastroDistribuicaoSolicitacaoAjuste.administrador',
            'CadastroTransferencia.listar',
            'CadastroTransferencia.editar',
        ]);
    });

    const novaDistribuicao = async () => {
        const gerente = await criarPessoaComPrivilegios(['CadastroTransferencia.inserir', 'CadastroTransferencia.editar']);
        const { inicial } = await criarTransferenciaComOrcamento(gerente, orgaoGestor.id);
        return inicial;
    };

    const solicitar = (sessao: Sessao, distribuicao_recurso_id: number, campos: Record<string, unknown>) =>
        casaCivil(sessao)
            .post('/api/distribuicao-recurso-solicitacao-ajuste')
            .send({ distribuicao_recurso_id, ...campos });

    const submeter = (sessao: Sessao, id: number) => casaCivil(sessao).patch(`/api/distribuicao-recurso-solicitacao-ajuste/${id}/submeter`);
    const decidir = (sessao: Sessao, id: number, corpo: Record<string, unknown>) =>
        casaCivil(sessao).patch(`/api/distribuicao-recurso-solicitacao-ajuste/${id}/gestao`).send(corpo);
    const buscar = async (sessao: Sessao, id: number) => (await casaCivil(sessao).get(`/api/distribuicao-recurso-solicitacao-ajuste/${id}`)).body;
    const distribuicaoDb = (id: number) => prisma().distribuicaoRecurso.findUniqueOrThrow({ where: { id } });

    describe('autenticação e privilégios', () => {
        it('401 sem token e 403 sem privilégio de inserir, listar ou administrar', async () => {
            assertStatus(await casaCivil().get('/api/distribuicao-recurso-solicitacao-ajuste'), 401);
            const leitor = await criarPessoaComPrivilegios(['SMAE.CadastroDistribuicaoSolicitacaoAjuste.listar']);
            assertStatus(await solicitar(leitor, 1, { nome: 'x' }), 403);
            const semListar = await criarPessoaComPrivilegios(['SMAE.CadastroDistribuicaoSolicitacaoAjuste.inserir']);
            assertStatus(await casaCivil(semListar).get('/api/distribuicao-recurso-solicitacao-ajuste'), 403);
            assertStatus(await decidir(gestor, 1, { status: 'Aprovada' }), 403);
        });
    });

    describe('rascunho (EmRegistro)', () => {
        it('cria guardando de/para, rejeita 2o rascunho, edita e remove', async () => {
            const dist = await novaDistribuicao();
            const nome = uniq('nome novo');
            const criada = await solicitar(gestor, dist.id, { nome, finalidade: 'finalidade nova', informacoes_complementares: 'info' });
            assertStatus(criada, 201);

            const s = await buscar(gestor, criada.body.id);
            assert.equal(s.status, 'EmRegistro');
            assert.equal(s.pode_editar, true);
            assert.equal(s.pode_aprovar, false);
            assert.deepEqual(s.campos_solicitados.nome, { de: dist.nome, para: nome });
            assert.equal(s.campos_solicitados.finalidade.para, 'finalidade nova');
            assert.equal(s.orgao_gestor_id, orgaoGestor.id);

            const segundo = await solicitar(gestor, dist.id, { objeto: uniq('o') });
            assertStatus(segundo, 400);
            assert.match(segundo.body.message, /em rascunho/);

            const editada = await casaCivil(gestor)
                .patch(`/api/distribuicao-recurso-solicitacao-ajuste/${criada.body.id}`)
                .send({ objeto: 'objeto ajustado' });
            assertStatus(editada, 200);
            const depois = await buscar(gestor, criada.body.id);
            assert.deepEqual(Object.keys(depois.campos_solicitados), ['objeto']);

            assertStatus(await casaCivil(gestor).delete(`/api/distribuicao-recurso-solicitacao-ajuste/${criada.body.id}`), 204);
            assertStatus(await casaCivil(gestor).get(`/api/distribuicao-recurso-solicitacao-ajuste/${criada.body.id}`), 404);
        });

        it('nada a ajustar ou distribuição de outro órgão', async () => {
            const dist = await novaDistribuicao();
            const alheia = await solicitar(outroGestor, dist.id, { nome: uniq('n') });
            assertStatus(alheia, 403);
            assert.match(alheia.body.message, /não tem permissão/);

            assertStatus(await solicitar(gestor, 999999, { nome: uniq('n') }), 404);

            const igual = await solicitar(gestor, dist.id, { nome: dist.nome });
            assertStatus(igual, 201);
            const submetida = await submeter(gestor, igual.body.id);
            assertStatus(submetida, 400);
            assert.match(submetida.body.message, /ao menos um campo/);
        });

        it('só o órgão gestor enxerga e mexe na solicitação', async () => {
            const dist = await novaDistribuicao();
            const criada = await solicitar(gestor, dist.id, { nome: uniq('n') });
            assertStatus(criada, 201);

            assertStatus(await casaCivil(outroGestor).get(`/api/distribuicao-recurso-solicitacao-ajuste/${criada.body.id}`), 404);
            assertStatus(await submeter(outroGestor, criada.body.id), 404);
            assertStatus(await casaCivil(outroGestor).delete(`/api/distribuicao-recurso-solicitacao-ajuste/${criada.body.id}`), 409);

            const doGestor = await casaCivil(gestor).get(`/api/distribuicao-recurso-solicitacao-ajuste?distribuicao_recurso_id=${dist.id}`);
            assert.equal(doGestor.body.linhas.length, 1);
            const doOutro = await casaCivil(outroGestor).get(`/api/distribuicao-recurso-solicitacao-ajuste?distribuicao_recurso_id=${dist.id}`);
            assert.equal(doOutro.body.linhas.length, 0);
            const doAdmin = await casaCivil(admin).get(`/api/distribuicao-recurso-solicitacao-ajuste?distribuicao_recurso_id=${dist.id}`);
            assert.equal(doAdmin.body.linhas.length, 1);
            assert.equal(doAdmin.body.linhas[0].pode_editar, false);
        });
    });

    describe('submissão e decisão', () => {
        it('submeter trava edição e remoção; aprovar aplica os valores na distribuição', async () => {
            const dist = await novaDistribuicao();
            const nome = uniq('nome aprovado');
            const criada = await solicitar(gestor, dist.id, { nome, finalidade: 'finalidade aprovada' });
            assertStatus(criada, 201);
            const id: number = criada.body.id;

            assertStatus(await submeter(gestor, id), 200);
            assert.equal((await buscar(gestor, id)).status, 'Pendente');
            assert.equal((await buscar(admin, id)).pode_aprovar, true);

            const editar = await casaCivil(gestor).patch(`/api/distribuicao-recurso-solicitacao-ajuste/${id}`).send({ nome: uniq('x') });
            assertStatus(editar, 400);
            assert.match(editar.body.message, /Apenas solicitações em registro/);
            assertStatus(await casaCivil(gestor).delete(`/api/distribuicao-recurso-solicitacao-ajuste/${id}`), 409);
            const resubmeter = await submeter(gestor, id);
            assertStatus(resubmeter, 400);

            const invalido = await decidir(admin, id, { status: 'Pendente' });
            assertStatus(invalido, 400);

            assertStatus(await decidir(admin, id, { status: 'Aprovada' }), 200);

            const aplicada = await distribuicaoDb(dist.id);
            assert.equal(aplicada.nome, nome);
            assert.equal(aplicada.finalidade, 'finalidade aprovada');

            const final = await buscar(admin, id);
            assert.equal(final.status, 'Aprovada');
            assert.equal(final.respondido_por, admin.pessoa.id);
            assert.ok(final.respondido_em);
            assert.equal(final.pode_aprovar, false);

            const refeita = await decidir(admin, id, { status: 'Recusada' });
            assertStatus(refeita, 403);
        });

        it('recusar guarda o motivo e deixa a distribuição intacta', async () => {
            const dist = await novaDistribuicao();
            const criada = await solicitar(gestor, dist.id, { nome: uniq('nao vai') });
            assertStatus(criada, 201);
            assertStatus(await submeter(gestor, criada.body.id), 200);

            assertStatus(await decidir(admin, criada.body.id, { status: 'Recusada', resposta_motivo: 'sem justificativa' }), 200);

            const s = await buscar(gestor, criada.body.id);
            assert.equal(s.status, 'Recusada');
            assert.equal(s.resposta_motivo, 'sem justificativa');
            assert.equal((await distribuicaoDb(dist.id)).nome, dist.nome);

            const novaSolicitacao = await solicitar(gestor, dist.id, { nome: uniq('de novo') });
            assertStatus(novaSolicitacao, 201);
        });

        it('aprovar com a distribuição alterada desde a solicitação responde 409', async () => {
            const dist = await novaDistribuicao();
            const criada = await solicitar(gestor, dist.id, { objeto: uniq('objeto pedido') });
            assertStatus(criada, 201);
            assertStatus(await submeter(gestor, criada.body.id), 200);

            await prisma().distribuicaoRecurso.update({ where: { id: dist.id }, data: { objeto: uniq('objeto mudou') } });

            const res = await decidir(admin, criada.body.id, { status: 'Aprovada' });
            assertStatus(res, 409);
            assert.match(res.body.message, /divergem do valor original: objeto/);
            assert.equal((await buscar(admin, criada.body.id)).status, 'Pendente');
        });

        it('pendente bloqueia nova solicitação nos mesmos campos e a submissão de uma segunda', async () => {
            const dist = await novaDistribuicao();
            const primeira = await solicitar(gestor, dist.id, { nome: uniq('a') });
            assertStatus(primeira, 201);
            assertStatus(await submeter(gestor, primeira.body.id), 200);

            const mesmoCampo = await solicitar(gestor, dist.id, { nome: uniq('b') });
            assertStatus(mesmoCampo, 400);
            assert.match(mesmoCampo.body.message, /pendente que inclui os campos: nome/);

            const outroCampo = await solicitar(gestor, dist.id, { finalidade: 'outra' });
            assertStatus(outroCampo, 201);
            const submissao = await submeter(gestor, outroCampo.body.id);
            assertStatus(submissao, 400);
            assert.match(submissao.body.message, /Já existe uma solicitação pendente/);

            assertStatus(await decidir(admin, primeira.body.id, { status: 'Recusada' }), 200);
            assertStatus(await submeter(gestor, outroCampo.body.id), 200);
        });

        it('edição direta de campo com solicitação pendente é bloqueada', async () => {
            const dist = await novaDistribuicao();
            const criada = await solicitar(gestor, dist.id, { nome: uniq('pedido') });
            assertStatus(criada, 201);
            assertStatus(await submeter(gestor, criada.body.id), 200);

            const direto = await casaCivil(admin).patch(`/api/distribuicao-recurso/${dist.id}`).send({ nome: uniq('direto') });
            assert.ok([400, 409].includes(direto.status), `veio ${direto.status}: ${direto.text}`);
            assert.equal((await distribuicaoDb(dist.id)).nome, dist.nome);
        });
    });
});
