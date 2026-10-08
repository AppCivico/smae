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
} from '../../lib';

describe('relatorio/parlamentares', () => {
    let executor: Sessao;
    let semPrivilegio: Sessao;

    before(async () => {
        await bootApp();
        executor = await criarPessoaComPrivilegios(['Reports.executar.CasaCivil']);
        semPrivilegio = await criarPessoaSemPrivilegios();
    });

    const url = '/api/relatorio/parlamentares';

    async function criarMandato(cargo: 'Vereador' | 'Senador', partidoId: number) {
        const eleicao = await prisma().eleicao.findFirstOrThrow({ where: { removido_em: null } });
        const parlamentar = await prisma().parlamentar.create({
            data: { nome: uniq('Civil'), nome_popular: uniq('Popular'), em_atividade: true },
        });
        await prisma().parlamentarMandato.create({
            data: {
                parlamentar_id: parlamentar.id,
                eleicao_id: eleicao.id,
                partido_candidatura_id: partidoId,
                partido_atual_id: partidoId,
                eleito: true,
                cargo,
                uf: 'SP',
                email: 'gabinete@e2e.test',
            },
        });
        return { parlamentar, eleicao };
    }

    it('401 sem token', async () => {
        assertStatus(await api().post(url).send({}), 401);
    });

    it('403 sem Reports.executar.CasaCivil', async () => {
        const res = await api(semPrivilegio).post(url).send({});
        assertStatus(res, 403);
        assert.match(res.body.message, /Reports\.executar\.CasaCivil/);
    });

    it('400 com cargo fora do enum', async () => {
        assertStatus(await api(executor).post(url).send({ cargo: 'Prefeito' }), 400);
    });

    it('201 com corpo vazio devolve linhas', async () => {
        const res = await api(executor).post(url).send({});
        assertStatus(res, 201);
        assert.ok(Array.isArray(res.body.linhas));
    });

    it('filtra por partido e cargo e devolve os dados do mandato', async () => {
        const partido = await prisma().partido.create({ data: { nome: uniq('Partido'), sigla: 'E2E', numero: 99 } });
        const outroPartido = await prisma().partido.create({
            data: { nome: uniq('Partido'), sigla: 'OUT', numero: 98 },
        });
        const { parlamentar, eleicao } = await criarMandato('Vereador', partido.id);
        await criarMandato('Vereador', outroPartido.id);
        await criarMandato('Senador', partido.id);

        const res = await api(executor).post(url).send({ partido_id: partido.id, cargo: 'Vereador' });
        assertStatus(res, 201);

        const linhas: { id: number; [k: string]: unknown }[] = res.body.linhas;
        assert.equal(linhas.length, 1);
        assert.equal(linhas[0].id, parlamentar.id);
        assert.equal(linhas[0].nome_civil, parlamentar.nome);
        assert.equal(linhas[0].nome_parlamentar, parlamentar.nome_popular);
        assert.equal(linhas[0].partido_sigla, 'E2E');
        assert.equal(linhas[0].cargo, 'Vereador');
        assert.equal(linhas[0].uf, 'SP');
        assert.equal(linhas[0].titular_suplente, 'T');
        assert.equal(linhas[0].email, 'gabinete@e2e.test');
        assert.equal(linhas[0].ano_eleicao, eleicao.ano);
    });

    it('partido_id 0 e cargo null equivalem a sem filtro', async () => {
        const partido = await prisma().partido.create({ data: { nome: uniq('Partido'), sigla: 'ZER', numero: 97 } });
        const { parlamentar } = await criarMandato('Vereador', partido.id);

        const res = await api(executor).post(url).send({ partido_id: 0, cargo: null });
        assertStatus(res, 201);
        assert.ok(res.body.linhas.some((l: { id: number }) => l.id === parlamentar.id));
    });
});
