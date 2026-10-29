import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarOrgao,
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    criarPlanoSetorial,
    loginAsSuperAdmin,
    prisma,
    Sessao,
    uniq,
} from '../lib';
import { criaGlobal } from '../variavel/_helpers';
import { criarMetaPS, gestorPS } from './_helpers';

const H = { sistema: 'PlanoSetorial' as const };

describe('acesso derivado de equipes (Plano Setorial)', () => {
    let superadmin: Sessao;
    let adminEquipe: Sessao;
    let gestor: Sessao;
    let orgao: { id: number };
    let orgaoFilho: { id: number };
    let orgaoOutro: { id: number };

    before(async () => {
        await bootApp();
        superadmin = await loginAsSuperAdmin();
        orgao = await criarOrgao();
        orgaoFilho = await criarOrgao({ parente_id: orgao.id });
        orgaoOutro = await criarOrgao();
        adminEquipe = await criarPessoaComPrivilegios(['CadastroGrupoVariavel.administrador'], { orgao_id: orgao.id });
        gestor = await gestorPS();
    });

    const novaEquipe = async (perfil: string, participantes: number[] = [], dados: Record<string, unknown> = {}) => {
        const res = await api(adminEquipe)
            .post('/api/equipe-responsavel')
            .send({ titulo: uniq('Equipe'), perfil, orgao_id: orgao.id, participantes, colaboradores: [], ...dados });
        assertStatus(res, 201);
        return res.body.id as number;
    };

    const novaPessoa = (orgao_id = orgao.id) => criarPessoaSemPrivilegios({ orgao_id });

    const perfisDerivados = async (pessoaId: number) => {
        const p = await prisma().pessoa.findUniqueOrThrow({
            where: { id: pessoaId },
            select: { perfis_equipe_pdm: true, perfis_equipe_ps: true },
        });
        return { pdm: [...p.perfis_equipe_pdm].sort(), ps: [...p.perfis_equipe_ps].sort() };
    };

    const patchEquipe = async (id: number, dados: Record<string, unknown>) =>
        assertStatus(await api(adminEquipe).patch(`/api/equipe-responsavel/${id}`).send(dados), 200);

    const patchPlano = async (id: number, dados: Record<string, unknown>) =>
        assertStatus(await api(gestor, H).patch(`/api/plano-setorial/${id}`).send(dados), 200);

    const idsMetas = async (s: Sessao, pdm_id: number) => {
        const res = await api(s, H).get(`/api/plano-setorial-meta?pdm_id=${pdm_id}`);
        assertStatus(res, 200);
        return (res.body.linhas as { id: number }[]).map((l) => l.id);
    };

    const cenario = async () => {
        const eqAdmin = await novaEquipe('AdminPS');
        const eqCP = await novaEquipe('TecnicoPS');
        const eqPF = await novaEquipe('PontoFocalPS');
        const ps = await criarPlanoSetorial({ dados: { orgao_admin_id: orgao.id } });
        await patchPlano(ps.id, {
            ps_admin_cp: { equipes: [eqAdmin] },
            ps_tecnico_cp: { equipes: [eqCP] },
            ps_ponto_focal: { equipes: [eqPF] },
        });
        const metaCP = await criarMetaPS(gestor, ps.id, 'PlanoSetorial', { ps_tecnico_cp: { equipes: [eqCP] } });
        const metaPF = await criarMetaPS(gestor, ps.id, 'PlanoSetorial', { ps_ponto_focal: { equipes: [eqPF] } });
        const metaLivre = await criarMetaPS(gestor, ps.id);
        return { eqAdmin, eqCP, eqPF, ps, metaCP, metaPF, metaLivre };
    };

    const tituloNovo = () => ({ titulo: uniq('Editada') });

    it('participante só vê as metas ligadas à sua equipe, e o perfil derivado segue o tipo da equipe', async () => {
        const c = await cenario();
        const tecnico = await novaPessoa();
        const pontoFocal = await novaPessoa();
        const naoMembro = await novaPessoa();
        await patchEquipe(c.eqCP, { participantes: [tecnico.pessoa.id] });
        await patchEquipe(c.eqPF, { participantes: [pontoFocal.pessoa.id] });

        assert.deepEqual(await perfisDerivados(tecnico.pessoa.id), { pdm: [], ps: ['TecnicoPS'] });
        assert.deepEqual(await perfisDerivados(pontoFocal.pessoa.id), { pdm: [], ps: ['PontoFocalPS'] });
        assert.deepEqual(await perfisDerivados(naoMembro.pessoa.id), { pdm: [], ps: [] });

        assert.deepEqual(await idsMetas(tecnico, c.ps.id), [c.metaCP]);
        assert.deepEqual(await idsMetas(pontoFocal, c.ps.id), [c.metaPF]);
        assertStatus(await api(naoMembro, H).get(`/api/plano-setorial-meta?pdm_id=${c.ps.id}`), 403);

        const todas = await idsMetas(gestor, c.ps.id);
        assert.deepEqual(todas.sort(), [c.metaCP, c.metaPF, c.metaLivre].sort());
    });

    it('participante edita a meta da sua equipe e não edita a de outra', async () => {
        const c = await cenario();
        const tecnico = await novaPessoa();
        await patchEquipe(c.eqCP, { participantes: [tecnico.pessoa.id] });

        assertStatus(await api(tecnico, H).patch(`/api/plano-setorial-meta/${c.metaCP}`).send(tituloNovo()), 200);
        const fora = await api(tecnico, H).patch(`/api/plano-setorial-meta/${c.metaLivre}`).send(tituloNovo());
        assertStatus(fora, 404);
        const foraPF = await api(tecnico, H).patch(`/api/plano-setorial-meta/${c.metaPF}`).send(tituloNovo());
        assertStatus(foraPF, 404);
    });

    it(
        'responde 400 ao soltar a equipe do plano enquanto uma meta ainda a usa',
        async () => {
            const c = await cenario();
            const res = await api(gestor, H)
                .patch(`/api/plano-setorial/${c.ps.id}`)
                .send({ ps_tecnico_cp: { equipes: [] } });
            assertStatus(res, 400);
            assert.match(res.body.message, /enquanto existirem relacionamentos/);
        }
    );

    describe('revogação do acesso', () => {
        it('desligar a equipe da meta tira a visibilidade, e do plano só é possível depois e zera o perfil derivado', async () => {
            const c = await cenario();
            const tecnico = await novaPessoa();
            await patchEquipe(c.eqCP, { participantes: [tecnico.pessoa.id] });
            assert.deepEqual(await idsMetas(tecnico, c.ps.id), [c.metaCP]);

            const vinculoAtivo = () =>
                prisma().pdmPerfil.count({
                    where: { pdm_id: c.ps.id, equipe_id: c.eqCP, relacionamento: 'PDM', removido_em: null },
                });
            await api(gestor, H).patch(`/api/plano-setorial/${c.ps.id}`).send({ ps_tecnico_cp: { equipes: [] } });
            assert.equal(await vinculoAtivo(), 1, 'trigger impede soltar o plano enquanto a meta usa a equipe');
            assert.deepEqual((await perfisDerivados(tecnico.pessoa.id)).ps, ['TecnicoPS']);

            assertStatus(
                await api(gestor, H)
                    .patch(`/api/plano-setorial-meta/${c.metaCP}`)
                    .send({ ps_tecnico_cp: { equipes: [] } }),
                200
            );
            assert.deepEqual(await idsMetas(tecnico, c.ps.id), []);
            assert.deepEqual((await perfisDerivados(tecnico.pessoa.id)).ps, ['TecnicoPS'], 'o vínculo com o plano continua');

            await patchPlano(c.ps.id, { ps_tecnico_cp: { equipes: [] } });
            assert.deepEqual(await perfisDerivados(tecnico.pessoa.id), { pdm: [], ps: [] });
        });

        it('tirar a pessoa da equipe zera o perfil derivado e remove o perfil de participante', async () => {
            const c = await cenario();
            const tecnico = await novaPessoa();
            await patchEquipe(c.eqCP, { participantes: [tecnico.pessoa.id] });
            assert.deepEqual(await idsMetas(tecnico, c.ps.id), [c.metaCP]);

            await patchEquipe(c.eqCP, { participantes: [] });

            assert.deepEqual(await perfisDerivados(tecnico.pessoa.id), { pdm: [], ps: [] });
            const comPerfil = await prisma().pessoaPerfil.count({
                where: { pessoa_id: tecnico.pessoa.id, perfil_acesso: { nome: 'Participante em equipes' } },
            });
            assert.equal(comPerfil, 0);
            assertStatus(await api(tecnico, H).get(`/api/plano-setorial-meta?pdm_id=${c.ps.id}`), 403);
        });

        it('quem está em duas equipes soma os perfis e mantém o acesso ao sair de uma', async () => {
            const c = await cenario();
            const pessoa = await novaPessoa();
            await patchEquipe(c.eqCP, { participantes: [pessoa.pessoa.id] });
            await patchEquipe(c.eqPF, { participantes: [pessoa.pessoa.id] });

            assert.deepEqual((await perfisDerivados(pessoa.pessoa.id)).ps, ['PontoFocalPS', 'TecnicoPS']);
            assert.deepEqual((await idsMetas(pessoa, c.ps.id)).sort(), [c.metaCP, c.metaPF].sort());

            await patchEquipe(c.eqPF, { participantes: [] });

            assert.deepEqual((await perfisDerivados(pessoa.pessoa.id)).ps, ['TecnicoPS']);
            assert.deepEqual(await idsMetas(pessoa, c.ps.id), [c.metaCP]);
            const perfis = await prisma().pessoaPerfil.count({
                where: { pessoa_id: pessoa.pessoa.id, perfil_acesso: { nome: 'Participante em equipes' } },
            });
            assert.equal(perfis, 1, 'continua participante da outra equipe');
        });

        it('equipe em uso não pode ser removida; depois de liberada, a remoção limpa os membros', async () => {
            const c = await cenario();
            const tecnico = await novaPessoa();
            await patchEquipe(c.eqCP, { participantes: [tecnico.pessoa.id] });

            const emUso = await api(adminEquipe).delete(`/api/equipe-responsavel/${c.eqCP}`);
            assertStatus(emUso, 400);

            await api(gestor, H).patch(`/api/plano-setorial-meta/${c.metaCP}`).send({ ps_tecnico_cp: { equipes: [] } });
            await patchPlano(c.ps.id, { ps_tecnico_cp: { equipes: [] } });
            assertStatus(await api(adminEquipe).delete(`/api/equipe-responsavel/${c.eqCP}`), 202);

            const equipe = await prisma().grupoResponsavelEquipe.findUniqueOrThrow({ where: { id: c.eqCP } });
            assert.ok(equipe.removido_em);
            const vinculos = await prisma().grupoResponsavelEquipeParticipante.count({
                where: { grupo_responsavel_equipe_id: c.eqCP, removido_em: null },
            });
            assert.equal(vinculos, 0);
            assert.deepEqual(await perfisDerivados(tecnico.pessoa.id), { pdm: [], ps: [] });
            const perfis = await prisma().pessoaPerfil.count({
                where: { pessoa_id: tecnico.pessoa.id, perfil_acesso: { nome: 'Participante em equipes' } },
            });
            assert.equal(perfis, 0);
        });

        it('remover o plano setorial recalcula quem participava das suas equipes', async () => {
            const c = await cenario();
            const outro = await criarPlanoSetorial({ dados: { orgao_admin_id: orgao.id } });
            const tecnico = await novaPessoa();
            await patchEquipe(c.eqCP, { participantes: [tecnico.pessoa.id] });
            assert.deepEqual((await perfisDerivados(tecnico.pessoa.id)).ps, ['TecnicoPS']);

            await patchPlano(outro.id, { ps_tecnico_cp: { equipes: [c.eqCP] } });
            await patchPlano(outro.id, { ps_admin_cp: { equipes: [c.eqAdmin] } });

            assertStatus(await api(gestor, H).delete(`/api/plano-setorial/${c.ps.id}`), 204);
            assert.deepEqual((await perfisDerivados(tecnico.pessoa.id)).ps, ['TecnicoPS'], 'o outro plano ainda usa a equipe');

            assertStatus(await api(gestor, H).delete(`/api/plano-setorial/${outro.id}`), 204);
            assert.deepEqual(await perfisDerivados(tecnico.pessoa.id), { pdm: [], ps: [] });
        });

        it('remover o perfil de participante da pessoa a tira de todas as equipes', async () => {
            const c = await cenario();
            const tecnico = await novaPessoa();
            await patchEquipe(c.eqCP, { participantes: [tecnico.pessoa.id] });

            assertStatus(await api(superadmin, H).patch(`/api/pessoa/${tecnico.pessoa.id}`).send({ perfil_acesso_ids: [] }), 200);

            const vinculos = await prisma().grupoResponsavelEquipeParticipante.count({
                where: { pessoa_id: tecnico.pessoa.id, removido_em: null },
            });
            assert.equal(vinculos, 0);
            assert.deepEqual(await perfisDerivados(tecnico.pessoa.id), { pdm: [], ps: [] });
        });

        it('PATCH da pessoa com equipes adiciona e remove vínculos recalculando os perfis', async () => {
            const c = await cenario();
            const pessoa = await novaPessoa();

            assertStatus(
                await api(superadmin, H).patch(`/api/pessoa/${pessoa.pessoa.id}`).send({ equipes: [c.eqCP, c.eqPF] }),
                200
            );
            assert.deepEqual((await perfisDerivados(pessoa.pessoa.id)).ps, ['PontoFocalPS', 'TecnicoPS']);
            assert.deepEqual((await idsMetas(pessoa, c.ps.id)).sort(), [c.metaCP, c.metaPF].sort());

            assertStatus(await api(superadmin, H).patch(`/api/pessoa/${pessoa.pessoa.id}`).send({ equipes: [c.eqPF] }), 200);
            assert.deepEqual((await perfisDerivados(pessoa.pessoa.id)).ps, ['PontoFocalPS']);
            assert.deepEqual(await idsMetas(pessoa, c.ps.id), [c.metaPF]);

            assertStatus(await api(superadmin, H).patch(`/api/pessoa/${pessoa.pessoa.id}`).send({ equipes: [] }), 200);
            assert.deepEqual(await perfisDerivados(pessoa.pessoa.id), { pdm: [], ps: [] });
        });
    });

    describe('transições bloqueadas para não deixar acesso pendurado', () => {
        it('troca de órgão: aceita dentro da árvore da equipe e recusa fora dela', async () => {
            const c = await cenario();
            const pessoa = await novaPessoa();
            await patchEquipe(c.eqCP, { participantes: [pessoa.pessoa.id] });

            const fora = await api(superadmin, H).patch(`/api/pessoa/${pessoa.pessoa.id}`).send({ orgao_id: orgaoOutro.id });
            assertStatus(fora, 400);
            assert.match(fora.body.message, /invalidaria a participação/);
            const intacto = await prisma().pessoaFisica.findFirstOrThrow({ where: { pessoa: { some: { id: pessoa.pessoa.id } } } });
            assert.equal(intacto.orgao_id, orgao.id);

            assertStatus(await api(superadmin, H).patch(`/api/pessoa/${pessoa.pessoa.id}`).send({ orgao_id: orgaoFilho.id }), 200);
            const vinculo = await prisma().grupoResponsavelEquipeParticipante.findFirstOrThrow({
                where: { pessoa_id: pessoa.pessoa.id, grupo_responsavel_equipe_id: c.eqCP, removido_em: null },
            });
            assert.equal(vinculo.orgao_id, orgaoFilho.id);
            assert.deepEqual((await perfisDerivados(pessoa.pessoa.id)).ps, ['TecnicoPS']);
            assert.deepEqual(await idsMetas(pessoa, c.ps.id), [c.metaCP]);
        });

        it('colaborador da equipe não troca de órgão e não alimenta o perfil derivado', async () => {
            const c = await cenario();
            const coordenador = await novaPessoa();
            await patchEquipe(c.eqCP, { colaboradores: [coordenador.pessoa.id] });

            assert.deepEqual(await perfisDerivados(coordenador.pessoa.id), { pdm: [], ps: [] });
            const sessao = await api(coordenador).get('/api/minha-conta');
            assertStatus(sessao, 200);
            assert.ok(sessao.body.sessao.privilegios.includes('SMAE.GrupoVariavel.colaborador'));

            const troca = await api(superadmin, H)
                .patch(`/api/pessoa/${coordenador.pessoa.id}`)
                .send({ orgao_id: orgaoFilho.id });
            assertStatus(troca, 400);
            assert.match(troca.body.message, /colaborador nas equipes/);

            await patchEquipe(c.eqCP, { colaboradores: [] });
            const depois = await api(coordenador).get('/api/minha-conta');
            assert.ok(!depois.body.sessao.privilegios.includes('SMAE.GrupoVariavel.colaborador'));
        });

        it('desativar a pessoa é bloqueado enquanto ela estiver em equipe', async () => {
            const c = await cenario();
            const pessoa = await novaPessoa();
            await patchEquipe(c.eqCP, { participantes: [pessoa.pessoa.id] });

            const corpo = { desativado: true, desativado_motivo: 'saiu do órgão' };
            const bloqueado = await api(superadmin, H).patch(`/api/pessoa/${pessoa.pessoa.id}`).send(corpo);
            assertStatus(bloqueado, 400);
            assert.match(bloqueado.body.message, /Remova a pessoa dessas equipes/);

            await patchEquipe(c.eqCP, { participantes: [] });
            assertStatus(await api(superadmin, H).patch(`/api/pessoa/${pessoa.pessoa.id}`).send(corpo), 200);
            const noBanco = await prisma().pessoa.findUniqueOrThrow({ where: { id: pessoa.pessoa.id } });
            assert.equal(noBanco.desativado, true);
            assert.deepEqual(noBanco.perfis_equipe_ps, []);
        });
    });

    describe('variável global ligada à equipe', () => {
        it('conta para os dois tipos (PDM e PS) e é recalculada ao remover a variável', async () => {
            const adminVar = await criarPessoaComPrivilegios(['CadastroVariavelGlobal.administrador'], {
                orgao_id: orgao.id,
            });
            const eqMedicao = await novaEquipe('Medicao');
            const membro = await novaPessoa();
            await patchEquipe(eqMedicao, { participantes: [membro.pessoa.id] });
            assert.deepEqual(await perfisDerivados(membro.pessoa.id), { pdm: [], ps: [] });

            const variavelId = await criaGlobal(adminVar, orgao.id, { orgao_id: orgao.id, medicao_grupo_ids: [eqMedicao] });
            assert.deepEqual(await perfisDerivados(membro.pessoa.id), { pdm: ['Medicao'], ps: ['Medicao'] });

            assertStatus(await api(adminVar).delete(`/api/variavel/${variavelId}`), 202);
            assert.deepEqual(await perfisDerivados(membro.pessoa.id), { pdm: [], ps: [] });
        });
    });

    describe('reconciliação (PATCH /api/pessoa/recalc-equipe)', () => {
        it('corrige drift injetado diretamente no banco e é idempotente', async () => {
            const c = await cenario();
            const certa = await novaPessoa();
            const comDrift = await novaPessoa();
            await patchEquipe(c.eqCP, { participantes: [certa.pessoa.id] });
            await prisma().pessoa.update({
                where: { id: comDrift.pessoa.id },
                data: { perfis_equipe_ps: ['AdminPS'] },
            });
            await prisma().pessoa.update({ where: { id: certa.pessoa.id }, data: { perfis_equipe_ps: [] } });

            const primeira = await api(superadmin).patch('/api/pessoa/recalc-equipe');
            assertStatus(primeira, 200);
            const afetadas = (primeira.body.pessoas_afetadas as { pessoa_id: number }[]).map((p) => p.pessoa_id);
            assert.ok(afetadas.includes(comDrift.pessoa.id));
            assert.ok(afetadas.includes(certa.pessoa.id));
            assert.deepEqual(await perfisDerivados(comDrift.pessoa.id), { pdm: [], ps: [] });
            assert.deepEqual((await perfisDerivados(certa.pessoa.id)).ps, ['TecnicoPS']);

            const segunda = await api(superadmin).patch('/api/pessoa/recalc-equipe');
            assertStatus(segunda, 200);
            assert.equal(segunda.body.pessoas_com_correcao, 0, 'regime estável: nada a corrigir');
        });
    });

    describe('perfil de acesso e módulos/sistemas', () => {
        let adminPerfil: Sessao;

        before(async () => {
            adminPerfil = await criarPessoaComPrivilegios(['PerfilAcesso.administrador']);
        });

        const idsPrivilegios = async (codigos: string[]) => {
            const rows = await prisma().privilegio.findMany({
                where: { codigo: { in: codigos } },
                select: { id: true, codigo: true },
            });
            assert.equal(rows.length, codigos.length);
            return codigos.map((c) => rows.find((r) => r.codigo === c)!.id);
        };

        const sistemasEsperados = async (codigos: string[]) => {
            const rows = await prisma().privilegio.findMany({
                where: { codigo: { in: codigos } },
                select: { modulo: { select: { modulo_sistema: true } } },
            });
            return [...new Set(rows.flatMap((r) => r.modulo.modulo_sistema))].sort();
        };

        const modulosDoPerfil = async (id: number) =>
            [...(await prisma().perfilAcesso.findUniqueOrThrow({ where: { id } })).modulos_sistemas].sort();

        const sessaoDe = async (s: Sessao) => {
            const res = await api(s).get('/api/minha-conta');
            assertStatus(res, 200);
            return res.body.sessao as { privilegios: string[]; sistemas: string[] };
        };

        it('trigger mantém modulos_sistemas do perfil ao criar, remover e devolver privilégios, e a sessão acompanha', async () => {
            const completo = ['CadastroPS.administrador', 'Projeto.administrador', 'CadastroOrgao.inserir'];
            const criado = await api(adminPerfil)
                .post('/api/perfil-acesso')
                .send({ nome: uniq('Perfil misto'), privilegios: await idsPrivilegios(completo) });
            assertStatus(criado, 201);
            const perfilId: number = criado.body.id;
            assert.deepEqual(await modulosDoPerfil(perfilId), await sistemasEsperados(completo));
            assert.ok((await modulosDoPerfil(perfilId)).includes('PlanoSetorial'));
            assert.ok((await modulosDoPerfil(perfilId)).includes('Projetos'));

            const pessoa = await novaPessoa();
            await prisma().pessoaPerfil.create({ data: { pessoa_id: pessoa.pessoa.id, perfil_acesso_id: perfilId } });
            let sessao = await sessaoDe(pessoa);
            assert.ok(sessao.sistemas.includes('PlanoSetorial'));
            assert.ok(sessao.privilegios.includes('CadastroPS.administrador'));

            const semPS = ['Projeto.administrador', 'CadastroOrgao.inserir'];
            assertStatus(
                await api(adminPerfil)
                    .patch(`/api/perfil-acesso/${perfilId}`)
                    .send({ privilegios: await idsPrivilegios(semPS) }),
                200
            );
            assert.deepEqual(await modulosDoPerfil(perfilId), await sistemasEsperados(semPS));
            assert.ok(!(await modulosDoPerfil(perfilId)).includes('PlanoSetorial'));
            sessao = await sessaoDe(pessoa);
            assert.ok(!sessao.sistemas.includes('PlanoSetorial'));
            assert.ok(!sessao.privilegios.includes('CadastroPS.administrador'));
            assert.ok(sessao.sistemas.includes('Projetos'));

            assertStatus(
                await api(adminPerfil)
                    .patch(`/api/perfil-acesso/${perfilId}`)
                    .send({ privilegios: await idsPrivilegios(completo) }),
                200
            );
            assert.deepEqual(await modulosDoPerfil(perfilId), await sistemasEsperados(completo));
            assert.ok((await sessaoDe(pessoa)).sistemas.includes('PlanoSetorial'));
        });

        it('perfil sem nenhum privilégio zera os módulos e a pessoa perde o acesso', async () => {
            const codigos = ['CadastroOrgao.inserir'];
            const criado = await api(adminPerfil)
                .post('/api/perfil-acesso')
                .send({ nome: uniq('Perfil único'), privilegios: await idsPrivilegios(codigos) });
            const perfilId: number = criado.body.id;
            const pessoa = await novaPessoa();
            await prisma().pessoaPerfil.deleteMany({ where: { pessoa_id: pessoa.pessoa.id } });
            await prisma().pessoaPerfil.create({ data: { pessoa_id: pessoa.pessoa.id, perfil_acesso_id: perfilId } });
            assert.ok((await sessaoDe(pessoa)).privilegios.includes('CadastroOrgao.inserir'));

            assertStatus(await api(adminPerfil).patch(`/api/perfil-acesso/${perfilId}`).send({ privilegios: [] }), 200);

            assert.deepEqual(await modulosDoPerfil(perfilId), []);
            const semAcesso = await api(pessoa).get('/api/minha-conta');
            assertStatus(semAcesso, 400);
            assert.match(semAcesso.body.message, /não tem mais permissões/);
        });

        it('trocar a pessoa de perfil invalida o cache pessoa_acesso_pdm_valido e a desativação também', async () => {
            const pessoa = await novaPessoa();
            const id = pessoa.pessoa.id;
            const valido = () => prisma().pessoaAcessoPdmValido.count({ where: { pessoa_id: id } });

            await prisma().pessoaAcessoPdmValido.create({ data: { pessoa_id: id } });
            assert.equal(await valido(), 1);
            const perfil = await prisma().perfilAcesso.create({
                data: { nome: uniq('perfil cache'), descricao: 'e2e', autogerenciavel: false },
            });
            await prisma().pessoaPerfil.create({ data: { pessoa_id: id, perfil_acesso_id: perfil.id } });
            assert.equal(await valido(), 0, 'pessoa_perfil limpa o cache só da pessoa');

            await prisma().pessoaAcessoPdmValido.create({ data: { pessoa_id: id } });
            const outra = await novaPessoa();
            await prisma().pessoaAcessoPdmValido.create({ data: { pessoa_id: outra.pessoa.id } });
            await prisma().pessoa.update({ where: { id }, data: { desativado: true } });
            assert.equal(await valido(), 0, 'desativar limpa o cache');
            assert.equal(
                await prisma().pessoaAcessoPdmValido.count({ where: { pessoa_id: outra.pessoa.id } }),
                1,
                'o cache de outras pessoas não é tocado'
            );

            await prisma().pessoaAcessoPdmValido.create({ data: { pessoa_id: id } });
            await prisma().pessoa.update({ where: { id }, data: { desativado: false } });
            assert.equal(await valido(), 0, 'reativar também limpa');
        });
    });
});
