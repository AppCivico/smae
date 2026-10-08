import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    loginAsSuperAdmin,
    prisma,
    PRIVILEGIO_INOFENSIVO,
    Sessao,
    uniq,
} from '../lib';

const SENHA = '!286!QDM7H';
const HASH_SENHA = '$2b$10$2DUUZc55NxezhEydgfUSTexk4.1qjbvb.873cZhCpIvjw4izkFqcW';
const NOVA_SENHA = 'Nova*Senha1';

async function novaPessoa(dados: { desativado?: boolean } = {}): Promise<Sessao> {
    const sessao = await criarPessoaComPrivilegios([PRIVILEGIO_INOFENSIVO]);
    await prisma().pessoa.update({
        where: { id: sessao.pessoa.id },
        data: { senha: HASH_SENHA, senha_bloqueada: false, qtde_senha_invalida: 0, ...dados },
    });
    return sessao;
}

const login = (email: string, senha: string) => api().post('/api/login').send({ email, senha });

const emailsPara = (email: string, subject?: string) =>
    prisma().emaildbQueue.findMany({ where: { to: email, ...(subject ? { subject } : {}) } });

async function solicitarNovaSenha(email: string) {
    assertStatus(await api().post('/api/solicitar-nova-senha').send({ email }), 202);
    const [primeiro] = await emailsPara(email, 'Nova senha solicitada');
    return (primeiro.variables as { nova_senha: string }).nova_senha;
}

describe('AuthController', () => {
    before(async () => {
        await bootApp();
    });

    describe('POST /api/login', () => {
        it('400 com e-mail inválido', async () => {
            assertStatus(await login('nao-e-email', SENHA), 400);
        });

        it('401 com senha errada, sem dizer qual campo falhou', async () => {
            const pessoa = await novaPessoa();
            const res = await login(pessoa.pessoa.email, 'errada');
            assertStatus(res, 401);
            assert.match(res.body.message, /E-mail ou senha inválidos/);
        });

        it('200 com access_token que abre /api/minha-conta', async () => {
            const pessoa = await novaPessoa();
            const res = await login(pessoa.pessoa.email, SENHA);
            assertStatus(res, 200);
            assert.ok(res.body.access_token);
            assert.equal(res.body.reduced_access_token, undefined);

            const conta = await api(res.body.access_token).get('/api/minha-conta');
            assertStatus(conta, 200);
            assert.equal(conta.body.sessao.id, pessoa.pessoa.id);
        });

        it('400 com senha certa para conta desativada', async () => {
            const pessoa = await novaPessoa({ desativado: true });
            const res = await login(pessoa.pessoa.email, SENHA);
            assertStatus(res, 400);
            assert.match(res.body.message, /Conta não está mais ativa/);
        });

        it('3 senhas erradas bloqueiam a conta e mandam nova senha por e-mail', async () => {
            const pessoa = await novaPessoa();
            for (let i = 0; i < 3; i++) assertStatus(await login(pessoa.pessoa.email, 'errada'), 401);

            const conta = await prisma().pessoa.findUniqueOrThrow({ where: { id: pessoa.pessoa.id } });
            assert.equal(conta.senha_bloqueada, true);

            const bloqueada = await login(pessoa.pessoa.email, SENHA);
            assertStatus(bloqueada, 401);
            assert.match(bloqueada.body.message, /Conta está bloqueada/);

            const emails = await emailsPara(pessoa.pessoa.email, 'Nova senha para liberar acesso');
            assert.equal(emails.length, 1);
        });
    });

    describe('POST /api/sair', () => {
        it('401 sem token', async () => {
            assertStatus(await api().post('/api/sair'), 401);
        });

        it('202 e o token deixa de funcionar', async () => {
            const pessoa = await novaPessoa();
            const { access_token } = (await login(pessoa.pessoa.email, SENHA)).body;

            assertStatus(await api(access_token).post('/api/sair'), 202);
            assertStatus(await api(access_token).get('/api/minha-conta'), 401);
        });
    });

    describe('POST /api/solicitar-nova-senha', () => {
        it('400 sem e-mail', async () => {
            assertStatus(await api().post('/api/solicitar-nova-senha').send({}), 400);
        });

        it('400 com e-mail desconhecido ou conta desativada, com a mesma mensagem', async () => {
            const desconhecido = await api()
                .post('/api/solicitar-nova-senha')
                .send({ email: `${uniq()}@e2e.test` });
            assertStatus(desconhecido, 400);
            assert.match(desconhecido.body.message, /E-mail não encontrado/);

            const desativada = await novaPessoa({ desativado: true });
            const res = await api().post('/api/solicitar-nova-senha').send({ email: desativada.pessoa.email });
            assertStatus(res, 400);
            assert.match(res.body.message, /E-mail não encontrado/);
            assert.equal((await emailsPara(desativada.pessoa.email)).length, 0);
        });

        it('202 bloqueia a conta, enfileira e-mail e recusa novo pedido em seguida', async () => {
            const pessoa = await novaPessoa();
            await solicitarNovaSenha(pessoa.pessoa.email);

            const conta = await prisma().pessoa.findUniqueOrThrow({ where: { id: pessoa.pessoa.id } });
            assert.equal(conta.senha_bloqueada, true);

            const segundo = await api().post('/api/solicitar-nova-senha').send({ email: pessoa.pessoa.email });
            assertStatus(segundo, 400);
            assert.match(segundo.body.message, /recentemente/);
        });
    });

    describe('POST /api/escrever-nova-senha', () => {
        it('400 com token inválido', async () => {
            const res = await api()
                .post('/api/escrever-nova-senha')
                .send({ reduced_access_token: 'lixo', senha: NOVA_SENHA });
            assertStatus(res, 400);
            assert.match(res.body.message, /token inválido/);
        });

        it('400 com senha fora da regra (mínimo 8, maiúscula, número e especial)', async () => {
            const curta = await api()
                .post('/api/escrever-nova-senha')
                .send({ reduced_access_token: 'x', senha: 'curta' });
            assertStatus(curta, 400);
            assert.match(JSON.stringify(curta.body.message), /Senha/);

            const semNumero = await api()
                .post('/api/escrever-nova-senha')
                .send({ reduced_access_token: 'x', senha: 'semnumero*a' });
            assertStatus(semNumero, 400);
            assert.match(JSON.stringify(semNumero.body.message), /Senha/);
        });

        it('troca a senha enviada por e-mail, abre sessão nova e derruba as antigas', async () => {
            const pessoa = await novaPessoa();
            const antiga = pessoa.token;
            const emailed = await solicitarNovaSenha(pessoa.pessoa.email);

            const reduzido = await login(pessoa.pessoa.email, emailed);
            assertStatus(reduzido, 200);
            assert.ok(reduzido.body.reduced_access_token);
            assert.equal(reduzido.body.access_token, undefined);

            const res = await api().post('/api/escrever-nova-senha').send({
                reduced_access_token: reduzido.body.reduced_access_token,
                senha: NOVA_SENHA,
            });
            assertStatus(res, 200);
            assert.ok(res.body.access_token);

            assertStatus(await api(res.body.access_token).get('/api/minha-conta'), 200);
            assertStatus(await api(antiga).get('/api/minha-conta'), 401);
            assertStatus(await login(pessoa.pessoa.email, NOVA_SENHA), 200);
        });

        it('400 ao reaproveitar a senha que chegou por e-mail', async () => {
            const pessoa = await novaPessoa();
            await prisma().pessoa.update({
                where: { id: pessoa.pessoa.id },
                data: { senha: HASH_SENHA, senha_bloqueada: true, senha_bloqueada_em: new Date() },
            });

            const { reduced_access_token } = (await login(pessoa.pessoa.email, SENHA)).body;
            const res = await api().post('/api/escrever-nova-senha').send({ reduced_access_token, senha: SENHA });
            assertStatus(res, 400);
            assert.match(res.body.message, /precisa ser trocada por uma nova/);
        });
    });
});

describe('PerfilAcessoController', () => {
    let gestor: Sessao;
    let semPrivilegio: Sessao;
    let privilegioId: number;

    before(async () => {
        await bootApp();
        gestor = await criarPessoaComPrivilegios(['PerfilAcesso.administrador']);
        semPrivilegio = await criarPessoaSemPrivilegios();
        privilegioId = (await prisma().privilegio.findUniqueOrThrow({ where: { codigo: 'CadastroOrgao.inserir' } })).id;
    });

    const novoPerfil = (extra: Record<string, unknown> = {}) => ({
        nome: uniq('Perfil'),
        privilegios: [privilegioId],
        ...extra,
    });

    it('401 sem token', async () => {
        assertStatus(await api().get('/api/perfil-acesso'), 401);
        assertStatus(await api().post('/api/perfil-acesso').send(novoPerfil()), 401);
        assertStatus(await api().patch('/api/perfil-acesso/1').send({ nome: uniq() }), 401);
        assertStatus(await api().delete('/api/perfil-acesso/1'), 401);
    });

    it('GET só exige sessão; POST, PATCH e DELETE exigem PerfilAcesso.administrador', async () => {
        assertStatus(await api(semPrivilegio).get('/api/perfil-acesso'), 200);

        const criar = await api(semPrivilegio).post('/api/perfil-acesso').send(novoPerfil());
        assertStatus(criar, 403);
        assert.match(criar.body.message, /PerfilAcesso\.administrador/);

        const editar = await api(semPrivilegio).patch(`/api/perfil-acesso/${privilegioId}`).send({ nome: uniq() });
        assertStatus(editar, 403);

        const remover = await api(semPrivilegio).delete(`/api/perfil-acesso/${privilegioId}`);
        assertStatus(remover, 403);
    });

    it('400 com corpo inválido', async () => {
        assertStatus(
            await api(gestor)
                .post('/api/perfil-acesso')
                .send({ privilegios: [privilegioId] }),
            400
        );
        assertStatus(
            await api(gestor)
                .post('/api/perfil-acesso')
                .send(novoPerfil({ privilegios: 'x' })),
            400
        );
        assertStatus(
            await api(gestor)
                .post('/api/perfil-acesso')
                .send(novoPerfil({ privilegios: ['x'] })),
            400
        );
    });

    it('cria, lista, edita e remove', async () => {
        const criado = await api(gestor).post('/api/perfil-acesso').send(novoPerfil());
        assertStatus(criado, 201);
        const id: number = criado.body.id;

        const lista = await api(gestor).get('/api/perfil-acesso');
        const linha = lista.body.linhas.find((l: { id: number }) => l.id === id);
        assert.equal(linha.autogerenciavel, false);
        assert.deepEqual(linha.privilegios, [privilegioId]);

        const novoNome = uniq('Editado');
        assertStatus(
            await api(gestor).patch(`/api/perfil-acesso/${id}`).send({ nome: novoNome, privilegios: [] }),
            200
        );
        const depois = await api(gestor).get('/api/perfil-acesso');
        const editado = depois.body.linhas.find((l: { id: number }) => l.id === id);
        assert.equal(editado.nome, novoNome);
        assert.deepEqual(editado.privilegios, []);

        assertStatus(await api(gestor).delete(`/api/perfil-acesso/${id}`), 202);
        const removido = await api(gestor).get('/api/perfil-acesso');
        assert.equal(
            removido.body.linhas.some((l: { id: number }) => l.id === id),
            false
        );
    });

    it('400 com nome igual a outro perfil ativo, sem diferenciar maiúsculas', async () => {
        const nome = uniq('Duplicado');
        assertStatus(await api(gestor).post('/api/perfil-acesso').send(novoPerfil({ nome })), 201);

        const res = await api(gestor)
            .post('/api/perfil-acesso')
            .send(novoPerfil({ nome: nome.toUpperCase() }));
        assertStatus(res, 400);
        assert.match(res.body.message, /Nome igual ou semelhante/);
    });

    it('400 ao remover perfil que tem pessoa usando', async () => {
        const usuario = await criarPessoaComPrivilegios(['CadastroOrgao.inserir']);
        const vinculo = await prisma().pessoaPerfil.findFirstOrThrow({ where: { pessoa_id: usuario.pessoa.id } });

        const res = await api(gestor).delete(`/api/perfil-acesso/${vinculo.perfil_acesso_id}`);
        assertStatus(res, 400);
        assert.match(res.body.message, /em uso/);
    });
});

describe('PrivController', () => {
    before(async () => {
        await bootApp();
    });

    it('401 sem token', async () => {
        assertStatus(await api().get('/api/perfil-de-acesso'), 401);
        assertStatus(await api().get('/api/privilegio'), 401);
    });

    it('GET /api/privilegio lista os códigos com seus módulos', async () => {
        const res = await api(await criarPessoaSemPrivilegios()).get('/api/privilegio');
        assertStatus(res, 200);
        assert.ok(res.body.linhas.some((l: { codigo: string }) => l.codigo === 'CadastroOrgao.inserir'));
        assert.ok(res.body.modulos.length > 0);
    });

    it('filtro sistemas só devolve privilégios do sistema pedido', async () => {
        const res = await api(await criarPessoaSemPrivilegios()).get('/api/privilegio?sistemas=PlanoSetorial');
        assertStatus(res, 200);
        assert.ok(res.body.linhas.length > 0);

        const codigos = res.body.linhas.map((l: { codigo: string }) => l.codigo);
        const privs = await prisma().privilegio.findMany({
            where: { codigo: { in: codigos } },
            select: { modulo: { select: { modulo_sistema: true } } },
        });
        assert.ok(privs.every((p) => p.modulo.modulo_sistema.includes('PlanoSetorial')));
    });

    it('400 com sistema que não existe', async () => {
        assertStatus(await api(await criarPessoaSemPrivilegios()).get('/api/privilegio?sistemas=Inexistente'), 400);
    });

    it('GET /api/perfil-de-acesso devolve o perfil criado para o superadmin', async () => {
        const perfil = await prisma().perfilAcesso.create({
            data: { nome: uniq('Visivel'), autogerenciavel: false },
        });
        const res = await api(await loginAsSuperAdmin()).get('/api/perfil-de-acesso');
        assertStatus(res, 200);
        assert.ok(res.body.linhas.some((l: { id: number }) => l.id === perfil.id));
    });
});
