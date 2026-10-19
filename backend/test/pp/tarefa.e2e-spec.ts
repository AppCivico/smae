import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarOrgao,
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    prisma,
    Sessao,
    uniq,
} from '../lib';
import { cenarioObras, criarPortfolio, criarProjeto } from './_helpers';

describe('projeto-tarefa', () => {
    let orgaoA: { id: number };
    let orgaoB: { id: number };
    let admin: Sessao;
    let gestorA: Sessao;
    let colaboradorFora: Sessao;
    let semPrivilegio: Sessao;
    let adminOrgaoB: Sessao;
    let projetoA: { id: number };

    const tarefa = (dados: Record<string, unknown> = {}) => ({
        orgao_id: orgaoA.id,
        nivel: 1,
        numero: 1,
        tarefa_pai_id: null,
        tarefa: uniq('Tarefa'),
        descricao: 'Descrição da tarefa',
        recursos: 'Equipe',
        ...dados,
    });

    before(async () => {
        await bootApp();
        orgaoA = await criarOrgao();
        orgaoB = await criarOrgao();
        admin = await criarPessoaComPrivilegios(['Projeto.administrador', 'Projeto.administrar_portfolios'], {
            orgao_id: orgaoA.id,
        });
        gestorA = await criarPessoaComPrivilegios(['SMAE.gestor_de_projeto'], { orgao_id: orgaoA.id });
        colaboradorFora = await criarPessoaComPrivilegios(['SMAE.colaborador_de_projeto'], { orgao_id: orgaoA.id });
        semPrivilegio = await criarPessoaSemPrivilegios();
        adminOrgaoB = await criarPessoaComPrivilegios(['Projeto.administrador_no_orgao'], { orgao_id: orgaoB.id });
        const portfolio = await criarPortfolio(admin, 'PP', { orgaos: [orgaoA.id] });
        projetoA = await criarProjeto(admin, 'PP', {
            portfolio_id: portfolio.id,
            responsaveis_no_orgao_gestor: [gestorA.pessoa.id],
        });
    });

    describe('autenticação, privilégios e validação', () => {
        it('401 sem token e 403 sem papel de projeto', async () => {
            assertStatus(await api().get(`/api/projeto/${projetoA.id}/tarefa`), 401);
            assertStatus(await api(semPrivilegio).get(`/api/projeto/${projetoA.id}/tarefa`), 403);
            assertStatus(await api(semPrivilegio).post(`/api/projeto/${projetoA.id}/tarefa`).send(tarefa()), 403);
        });

        it('400 com nivel fora de 1..32 e com :id não numérico', async () => {
            assertStatus(await api(gestorA).post(`/api/projeto/${projetoA.id}/tarefa`).send(tarefa({ nivel: 0 })), 400);
            assertStatus(await api(gestorA).get('/api/projeto/abc/tarefa'), 400);
        });

        it('400 para colaborador fora da equipe e órgão que não vê o projeto', async () => {
            const fora = await api(colaboradorFora).post(`/api/projeto/${projetoA.id}/tarefa`).send(tarefa());
            assertStatus(fora, 400);
            assertStatus(await api(adminOrgaoB).get(`/api/projeto/${projetoA.id}/tarefa`), 400);
        });
    });

    describe('hierarquia', () => {
        let raiz: { id: number };
        let filha: { id: number };
        const nomeRaiz = uniq('Raiz');

        before(async () => {
            // tarefas de nível > 1 só são aceitas depois do Registrado
            await prisma().projeto.update({ where: { id: projetoA.id }, data: { status: 'EmPlanejamento' } });
            const r = await api(gestorA).post(`/api/projeto/${projetoA.id}/tarefa`).send(tarefa({ tarefa: nomeRaiz }));
            assertStatus(r, 201);
            raiz = r.body;
            const f = await api(gestorA)
                .post(`/api/projeto/${projetoA.id}/tarefa`)
                .send(tarefa({ nivel: 2, numero: 1, tarefa_pai_id: raiz.id }));
            assertStatus(f, 201);
            filha = f.body;
        });

        it('400 para nível acima de 1 sem tarefa pai', async () => {
            const res = await api(gestorA)
                .post(`/api/projeto/${projetoA.id}/tarefa`)
                .send(tarefa({ nivel: 2, numero: 9 }));
            assertStatus(res, 400);
            assert.match(res.body.message, /necessitam de uma tarefa pai/);
        });

        it('400 com tarefa pai de outro projeto ou inexistente', async () => {
            const res = await api(gestorA)
                .post(`/api/projeto/${projetoA.id}/tarefa`)
                .send(tarefa({ nivel: 2, numero: 9, tarefa_pai_id: 999999 }));
            assertStatus(res, 400);
            assert.match(res.body.message, /não foi encontrada no projeto/);
        });

        it('lista com projeto e portfólio, e lê a tarefa filha', async () => {
            const lista = await api(gestorA).get(`/api/projeto/${projetoA.id}/tarefa`);
            assertStatus(lista, 200);
            assert.equal(lista.body.projeto.id, projetoA.id);
            assert.ok(lista.body.portfolio.id);
            const nomes = lista.body.linhas.map((l: { tarefa: string }) => l.tarefa);
            assert.ok(nomes.includes(nomeRaiz));

            const lido = await api(gestorA).get(`/api/projeto/${projetoA.id}/tarefa/${filha.id}`);
            assertStatus(lido, 200);
            assert.equal(lido.body.nivel, 2);
        });

        it('hierarquia do projeto responde com as tarefas', async () => {
            const res = await api(gestorA).get(`/api/projeto/${projetoA.id}/tarefas-hierarquia`);
            assertStatus(res, 200);
            const numRaiz = res.body[raiz.id];
            assert.ok(numRaiz);
            assert.ok(res.body[filha.id]?.startsWith(`${numRaiz}.`), `filha fora da raiz: ${JSON.stringify(res.body)}`);
        });

        it('edita o nome da tarefa', async () => {
            const novo = uniq('Editada');
            assertStatus(await api(gestorA).patch(`/api/projeto/${projetoA.id}/tarefa/${filha.id}`).send({ tarefa: novo }), 200);
            assert.equal((await api(gestorA).get(`/api/projeto/${projetoA.id}/tarefa/${filha.id}`)).body.tarefa, novo);
        });

        it('não apaga tarefa com filhas; apaga a filha e depois a raiz (202)', async () => {
            const res = await api(gestorA).delete(`/api/projeto/${projetoA.id}/tarefa/${raiz.id}`);
            assertStatus(res, 400);
            assert.match(res.body.message, /Apague primeiro as tarefas filhas/);

            assertStatus(await api(gestorA).delete(`/api/projeto/${projetoA.id}/tarefa/${filha.id}`), 202);
            assertStatus(await api(gestorA).delete(`/api/projeto/${projetoA.id}/tarefa/${raiz.id}`), 202);
        });
    });

    describe('caminho crítico', () => {
        it('grava folga, tarefas críticas e o caminho no recálculo da listagem', async () => {
            const portfolio = await criarPortfolio(admin, 'PP', { orgaos: [orgaoA.id] });
            const projeto = await criarProjeto(admin, 'PP', {
                portfolio_id: portfolio.id,
                responsaveis_no_orgao_gestor: [gestorA.pessoa.id],
            });
            const rota = `/api/projeto/${projeto.id}/tarefa`;
            const criar = async (dados: Record<string, unknown>) => {
                const r = await api(gestorA).post(rota).send(tarefa(dados));
                assertStatus(r, 201);
                return r.body.id as number;
            };

            const t1 = await criar({
                numero: 1,
                inicio_planejado: '2026-01-01',
                termino_planejado: '2026-01-05',
                duracao_planejado: 5,
            });
            const t2 = await criar({
                numero: 2,
                duracao_planejado: 6,
                dependencias: [{ dependencia_tarefa_id: t1, tipo: 'termina_pro_inicio', latencia: 0 }],
            });
            const t3 = await criar({
                numero: 3,
                inicio_planejado: '2026-01-01',
                termino_planejado: '2026-01-03',
                duracao_planejado: 3,
            });

            const lista = await api(gestorA).get(rota);
            assertStatus(lista, 200);
            const porId = new Map(lista.body.linhas.map((l: { id: number }) => [l.id, l]));
            const ymd = (d: string | null) => d?.substring(0, 10) ?? null;
            assert.equal(ymd((porId.get(t2) as any).termino_planejado), '2026-01-10');
            assert.deepEqual(
                [t1, t2, t3].map((id) => {
                    const l = porId.get(id) as any;
                    return [l.folga, l.eh_critica, ymd(l.termino_mais_tarde)];
                }),
                [
                    [0, true, '2026-01-05'],
                    [0, true, '2026-01-10'],
                    [7, false, '2026-01-10'],
                ]
            );

            const crono = await prisma().tarefaCronograma.findFirstOrThrow({ where: { projeto_id: projeto.id } });
            assert.deepEqual(crono.caminho_critico, [t1, t2]);
            const gravada = await prisma().tarefa.findUniqueOrThrow({ where: { id: t3 } });
            assert.equal(gravada.folga, 7);
            assert.equal(gravada.eh_critica, false);

            const detalhe = await api(gestorA).get(`/api/projeto/${projeto.id}`);
            assertStatus(detalhe, 200);
            assert.deepEqual(detalhe.body.tarefa_cronograma.caminho_critico, [t1, t2]);

            const lida = await api(gestorA).get(`${rota}/${t3}`);
            assert.equal(lida.body.inicio_mais_tarde, '2026-01-08');
        });
    });

    describe('obras (projeto-mdo/tarefas-hierarquia)', () => {
        it(
            'hierarquia de obra responde 200 para quem edita a obra',
            async () => {
                const obras = await cenarioObras();
                const obra = await criarProjeto(obras.adminMdo, 'MDO', { portfolio_id: obras.portfolio.id });
                assertStatus(await api(obras.adminMdo).get(`/api/projeto-mdo/${obra.id}/tarefas-hierarquia`), 200);
            }
        );
    });
});
