import { before, describe, it } from 'node:test';
import { api, assert, assertStatus, bootApp, criarOrgao, criarPessoaComPrivilegios, prisma, Sessao } from '../lib';
import { criaGlobal, gravaSerie, serieVariavelDb } from './_helpers';

describe('ciclo de variável global (Preenchimento, Validação, Liberação)', () => {
    let admin: Sessao;
    let ponto: Sessao;
    let orgaoId: number;
    let grupos: number[];

    before(async () => {
        await bootApp();
        orgaoId = (await criarOrgao()).id;
        admin = await criarPessoaComPrivilegios(['CadastroVariavelGlobal.administrador'], { orgao_id: orgaoId });
        ponto = await criarPessoaComPrivilegios(['CadastroMetaPS.listar'], { orgao_id: orgaoId });
        grupos = [];
        for (const perfil of ['Medicao', 'Validacao', 'Liberacao'] as const) {
            const g = await prisma().grupoResponsavelEquipe.create({
                data: { orgao_id: orgaoId, titulo: `Equipe ${perfil} ${Date.now()}`, perfil },
            });
            await prisma().grupoResponsavelEquipeParticipante.create({
                data: { grupo_responsavel_equipe_id: g.id, orgao_id: orgaoId, pessoa_id: ponto.pessoa.id },
            });
            grupos.push(g.id);
        }
    });

    const mes = async (atras: number): Promise<string> => {
        const [{ d }] = await prisma().$queryRaw<{ d: string }[]>`
            select to_char(date_trunc('month', now() at time zone 'America/Sao_Paulo') - (${atras}::int || ' months')::interval, 'YYYY-MM-DD') d`;
        return d;
    };

    const criaComEquipes = (inicio: string, extra: Record<string, unknown> = {}) =>
        criaGlobal(admin, orgaoId, {
            inicio_medicao: inicio,
            fim_medicao: undefined,
            medicao_orgao_id: orgaoId,
            validacao_orgao_id: orgaoId,
            liberacao_orgao_id: orgaoId,
            medicao_grupo_ids: [grupos[0]],
            validacao_grupo_ids: [grupos[1]],
            liberacao_grupo_ids: [grupos[2]],
            ...extra,
        });

    const ciclo = (variavel_id: number) => prisma().variavelCicloCorrente.findUniqueOrThrow({ where: { variavel_id } });

    const listaCiclo = async (variavel_id: number) => {
        const res = await api(ponto).get('/api/plano-setorial-variavel-ciclo').query({ variavel_id });
        assertStatus(res, 200);
        return res.body.linhas[0] as {
            fase: string;
            ultimo_periodo_valido: string;
            em_atraso: boolean;
            atrasos: string[] | null;
            pode_editar: boolean;
            pedido_complementacao: boolean;
        };
    };

    const envia = (variavel_id: number, data_referencia: string, corpo: Record<string, unknown>) =>
        api(ponto)
            .patch('/api/plano-setorial-variavel-ciclo')
            .send({ variavel_id, data_referencia, valores: [{ valor_realizado: '7' }], ...corpo });

    const aprova = async (v: number, ref: string, valor = '7') =>
        assertStatus(
            await envia(v, ref, { analise_qualitativa: 'ok', aprovar: true, valores: [{ valor_realizado: valor }] }),
            200
        );

    const fluxoCompleto = async (v: number, ref: string, valor = '7') => {
        await aprova(v, ref, valor);
        await aprova(v, ref, valor);
        await aprova(v, ref, valor);
    };

    it('abre em Preenchimento, anda por Validação e Liberação e só grava a série no aceite da Liberação', async () => {
        const ref = await mes(1);
        const v = await criaComEquipes(ref, { acumulativa: true, valor_base: '3' });

        const inicial = await listaCiclo(v);
        assert.equal(inicial.fase, 'Preenchimento');
        assert.equal(inicial.ultimo_periodo_valido, ref);
        assert.equal(inicial.pode_editar, true);
        assert.equal(inicial.em_atraso, false);
        assert.equal(inicial.atrasos, null);

        const semAnalise = await envia(v, ref, { aprovar: true });
        assertStatus(semAnalise, 400);
        assert.match(String(semAnalise.body.message), /análise qualitativa ou pedir complementação/);

        await aprova(v, ref);
        assert.equal((await listaCiclo(v)).fase, 'Validacao');
        await aprova(v, ref);
        assert.equal((await listaCiclo(v)).fase, 'Liberacao');
        assert.deepEqual(await serieVariavelDb(v, 'Realizado'), {}, 'ainda não conferida: não grava a série');

        await aprova(v, ref);
        const final = await ciclo(v);
        assert.equal(final.fase, 'Liberacao');
        assert.equal(final.liberacao_enviada, true);
        assert.equal(final.prazo, null);

        assert.deepEqual(await serieVariavelDb(v, 'Realizado'), { [ref]: 7 });
        const realizado = await prisma().serieVariavel.findFirstOrThrow({
            where: { variavel_id: v, serie: 'Realizado' },
        });
        assert.equal(realizado.conferida, true);
        assert.equal(realizado.atualizado_por, ponto.pessoa.id);
        assert.deepEqual(await serieVariavelDb(v, 'RealizadoAcumulado'), { [ref]: 10 });

        const fases = await prisma().variavelGlobalCicloAnalise.findMany({
            where: { variavel_id: v, referencia_data: new Date(ref), ultima_revisao: true, removido_em: null },
            select: { fase: true, aprovada: true },
        });
        assert.deepEqual(fases.map((f) => f.fase).sort(), ['Liberacao', 'Preenchimento', 'Validacao']);
        assert.ok(fases.every((f) => f.aprovada));

        const fila = await prisma().$queryRaw<{ n: number }[]>`
            select count(*)::int n from task_queue
            where type::text = 'refresh_meta' or (type::text = 'refresh_variavel' and (params->>'variavel_id')::int = ${v}::int)`;
        assert.ok(fila[0].n > 0);
    });

    it('pedido de complementação volta a fase, fica pendente até o reenvio e só vale na Validação ou Liberação', async () => {
        const ref = await mes(1);
        const v = await criaComEquipes(ref);

        const cedo = await envia(v, ref, { pedido_complementacao: 'falta dado' });
        assertStatus(cedo, 400);
        assert.match(String(cedo.body.message), /Não é possível pedir complementação nesta fase/);

        await aprova(v, ref);
        const ambos = await envia(v, ref, { analise_qualitativa: 'x', aprovar: true, pedido_complementacao: 'y' });
        assertStatus(ambos, 400);
        assert.equal((await ciclo(v)).fase, 'Validacao', 'a transação inteira é revertida');

        assertStatus(await envia(v, ref, { pedido_complementacao: 'confira o valor' }), 200);
        const voltou = await listaCiclo(v);
        assert.equal(voltou.fase, 'Preenchimento');
        assert.equal(voltou.pedido_complementacao, true);
        const pedido = await prisma().variavelGlobalPedidoComplementacao.findFirstOrThrow({
            where: { variavel_id: v, ultima_revisao: true },
        });
        assert.equal(pedido.atendido, false);
        assert.equal(pedido.pedido, 'confira o valor');

        await aprova(v, ref);
        const atendido = await prisma().variavelGlobalPedidoComplementacao.findFirstOrThrow({
            where: { variavel_id: v, ultima_revisao: true },
        });
        assert.equal(atendido.atendido, true);
        assert.equal((await listaCiclo(v)).pedido_complementacao, false);

        await aprova(v, ref);
        assert.equal((await listaCiclo(v)).fase, 'Liberacao');
        assertStatus(await envia(v, ref, { pedido_complementacao: 'volte para validar' }), 200);
        assert.equal((await listaCiclo(v)).fase, 'Validacao');
        assert.deepEqual(await serieVariavelDb(v, 'Realizado'), {}, 'nada foi conferido ainda');
    });

    it('recusa data fora do ciclo, valores fora do formato e quem não é da equipe', async () => {
        const ref = await mes(1);
        const v = await criaComEquipes(ref);

        const antiga = await envia(v, await mes(5), { analise_qualitativa: 'x', aprovar: true });
        assertStatus(antiga, 400);

        const casas = await envia(v, ref, {
            analise_qualitativa: 'x',
            aprovar: true,
            valores: [{ valor_realizado: '1.234' }],
        });
        assertStatus(casas, 400);
        assert.equal((await ciclo(v)).fase, 'Preenchimento');

        const estranho = await criarPessoaComPrivilegios(['CadastroMetaPS.listar'], { orgao_id: orgaoId });
        const res = await api(estranho)
            .patch('/api/plano-setorial-variavel-ciclo')
            .send({
                variavel_id: v,
                data_referencia: ref,
                analise_qualitativa: 'x',
                aprovar: true,
                valores: [{ valor_realizado: '1' }],
            });
        assertStatus(res, 400);
        assert.match(String(res.body.message), /Variável não encontrada, ou não tem permissão/);
        const lista = await api(estranho).get('/api/plano-setorial-variavel-ciclo').query({ variavel_id: v });
        assert.deepEqual(lista.body.linhas, []);
    });

    it('ciclos atrasados são cumpridos do mais antigo para o mais novo', async () => {
        const m3 = await mes(3);
        const m2 = await mes(2);
        const m1 = await mes(1);
        const v = await criaComEquipes(m3);

        const a = await listaCiclo(v);
        assert.equal(a.ultimo_periodo_valido, m3);
        assert.equal(a.em_atraso, true);
        assert.deepEqual(a.atrasos, [m3, m2]);

        await fluxoCompleto(v, m3, '1');
        const b = await listaCiclo(v);
        assert.equal(b.ultimo_periodo_valido, m2);
        assert.equal(b.fase, 'Preenchimento');
        assert.equal(b.em_atraso, true);
        assert.deepEqual(b.atrasos, [m2]);

        await fluxoCompleto(v, m2, '2');
        const c = await listaCiclo(v);
        assert.equal(c.ultimo_periodo_valido, m1);
        assert.equal(c.em_atraso, false);
        assert.equal(c.atrasos, null);

        assert.deepEqual(await serieVariavelDb(v, 'Realizado'), { [m3]: 1, [m2]: 2 });
    });

    it('administrador que grava a série direto libera o mês (liberação automática) e apagar o valor reabre', async () => {
        const m2 = await mes(2);
        const m1 = await mes(1);
        const v = await criaComEquipes(m2);
        assert.equal((await listaCiclo(v)).ultimo_periodo_valido, m2);

        await gravaSerie(admin, '/api/variavel-serie', `/api/variavel/${v}/serie`, [
            { periodo: m2, tipo: 'R_', valor: '4' },
        ]);
        const liberacao = await prisma().variavelGlobalCicloAnalise.findFirstOrThrow({
            where: { variavel_id: v, fase: 'Liberacao', referencia_data: new Date(m2), removido_em: null },
        });
        assert.equal(liberacao.eh_liberacao_auto, true);

        const avancou = await listaCiclo(v);
        assert.equal(avancou.ultimo_periodo_valido, m1);
        assert.equal(avancou.em_atraso, false);

        await gravaSerie(admin, '/api/variavel-serie', `/api/variavel/${v}/serie`, [
            { periodo: m2, tipo: 'R_', valor: '' },
        ]);
        const removida = await prisma().variavelGlobalCicloAnalise.findFirstOrThrow({
            where: { id: liberacao.id },
        });
        assert.notEqual(removida.removido_em, null);
        assert.equal(removida.ultima_revisao, false);
        const reabriu = await listaCiclo(v);
        assert.equal(reabriu.ultimo_periodo_valido, m2);
        assert.equal(reabriu.em_atraso, true);
    });

    it('aceite com valor vazio é recusado e a série conferida fica intacta', async () => {
        const ref = await mes(1);
        const v = await criaComEquipes(ref);
        await gravaSerie(admin, '/api/variavel-serie', `/api/variavel/${v}/serie`, [
            { periodo: ref, tipo: 'R_', valor: '5' },
        ]);
        const antes = await listaCiclo(v);
        assert.equal(antes.fase, 'Liberacao');
        assert.deepEqual(await serieVariavelDb(v, 'RealizadoAcumulado'), { [ref]: 5 });

        const res = await envia(v, ref, {
            analise_qualitativa: 'sem dado',
            aprovar: true,
            valores: [{ valor_realizado: '' }],
        });
        assertStatus(res, 400);
        assert.match(String(res.body.message), /não pode estar vazio/);
        assert.deepEqual(await serieVariavelDb(v, 'Realizado'), { [ref]: 5 });
        assert.deepEqual(await serieVariavelDb(v, 'RealizadoAcumulado'), { [ref]: 5 });
    });

    describe('variável suspensa', () => {
        // o PATCH dispara o processamento em segundo plano (sem await): espera ele terminar antes de chamar o endpoint manual
        const suspende = async (v: number, ultimoCiclo: string) => {
            assertStatus(await api(admin).patch(`/api/variavel/${v}`).send({ suspendida: true }), 200);
            for (let i = 0; i < 100; i++) {
                const feito = await prisma().variavelSuspensaControle.count({
                    where: {
                        variavel_id: v,
                        serie: 'Realizado',
                        ciclo_referencia: new Date(ultimoCiclo),
                        removido_em: null,
                    },
                });
                if (feito >= 1) return;
                await new Promise((r) => setTimeout(r, 100));
            }
            throw new Error('processamento automático da variável suspensa não terminou');
        };
        const processa = async (v: number): Promise<number[]> => {
            const res = await api(admin).post('/api/processa-variaveis-globais-suspensas').query({ variavel_id: v });
            assertStatus(res, 201);
            return res.body;
        };

        it('não acumulativa: repete o último valor conferido nos ciclos abertos e registra o controle', async () => {
            const [m3, m2, m1] = [await mes(3), await mes(2), await mes(1)];
            const v = await criaComEquipes(m3);
            await gravaSerie(admin, '/api/variavel-serie', `/api/variavel/${v}/serie`, [
                { periodo: m3, tipo: 'R_', valor: '5' },
            ]);
            assert.equal((await listaCiclo(v)).ultimo_periodo_valido, m2);

            await suspende(v, m1);

            assert.deepEqual(await serieVariavelDb(v, 'Realizado'), { [m3]: 5, [m2]: 5, [m1]: 5 });
            assert.deepEqual(await serieVariavelDb(v, 'RealizadoAcumulado'), { [m3]: 5, [m2]: 5, [m1]: 5 });
            const copiado = await prisma().serieVariavel.findFirstOrThrow({
                where: { variavel_id: v, serie: 'Realizado', data_valor: new Date(m1) },
            });
            assert.equal(copiado.conferida, true);
            assert.equal(copiado.atualizado_por, -1);

            const controle = await prisma().variavelSuspensaControle.findMany({
                where: { variavel_id: v, serie: 'Realizado' },
            });
            assert.deepEqual(controle.map((c) => c.ciclo_referencia!.toISOString().slice(0, 10)).sort(), [m2, m1]);

            assert.deepEqual(await processa(v), [], 'o endpoint manual não reprocessa ciclos já tratados');
        });

        it('acumulativa: preenche com zero e a série acumulada fica parada no último total', async () => {
            const [m3, m2, m1] = [await mes(3), await mes(2), await mes(1)];
            const v = await criaComEquipes(m3, { acumulativa: true, valor_base: '10' });
            await gravaSerie(admin, '/api/variavel-serie', `/api/variavel/${v}/serie`, [
                { periodo: m3, tipo: 'R_', valor: '4' },
            ]);
            await suspende(v, m1);

            assert.deepEqual(await serieVariavelDb(v, 'Realizado'), { [m3]: 4, [m2]: 0, [m1]: 0 });
            assert.deepEqual(await serieVariavelDb(v, 'RealizadoAcumulado'), { [m3]: 14, [m2]: 14, [m1]: 14 });
        });
    });
});
