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

// id reservado do seed (CONST_VAR_SEM_UN_MEDIDA): existe no banco mas nunca aparece
const SEM_UNIDADE = -1;

const sigla = () => uniq('u').slice(0, 15);

async function criarVariavel(unidade_medida_id: number) {
    return prisma().variavel.create({
        data: {
            orgao_id: 1,
            titulo: uniq('Variável'),
            codigo: uniq('cod').replace(/\s+/g, '-'),
            valor_base: 0,
            periodicidade: 'Mensal',
            unidade_medida_id,
        },
    });
}

describe('unidade-medida', () => {
    let gestor: Sessao;
    let semPrivilegio: Sessao;

    before(async () => {
        await bootApp();
        gestor = await criarPessoaComPrivilegios([
            'CadastroUnidadeMedida.inserir',
            'CadastroUnidadeMedida.editar',
            'CadastroUnidadeMedida.remover',
        ]);
        semPrivilegio = await criarPessoaSemPrivilegios();
    });

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await api().get('/api/unidade-medida'), 401);
            assertStatus(await api().post('/api/unidade-medida').send({ sigla: sigla(), descricao: uniq() }), 401);
            assertStatus(await api().patch('/api/unidade-medida/1').send({ descricao: uniq() }), 401);
            assertStatus(await api().delete('/api/unidade-medida/1'), 401);
        });

        it('403 sem CadastroUnidadeMedida.*, a listagem só exige sessão', async () => {
            const criado = await api(gestor).post('/api/unidade-medida').send({ sigla: sigla(), descricao: uniq() });
            assertStatus(criado, 201);
            const id = criado.body.id;

            assertStatus(await api(semPrivilegio).get('/api/unidade-medida'), 200);
            assertStatus(
                await api(semPrivilegio).post('/api/unidade-medida').send({ sigla: sigla(), descricao: uniq() }),
                403
            );
            assertStatus(await api(semPrivilegio).patch(`/api/unidade-medida/${id}`).send({ descricao: uniq() }), 403);
            assertStatus(await api(semPrivilegio).delete(`/api/unidade-medida/${id}`), 403);
        });
    });

    describe('validação', () => {
        it('400 sem sigla, com sigla vazia ou sem descricao', async () => {
            assertStatus(await api(gestor).post('/api/unidade-medida').send({ descricao: uniq() }), 400);
            assertStatus(await api(gestor).post('/api/unidade-medida').send({ sigla: '', descricao: uniq() }), 400);
            assertStatus(await api(gestor).post('/api/unidade-medida').send({ sigla: sigla() }), 400);
        });
    });

    describe('CRUD', () => {
        it('cria, lista, edita e remove', async () => {
            const dados = { sigla: sigla(), descricao: uniq('metro quadrado') };
            const criado = await api(gestor).post('/api/unidade-medida').send(dados);
            assertStatus(criado, 201);
            const id: number = criado.body.id;

            const lista = await api(gestor).get('/api/unidade-medida');
            assertStatus(lista, 200);
            assert.deepEqual(
                lista.body.linhas.find((l: { id: number }) => l.id === id),
                { id, sigla: dados.sigla, descricao: dados.descricao }
            );

            const novaDescricao = uniq('hectare');
            const novaSigla = sigla();
            assertStatus(
                await api(gestor)
                    .patch(`/api/unidade-medida/${id}`)
                    .send({ sigla: novaSigla, descricao: novaDescricao }),
                200
            );
            const editada = (await api(gestor).get('/api/unidade-medida')).body.linhas.find(
                (l: { id: number }) => l.id === id
            );
            assert.deepEqual(editada, { id, sigla: novaSigla, descricao: novaDescricao });

            assertStatus(await api(gestor).delete(`/api/unidade-medida/${id}`), 202);
            const depois = await api(gestor).get('/api/unidade-medida');
            assert.equal(
                depois.body.linhas.some((l: { id: number }) => l.id === id),
                false
            );
        });

        it('a unidade reservada do seed existe no banco mas não aparece na listagem nem na edição', async () => {
            assert.ok(await prisma().unidadeMedida.findUnique({ where: { id: SEM_UNIDADE } }));

            const lista = await api(gestor).get('/api/unidade-medida');
            assert.equal(
                lista.body.linhas.some((l: { id: number }) => l.id === SEM_UNIDADE),
                false
            );
            assertStatus(
                await api(gestor).patch(`/api/unidade-medida/${SEM_UNIDADE}`).send({ descricao: uniq() }),
                404
            );
        });

        it('404 ao editar id inexistente', async () => {
            assertStatus(await api(gestor).patch('/api/unidade-medida/999999').send({ descricao: uniq() }), 404);
        });
    });

    describe('unicidade e variáveis dependentes', () => {
        it('400 ao criar com descrição igual de outro registro ativo, ignorando maiúsculas', async () => {
            const descricao = uniq('quilo');
            assertStatus(await api(gestor).post('/api/unidade-medida').send({ sigla: sigla(), descricao }), 201);

            const dup = await api(gestor)
                .post('/api/unidade-medida')
                .send({ sigla: sigla(), descricao: descricao.toUpperCase() });
            assertStatus(dup, 400);
            assert.match(dup.body.message, /Descrição igual ou semelhante/);
        });

        it('400 ao criar com sigla igual de outro registro ativo', async () => {
            const s = sigla();
            assertStatus(await api(gestor).post('/api/unidade-medida').send({ sigla: s, descricao: uniq() }), 201);

            const dup = await api(gestor).post('/api/unidade-medida').send({ sigla: s, descricao: uniq() });
            assertStatus(dup, 400);
            assert.match(dup.body.message, /Sigla igual ou semelhante/);
        });

        it('PATCH só com sigla repetida é recusado', async () => {
            const s = sigla();
            assertStatus(await api(gestor).post('/api/unidade-medida').send({ sigla: s, descricao: uniq() }), 201);
            const outra = await api(gestor).post('/api/unidade-medida').send({ sigla: sigla(), descricao: uniq() });
            assertStatus(outra, 201);

            assertStatus(await api(gestor).patch(`/api/unidade-medida/${outra.body.id}`).send({ sigla: s }), 400);
        });

        it('PATCH só com descricao nova é aceito', async () => {
            assertStatus(
                await api(gestor).post('/api/unidade-medida').send({ sigla: sigla(), descricao: uniq() }),
                201
            );
            const alvo = await api(gestor).post('/api/unidade-medida').send({ sigla: sigla(), descricao: uniq() });
            assertStatus(alvo, 201);

            assertStatus(
                await api(gestor)
                    .patch(`/api/unidade-medida/${alvo.body.id}`)
                    .send({ descricao: uniq('nova') }),
                200
            );
        });

        it('400 ao remover unidade usada por variável ativa, liberada depois que a variável é removida', async () => {
            const criado = await api(gestor).post('/api/unidade-medida').send({ sigla: sigla(), descricao: uniq() });
            assertStatus(criado, 201);
            const variavel = await criarVariavel(criado.body.id);

            const emUso = await api(gestor).delete(`/api/unidade-medida/${criado.body.id}`);
            assertStatus(emUso, 400);
            assert.match(emUso.body.message, /variáveis dependentes/);

            await prisma().variavel.update({ where: { id: variavel.id }, data: { removido_em: new Date() } });
            assertStatus(await api(gestor).delete(`/api/unidade-medida/${criado.body.id}`), 202);
        });
    });
});
