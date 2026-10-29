import { before, describe, it } from 'node:test';
import { api, assert, assertStatus, bootApp, criarOrgao, criarPessoaComPrivilegios, prisma, Sessao, uniq } from '../lib';
import { corpoTarefa, periodo, periodoReal } from './_helpers';
import { Cronograma, novoCronograma } from './_cronograma';

const escreveComo = (c: Cronograma, id: number, s: Sessao) => api(s).patch(`${c.base}/tarefa/${id}`).send({ tarefa: 'x' });

async function liberarLeitura(c: Cronograma, pessoa: Sessao) {
    const db = prisma();
    const criador = c.sessao.pessoa.id;
    const grupo = await db.grupoPortfolio.create({
        data: { titulo: uniq('Grupo'), criado_por: criador, orgao_id: c.orgao_id, tipo_projeto: c.tipo },
    });
    await db.grupoPortfolioPessoa.create({
        data: { grupo_portfolio_id: grupo.id, pessoa_id: pessoa.pessoa.id, orgao_id: c.orgao_id, criado_por: criador },
    });
    await db.projetoGrupoPortfolio.create({
        data: { grupo_portfolio_id: grupo.id, projeto_id: c.projeto_id, criado_por: criador },
    });
}

describe('tarefa permissões (PP): responsável, equipe e gestor', () => {
    before(async () => {
        await bootApp();
    });

    async function cenario() {
        const c = await novoCronograma('PP');
        const responsavel = await criarPessoaComPrivilegios(['SMAE.colaborador_de_projeto'], { orgao_id: c.orgao_id });
        const colega = await criarPessoaComPrivilegios(['SMAE.colaborador_de_projeto'], { orgao_id: c.orgao_id });
        const gestorPortfolio = await criarPessoaComPrivilegios(['SMAE.gestor_de_projeto'], { orgao_id: c.orgao_id });
        const espectador = await criarPessoaComPrivilegios(['SMAE.espectador_de_projeto'], { orgao_id: c.orgao_id });
        await prisma().projeto.update({ where: { id: c.projeto_id }, data: { responsavel_id: responsavel.pessoa.id } });
        await liberarLeitura(c, espectador);
        const t = await c.criar({ ...periodo('2033-01-01', 10), tarefa: 'Original' });
        const escreve = (s: Sessao, dados: object) => api(s).patch(`${c.base}/tarefa/${t.id}`).send(dados);
        return { c, t, responsavel, colega, gestorPortfolio, espectador, escreve };
    }

    it('em planejamento o responsável cria e edita tarefas; colaborador fora da equipe e espectador não', async () => {
        const { c, t, responsavel, colega, espectador, escreve } = await cenario();

        const criada = await api(responsavel).post(`${c.base}/tarefa`).send(corpoTarefa(c.orgao_id, { numero: 2 }));
        assertStatus(criada, 201);
        assertStatus(await escreve(responsavel, { tarefa: 'Editada pelo responsável' }), 200);
        assert.equal((await c.ler(t.id)).tarefa, 'Editada pelo responsável');

        assertStatus(await escreve(colega, { tarefa: 'x' }), 400);
        assertStatus(await api(colega).post(`${c.base}/tarefa`).send(corpoTarefa(c.orgao_id)), 400);
        assertStatus(await escreve(espectador, { tarefa: 'x' }), 403);
        assertStatus(await api(espectador).delete(`${c.base}/tarefa/${t.id}`), 403);
        assertStatus(await api(espectador).get(`${c.base}/tarefa/${t.id}`), 200);
        assertStatus(await api(espectador).get(`${c.base}/tarefas-hierarquia`), 200);
        assert.equal((await c.ler(t.id)).tarefa, 'Editada pelo responsável');
    });

    it('colaborador na equipe do projeto também edita em planejamento', async () => {
        const { c, t, colega, escreve } = await cenario();
        assertStatus(await escreve(colega, { tarefa: 'x' }), 400);
        await prisma().projetoEquipe.create({ data: { projeto_id: c.projeto_id, pessoa_id: colega.pessoa.id, orgao_id: c.orgao_id, criado_por: c.sessao.pessoa.id, criado_em: new Date() },
        });
        assertStatus(await escreve(colega, { tarefa: 'Pela equipe' }), 200);
        assert.equal((await c.ler(t.id)).tarefa, 'Pela equipe');
    });

    it('gestor do órgão do portfólio escreve mesmo depois do planejamento', async () => {
        const { c, t, gestorPortfolio, escreve } = await cenario();
        await prisma().projeto.update({
            where: { id: c.projeto_id },
            data: { status: 'EmAcompanhamento', responsaveis_no_orgao_gestor: [gestorPortfolio.pessoa.id] },
        });
        assertStatus(await escreve(gestorPortfolio, { tarefa: 'Pelo gestor' }), 200);
        assert.equal((await c.ler(t.id)).tarefa, 'Pelo gestor');
    });

    it('após o planejamento o responsável só atualiza o realizado, e só os campos do realizado', async () => {
        const { c, t, responsavel, colega, escreve } = await cenario();
        await prisma().projeto.update({ where: { id: c.projeto_id }, data: { status: 'EmAcompanhamento' } });

        const geral = await escreve(responsavel, { tarefa: 'Não deveria' });
        assertStatus(geral, 400);
        assert.match(geral.body.message, /permissão para editar este projeto/);
        assertStatus(await api(responsavel).post(`${c.base}/tarefa`).send(corpoTarefa(c.orgao_id, { numero: 2 })), 400);
        assertStatus(await api(responsavel).delete(`${c.base}/tarefa/${t.id}`), 400);

        const fora = await escreve(colega, { atualizacao_do_realizado: true, percentual_concluido: 5, ...periodoReal('2033-01-01', 2) });
        assertStatus(fora, 400);
        assert.match(fora.body.message, /sem permissão para acesso/);

        const ok = await escreve(responsavel, {
            atualizacao_do_realizado: true,
            tarefa: 'Ignorado',
            ...periodo('2040-01-01', 3),
            percentual_concluido: 40,
            ...periodoReal('2033-01-01', 4),
        });
        assertStatus(ok, 200);
        const depois = await c.ler(t.id);
        assert.equal(depois.percentual_concluido, 40);
        assert.equal(depois.inicio_real, '2033-01-01');
        assert.equal(depois.termino_real, '2033-01-04');
        assert.equal(depois.duracao_real, 4);
        assert.equal(depois.tarefa, 'Original');
        assert.equal(depois.inicio_planejado, '2033-01-01');
        assert.equal(depois.termino_planejado, '2033-01-10');
        assert.equal((await c.cronograma()).percentual_concluido, 40);
    });

    it('realizado com período inconsistente é rejeitado também no modo atualização do realizado', async () => {
        const { c, t, responsavel, escreve } = await cenario();
        const res = await escreve(responsavel, {
            atualizacao_do_realizado: true,
            inicio_real: '2033-01-01',
            termino_real: '2033-01-10',
            duracao_real: 3,
        });
        assertStatus(res, 400);
        assert.equal((await c.ler(t.id)).inicio_real, null);
    });

    it('pode_editar e pode_editar_realizado refletem o papel de quem lê', async () => {
        const { c, t, responsavel, espectador } = await cenario();
        const doResp = await api(responsavel).get(`${c.base}/tarefa/${t.id}`);
        assert.equal(doResp.body.pode_editar, true);
        assert.equal(doResp.body.pode_editar_realizado, true);
        const orgaoFora = await criarOrgao();
        const espFora = await criarPessoaComPrivilegios(['SMAE.espectador_de_projeto'], { orgao_id: orgaoFora.id });
        await liberarLeitura(c, espFora);
        const linha = (await api(espFora).get(`${c.base}/tarefa`)).body.linhas.find((l: any) => l.id === t.id);
        assert.equal(linha.pode_editar, false);
        assertStatus(await escreveComo(c, t.id, espectador), 403);
    });

    it(
        'espectador do mesmo órgão da tarefa não é marcado como pode_editar',
        async () => {
            const { c, t, espectador } = await cenario();
            const doEsp = await api(espectador).get(`${c.base}/tarefa/${t.id}`);
            assert.equal(doEsp.body.pode_editar, false);
            assert.equal(doEsp.body.pode_editar_realizado, false);
        }
    );

    it('responsável com perfil de colaborador e de espectador edita o realizado', async () => {
        const { c, t } = await cenario();
        const ambos = await criarPessoaComPrivilegios(['SMAE.colaborador_de_projeto', 'SMAE.espectador_de_projeto'], {
            orgao_id: c.orgao_id,
        });
        await prisma().projeto.update({ where: { id: c.projeto_id }, data: { responsavel_id: ambos.pessoa.id } });
        const lido = await api(ambos).get(`${c.base}/tarefa/${t.id}`);
        assert.equal(lido.body.pode_editar_realizado, true);
        const res = await api(ambos)
            .patch(`${c.base}/tarefa/${t.id}`)
            .send({ atualizacao_do_realizado: true, ...periodoReal('2033-01-01', 2) });
        assertStatus(res, 200);
    });

    it('MDO: colaborador responsável escreve em qualquer fase; sem vínculo não; espectador só lê', async () => {
        const c = await novoCronograma('MDO');
        const resp = await criarPessoaComPrivilegios(['MDO.colaborador_de_projeto'], { orgao_id: c.orgao_id });
        const sem = await criarPessoaComPrivilegios(['MDO.colaborador_de_projeto'], { orgao_id: c.orgao_id });
        const esp = await criarPessoaComPrivilegios(['MDO.espectador_de_projeto'], { orgao_id: c.orgao_id });
        await liberarLeitura(c, esp);
        await prisma().projeto.update({
            where: { id: c.projeto_id },
            data: { responsavel_id: resp.pessoa.id, status: 'EmAcompanhamento' },
        });
        const t = await c.criar(periodo('2033-03-01', 5));
        const patch = (s: Sessao, dados: object) => api(s).patch(`${c.base}/tarefa/${t.id}`).send(dados);

        assertStatus(await patch(resp, { tarefa: 'Pelo responsável da obra' }), 200);
        assertStatus(await patch(sem, { tarefa: 'x' }), 400);
        assertStatus(await patch(esp, { tarefa: 'x' }), 403);
        assertStatus(await api(esp).get(`${c.base}/tarefa`), 200);
        assert.equal((await c.ler(t.id)).tarefa, 'Pelo responsável da obra');
    });
});
