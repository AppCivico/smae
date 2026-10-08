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

describe('equipe-responsavel', () => {
    let admin: Sessao;
    let colaborador: Sessao;
    let semPrivilegio: Sessao;
    let orgaoA: number;
    let orgaoB: number;
    let pessoaOrgaoA: Sessao;
    let pessoaOrgaoB: Sessao;

    before(async () => {
        await bootApp();
        orgaoA = (await criarOrgao()).id;
        orgaoB = (await criarOrgao()).id;
        admin = await criarPessoaComPrivilegios(['CadastroGrupoVariavel.administrador'], { orgao_id: orgaoA });
        colaborador = await criarPessoaComPrivilegios(['SMAE.GrupoVariavel.colaborador'], { orgao_id: orgaoA });
        semPrivilegio = await criarPessoaSemPrivilegios({ orgao_id: orgaoA });
        pessoaOrgaoA = await criarPessoaComPrivilegios(['CadastroOrgao.inserir'], { orgao_id: orgaoA });
        pessoaOrgaoB = await criarPessoaComPrivilegios(['CadastroOrgao.inserir'], { orgao_id: orgaoB });
    });

    const novaEquipe = (extra: Record<string, unknown> = {}) => ({
        titulo: uniq('Equipe'),
        perfil: 'Medicao',
        participantes: [],
        colaboradores: [],
        ...extra,
    });

    const listar = async (query = '') => {
        const res = await api(colaborador).get(`/api/equipe-responsavel${query}`);
        assertStatus(res, 200);
        return res.body.linhas as { id: number; orgao_id: number; titulo: string; colaboradores: { id: number }[] }[];
    };

    it('401 sem token', async () => {
        assertStatus(await api().get('/api/equipe-responsavel'), 401);
        assertStatus(await api().post('/api/equipe-responsavel').send(novaEquipe()), 401);
        assertStatus(await api().patch('/api/equipe-responsavel/1').send({ titulo: uniq() }), 401);
        assertStatus(await api().delete('/api/equipe-responsavel/1'), 401);
    });

    it('GET só exige sessão; POST, PATCH e DELETE exigem CadastroGrupoVariavel.administrador ou colaborador de grupo', async () => {
        assertStatus(await api(semPrivilegio).get('/api/equipe-responsavel'), 200);

        const criar = await api(semPrivilegio).post('/api/equipe-responsavel').send(novaEquipe());
        assertStatus(criar, 403);
        assert.match(criar.body.message, /CadastroGrupoVariavel\.administrador/);

        assertStatus(await api(semPrivilegio).patch('/api/equipe-responsavel/1').send({ titulo: uniq() }), 403);
        assertStatus(await api(semPrivilegio).delete('/api/equipe-responsavel/1'), 403);
    });

    it('400 com corpo inválido', async () => {
        assertStatus(await api(admin).post('/api/equipe-responsavel').send({}), 400);
        assertStatus(
            await api(admin)
                .post('/api/equipe-responsavel')
                .send(novaEquipe({ perfil: 'Inexistente' })),
            400
        );
        assertStatus(
            await api(admin)
                .post('/api/equipe-responsavel')
                .send(novaEquipe({ participantes: 'x' })),
            400
        );
    });

    it('cria equipe e o colaborador ganha o perfil de coordenador', async () => {
        const titulo = uniq('Medição');
        const criado = await api(admin)
            .post('/api/equipe-responsavel')
            .send(novaEquipe({ titulo, orgao_id: orgaoA, colaboradores: [pessoaOrgaoA.pessoa.id] }));
        assertStatus(criado, 201);

        const linha = (await listar(`?id=${criado.body.id}`))[0];
        assert.equal(linha.titulo, titulo);
        assert.equal(linha.orgao_id, orgaoA);
        assert.deepEqual(
            linha.colaboradores.map((c) => c.id),
            [pessoaOrgaoA.pessoa.id]
        );

        const perfil = await prisma().pessoaPerfil.findFirst({
            where: { pessoa_id: pessoaOrgaoA.pessoa.id, perfil_acesso: { nome: 'Coordenador em equipes' } },
        });
        assert.ok(perfil, 'colaborador deveria receber o perfil Coordenador em equipes');
    });

    it('400 com título repetido, sem diferenciar maiúsculas', async () => {
        const titulo = uniq('Repetido');
        assertStatus(
            await api(admin)
                .post('/api/equipe-responsavel')
                .send(novaEquipe({ titulo, orgao_id: orgaoA })),
            201
        );

        const res = await api(admin)
            .post('/api/equipe-responsavel')
            .send(novaEquipe({ titulo: titulo.toUpperCase(), orgao_id: orgaoA }));
        assertStatus(res, 400);
        assert.match(res.body.message, /Título já está em uso/);
    });

    it('400 quando colaborador de outro órgão e quando participante fora da árvore do órgão', async () => {
        const colaboradorDeFora = await api(admin)
            .post('/api/equipe-responsavel')
            .send(novaEquipe({ orgao_id: orgaoA, colaboradores: [pessoaOrgaoB.pessoa.id] }));
        assertStatus(colaboradorDeFora, 400);
        assert.match(colaboradorDeFora.body.message, /mesmo órgão/);

        const participanteDeFora = await api(admin)
            .post('/api/equipe-responsavel')
            .send(novaEquipe({ orgao_id: orgaoA, participantes: [pessoaOrgaoB.pessoa.id] }));
        assertStatus(participanteDeFora, 400);
        assert.match(participanteDeFora.body.message, /não pode ser participante/);
    });

    it('400 com pessoa inexistente', async () => {
        const res = await api(admin)
            .post('/api/equipe-responsavel')
            .send(novaEquipe({ orgao_id: orgaoA, participantes: [999999] }));
        assertStatus(res, 400);
        assert.match(res.body.message, /não encontrada/);
    });

    it('colaborador sem CadastroGrupoVariavel.administrador só cria no próprio órgão', async () => {
        const res = await api(colaborador)
            .post('/api/equipe-responsavel')
            .send(novaEquipe({ orgao_id: orgaoB }));
        assertStatus(res, 400);
        assert.match(res.body.message, /mesmo órgão/);

        assertStatus(await api(colaborador).post('/api/equipe-responsavel').send(novaEquipe()), 201);
    });

    it('filtra a listagem por órgão', async () => {
        assertStatus(
            await api(admin)
                .post('/api/equipe-responsavel')
                .send(novaEquipe({ orgao_id: orgaoB })),
            201
        );

        const doA = await listar(`?orgao_id=${orgaoA}`);
        assert.ok(doA.length > 0);
        assert.ok(doA.every((l) => l.orgao_id === orgaoA));
    });

    it('PATCH: 404 para equipe inexistente, 400 de outro órgão para colaborador, e edita para admin', async () => {
        assertStatus(await api(admin).patch('/api/equipe-responsavel/999999').send({ titulo: uniq() }), 404);

        const deB = await api(admin)
            .post('/api/equipe-responsavel')
            .send(novaEquipe({ orgao_id: orgaoB }));
        const foraDoOrgao = await api(colaborador)
            .patch(`/api/equipe-responsavel/${deB.body.id}`)
            .send({ titulo: uniq() });
        assertStatus(foraDoOrgao, 400);
        assert.match(foraDoOrgao.body.message, /mesmo órgão/);

        const titulo = uniq('Renomeada');
        const criada = await api(admin)
            .post('/api/equipe-responsavel')
            .send(novaEquipe({ orgao_id: orgaoA }));
        assertStatus(await api(admin).patch(`/api/equipe-responsavel/${criada.body.id}`).send({ titulo }), 200);
        assert.equal((await listar(`?id=${criada.body.id}`))[0].titulo, titulo);
    });

    it('PATCH: colaborador do órgão mas fora do grupo não edita', async () => {
        const criada = await api(admin)
            .post('/api/equipe-responsavel')
            .send(novaEquipe({ orgao_id: orgaoA }));
        const res = await api(colaborador).patch(`/api/equipe-responsavel/${criada.body.id}`).send({ titulo: uniq() });
        assertStatus(res, 400);
        assert.match(res.body.message, /colaborador do grupo/);
    });

    it('DELETE remove a equipe e 400 para quem é de outro órgão', async () => {
        const criada = await api(admin)
            .post('/api/equipe-responsavel')
            .send(novaEquipe({ orgao_id: orgaoB }));

        const deOutroOrgao = await api(colaborador).delete(`/api/equipe-responsavel/${criada.body.id}`);
        assertStatus(deOutroOrgao, 400);
        assert.match(deOutroOrgao.body.message, /mesmo órgão/);

        assertStatus(await api(admin).delete(`/api/equipe-responsavel/${criada.body.id}`), 202);
        assert.equal(
            (await listar(`?orgao_id=${orgaoB}`)).some((l) => l.id === criada.body.id),
            false
        );
    });
});
