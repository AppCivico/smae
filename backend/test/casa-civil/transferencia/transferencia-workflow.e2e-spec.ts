import { before, describe, it } from 'node:test';
import { assert, assertStatus, bootApp, criarPessoaComPrivilegios, prisma, Sessao, uniq } from '../../lib';
import {
    casaCivil,
    consolidado,
    criarTransferencia,
    garantirOrgaoSERI,
    montarWorkflowAtivo,
    WorkflowMontado,
} from '../_helpers';

describe('transferencia: ciclo de vida do workflow', () => {
    let s: Sessao;
    let seriId: number;

    before(async () => {
        await bootApp();
        s = await criarPessoaComPrivilegios([
            'CadastroWorkflows.inserir',
            'CadastroWorkflows.editar',
            'CadastroWorkflows.listar',
            'CadastroWorkflows.remover',
            'CadastroTransferencia.inserir',
            'CadastroTransferencia.listar',
            'CadastroTransferencia.editar',
            'CadastroTransferencia.remover',
            'CadastroTransferencia.administrador',
            'AndamentoWorkflow.listar',
        ]);
        seriId = (await garantirOrgaoSERI()).id;
    });

    const fase = (path: string, transferencia_id: number, fase_id?: number) =>
        casaCivil(s)
            .post(`/api/workflow-andamento-fase/${path}`)
            .send(fase_id === undefined ? { transferencia_id } : { transferencia_id, fase_id });

    const patchFase = (transferencia_id: number, fase_id: number, corpo: Record<string, unknown>) =>
        casaCivil(s).patch('/api/workflow-andamento-fase').send({ transferencia_id, fase_id, ...corpo });

    const andamento = async (id: number) => {
        const res = await casaCivil(s).get(`/api/workflow-andamento?transferencia_id=${id}`);
        assertStatus(res, 200);
        return res.body;
    };

    const faseNoAndamento = (corpo: any, faseId: number) =>
        corpo.fluxo.flatMap((f: any) => f.fases).find((f: any) => f.fase.id === faseId);

    const estado = (id: number) =>
        prisma().transferencia.findUniqueOrThrow({
            where: { id },
            select: {
                workflow_id: true,
                workflow_etapa_atual_id: true,
                workflow_fase_atual_id: true,
                workflow_finalizado: true,
            },
        });

    const andamentoDb = (id: number, faseId: number) =>
        prisma().transferenciaAndamento.findFirstOrThrow({
            where: { transferencia_id: id, workflow_fase_id: faseId, removido_em: null },
        });

    const tarefaDaFase = (id: number, nome: string) =>
        prisma().tarefa.findFirstOrThrow({
            where: { tarefa: nome, removido_em: null, tarefa_cronograma: { transferencia_id: id, removido_em: null } },
        });

    const view = async (id: number) => {
        const linhas = await prisma().$queryRaw<
            {
                workflow_finalizado: boolean;
                workflow_etapa_atual_id: number | null;
                workflow_fase_atual_id: number | null;
                valor_total: unknown;
            }[]
        >`select * from view_transferencia_analise where transferencia_id = ${id}::int`;
        return linhas[0];
    };

    async function novaTransferenciaComWorkflow() {
        const wf = await montarWorkflowAtivo(s);
        const id = await criarTransferencia(s, { tipo_id: wf.tipoId });
        return { wf, id };
    }

    async function percorrerAteOFim(wf: WorkflowMontado, id: number) {
        assertStatus(await fase('finalizar', id, wf.fasePropria.id), 201);
        assertStatus(await fase('iniciar', id, wf.faseOutroOrgao.id), 201);
        assertStatus(await fase('finalizar', id, wf.faseOutroOrgao.id), 201);
        assertStatus(await fase('finalizar', id, wf.faseB.id), 201);
    }

    describe('criação instancia o workflow ativo do tipo', () => {
        it('cria andamento, cronograma de 3 níveis e marca a primeira fase como atual', async () => {
            const { wf, id } = await novaTransferenciaComWorkflow();

            const t = await estado(id);
            assert.equal(t.workflow_id, wf.workflowId);
            assert.equal(t.workflow_etapa_atual_id, wf.etapaA.id);
            assert.equal(t.workflow_fase_atual_id, wf.fasePropria.id);
            assert.equal(t.workflow_finalizado, false);

            const linhas = await prisma().transferenciaAndamento.findMany({
                where: { transferencia_id: id, removido_em: null },
                orderBy: { id: 'asc' },
            });
            assert.deepEqual(
                linhas.map((l) => l.workflow_fase_id),
                [wf.fasePropria.id, wf.faseOutroOrgao.id, wf.faseB.id]
            );
            assert.ok(linhas[0].data_inicio, 'só a primeira fase começa iniciada');
            assert.equal(linhas[1].data_inicio, null);
            assert.equal(linhas[2].data_inicio, null);
            assert.equal(linhas[0].orgao_responsavel_id, seriId, 'fase própria nasce com a SERI');
            assert.equal(linhas[1].orgao_responsavel_id, null, 'fase de outro órgão nasce sem órgão');

            const tarefas = await prisma().tarefa.findMany({
                where: { removido_em: null, tarefa_cronograma: { transferencia_id: id, removido_em: null } },
            });
            assert.equal(tarefas.filter((x) => x.nivel === 1).length, 2, 'uma tarefa por etapa');
            assert.equal(tarefas.filter((x) => x.nivel === 2).length, 5, 'fases + acompanhamento de etapa');
            const etapaA = tarefas.find((x) => x.tarefa === wf.etapaA.nome)!;
            assert.ok(etapaA.inicio_real, 'etapa inicial já começou');
            assert.equal(etapaA.n_filhos_imediatos, 3);
            const espelhoFase1 = tarefas.find((x) => x.tarefa === wf.fasePropria.nome)!;
            assert.equal(espelhoFase1.transferencia_fase_id, linhas[0].id);
            assert.equal(espelhoFase1.duracao_planejado, 5);
            assert.ok(espelhoFase1.termino_planejado, 'projeção de término calculada pelas dependências');
        });

        it('GET workflow-andamento descreve o estado inicial e as flags de ação', async () => {
            const { wf, id } = await novaTransferenciaComWorkflow();
            const corpo = await andamento(id);

            assert.equal(corpo.possui_proxima_etapa, true);
            assert.equal(corpo.pode_passar_para_proxima_etapa, false);
            assert.equal(corpo.pode_reabrir_fase, false);
            assert.equal(corpo.pode_reiniciar_workflow, true);
            assert.equal(corpo.pode_limpar_workflow, true);
            assert.equal(corpo.workflow_desatualizado, false);

            const [etapaA, etapaB] = corpo.fluxo;
            assert.equal(etapaA.atual, true);
            assert.equal(etapaA.concluida, false);
            assert.equal(etapaB.atual, false);

            const f1 = faseNoAndamento(corpo, wf.fasePropria.id).andamento;
            assert.equal(f1.atual, true);
            assert.equal(f1.orgao_responsavel.id, seriId);
            const f2 = faseNoAndamento(corpo, wf.faseOutroOrgao.id);
            assert.equal(f2.andamento.atual, false);
            assert.equal(f2.andamento.necessita_preencher_orgao, true);
            assert.deepEqual(f2.situacoes.map((x: { id: number }) => x.id).sort(), [...wf.situacoes].sort());
        });

        it('GET workflow-andamento exige transferencia_id e 404 para transferência inexistente', async () => {
            assertStatus(await casaCivil(s).get('/api/workflow-andamento'), 400);
            assertStatus(await casaCivil(s).get('/api/workflow-andamento?transferencia_id=999999'), 404);
        });

        it('tipo sem workflow ativo: andamento vazio, sem reinício possível', async () => {
            const id = await criarTransferencia(s);
            const corpo = await andamento(id);
            assert.equal(corpo.pode_reiniciar_workflow, false);
            assert.equal(corpo.pode_limpar_workflow, false);
            assert.equal(corpo.possui_proxima_etapa, false);
            assert.equal((await estado(id)).workflow_id, null);
        });
    });

    describe('avanço de fases e etapas', () => {
        it('percorre o workflow inteiro e mantém coluna de controle, cronograma, consolidado e view coerentes', async () => {
            const { wf, id } = await novaTransferenciaComWorkflow();
            const fila = await prisma().$queryRaw<{ n: bigint }[]>`
                select count(*) n from task_queue
                where type = 'refresh_transferencia' and (params->>'transferencia_id')::int = ${id}::int`;
            assert.ok(Number(fila[0].n) > 0, 'triggers enfileiram refresh_transferencia na criação');
            assert.equal((await view(id)).workflow_fase_atual_id, wf.fasePropria.id);

            // iniciar fase com a anterior ainda aberta
            const cedo = await fase('iniciar', id, wf.faseOutroOrgao.id);
            assertStatus(cedo, 400);
            assert.match(cedo.body.message, /precisa ser finalizada antes/);

            // finaliza fase 1
            assertStatus(await fase('finalizar', id, wf.fasePropria.id), 201);
            const f1 = await andamentoDb(id, wf.fasePropria.id);
            assert.ok(f1.data_termino);
            const espelho1 = await tarefaDaFase(id, wf.fasePropria.nome);
            assert.equal(Number(espelho1.percentual_concluido), 100);
            assert.ok(espelho1.termino_real);
            assert.equal(espelho1.fase_atual_workflow, false);

            const refinalizar = await fase('finalizar', id, wf.fasePropria.id);
            assertStatus(refinalizar, 400);
            assert.match(refinalizar.body.message, /já foi finalizada/);

            const corpo1 = await andamento(id);
            assert.equal(corpo1.pode_reabrir_fase, true);
            assert.equal(faseNoAndamento(corpo1, wf.fasePropria.id).andamento.concluida, true);

            // fase de outra etapa não pode ser iniciada daqui
            const foraDaEtapa = await fase('iniciar', id, wf.faseB.id);
            assertStatus(foraDaEtapa, 400);
            assert.match(foraDaEtapa.body.message, /próxima fase na etapa atual/);

            // inicia fase 2
            assertStatus(await fase('iniciar', id, wf.faseOutroOrgao.id), 201);
            assert.equal((await estado(id)).workflow_fase_atual_id, wf.faseOutroOrgao.id);
            const espelho2 = await tarefaDaFase(id, wf.faseOutroOrgao.nome);
            assert.equal(espelho2.fase_atual_workflow, true);
            assert.ok(espelho2.inicio_real);
            assert.equal((await view(id)).workflow_fase_atual_id, wf.faseOutroOrgao.id);

            const aberta = await consolidado(id);
            assert.equal(aberta.length, 1);
            assert.equal(aberta[0].situacao, wf.faseOutroOrgao.nome);
            assert.equal(aberta[0].data_origem, 'Cronograma');
            assert.deepEqual(aberta[0].orgaos_envolvidos, []);

            // preenche órgão e situação da fase 2: o consolidado enxerga o órgão
            assertStatus(
                await patchFase(id, wf.faseOutroOrgao.id, { situacao_id: wf.situacoes[0], orgao_responsavel_id: 1 }),
                200
            );
            const comOrgao = await consolidado(id);
            assert.deepEqual(comOrgao[0].orgaos_envolvidos, [1]);
            const f2 = faseNoAndamento(await andamento(id), wf.faseOutroOrgao.id).andamento;
            assert.equal(f2.situacao.id, wf.situacoes[0]);
            assert.equal(f2.orgao_responsavel.id, 1);
            assert.equal(f2.pessoa_responsavel.id, s.pessoa.id, 'fase de outro órgão grava quem alterou a situação');
            const espelho2b = await tarefaDaFase(id, wf.faseOutroOrgao.nome);
            assert.equal(espelho2b.orgao_id, 1);
            assert.equal(espelho2b.recursos, s.pessoa.nome_exibicao);

            // finalizar a última fase da etapa A inicia a etapa B sozinho
            assertStatus(await fase('finalizar', id, wf.faseOutroOrgao.id), 201);
            const t = await estado(id);
            assert.equal(t.workflow_etapa_atual_id, wf.etapaB.id);
            assert.equal(t.workflow_fase_atual_id, wf.faseB.id);
            const f3 = await andamentoDb(id, wf.faseB.id);
            assert.ok(f3.data_inicio);
            assert.equal(f3.orgao_responsavel_id, seriId);
            const tarefaEtapaA = await tarefaDaFase(id, wf.etapaA.nome);
            assert.ok(tarefaEtapaA.termino_real, 'tarefa da etapa A encerrada');
            assert.equal(tarefaEtapaA.fase_atual_workflow, false);
            assert.equal((await tarefaDaFase(id, wf.faseB.nome)).fase_atual_workflow, true);

            const emB = await consolidado(id);
            assert.equal(emB.length, 1);
            assert.equal(emB[0].situacao, wf.faseB.nome);
            assert.deepEqual(emB[0].orgaos_envolvidos, [seriId]);
            const v = await view(id);
            assert.equal(v.workflow_etapa_atual_id, wf.etapaB.id);
            assert.equal(v.workflow_fase_atual_id, wf.faseB.id);

            const corpo2 = await andamento(id);
            assert.equal(corpo2.fluxo[0].concluida, true);
            assert.equal(corpo2.fluxo[0].atual, false);
            assert.equal(corpo2.fluxo[1].atual, true);

            // finalizar a última fase do workflow
            assertStatus(await fase('finalizar', id, wf.faseB.id), 201);
            assert.equal((await estado(id)).workflow_finalizado, true);
            assert.deepEqual(await consolidado(id), [], 'workflow concluído não tem situação em aberto');
            assert.equal((await view(id)).workflow_finalizado, true);
            const fim = await andamento(id);
            assert.equal(fim.possui_proxima_etapa, false);
            assert.equal(fim.pode_passar_para_proxima_etapa, false);
        });

        it('reabrir-fase-anterior: com fase atual aberta, reabre a anterior e desfaz o início da atual', async () => {
            const { wf, id } = await novaTransferenciaComWorkflow();
            assertStatus(await fase('finalizar', id, wf.fasePropria.id), 201);
            assertStatus(await fase('iniciar', id, wf.faseOutroOrgao.id), 201);

            assertStatus(await fase('reabrir-fase-anterior', id), 201);

            const t = await estado(id);
            assert.equal(t.workflow_fase_atual_id, wf.fasePropria.id);
            const f1 = await andamentoDb(id, wf.fasePropria.id);
            assert.equal(f1.data_termino, null);
            const f2 = await andamentoDb(id, wf.faseOutroOrgao.id);
            assert.equal(f2.data_inicio, null);

            const espelho1 = await tarefaDaFase(id, wf.fasePropria.nome);
            assert.equal(Number(espelho1.percentual_concluido), 0);
            assert.equal(espelho1.termino_real, null);
            assert.equal(espelho1.fase_atual_workflow, true);
            assert.equal((await tarefaDaFase(id, wf.faseOutroOrgao.nome)).fase_atual_workflow, false);

            const historico = await prisma().transferenciaHistorico.findMany({
                where: { transferencia_id: id, acao: 'ReaberturaFaseWorkflow' },
            });
            assert.equal(historico.length, 1);
            const dados = JSON.parse(historico[0].dados_extra as string);
            assert.equal(dados.faseReaberta.fase, wf.fasePropria.nome);
            assert.equal(dados.faseIncompleta.fase, wf.faseOutroOrgao.nome);

            const consol = await consolidado(id);
            assert.equal(consol.length, 1);
            assert.equal(consol[0].situacao, wf.fasePropria.nome);
        });

        it('reabrir-fase-anterior: 400 quando não há fase anterior concluída', async () => {
            const { id } = await novaTransferenciaComWorkflow();
            const res = await fase('reabrir-fase-anterior', id);
            assertStatus(res, 400);
            assert.match(res.body.message, /fase anterior/);
        });

        it('iniciar-prox-etapa sem fases concluídas responde 400', async () => {
            const { id } = await novaTransferenciaComWorkflow();
            const res = await casaCivil(s).post('/api/workflow-andamento/iniciar-prox-etapa').send({ transferencia_id: id });
            assertStatus(res, 400);
            assert.match(res.body.message, /sem linhas de andamento/);
        });

        it('reabrir a última fase de um workflow concluído devolve a situação ao consolidado', async () => {
            const { wf, id } = await novaTransferenciaComWorkflow();
            await percorrerAteOFim(wf, id);
            assert.deepEqual(await consolidado(id), []);

            assertStatus(await fase('reabrir-fase-anterior', id), 201);

            const consol = await consolidado(id);
            assert.equal(consol.length, 1);
            assert.equal(consol[0].situacao, wf.faseB.nome);
            assert.equal((await andamentoDb(id, wf.faseB.id)).data_termino, null);
        });

        it(
            'reabrir fase de workflow concluído volta workflow_finalizado para false',
            { todo: 'BUG: reabrirFaseAnterior não zera transferencia.workflow_finalizado (workflow-andamento-fase.service.ts:885)' },
            async () => {
                const { wf, id } = await novaTransferenciaComWorkflow();
                await percorrerAteOFim(wf, id);
                assertStatus(await fase('reabrir-fase-anterior', id), 201);
                assert.equal((await estado(id)).workflow_finalizado, false);
                assert.equal((await view(id)).workflow_finalizado, false);
            }
        );

        it(
            'a fase inicial aberta aparece no consolidado como situação atual',
            { todo: 'BUG: startWorkflow não marca fase_atual_workflow na tarefa da 1a fase (transferencia.service.ts:2191), consolidado fica "Aguardando liberação"' },
            async () => {
                const { wf, id } = await novaTransferenciaComWorkflow();
                const consol = await consolidado(id);
                assert.equal(consol.length, 1);
                assert.equal(consol[0].situacao, wf.fasePropria.nome);
            }
        );

        it('sem nenhuma fase em aberto no cronograma, o consolidado mostra a linha virtual de espera', async () => {
            const { id } = await novaTransferenciaComWorkflow();
            await prisma().tarefa.updateMany({
                where: { tarefa_cronograma: { transferencia_id: id } },
                data: { fase_atual_workflow: false },
            });
            const consol = await consolidado(id);
            assert.equal(consol.length, 1);
            assert.equal(consol[0].situacao, 'Aguardando liberação da próxima fase');
            assert.equal(consol[0].data_origem, 'Workflow');
            assert.equal(consol[0].data, null);
        });

        it('consolidado ignora tarefa sem término planejado, concluída ou removida', async () => {
            const { wf, id } = await novaTransferenciaComWorkflow();
            assertStatus(await fase('finalizar', id, wf.fasePropria.id), 201);
            assertStatus(await fase('iniciar', id, wf.faseOutroOrgao.id), 201);
            const espelho = await tarefaDaFase(id, wf.faseOutroOrgao.nome);
            assert.equal((await consolidado(id))[0].situacao, wf.faseOutroOrgao.nome);

            await prisma().tarefa.update({ where: { id: espelho.id }, data: { percentual_concluido: 100 } });
            assert.equal((await consolidado(id))[0].data_origem, 'Workflow');

            await prisma().tarefa.update({ where: { id: espelho.id }, data: { percentual_concluido: 0, removido_em: new Date() } });
            assert.equal((await consolidado(id))[0].data_origem, 'Workflow');
        });
    });

    describe('edição da fase (PATCH workflow-andamento-fase)', () => {
        it('valida situação, responsabilidade e existência de andamento', async () => {
            const { wf, id } = await novaTransferenciaComWorkflow();
            assertStatus(await fase('finalizar', id, wf.fasePropria.id), 201);
            assertStatus(await fase('iniciar', id, wf.faseOutroOrgao.id), 201);

            const situacaoFora = await casaCivil(s)
                .post('/api/workflow-situacao')
                .send({ situacao: uniq('situacao fora'), tipo_situacao: 'Suspenso' });
            const foraDaConfig = await patchFase(id, wf.faseOutroOrgao.id, { situacao_id: situacaoFora.body.id });
            assertStatus(foraDaConfig, 400);
            assert.match(foraDaConfig.body.message, /Situação não está presente/);

            const seriEmOutroOrgao = await patchFase(id, wf.faseOutroOrgao.id, { orgao_responsavel_id: seriId });
            assertStatus(seriEmOutroOrgao, 400);
            assert.match(seriEmOutroOrgao.body.message, /outro órgão/);

            const propriaComOutroOrgao = await patchFase(id, wf.fasePropria.id, { orgao_responsavel_id: 1 });
            assertStatus(propriaComOutroOrgao, 400);
            assert.match(propriaComOutroOrgao.body.message, /responsabilidade própria/);

            const semAndamento = await patchFase(id, 999999, {});
            assertStatus(semAndamento, 400);
            assert.match(semAndamento.body.message, /registro de andamento/);

            const semNada = await casaCivil(s).patch('/api/workflow-andamento-fase').send({});
            assertStatus(semNada, 400);
        });
    });

    describe('transferência cancelada', () => {
        it('bloqueia toda movimentação do workflow e congela as flags de ação', async () => {
            const { wf, id } = await novaTransferenciaComWorkflow();
            assertStatus(await fase('finalizar', id, wf.fasePropria.id), 201);
            assertStatus(await casaCivil(s).post(`/api/transferencia/${id}/cancelar`), 201);

            const bloqueios = [
                await fase('finalizar', id, wf.faseOutroOrgao.id),
                await fase('iniciar', id, wf.faseOutroOrgao.id),
                await fase('reabrir-fase-anterior', id),
                await patchFase(id, wf.faseOutroOrgao.id, { orgao_responsavel_id: 1 }),
                await casaCivil(s).post('/api/workflow-andamento/iniciar-prox-etapa').send({ transferencia_id: id }),
                await casaCivil(s).post(`/api/transferencia/${id}/reiniciar-workflow`),
                await casaCivil(s).post(`/api/transferencia/${id}/limpar-workflow`),
            ];
            for (const res of bloqueios) {
                assertStatus(res, 400);
                assert.match(res.body.message, /cancelada não permite/);
            }

            const corpo = await andamento(id);
            assert.equal(corpo.transferencia_cancelada, true);
            assert.equal(corpo.pode_reabrir_fase, false);
            assert.equal(corpo.pode_reiniciar_workflow, false);
            assert.equal(corpo.pode_limpar_workflow, false);
            assert.ok((await andamentoDb(id, wf.fasePropria.id)).data_termino, 'andamento intacto');
        });
    });

    describe('limpar e reiniciar workflow', () => {
        it('limpar remove andamento e cronograma (soft delete), registra histórico e zera o consolidado de tarefas', async () => {
            const { wf, id } = await novaTransferenciaComWorkflow();
            assertStatus(await fase('finalizar', id, wf.fasePropria.id), 201);

            assertStatus(await casaCivil(s).post(`/api/transferencia/${id}/limpar-workflow`), 201);

            assert.equal(
                await prisma().transferenciaAndamento.count({ where: { transferencia_id: id, removido_em: null } }),
                0
            );
            assert.equal(
                await prisma().tarefaCronograma.count({ where: { transferencia_id: id, removido_em: null } }),
                0
            );
            assert.equal(
                await prisma().tarefa.count({
                    where: { removido_em: null, tarefa_cronograma: { transferencia_id: id } },
                }),
                0
            );
            assert.equal(
                await prisma().transferenciaHistorico.count({ where: { transferencia_id: id, acao: 'DelecaoWorkflow' } }),
                1
            );

            const corpo = await andamento(id);
            assert.equal(corpo.pode_limpar_workflow, false, 'sem andamento válido não há o que limpar');
            assert.equal(corpo.pode_reiniciar_workflow, true);

            const consol = await consolidado(id);
            assert.deepEqual(
                consol.map((c) => c.data_origem),
                ['Workflow'],
                'só a linha virtual de espera'
            );
        });

        it('reiniciar recria andamento e cronograma do zero e grava ReinicioWorkflow sem DelecaoWorkflow', async () => {
            const { wf, id } = await novaTransferenciaComWorkflow();
            await percorrerAteOFim(wf, id);
            assert.equal((await estado(id)).workflow_finalizado, true);

            assertStatus(await casaCivil(s).post(`/api/transferencia/${id}/reiniciar-workflow`), 201);

            const t = await estado(id);
            assert.equal(t.workflow_finalizado, false);
            assert.equal(t.workflow_etapa_atual_id, wf.etapaA.id);
            assert.equal(t.workflow_fase_atual_id, wf.fasePropria.id);

            const ativas = await prisma().transferenciaAndamento.findMany({
                where: { transferencia_id: id, removido_em: null },
            });
            assert.equal(ativas.length, 3);
            assert.equal(ativas.filter((a) => a.data_inicio).length, 1);
            assert.equal(ativas.filter((a) => a.data_termino).length, 0);
            assert.equal(
                await prisma().transferenciaAndamento.count({ where: { transferencia_id: id, removido_em: { not: null } } }),
                3,
                'andamento antigo preservado como removido'
            );
            assert.equal(
                await prisma().tarefaCronograma.count({ where: { transferencia_id: id, removido_em: null } }),
                1
            );
            const acoes = (
                await prisma().transferenciaHistorico.findMany({ where: { transferencia_id: id } })
            ).map((h) => h.acao);
            assert.deepEqual(acoes, ['ReinicioWorkflow']);

            assert.equal((await consolidado(id)).every((c) => c.situacao !== undefined), true);
            assertStatus(await fase('finalizar', id, wf.fasePropria.id), 201);
        });

        it('workflow desatualizado: reiniciar adota o novo workflow ativo do tipo', async () => {
            const { wf, id } = await novaTransferenciaComWorkflow();
            assertStatus(await casaCivil(s).patch(`/api/workflow/${wf.workflowId}`).send({ ativo: false }), 200);

            const semAtivo = await andamento(id);
            assert.equal(semAtivo.pode_reiniciar_workflow, false);
            const rejeitado = await casaCivil(s).post(`/api/transferencia/${id}/reiniciar-workflow`);
            assertStatus(rejeitado, 400);
            assert.match(rejeitado.body.message, /Não há workflow ativo/);

            const novo = await montarWorkflowAtivo(s, { tipoId: wf.tipoId });
            const desatualizado = await andamento(id);
            assert.equal(desatualizado.workflow_desatualizado, true);
            assert.equal(desatualizado.pode_reiniciar_workflow, true);

            assertStatus(await casaCivil(s).post(`/api/transferencia/${id}/reiniciar-workflow`), 201);
            const t = await estado(id);
            assert.equal(t.workflow_id, novo.workflowId);
            assert.equal(t.workflow_etapa_atual_id, novo.etapaA.id);
            assert.equal((await andamento(id)).workflow_desatualizado, false);

            const historico = await prisma().transferenciaHistorico.findFirstOrThrow({
                where: { transferencia_id: id, acao: 'ReinicioWorkflow' },
            });
            const extra = historico.dados_extra as { workflow_antigo_id: number; workflow_novo_id: number };
            assert.equal(extra.workflow_antigo_id, wf.workflowId);
            assert.equal(extra.workflow_novo_id, novo.workflowId);
        });
    });

    describe('remoção da transferência', () => {
        it('soft delete tira a transferência do consolidado e da view de análise', async () => {
            const { wf, id } = await novaTransferenciaComWorkflow();
            assertStatus(await fase('finalizar', id, wf.fasePropria.id), 201);
            assertStatus(await fase('iniciar', id, wf.faseOutroOrgao.id), 201);
            assert.equal((await consolidado(id)).length, 1);
            assert.ok(await view(id));

            assertStatus(await casaCivil(s).delete(`/api/transferencia/${id}`), 202);

            assert.deepEqual(await consolidado(id), []);
            assert.equal(await view(id), undefined);
            assertStatus(await casaCivil(s).get(`/api/transferencia/${id}`), 404);
            const naLista = await casaCivil(s).get('/api/transferencia?ano=2026&ipp=500');
            assert.equal(naLista.body.linhas.some((l: { id: number }) => l.id === id), false);
        });
    });
});
