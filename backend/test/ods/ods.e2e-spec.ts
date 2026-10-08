import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarPdmAntigo,
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    loginAsSuperAdmin,
    prisma,
    Sessao,
    uniq,
} from '../lib';

// PessoaService.filtraPrivilegiosSMAE tira CadastroOds.* da sessão fora de PDM/PlanoSetorial/ProgramaDeMetas
describe('ods (privilégio dependente do smae-sistemas)', () => {
    let admin: Sessao;
    let numero = 100;

    before(async () => {
        await bootApp();
        admin = await loginAsSuperAdmin();
    });

    const novaOds = () => ({ numero: ++numero, titulo: uniq('ODS'), descricao: 'Erradicar a pobreza' });

    it('superadmin cria com sistema PlanoSetorial', async () => {
        const res = await api(admin, { sistema: 'PlanoSetorial' }).post('/api/ods').send(novaOds());
        assertStatus(res, 201);
    });

    it('o mesmo superadmin recebe 403 com sistema Projetos', async () => {
        const res = await api(admin, { sistema: 'Projetos' }).post('/api/ods').send(novaOds());
        assertStatus(res, 403);
        assert.match(res.body.message, /CadastroOds\.inserir/);
    });

    it('pessoa só com CadastroOds.inserir cria, mas não edita', async () => {
        const autor = await criarPessoaComPrivilegios(['CadastroOds.inserir']);
        const criado = await api(autor, { sistema: 'ProgramaDeMetas' }).post('/api/ods').send(novaOds());
        assertStatus(criado, 201);

        const edicao = await api(autor, { sistema: 'ProgramaDeMetas' })
            .patch(`/api/ods/${criado.body.id}`)
            .send({ titulo: uniq() });
        assertStatus(edicao, 403);
    });

    it('400: descricao com menos de 4 caracteres e numero duplicado', async () => {
        const cliente = api(admin, { sistema: 'PlanoSetorial' });
        assertStatus(await cliente.post('/api/ods').send({ ...novaOds(), descricao: 'abc' }), 400);

        const dados = novaOds();
        assertStatus(await cliente.post('/api/ods').send(dados), 201);
        const duplicado = await cliente.post('/api/ods').send({ ...dados, titulo: uniq() });
        assertStatus(duplicado, 400);
        assert.match(duplicado.body.message, /Número já existe/);
    });

    it('401 sem token e 403 sem CadastroOds.*', async () => {
        assertStatus(await api().get('/api/ods'), 401);
        assertStatus(await api().post('/api/ods').send(novaOds()), 401);

        const semPrivilegio = await criarPessoaSemPrivilegios();
        assertStatus(await api(semPrivilegio, { sistema: 'PlanoSetorial' }).get('/api/ods'), 200);
        assertStatus(await api(semPrivilegio, { sistema: 'PlanoSetorial' }).post('/api/ods').send(novaOds()), 403);
    });

    it('400 quando numero não é inteiro', async () => {
        const res = await api(admin, { sistema: 'PlanoSetorial' })
            .post('/api/ods')
            .send({ ...novaOds(), numero: 'x' });
        assertStatus(res, 400);
    });

    it('400 ao remover ODS com tag dependente, liberada depois que a tag sai', async () => {
        const cliente = api(admin, { sistema: 'PlanoSetorial' });
        const criado = await cliente.post('/api/ods').send(novaOds());
        assertStatus(criado, 201);
        const pdm = await criarPdmAntigo();
        const tag = await prisma().tag.create({
            data: { descricao: uniq('Tag'), pdm_id: pdm.id, ods_id: criado.body.id },
        });

        const res = await cliente.delete(`/api/ods/${criado.body.id}`);
        assertStatus(res, 400);
        assert.match(res.body.message, /tag\(s\) dependentes/);

        await prisma().tag.update({ where: { id: tag.id }, data: { removido_em: new Date() } });
        assertStatus(await cliente.delete(`/api/ods/${criado.body.id}`), 202);
    });

    it('lista, edita e remove', async () => {
        const cliente = api(admin, { sistema: 'PlanoSetorial' });
        const dados = novaOds();
        const criado = await cliente.post('/api/ods').send(dados);
        assertStatus(criado, 201);
        const id: number = criado.body.id;

        const titulo = uniq('Fome Zero');
        assertStatus(await cliente.patch(`/api/ods/${id}`).send({ titulo }), 200);

        const lista = await cliente.get('/api/ods');
        assertStatus(lista, 200);
        const linha = lista.body.linhas.find((l: { id: number }) => l.id === id);
        assert.equal(linha.titulo, titulo);
        assert.equal(linha.numero, dados.numero);

        assertStatus(await cliente.delete(`/api/ods/${id}`), 202);
        const depois = await cliente.get('/api/ods');
        assert.equal(
            depois.body.linhas.some((l: { id: number }) => l.id === id),
            false
        );
    });
});
