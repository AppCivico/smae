import { before, describe, it } from 'node:test';
import { assert, assertStatus, bootApp, criarPessoaComPrivilegios, prisma, Sessao, uniq } from '../../../lib';
import { buscarStatusBase, casaCivil, criarTipoTransferencia, criarTransferencia, montarWorkflowAtivo } from '../../_helpers';

describe('workflow: montagem da configuração (etapas, fluxo, fases, situações)', () => {
    let s: Sessao;

    before(async () => {
        await bootApp();
        s = await criarPessoaComPrivilegios([
            'CadastroWorkflows.inserir',
            'CadastroWorkflows.listar',
            'CadastroWorkflows.editar',
            'CadastroWorkflows.remover',
            'CadastroTransferencia.inserir',
            'CadastroTransferencia.listar',
            'CadastroTransferencia.editar',
            'CadastroTransferencia.remover',
        ]);
    });

    const criar = async (path: string, corpo: Record<string, unknown>) => {
        const res = await casaCivil(s).post(path).send(corpo);
        assertStatus(res, 201);
        return res.body.id as number;
    };

    const novoWorkflow = async () => {
        const tipo = await criarTipoTransferencia();
        const id = await criar('/api/workflow', { transferencia_tipo_id: tipo.id, nome: uniq('Workflow'), inicio: '2020-01-01' });
        return { id, tipoId: tipo.id };
    };

    const etapa = () => criar('/api/workflow-etapa', { descricao: uniq('etapa') });
    const faseCatalogo = () => criar('/api/workflow-fase', { fase: uniq('fase') });

    describe('catálogos (etapa, fase, tarefa, situação)', () => {
        const catalogos = [
            { path: '/api/workflow-etapa', campo: 'descricao', extra: {} },
            { path: '/api/workflow-fase', campo: 'fase', extra: {} },
            { path: '/api/workflow-tarefa', campo: 'descricao', extra: {} },
            { path: '/api/workflow-situacao', campo: 'situacao', extra: { tipo_situacao: 'EmAndamento' } },
        ];

        for (const { path, campo, extra } of catalogos) {
            it(`${path}: cria, rejeita nome repetido, edita, lista e remove`, async () => {
                const nome = uniq('item');
                const id = await criar(path, { [campo]: nome, ...extra });

                const repetido = await casaCivil(s).post(path).send({ [campo]: nome.toUpperCase(), ...extra });
                assertStatus(repetido, 400);
                assert.match(repetido.body.message, /igual ou semelhante/);

                assertStatus(await casaCivil(s).post(path).send({ [campo]: '', ...extra }), 400);

                const novoNome = uniq('renomeado');
                assertStatus(await casaCivil(s).patch(`${path}/${id}`).send({ [campo]: novoNome }), 200);

                const lista = await casaCivil(s).get(path);
                assertStatus(lista, 200);
                const linha = lista.body.linhas.find((l: { id: number }) => l.id === id);
                assert.equal(linha[campo], novoNome);

                assertStatus(await casaCivil(s).delete(`${path}/${id}`), 202);
                const depois = await casaCivil(s).get(path);
                assert.equal(depois.body.linhas.some((l: { id: number }) => l.id === id), false);
                if (path.endsWith('etapa')) {
                    const comRemovidas = await casaCivil(s).get(`${path}?incluir_removidas=true`);
                    assert.equal(comRemovidas.body.linhas.some((l: { id: number }) => l.id === id), true);
                }
            });
        }

        it('situação: 400 com tipo_situacao fora do enum', async () => {
            const res = await casaCivil(s).post('/api/workflow-situacao').send({ situacao: uniq('s'), tipo_situacao: 'Qualquer' });
            assertStatus(res, 400);
        });
    });

    describe('fluxo (de etapa para etapa)', () => {
        it('valida etapa igual, saída/destino já usados, ordem repetida e encadeamento', async () => {
            const { id: workflow_id } = await novoWorkflow();
            const [a, b, c, d] = [await etapa(), await etapa(), await etapa(), await etapa()];
            const fluxo = (de: number, para: number, ordem?: number) =>
                casaCivil(s).post('/api/workflow-fluxo').send({ workflow_id, workflow_etapa_de_id: de, workflow_etapa_para_id: para, ordem });

            const igual = await fluxo(a, a, 1);
            assertStatus(igual, 400);
            assert.match(igual.body.message, /não pode ser a mesma/);

            assertStatus(await fluxo(a, b, 1), 201);

            const saidaRepetida = await fluxo(a, c, 2);
            assertStatus(saidaRepetida, 400);
            assert.match(saidaRepetida.body.message, /já em uso/);

            const destinoRepetido = await fluxo(c, b, 2);
            assertStatus(destinoRepetido, 400);
            assert.match(destinoRepetido.body.message, /já em uso/);

            const ordemRepetida = await fluxo(b, c, 1);
            assertStatus(ordemRepetida, 400);
            assert.match(ordemRepetida.body.message, /Ordem já em uso/);

            const quebraCadeia = await fluxo(c, d, 2);
            assertStatus(quebraCadeia, 400);
            assert.match(quebraCadeia.body.message, /mesma de saída do passo anterior/);

            assertStatus(await fluxo(b, c, 2), 201);
            const lista = await casaCivil(s).get(`/api/workflow-fluxo?workflow_id=${workflow_id}`);
            assertStatus(lista, 200);
            assert.equal(lista.body.linhas.length, 2);
        });

        it('400 com workflow, etapa de ou para inexistentes ou ausentes', async () => {
            assertStatus(await casaCivil(s).post('/api/workflow-fluxo').send({}), 400);
        });
    });

    describe('fluxo-fase (fases de uma etapa)', () => {
        async function fluxoComEtapas() {
            const { id: workflow_id, tipoId } = await novoWorkflow();
            const fluxo_id = await criar('/api/workflow-fluxo', {
                workflow_id,
                workflow_etapa_de_id: await etapa(),
                workflow_etapa_para_id: await etapa(),
                ordem: 1,
            });
            return { workflow_id, tipoId, fluxo_id };
        }

        const ordens = async (fluxo_id: number) =>
            (await prisma().fluxoFase.findMany({ where: { fluxo_id, removido_em: null }, orderBy: { ordem: 'asc' } })).map(
                (f) => ({ fase_id: f.fase_id, ordem: f.ordem })
            );

        it('inserir com ordem abre espaço, mover reordena, remover fecha a lacuna', async () => {
            const { fluxo_id } = await fluxoComEtapas();
            const [f1, f2, f3] = [await faseCatalogo(), await faseCatalogo(), await faseCatalogo()];
            const ff = (fase_id: number, ordem?: number) =>
                criar('/api/workflow-fluxo-fase', { fluxo_id, fase_id, ordem, responsabilidade: 'Propria' });

            const ff1 = await ff(f1);
            const ff2 = await ff(f2);
            assert.deepEqual(await ordens(fluxo_id), [{ fase_id: f1, ordem: 1 }, { fase_id: f2, ordem: 2 }]);

            const ff3 = await ff(f3, 1);
            assert.deepEqual(await ordens(fluxo_id), [
                { fase_id: f3, ordem: 1 },
                { fase_id: f1, ordem: 2 },
                { fase_id: f2, ordem: 3 },
            ]);

            assertStatus(await casaCivil(s).patch(`/api/workflow-fluxo-fase/${ff3}`).send({ ordem: 3 }), 200);
            assert.deepEqual(await ordens(fluxo_id), [
                { fase_id: f1, ordem: 1 },
                { fase_id: f2, ordem: 2 },
                { fase_id: f3, ordem: 3 },
            ]);

            assertStatus(await casaCivil(s).delete(`/api/workflow-fluxo-fase/${ff1}`), 202);
            assert.deepEqual(await ordens(fluxo_id), [{ fase_id: f2, ordem: 1 }, { fase_id: f3, ordem: 2 }]);
            assert.ok(ff2);
        });

        it('troca de fase para uma já usada no fluxo é rejeitada', async () => {
            const { fluxo_id } = await fluxoComEtapas();
            const [f1, f2] = [await faseCatalogo(), await faseCatalogo()];
            const ff1 = await criar('/api/workflow-fluxo-fase', { fluxo_id, fase_id: f1, responsabilidade: 'Propria' });
            await criar('/api/workflow-fluxo-fase', { fluxo_id, fase_id: f2, responsabilidade: 'Propria' });
            const res = await casaCivil(s).patch(`/api/workflow-fluxo-fase/${ff1}`).send({ fase_id: f2 });
            assertStatus(res, 400);
            assert.match(res.body.message, /Fase já em uso/);
        });

        it('situações da fase: grava, substitui e lista', async () => {
            const { fluxo_id } = await fluxoComEtapas();
            const sit = async () => criar('/api/workflow-situacao', { situacao: uniq('sit'), tipo_situacao: 'EmAndamento' });
            const [s1, s2, s3] = [await sit(), await sit(), await sit()];
            const ff = await criar('/api/workflow-fluxo-fase', {
                fluxo_id,
                fase_id: await faseCatalogo(),
                responsabilidade: 'OutroOrgao',
                situacao: [s1, s2],
            });
            const lerSituacoes = async () => {
                const lista = await casaCivil(s).get(`/api/workflow-fluxo-fase?fluxo_id=${fluxo_id}`);
                const linha = lista.body.linhas.find((l: { id: number }) => l.id === ff);
                return linha.situacao.map((x: { id: number }) => x.id).sort();
            };
            assert.deepEqual(await lerSituacoes(), [s1, s2].sort());

            assertStatus(await casaCivil(s).patch(`/api/workflow-fluxo-fase/${ff}`).send({ situacao: [s2, s3] }), 200);
            assert.deepEqual(await lerSituacoes(), [s2, s3].sort());

            assertStatus(await casaCivil(s).patch(`/api/workflow-fluxo-fase/${ff}`).send({ situacao: [] }), 200);
            assert.deepEqual(await lerSituacoes(), []);
        });

        it('400 com responsabilidade inválida e com fluxo inexistente', async () => {
            const { fluxo_id } = await fluxoComEtapas();
            const fase_id = await faseCatalogo();
            assertStatus(await casaCivil(s).post('/api/workflow-fluxo-fase').send({ fluxo_id, fase_id, responsabilidade: 'Ninguem' }), 400);
            const semFluxo = await casaCivil(s)
                .post('/api/workflow-fluxo-fase')
                .send({ fluxo_id: 999999, fase_id, responsabilidade: 'Propria' });
            assertStatus(semFluxo, 400);
            assert.match(semFluxo.body.message, /Fluxo não encontrado/);
        });
    });

    describe('fluxo-tarefa', () => {
        it('cria, rejeita duplicada na mesma fase, edita e remove', async () => {
            const { id: workflow_id } = await novoWorkflow();
            const fluxo_id = await criar('/api/workflow-fluxo', {
                workflow_id,
                workflow_etapa_de_id: await etapa(),
                workflow_etapa_para_id: await etapa(),
                ordem: 1,
            });
            const fluxo_fase_id = await criar('/api/workflow-fluxo-fase', {
                fluxo_id,
                fase_id: await faseCatalogo(),
                responsabilidade: 'Propria',
            });
            const workflow_tarefa_id = await criar('/api/workflow-tarefa', { descricao: uniq('tarefa') });
            const corpo = { fluxo_fase_id, workflow_tarefa_id, ordem: 1, responsabilidade: 'Propria' };

            const id = await criar('/api/workflow-fluxo-tarefa', corpo);
            const duplicada = await casaCivil(s).post('/api/workflow-fluxo-tarefa').send(corpo);
            assertStatus(duplicada, 400);
            assert.match(duplicada.body.message, /Já existe uma configuração/);

            const inexistente = await casaCivil(s).post('/api/workflow-fluxo-tarefa').send({ ...corpo, fluxo_fase_id: 999999 });
            assertStatus(inexistente, 400);

            assertStatus(await casaCivil(s).patch(`/api/workflow-fluxo-tarefa/${id}`).send({ responsabilidade: 'OutroOrgao' }), 200);
            const lista = await casaCivil(s).get(`/api/workflow-fluxo-tarefa?fluxo_fase_id=${fluxo_fase_id}`);
            assertStatus(lista, 200);
            assert.equal(lista.body.linhas.find((l: { id: number }) => l.id === id).responsabilidade, 'OutroOrgao');

            assertStatus(await casaCivil(s).delete(`/api/workflow-fluxo-tarefa/${id}`), 202);
        });
    });

    describe('ativação do workflow', () => {
        it('só ativa com etapas e fases, e só um ativo por tipo', async () => {
            const { id, tipoId } = await novoWorkflow();
            const ativar = (wid: number) => casaCivil(s).patch(`/api/workflow/${wid}`).send({ ativo: true });

            const vazio = await ativar(id);
            assertStatus(vazio, 400);
            assert.match(vazio.body.message, /não possui etapas/);

            const fluxo_id = await criar('/api/workflow-fluxo', {
                workflow_id: id,
                workflow_etapa_de_id: await etapa(),
                workflow_etapa_para_id: await etapa(),
                ordem: 1,
            });
            const semFase = await ativar(id);
            assertStatus(semFase, 400);
            assert.match(semFase.body.message, /não possui\(em\) fase/);

            await criar('/api/workflow-fluxo-fase', { fluxo_id, fase_id: await faseCatalogo(), responsabilidade: 'Propria' });
            assertStatus(await ativar(id), 200);
            assert.equal((await casaCivil(s).get(`/api/workflow/${id}`)).body.ativo, true);

            const outro = await montarWorkflowAtivo(s, { tipoId }).catch((e: Error) => e);
            assert.ok(outro instanceof Error);
            assert.match(outro.message, /Já existe um workflow ativo para este tipo/);

            assertStatus(await casaCivil(s).patch(`/api/workflow/${id}`).send({ ativo: false }), 200);
            const novo = await montarWorkflowAtivo(s, { tipoId });
            const ativos = await casaCivil(s).get(`/api/workflow?ativo=true&transferencia_tipo_id=${tipoId}`);
            assertStatus(ativos, 200);
            assert.deepEqual(
                ativos.body.linhas.map((l: { id: number }) => l.id),
                [novo.workflowId]
            );
        });

        it('listagem filtra por ativo e tipo e põe os ativos primeiro', async () => {
            const { id, tipoId } = await novoWorkflow();
            const ativo = await montarWorkflowAtivo(s, { tipoId });
            const todos = await casaCivil(s).get(`/api/workflow?transferencia_tipo_id=${tipoId}`);
            assertStatus(todos, 200);
            assert.deepEqual(
                todos.body.linhas.map((l: { id: number }) => l.id),
                [ativo.workflowId, id]
            );
            const inativos = await casaCivil(s).get(`/api/workflow?transferencia_tipo_id=${tipoId}&ativo=false`);
            assert.deepEqual(
                inativos.body.linhas.map((l: { id: number }) => l.id),
                [id]
            );
            assertStatus(await casaCivil(s).get('/api/workflow?pagina=2'), 400);
        });

        it('término no passado desativa o workflow ativo', async () => {
            const wf = await montarWorkflowAtivo(s);
            await prisma().workflow.update({ where: { id: wf.workflowId }, data: { termino: new Date('2030-01-01') } });
            assertStatus(await casaCivil(s).patch(`/api/workflow/${wf.workflowId}`).send({ termino: '2021-01-01' }), 200);
            assert.equal((await casaCivil(s).get(`/api/workflow/${wf.workflowId}`)).body.ativo, false);
        });

        it('detalhe devolve fluxo ordenado com fases e situações', async () => {
            const wf = await montarWorkflowAtivo(s);
            const detalhe = (await casaCivil(s).get(`/api/workflow/${wf.workflowId}`)).body;
            assert.deepEqual(
                detalhe.fluxo.map((f: any) => f.ordem),
                [1, 2]
            );
            assert.deepEqual(
                detalhe.fluxo[0].fases.map((f: any) => f.fase.id),
                [wf.fasePropria.id, wf.faseOutroOrgao.id]
            );
            assert.equal(detalhe.fluxo[0].fases[1].situacoes.length, 2);
            assert.equal(detalhe.fluxo[0].fases[1].responsabilidade, 'OutroOrgao');
        });

        it('statuses de distribuição permitidos são gravados e devolvidos', async () => {
            const { id } = await novoWorkflow();
            const cancelada = await buscarStatusBase('Cancelada');
            assertStatus(await casaCivil(s).patch(`/api/workflow/${id}`).send({ distribuicao_statuses_base: [cancelada.id] }), 200);
            const detalhe = (await casaCivil(s).get(`/api/workflow/${id}`)).body;
            assert.equal(detalhe.statuses_distribuicao.length, 1);
        });
    });

    describe('workflow em uso por transferência', () => {
        it('trava edição estrutural, remoção e criação de fase; destrava só com o histórico removido', async () => {
            const wf = await montarWorkflowAtivo(s);
            const detalhe = (await casaCivil(s).get(`/api/workflow/${wf.workflowId}`)).body;
            assert.equal(detalhe.edicao_restrita, false);

            const id = await criarTransferencia(s, { tipo_id: wf.tipoId });
            assert.equal((await casaCivil(s).get(`/api/workflow/${wf.workflowId}`)).body.edicao_restrita, true);

            const emUso = /há uma Transferência que o utiliza/;
            const mudarInicio = await casaCivil(s).patch(`/api/workflow/${wf.workflowId}`).send({ inicio: '2021-02-02' });
            assertStatus(mudarInicio, 400);
            assert.match(mudarInicio.body.message, emUso);

            const remover = await casaCivil(s).delete(`/api/workflow/${wf.workflowId}`);
            assertStatus(remover, 400);
            assert.match(remover.body.message, emUso);

            const fluxoFase = await prisma().fluxoFase.findFirstOrThrow({ where: { fluxo: { workflow_id: wf.workflowId } } });
            const fase_id = await faseCatalogo();
            const novaFase = await casaCivil(s)
                .post('/api/workflow-fluxo-fase')
                .send({ fluxo_id: fluxoFase.fluxo_id, fase_id, responsabilidade: 'Propria' });
            assertStatus(novaFase, 400);
            assert.match(novaFase.body.message, /já está em uso/);

            assertStatus(await casaCivil(s).patch(`/api/workflow-fluxo-fase/${fluxoFase.id}`).send({ ordem: 2 }), 400);
            assertStatus(await casaCivil(s).delete(`/api/workflow-fluxo-fase/${fluxoFase.id}`), 400);

            // renomear continua permitido
            assertStatus(await casaCivil(s).patch(`/api/workflow/${wf.workflowId}`).send({ nome: uniq('Renomeado') }), 200);

            // removida a transferência, o histórico de andamento ainda segura o workflow
            assertStatus(await casaCivil(s).delete(`/api/transferencia/${id}`), 202);
            assertStatus(await casaCivil(s).delete(`/api/workflow/${wf.workflowId}`), 400);
        });

        it('workflow sem transferência pode ser removido e some da listagem', async () => {
            const { id, tipoId } = await novoWorkflow();
            assertStatus(await casaCivil(s).delete(`/api/workflow/${id}`), 202);
            const lista = await casaCivil(s).get(`/api/workflow?transferencia_tipo_id=${tipoId}`);
            assert.deepEqual(lista.body.linhas, []);
        });
    });
});
