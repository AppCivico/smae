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
import { criaGlobal } from '../variavel/_helpers';

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
        const deA = await api(admin)
            .post('/api/equipe-responsavel')
            .send(novaEquipe({ orgao_id: orgaoA }));
        assertStatus(deA, 201);
        const deB = await api(admin)
            .post('/api/equipe-responsavel')
            .send(novaEquipe({ orgao_id: orgaoB }));
        assertStatus(deB, 201);

        const doA = await listar(`?orgao_id=${orgaoA}`);
        assert.ok(doA.some((l) => l.id === deA.body.id));
        assert.ok(!doA.some((l) => l.id === deB.body.id));
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

    describe('ciclo de vida de membros, perfis de acesso e uso', () => {
        let orgaoFilho: number;

        before(async () => {
            orgaoFilho = (await criarOrgao({ parente_id: orgaoA })).id;
        });

        const nomePerfil = { participante: 'Participante em equipes', colaborador: 'Coordenador em equipes' };

        const contaPerfil = (pessoaId: number, nome: string) =>
            prisma().pessoaPerfil.count({ where: { pessoa_id: pessoaId, perfil_acesso: { nome } } });

        const vinculosAtivos = async (pessoaId: number) => ({
            participante: await prisma().grupoResponsavelEquipeParticipante.count({
                where: { pessoa_id: pessoaId, removido_em: null },
            }),
            colaborador: await prisma().grupoResponsavelEquipeResponsavel.count({
                where: { pessoa_id: pessoaId, removido_em: null },
            }),
        });

        const criarEquipe = async (extra: Record<string, unknown> = {}) => {
            const res = await api(admin)
                .post('/api/equipe-responsavel')
                .send(novaEquipe({ orgao_id: orgaoA, ...extra }));
            assertStatus(res, 201);
            return res.body.id as number;
        };

        const editar = (id: number, dados: Record<string, unknown>) =>
            api(admin).patch(`/api/equipe-responsavel/${id}`).send(dados);

        it('PATCH de participantes adiciona e remove vínculos e mantém um único perfil de participante por pessoa', async () => {
            const p1 = await criarPessoaSemPrivilegios({ orgao_id: orgaoA });
            const p2 = await criarPessoaSemPrivilegios({ orgao_id: orgaoA });
            const equipe1 = await criarEquipe({ participantes: [p1.pessoa.id] });
            const equipe2 = await criarEquipe({ participantes: [p1.pessoa.id, p2.pessoa.id] });

            assert.equal(await contaPerfil(p1.pessoa.id, nomePerfil.participante), 1);
            assert.equal(await contaPerfil(p2.pessoa.id, nomePerfil.participante), 1);

            assertStatus(await editar(equipe1, { participantes: [p1.pessoa.id, p2.pessoa.id] }), 200);
            assert.equal(await contaPerfil(p2.pessoa.id, nomePerfil.participante), 1, 'sem duplicar o perfil');
            assert.equal((await vinculosAtivos(p2.pessoa.id)).participante, 2);

            assertStatus(await editar(equipe1, { participantes: [p2.pessoa.id] }), 200);
            assert.equal(await contaPerfil(p1.pessoa.id, nomePerfil.participante), 1, 'ainda está na equipe 2');
            assert.equal((await vinculosAtivos(p1.pessoa.id)).participante, 1);

            assertStatus(await editar(equipe2, { participantes: [p2.pessoa.id] }), 200);
            assert.equal(await contaPerfil(p1.pessoa.id, nomePerfil.participante), 0, 'saiu de todas as equipes');
            assert.deepEqual(await vinculosAtivos(p1.pessoa.id), { participante: 0, colaborador: 0 });
            assert.equal(await contaPerfil(p2.pessoa.id, nomePerfil.participante), 1);
        });

        it('colaboradores seguem a mesma regra com o perfil de coordenador, sem mexer no de participante', async () => {
            const c1 = await criarPessoaSemPrivilegios({ orgao_id: orgaoA });
            const equipe = await criarEquipe({ colaboradores: [c1.pessoa.id] });

            assert.equal(await contaPerfil(c1.pessoa.id, nomePerfil.colaborador), 1);
            assert.equal(await contaPerfil(c1.pessoa.id, nomePerfil.participante), 0);
            assert.deepEqual(await vinculosAtivos(c1.pessoa.id), { participante: 0, colaborador: 1 });

            assertStatus(await editar(equipe, { colaboradores: [] }), 200);
            assert.equal(await contaPerfil(c1.pessoa.id, nomePerfil.colaborador), 0);
            assert.deepEqual(await vinculosAtivos(c1.pessoa.id), { participante: 0, colaborador: 0 });
        });

        it('aceita participante do órgão subordinado, e uma lista inválida no PATCH não altera nada', async () => {
            const filho = await criarPessoaSemPrivilegios({ orgao_id: orgaoFilho });
            const dentro = await criarPessoaSemPrivilegios({ orgao_id: orgaoA });
            const equipe = await criarEquipe({ participantes: [dentro.pessoa.id] });

            assertStatus(await editar(equipe, { participantes: [dentro.pessoa.id, filho.pessoa.id] }), 200);
            const vinculo = await prisma().grupoResponsavelEquipeParticipante.findFirstOrThrow({
                where: { pessoa_id: filho.pessoa.id, grupo_responsavel_equipe_id: equipe, removido_em: null },
            });
            assert.equal(vinculo.orgao_id, orgaoFilho);

            const invalido = await editar(equipe, { participantes: [filho.pessoa.id, pessoaOrgaoB.pessoa.id] });
            assertStatus(invalido, 400);
            const restantes = await prisma().grupoResponsavelEquipeParticipante.findMany({
                where: { grupo_responsavel_equipe_id: equipe, removido_em: null },
                select: { pessoa_id: true },
            });
            assert.deepEqual(
                restantes.map((r) => r.pessoa_id).sort(),
                [dentro.pessoa.id, filho.pessoa.id].sort(),
                'transação desfeita'
            );
            assert.equal(await contaPerfil(pessoaOrgaoB.pessoa.id, nomePerfil.participante), 0);
        });

        it('equipe do pai aparece no filtro por órgão de contexto do filho, e a do filho não aparece para o pai', async () => {
            const doPai = await criarEquipe({ orgao_id: orgaoA });
            const doFilho = await criarEquipe({ orgao_id: orgaoFilho });

            const paraFilho = await listar(`?orgao_id_contexto=${orgaoFilho}`);
            assert.ok(paraFilho.some((l) => l.id === doPai));
            assert.ok(paraFilho.some((l) => l.id === doFilho));

            const paraPai = await listar(`?orgao_id_contexto=${orgaoA}`);
            assert.ok(paraPai.some((l) => l.id === doPai));
            assert.ok(!paraPai.some((l) => l.id === doFilho));
        });

        it('PATCH de título: 400 para título de outra equipe (sem diferenciar caixa), 200 para o próprio', async () => {
            const tituloA = uniq('Titulo A');
            const a = await criarEquipe({ titulo: tituloA });
            const b = await criarEquipe();

            const repetido = await editar(b, { titulo: tituloA.toLowerCase() });
            assertStatus(repetido, 400);
            assert.match(repetido.body.message, /Título já está em uso/);

            assertStatus(await editar(a, { titulo: tituloA.toUpperCase() }), 200);
        });

        it('remover equipe libera os perfis dos membros, e só se não houver outra equipe', async () => {
            const membro = await criarPessoaSemPrivilegios({ orgao_id: orgaoA });
            const coord = await criarPessoaSemPrivilegios({ orgao_id: orgaoA });
            const doomed = await criarEquipe({ participantes: [membro.pessoa.id], colaboradores: [coord.pessoa.id] });
            const outra = await criarEquipe({ participantes: [membro.pessoa.id] });

            assertStatus(await api(admin).delete(`/api/equipe-responsavel/${doomed}`), 202);
            assert.equal(await contaPerfil(membro.pessoa.id, nomePerfil.participante), 1, 'continua na outra equipe');
            assert.equal(await contaPerfil(coord.pessoa.id, nomePerfil.colaborador), 0);
            assert.deepEqual(await vinculosAtivos(coord.pessoa.id), { participante: 0, colaborador: 0 });

            assertStatus(await api(admin).delete(`/api/equipe-responsavel/${doomed}`), 202);
            assertStatus(await api(admin).delete(`/api/equipe-responsavel/${outra}`), 202);
            assert.equal(await contaPerfil(membro.pessoa.id, nomePerfil.participante), 0);
        });

        it('equipe usada por variável não é removida e a mensagem lista a variável; depois de removê-la, pode', async () => {
            const adminVar = await criarPessoaComPrivilegios(['CadastroVariavelGlobal.administrador'], {
                orgao_id: orgaoA,
            });
            const equipe = await criarEquipe({ perfil: 'Medicao' });
            const titulo = uniq('Variável da equipe');
            const variavelId = await criaGlobal(adminVar, orgaoA, {
                titulo,
                orgao_id: orgaoA,
                medicao_grupo_ids: [equipe],
            });

            const emUso = await api(admin).delete(`/api/equipe-responsavel/${equipe}`);
            assertStatus(emUso, 400);
            assert.ok(emUso.body.message.includes(titulo));

            const comUso = await listar(`?id=${equipe}&retornar_uso=true`);
            assert.deepEqual(
                (comUso[0] as unknown as { variaveis: { id: number }[] }).variaveis.map((v) => v.id),
                [variavelId]
            );

            assertStatus(await api(adminVar).delete(`/api/variavel/${variavelId}`), 202);
            assertStatus(await api(admin).delete(`/api/equipe-responsavel/${equipe}`), 202);
        });
    });
});
