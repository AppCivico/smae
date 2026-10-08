import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarPessoaSemPrivilegios,
    loginAsSuperAdmin,
    prisma,
    Sessao,
    uniq,
} from '../lib';

// anos 1950-1999: fora dos anos do seed (2020 a 2030)
let ultimoAno = 1949;
const anoLivre = () => ++ultimoAno;

async function criarMandato(eleicaoId: number) {
    const partido = await prisma().partido.create({
        data: { nome: uniq('Partido'), sigla: uniq('P').slice(0, 20), numero: 900 + ultimoAno },
    });
    const parlamentar = await prisma().parlamentar.create({
        data: { nome: uniq('Parlamentar'), nome_popular: uniq('Popular') },
    });
    return prisma().parlamentarMandato.create({
        data: {
            parlamentar_id: parlamentar.id,
            eleicao_id: eleicaoId,
            partido_candidatura_id: partido.id,
            partido_atual_id: partido.id,
            eleito: true,
            cargo: 'Vereador',
            uf: 'SP',
        },
    });
}

describe('eleicao', () => {
    let gestor: Sessao;
    let semPrivilegio: Sessao;

    before(async () => {
        await bootApp();
        gestor = await loginAsSuperAdmin();
        semPrivilegio = await criarPessoaSemPrivilegios();
    });

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await api().get('/api/eleicao'), 401);
            assertStatus(
                await api().post('/api/eleicao').send({ tipo: 'Geral', ano: anoLivre(), atual_para_mandatos: false }),
                401
            );
        });

        it('leitura não exige SMAE.superadmin, escrita exige', async () => {
            assertStatus(await api(semPrivilegio).get('/api/eleicao'), 200);

            const eleicao = await api(gestor)
                .post('/api/eleicao')
                .send({ tipo: 'Geral', ano: anoLivre(), atual_para_mandatos: false });
            assertStatus(eleicao, 201);
            const id = eleicao.body.id;

            const dados = { tipo: 'Geral', ano: anoLivre(), atual_para_mandatos: false };
            assertStatus(await api(semPrivilegio).post('/api/eleicao').send(dados), 403);
            assertStatus(await api(semPrivilegio).patch(`/api/eleicao/${id}`).send({ atual_para_mandatos: true }), 403);
            assertStatus(await api(semPrivilegio).delete(`/api/eleicao/${id}`), 403);
        });
    });

    describe('validação', () => {
        it('400 com tipo inválido, ano fora da faixa ou ano ausente', async () => {
            assertStatus(
                await api(gestor)
                    .post('/api/eleicao')
                    .send({ tipo: 'Distrital', ano: anoLivre(), atual_para_mandatos: false }),
                400
            );
            assertStatus(
                await api(gestor).post('/api/eleicao').send({ tipo: 'Geral', ano: 1899, atual_para_mandatos: false }),
                400
            );
            assertStatus(
                await api(gestor).post('/api/eleicao').send({ tipo: 'Geral', atual_para_mandatos: false }),
                400
            );
        });

        it('400 ao buscar id inexistente (BadRequest, não 404)', async () => {
            const res = await api(gestor).get('/api/eleicao/999999');
            assertStatus(res, 400);
            assert.match(res.body.message, /Eleição não encontrada/);
        });
    });

    describe('CRUD', () => {
        it('cria, lê, lista, edita e remove', async () => {
            const ano = anoLivre();
            const criado = await api(gestor)
                .post('/api/eleicao')
                .send({ tipo: 'Estadual', ano, atual_para_mandatos: false });
            assertStatus(criado, 201);
            const id: number = criado.body.id;

            const lido = await api(gestor).get(`/api/eleicao/${id}`);
            assertStatus(lido, 200);
            assert.equal(lido.body.tipo, 'Estadual');
            assert.equal(lido.body.ano, ano);
            assert.equal(lido.body.atual_para_mandatos, false);

            const lista = await api(gestor).get('/api/eleicao').query({ ano });
            assertStatus(lista, 200);
            assert.deepEqual(
                lista.body.linhas.map((l: { id: number }) => l.id),
                [id]
            );

            const editado = await api(gestor).patch(`/api/eleicao/${id}`).send({ atual_para_mandatos: true });
            assertStatus(editado, 200);
            assert.equal(editado.body.id, id);
            assert.equal((await api(gestor).get(`/api/eleicao/${id}`)).body.atual_para_mandatos, true);

            assertStatus(await api(gestor).delete(`/api/eleicao/${id}`), 204);
            assertStatus(await api(gestor).get(`/api/eleicao/${id}`), 400);
            const depois = await api(gestor).get('/api/eleicao').query({ ano });
            assert.deepEqual(depois.body.linhas, []);
        });

        it('filtra por tipo e por atual_para_mandatos', async () => {
            const ano = anoLivre();
            assertStatus(
                await api(gestor).post('/api/eleicao').send({ tipo: 'Municipal', ano, atual_para_mandatos: true }),
                201
            );

            const ano2 = anoLivre();
            assertStatus(
                await api(gestor)
                    .post('/api/eleicao')
                    .send({ tipo: 'Municipal', ano: ano2, atual_para_mandatos: false }),
                201
            );

            const atuais = await api(gestor)
                .get('/api/eleicao')
                .query({ tipo: 'Municipal', atual_para_mandatos: true });
            assertStatus(atuais, 200);
            const anosAtuais = atuais.body.linhas.map((l: { ano: number }) => l.ano);
            assert.ok(anosAtuais.includes(ano));
            assert.ok(!anosAtuais.includes(ano2));
            assert.ok(
                atuais.body.linhas.every(
                    (l: { tipo: string; atual_para_mandatos: boolean }) =>
                        l.tipo === 'Municipal' && l.atual_para_mandatos
                )
            );
        });
    });

    describe('unicidade (tipo, ano)', () => {
        it('400 ao criar eleição do mesmo tipo e ano', async () => {
            const ano = anoLivre();
            assertStatus(
                await api(gestor).post('/api/eleicao').send({ tipo: 'Geral', ano, atual_para_mandatos: false }),
                201
            );

            const dup = await api(gestor).post('/api/eleicao').send({ tipo: 'Geral', ano, atual_para_mandatos: true });
            assertStatus(dup, 400);
            assert.match(dup.body.message, /Já existe uma eleição deste tipo para este ano/);
        });

        it('mesmo ano com outro tipo é permitido', async () => {
            const ano = anoLivre();
            assertStatus(
                await api(gestor).post('/api/eleicao').send({ tipo: 'Geral', ano, atual_para_mandatos: false }),
                201
            );
            assertStatus(
                await api(gestor).post('/api/eleicao').send({ tipo: 'Estadual', ano, atual_para_mandatos: false }),
                201
            );
        });

        it('400 ao editar para um (tipo, ano) já existente', async () => {
            const ano = anoLivre();
            const existente = await api(gestor)
                .post('/api/eleicao')
                .send({ tipo: 'Geral', ano, atual_para_mandatos: false });
            assertStatus(existente, 201);
            const outra = await api(gestor)
                .post('/api/eleicao')
                .send({ tipo: 'Municipal', ano, atual_para_mandatos: false });
            assertStatus(outra, 201);

            const res = await api(gestor).patch(`/api/eleicao/${outra.body.id}`).send({ tipo: 'Geral', ano });
            assertStatus(res, 400);
            assert.match(res.body.message, /Já existe uma eleição deste tipo para este ano/);
        });
    });

    describe('remoção com dependentes', () => {
        it('400 ao remover eleição com mandato ativo', async () => {
            const criado = await api(gestor)
                .post('/api/eleicao')
                .send({ tipo: 'Geral', ano: anoLivre(), atual_para_mandatos: false });
            assertStatus(criado, 201);
            await criarMandato(criado.body.id);

            const res = await api(gestor).delete(`/api/eleicao/${criado.body.id}`);
            assertStatus(res, 400);
            assert.match(res.body.message, /mandatos ou comparecimentos/);
        });
    });
});
