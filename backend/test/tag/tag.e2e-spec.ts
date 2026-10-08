import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarPdmAntigo,
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    criarPlanoSetorial,
    loginAsSuperAdmin,
    prisma,
    Sessao,
    uniq,
} from '../lib';

let seqOds = 9000;

async function criarOds() {
    return prisma().ods.create({
        data: { numero: ++seqOds, titulo: uniq('ODS'), descricao: 'Descrição de teste para a ODS' },
    });
}

async function criarMeta(pdm_id: number) {
    return prisma().meta.create({
        data: { pdm_id, status: 'Registrado', codigo: uniq('M').replace(/\s+/g, '-'), titulo: uniq('Meta') },
    });
}

describe('tag', () => {
    const PRIV_PDM = [
        'CadastroTag.inserir',
        'CadastroTag.editar',
        'CadastroTag.remover',
        'CadastroPdm.editar',
    ] as const;

    let gestor: Sessao;
    let semPrivilegio: Sessao;
    let semPdm: Sessao;
    let pdmId: number;
    let odsId: number;

    before(async () => {
        await bootApp();
        gestor = await criarPessoaComPrivilegios([...PRIV_PDM]);
        semPrivilegio = await criarPessoaSemPrivilegios();
        semPdm = await criarPessoaComPrivilegios(['CadastroTag.inserir', 'CadastroTag.editar', 'CadastroTag.remover']);
        pdmId = (await criarPdmAntigo()).id;
        odsId = (await criarOds()).id;
    });

    const nova = (extra: Record<string, unknown> = {}) => ({
        descricao: uniq('Tag'),
        pdm_id: pdmId,
        ods_id: odsId,
        ...extra,
    });

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await api().get('/api/tag'), 401);
            assertStatus(await api().post('/api/tag').send(nova()), 401);
            assertStatus(await api().patch('/api/tag/1').send({ descricao: uniq() }), 401);
            assertStatus(await api().delete('/api/tag/1'), 401);
        });

        it('403 sem CadastroTag.*, e 403 com CadastroTag.* mas sem permissão no PDM', async () => {
            assertStatus(await api(semPrivilegio).post('/api/tag').send(nova()), 403);
            assertStatus(await api(semPdm).post('/api/tag').send(nova()), 403);
        });
    });

    describe('validação', () => {
        it('400 sem descricao ou sem ods_id; ods_id null é aceito na criação', async () => {
            assertStatus(await api(gestor).post('/api/tag').send({ descricao: uniq(), pdm_id: pdmId }), 400);
            assertStatus(
                await api(gestor)
                    .post('/api/tag')
                    .send(nova({ descricao: undefined })),
                400
            );
            assertStatus(
                await api(gestor)
                    .post('/api/tag')
                    .send(nova({ ods_id: null })),
                201
            );
        });

        it('400 sem pdm_id', async () => {
            assertStatus(await api(gestor).post('/api/tag').send({ descricao: uniq(), ods_id: odsId }), 400);
        });

        it('400 com pdm_id inexistente', async () => {
            const res = await api(gestor)
                .post('/api/tag')
                .send(nova({ pdm_id: 999999 }));
            assertStatus(res, 400);
            assert.match(res.body.message, /não encontrado ou removido/);
        });
    });

    describe('CRUD', () => {
        it('cria com ODS, lê, lista por pdm, edita e remove', async () => {
            const dados = nova();
            const criado = await api(gestor).post('/api/tag').send(dados);
            assertStatus(criado, 201);
            const id: number = criado.body.id;

            const lido = await api(gestor).get(`/api/tag/${id}`);
            assertStatus(lido, 200);
            assert.deepEqual(lido.body, {
                id,
                descricao: dados.descricao,
                pdm_id: pdmId,
                ods_id: odsId,
                icone: null,
                icone_thumbnail: null,
                ods: { id: odsId, titulo: (await prisma().ods.findUniqueOrThrow({ where: { id: odsId } })).titulo },
            });

            const lista = await api(gestor).get('/api/tag').query({ pdm_id: pdmId });
            assert.ok(lista.body.linhas.some((l: { id: number }) => l.id === id));

            const nova2 = uniq('Tag editada');
            assertStatus(await api(gestor).patch(`/api/tag/${id}`).send({ descricao: nova2, ods_id: null }), 200);
            const editado = await api(gestor).get(`/api/tag/${id}`);
            assert.equal(editado.body.descricao, nova2);
            assert.equal(editado.body.ods_id, null);
            assert.equal(editado.body.ods, null);

            assertStatus(await api(gestor).delete(`/api/tag/${id}`), 202);
            assertStatus(await api(gestor).get(`/api/tag/${id}`), 404);
        });

        it('404 ao ler id inexistente', async () => {
            assertStatus(await api(gestor).get('/api/tag/999999'), 404);
        });
    });

    describe('unicidade por PDM e uso em metas', () => {
        it('400 com descrição igual no mesmo PDM, aceita em outro PDM', async () => {
            const descricao = uniq('Saúde');
            assertStatus(await api(gestor).post('/api/tag').send(nova({ descricao })), 201);

            const dup = await api(gestor)
                .post('/api/tag')
                .send(nova({ descricao: descricao.toUpperCase() }));
            assertStatus(dup, 400);
            assert.match(dup.body.message, /Descrição igual ou semelhante/);

            const outroPdm = (await criarPdmAntigo()).id;
            assertStatus(
                await api(gestor)
                    .post('/api/tag')
                    .send(nova({ descricao, pdm_id: outroPdm })),
                201
            );
        });

        it('PATCH com descrição de outra tag do mesmo PDM é recusado', async () => {
            const a = uniq('Tag A');
            assertStatus(
                await api(gestor)
                    .post('/api/tag')
                    .send(nova({ descricao: a })),
                201
            );
            const b = await api(gestor).post('/api/tag').send(nova());
            assertStatus(b, 201);

            assertStatus(await api(gestor).patch(`/api/tag/${b.body.id}`).send({ descricao: a }), 400);
        });

        it('400 ao remover tag usada em meta, liberada depois que o vínculo sai', async () => {
            const criado = await api(gestor).post('/api/tag').send(nova());
            assertStatus(criado, 201);
            const meta = await criarMeta(pdmId);
            const metaTag = await prisma().metaTag.create({ data: { meta_id: meta.id, tag_id: criado.body.id } });

            const emUso = await api(gestor).delete(`/api/tag/${criado.body.id}`);
            assertStatus(emUso, 400);
            assert.match(emUso.body.message, /Tag em uso em Metas/);

            await prisma().metaTag.delete({ where: { id: metaTag.id } });
            assertStatus(await api(gestor).delete(`/api/tag/${criado.body.id}`), 202);
        });
    });

    describe('plano-setorial-tag e isolamento entre PDM e PS', () => {
        it('tag de Plano Setorial não aparece na listagem do PDM antigo', async () => {
            const psPdm = await criarPlanoSetorial();
            const admin = await loginAsSuperAdmin();
            const criada = await api(admin)
                .post('/api/plano-setorial-tag')
                .send(nova({ pdm_id: psPdm.id }));
            assertStatus(criada, 201);

            const legado = await api(gestor).get('/api/tag').query({ pdm_id: psPdm.id });
            assertStatus(legado, 200);
            assert.deepEqual(legado.body.linhas, []);

            const ps = await api(admin).get('/api/plano-setorial-tag').query({ pdm_id: psPdm.id });
            assert.ok(ps.body.linhas.some((l: { id: number }) => l.id === criada.body.id));
        });

        it('403 em plano-setorial-tag sem perfil de administrador do PS', async () => {
            const psPdm = await criarPlanoSetorial();
            const soTag = await criarPessoaComPrivilegios(['CadastroTagPS.inserir']);
            assertStatus(
                await api(soTag)
                    .post('/api/plano-setorial-tag')
                    .send(nova({ pdm_id: psPdm.id })),
                403
            );
        });

        it('400 com smae-sistemas que não é de PS nem de PDM novo', async () => {
            const admin = await loginAsSuperAdmin();
            const res = await api(admin, { sistema: 'Projetos' }).get('/api/plano-setorial-tag');
            assertStatus(res, 400);
        });
    });
});
