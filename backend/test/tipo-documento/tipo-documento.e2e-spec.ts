import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    criarPlanoSetorial,
    prisma,
    Sessao,
    uniq,
} from '../lib';

const novo = (extra: Record<string, unknown> = {}) => ({
    codigo: uniq('COD').replace(/\s+/g, '-'),
    titulo: uniq('Título'),
    descricao: uniq('Descrição'),
    extensoes: 'pdf, docx',
    ...extra,
});

describe('tipo-documento', () => {
    let gestor: Sessao;
    let semPrivilegio: Sessao;

    before(async () => {
        await bootApp();
        gestor = await criarPessoaComPrivilegios([
            'CadastroTipoDocumento.inserir',
            'CadastroTipoDocumento.editar',
            'CadastroTipoDocumento.remover',
        ]);
        semPrivilegio = await criarPessoaSemPrivilegios();
    });

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await api().get('/api/tipo-documento'), 401);
            assertStatus(await api().post('/api/tipo-documento').send(novo()), 401);
            assertStatus(await api().patch('/api/tipo-documento/1').send({ titulo: uniq() }), 401);
            assertStatus(await api().delete('/api/tipo-documento/1'), 401);
        });

        it('403 sem CadastroTipoDocumento.*, a listagem só exige sessão', async () => {
            const criado = await api(gestor).post('/api/tipo-documento').send(novo());
            assertStatus(criado, 201);
            const id = criado.body.id;

            assertStatus(await api(semPrivilegio).get('/api/tipo-documento'), 200);
            assertStatus(await api(semPrivilegio).post('/api/tipo-documento').send(novo()), 403);
            assertStatus(await api(semPrivilegio).patch(`/api/tipo-documento/${id}`).send({ titulo: uniq() }), 403);
            assertStatus(await api(semPrivilegio).delete(`/api/tipo-documento/${id}`), 403);
        });
    });

    describe('validação', () => {
        it('400 sem codigo, titulo ou descricao', async () => {
            const base = novo();
            assertStatus(
                await api(gestor)
                    .post('/api/tipo-documento')
                    .send({ ...base, codigo: undefined }),
                400
            );
            assertStatus(
                await api(gestor)
                    .post('/api/tipo-documento')
                    .send({ ...base, titulo: undefined }),
                400
            );
            assertStatus(
                await api(gestor)
                    .post('/api/tipo-documento')
                    .send({ ...base, descricao: undefined }),
                400
            );
        });

        it('400 com extensões fora do formato "ext, ext" separado por vírgula', async () => {
            assertStatus(
                await api(gestor)
                    .post('/api/tipo-documento')
                    .send(novo({ extensoes: 'pdf docx' })),
                400
            );
            assertStatus(
                await api(gestor)
                    .post('/api/tipo-documento')
                    .send(novo({ extensoes: 'extensaolonga' })),
                400
            );
        });
    });

    describe('CRUD', () => {
        it('cria sem extensões, lista, edita e remove', async () => {
            const dados = novo({ extensoes: undefined });
            const criado = await api(gestor).post('/api/tipo-documento').send(dados);
            assertStatus(criado, 201);
            const id: number = criado.body.id;

            const lista = await api(gestor).get('/api/tipo-documento');
            assertStatus(lista, 200);
            assert.deepEqual(
                lista.body.linhas.find((l: { id: number }) => l.id === id),
                { id, codigo: dados.codigo, titulo: dados.titulo, descricao: dados.descricao, extensoes: null }
            );

            const novoTitulo = uniq('Novo título');
            assertStatus(
                await api(gestor).patch(`/api/tipo-documento/${id}`).send({ titulo: novoTitulo, extensoes: 'png' }),
                200
            );
            const editado = (await api(gestor).get('/api/tipo-documento')).body.linhas.find(
                (l: { id: number }) => l.id === id
            );
            assert.equal(editado.titulo, novoTitulo);
            assert.equal(editado.extensoes, 'png');

            assertStatus(await api(gestor).delete(`/api/tipo-documento/${id}`), 202);
            const depois = await api(gestor).get('/api/tipo-documento');
            assert.equal(
                depois.body.linhas.some((l: { id: number }) => l.id === id),
                false
            );
        });

        it('404 ao editar id inexistente', async () => {
            assertStatus(await api(gestor).patch('/api/tipo-documento/999999').send({ titulo: uniq() }), 404);
        });
    });

    describe('unicidade e arquivos dependentes', () => {
        it('400 com descrição igual de outro tipo ativo, na criação e na edição', async () => {
            const base = novo();
            assertStatus(await api(gestor).post('/api/tipo-documento').send(base), 201);

            const dup = await api(gestor)
                .post('/api/tipo-documento')
                .send(novo({ descricao: base.descricao.toUpperCase() }));
            assertStatus(dup, 400);
            assert.match(dup.body.message, /Descrição igual ou semelhante/);

            const outro = await api(gestor).post('/api/tipo-documento').send(novo());
            assertStatus(outro, 201);
            assertStatus(
                await api(gestor).patch(`/api/tipo-documento/${outro.body.id}`).send({ descricao: base.descricao }),
                400
            );
        });

        it('400 ao remover tipo usado por arquivo de PDM, liberado depois que o vínculo sai', async () => {
            const criado = await api(gestor).post('/api/tipo-documento').send(novo());
            assertStatus(criado, 201);
            const planoSetorial = await criarPlanoSetorial();
            const arquivo = await prisma().arquivo.create({
                data: {
                    tipo: 'Documento',
                    caminho: uniq('caminho'),
                    nome_original: uniq('logo') + '.png',
                    tamanho_bytes: 10,
                    tipo_documento_id: criado.body.id,
                },
            });
            await prisma().pdm.update({ where: { id: planoSetorial.id }, data: { arquivo_logo_id: arquivo.id } });

            const emUso = await api(gestor).delete(`/api/tipo-documento/${criado.body.id}`);
            assertStatus(emUso, 400);
            assert.ok(emUso.body.message.includes(`Plano Setorial ${planoSetorial.nome}`));

            await prisma().pdm.update({ where: { id: planoSetorial.id }, data: { arquivo_logo_id: null } });
            assertStatus(await api(gestor).delete(`/api/tipo-documento/${criado.body.id}`), 202);
        });
    });
});
