import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarOrgao,
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    loginAsSuperAdmin,
    prisma,
    Sessao,
    uniq,
} from '../lib';

const H = { sistema: 'PlanoSetorial' as const };
const SENHA = '!286!QDM7H';
const HASH_SENHA = '$2b$10$2DUUZc55NxezhEydgfUSTexk4.1qjbvb.873cZhCpIvjw4izkFqcW';

let cpfSeq = 0;
// CPF com dígitos verificadores válidos, único por chamada
function cpfValido(): string {
    const base = String(10000000 + ((process.pid * 1000 + ++cpfSeq) % 89999999)).padStart(9, '0');
    const nums = base.split('').map(Number);
    const digito = (digitos: number[]) => {
        const soma = digitos.reduce((acc, n, i) => acc + n * (digitos.length + 1 - i), 0);
        const resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    };
    const d1 = digito(nums);
    const d2 = digito([...nums, d1]);
    return `${base.slice(0, 3)}.${base.slice(3, 6)}.${base.slice(6)}-${d1}${d2}`;
}

const emailsPara = (email: string, subject: string) =>
    prisma().emaildbQueue.findMany({ where: { to: email, subject } });

describe('PessoaController', () => {
    let admin: Sessao;
    let gestor: Sessao;
    let editor: Sessao;
    let semPrivilegio: Sessao;
    let orgaoId: number;

    before(async () => {
        await bootApp();
        admin = await loginAsSuperAdmin();
        orgaoId = (await criarOrgao()).id;
        gestor = await criarPessoaComPrivilegios(
            ['CadastroPessoa.inserir', 'CadastroPessoa.editar', 'CadastroPessoa.inativar', 'CadastroPessoa.ativar'],
            { orgao_id: orgaoId }
        );
        editor = await criarPessoaComPrivilegios(['CadastroPessoa.editar'], { orgao_id: orgaoId });
        semPrivilegio = await criarPessoaSemPrivilegios();
    });

    const novaPessoa = (extra: Record<string, unknown> = {}) => ({
        email: `${uniq('pessoa').replace(/\W+/g, '.').toLowerCase()}@e2e.test`,
        nome_exibicao: uniq('Exibição'),
        nome_completo: uniq('Nome Completo'),
        orgao_id: orgaoId,
        perfil_acesso_ids: [],
        cpf: cpfValido(),
        ...extra,
    });

    async function pessoaComSenhaConhecida(extra: Record<string, unknown> = {}) {
        const sessao = await criarPessoaComPrivilegios(['CadastroPessoa.editar'], { orgao_id: orgaoId });
        await prisma().pessoa.update({
            where: { id: sessao.pessoa.id },
            data: { senha: HASH_SENHA, senha_bloqueada: false, qtde_senha_invalida: 0, ...extra },
        });
        return sessao;
    }

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await api().get('/api/pessoa'), 401);
            assertStatus(await api().post('/api/pessoa').send(novaPessoa()), 401);
            assertStatus(await api().get('/api/pessoa/1'), 401);
            assertStatus(await api().patch('/api/pessoa/1').send({ nome_exibicao: uniq() }), 401);
        });

        it('403 sem CadastroPessoa.inserir ou editar', async () => {
            const criar = await api(semPrivilegio, H).post('/api/pessoa').send(novaPessoa());
            assertStatus(criar, 403);
            assert.match(criar.body.message, /CadastroPessoa\.inserir/);

            const editar = await api(semPrivilegio, H).patch(`/api/pessoa/${editor.pessoa.id}`).send({ cargo: 'x' });
            assertStatus(editar, 403);
            assert.match(editar.body.message, /CadastroPessoa\.editar/);
        });

        it('403 em recalc-equipe sem SMAE.superadmin', async () => {
            const res = await api(gestor).patch('/api/pessoa/recalc-equipe');
            assertStatus(res, 403);
            assert.match(res.body.message, /SMAE\.superadmin/);
        });

        it('400 ao editar sem smae-sistemas, porque a edição exige um sistema', async () => {
            const res = await api(admin).patch(`/api/pessoa/${editor.pessoa.id}`).send({ cargo: 'x' });
            assertStatus(res, 400);
            assert.match(res.body.message, /mais de um sistema/);
        });
    });

    describe('validação', () => {
        it('400 com e-mail inválido ou sem perfil_acesso_ids', async () => {
            assertStatus(
                await api(admin, H)
                    .post('/api/pessoa')
                    .send(novaPessoa({ email: 'nao-e-email' })),
                400
            );

            const semPerfis = novaPessoa();
            delete (semPerfis as { perfil_acesso_ids?: unknown }).perfil_acesso_ids;
            assertStatus(await api(admin, H).post('/api/pessoa').send(semPerfis), 400);
        });

        it('400 com CPF de dígitos verificadores errados', async () => {
            const res = await api(admin, H)
                .post('/api/pessoa')
                .send(novaPessoa({ cpf: '123.456.789-00' }));
            assertStatus(res, 400);
        });

        it('400 ao desativar com motivo menor que 4 caracteres', async () => {
            const alvo = await pessoaComSenhaConhecida();
            const res = await api(gestor, H)
                .patch(`/api/pessoa/${alvo.pessoa.id}`)
                .send({ desativado: true, desativado_motivo: 'abc' });
            assertStatus(res, 400);
        });
    });

    describe('criação', () => {
        it('cria com senha bloqueada e enfileira a primeira senha por e-mail', async () => {
            const dados = novaPessoa({ email: `${uniq('Criada').replace(/\W+/g, '.')}@E2E.test` });
            const res = await api(admin, H).post('/api/pessoa').send(dados);
            assertStatus(res, 201);
            assert.equal(typeof res.body.id, 'number');

            const conta = await prisma().pessoa.findUniqueOrThrow({
                where: { id: res.body.id },
                select: {
                    email: true,
                    senha_bloqueada: true,
                    pessoa_fisica: { select: { orgao_id: true, cpf: true } },
                },
            });
            assert.equal(conta.email, dados.email.toLowerCase());
            assert.equal(conta.senha_bloqueada, true);
            assert.equal(conta.pessoa_fisica?.orgao_id, orgaoId);
            assert.equal(conta.pessoa_fisica?.cpf, dados.cpf);

            const emails = await emailsPara(
                dados.email.toLowerCase(),
                'Bem vindo ao SMAE - Senha para primeiro acesso'
            );
            assert.equal(emails.length, 1);
        });

        it('400 com e-mail já cadastrado, mesmo com maiúsculas', async () => {
            const existente = await pessoaComSenhaConhecida();
            const res = await api(admin, H)
                .post('/api/pessoa')
                .send(novaPessoa({ email: existente.pessoa.email.toUpperCase() }));
            assertStatus(res, 400);
            assert.match(res.body.message, /E-mail já tem conta/);
        });

        it('400 com CPF já atrelado a outra conta', async () => {
            const cpf = cpfValido();
            assertStatus(await api(admin, H).post('/api/pessoa').send(novaPessoa({ cpf })), 201);

            const res = await api(admin, H).post('/api/pessoa').send(novaPessoa({ cpf }));
            assertStatus(res, 400);
            assert.match(res.body.message, /CPF já atrelado/);
        });

        it('403 para criar pessoa em órgão diferente do seu, sem ser administrador', async () => {
            const res = await api(gestor, H)
                .post('/api/pessoa')
                .send(novaPessoa({ orgao_id: 1 }));
            assertStatus(res, 403);
            assert.match(res.body.message, /próprio órgão/);
            assertStatus(await api(gestor, H).post('/api/pessoa').send(novaPessoa()), 201);
        });

        it('400 ao gestor atribuir perfil com SMAE.superadmin', async () => {
            const perfilAdmin = await prisma().perfilPrivilegio.findFirstOrThrow({
                where: { privilegio: { codigo: 'SMAE.superadmin' } },
                select: { perfil_acesso_id: true },
            });
            const res = await api(gestor, H)
                .post('/api/pessoa')
                .send(novaPessoa({ perfil_acesso_ids: [perfilAdmin.perfil_acesso_id] }));
            assertStatus(res, 400);
            assert.match(res.body.message, /não pode adicionar ou remover permissões/);
        });
    });

    describe('edição e privilégios sobre outras pessoas', () => {
        it('403 ao editar a própria conta sem ser administrador', async () => {
            const res = await api(gestor, H).patch(`/api/pessoa/${gestor.pessoa.id}`).send({ cargo: 'Chefe' });
            assertStatus(res, 403);
            assert.match(res.body.message, /a si mesmo/);
        });

        it('400 ao gestor editar pessoa com privilégios que ele não tem', async () => {
            const maior = await criarPessoaComPrivilegios(['CadastroOrgao.inserir'], { orgao_id: orgaoId });
            const res = await api(gestor, H).patch(`/api/pessoa/${maior.pessoa.id}`).send({ cargo: 'x' });
            assertStatus(res, 400);
            assert.match(res.body.message, /mais privilégios que você/);
        });

        it('200 edita dados e GET em /api/pessoa/:id reflete a mudança', async () => {
            const alvo = await pessoaComSenhaConhecida();
            const cargo = uniq('Cargo');
            assertStatus(await api(admin, H).patch(`/api/pessoa/${alvo.pessoa.id}`).send({ cargo }), 200);

            const detalhe = await api(admin, H).get(`/api/pessoa/${alvo.pessoa.id}`);
            assertStatus(detalhe, 200);
            assert.equal(detalhe.body.cargo, cargo);
        });

        it('400 ao trocar e-mail para o de outra conta', async () => {
            const outra = await pessoaComSenhaConhecida();
            const alvo = await pessoaComSenhaConhecida();
            const res = await api(admin, H).patch(`/api/pessoa/${alvo.pessoa.id}`).send({ email: outra.pessoa.email });
            assertStatus(res, 400);
            assert.match(res.body.message, /E-mail está em uso/);
        });

        it('403 para desativar sem CadastroPessoa.inativar, e 403 para inativar pessoa de outro órgão', async () => {
            const alvo = await pessoaComSenhaConhecida();
            const semInativar = await api(editor, H)
                .patch(`/api/pessoa/${alvo.pessoa.id}`)
                .send({ desativado: true, desativado_motivo: 'motivo valido' });
            assertStatus(semInativar, 403);
            assert.match(semInativar.body.message, /não pode inativar/);

            const outroOrgao = await criarPessoaComPrivilegios(['CadastroOrgao.inserir'], { orgao_id: 1 });
            const deOutroOrgao = await api(gestor, H)
                .patch(`/api/pessoa/${outroOrgao.pessoa.id}`)
                .send({ desativado: true, desativado_motivo: 'motivo valido' });
            assertStatus(deOutroOrgao, 403);
            assert.match(deOutroOrgao.body.message, /próprio órgão/);
        });

        it('403 ao desativar sem motivo', async () => {
            const alvo = await pessoaComSenhaConhecida();
            const res = await api(gestor, H).patch(`/api/pessoa/${alvo.pessoa.id}`).send({ desativado: true });
            assertStatus(res, 403);
            assert.match(res.body.message, /motivo/);
        });

        it('conta desativada não entra mais, e volta a entrar depois de ativada', async () => {
            const alvo = await pessoaComSenhaConhecida();
            const entrar = () => api().post('/api/login').send({ email: alvo.pessoa.email, senha: SENHA });
            assertStatus(await entrar(), 200);

            const desativar = await api(gestor, H)
                .patch(`/api/pessoa/${alvo.pessoa.id}`)
                .send({ desativado: true, desativado_motivo: 'saiu da equipe' });
            assertStatus(desativar, 200);

            const conta = await prisma().pessoa.findUniqueOrThrow({ where: { id: alvo.pessoa.id } });
            assert.equal(conta.desativado, true);
            assert.equal(conta.desativado_por, gestor.pessoa.id);
            assert.equal(conta.desativado_motivo, 'saiu da equipe');

            const bloqueado = await entrar();
            assertStatus(bloqueado, 400);
            assert.match(bloqueado.body.message, /Conta não está mais ativa/);

            assertStatus(await api(gestor, H).patch(`/api/pessoa/${alvo.pessoa.id}`).send({ desativado: false }), 200);
            assertStatus(await entrar(), 200);
        });

        it('a sessão aberta antes de desativar perde o acesso', async () => {
            const alvo = await pessoaComSenhaConhecida();
            const { access_token } = (await api().post('/api/login').send({ email: alvo.pessoa.email, senha: SENHA }))
                .body;
            assertStatus(
                await api(gestor, H)
                    .patch(`/api/pessoa/${alvo.pessoa.id}`)
                    .send({ desativado: true, desativado_motivo: 'saiu da equipe' }),
                200
            );

            const res = await api(access_token).get('/api/minha-conta');
            assertStatus(res, 400);
            assert.match(res.body.message, /não tem mais permissões/);
        });
    });

    describe('listagem e detalhe', () => {
        it('GET /api/pessoa filtra por órgão e exige sistema para não administrador', async () => {
            const dentro = await pessoaComSenhaConhecida();

            const res = await api(admin, H).get(`/api/pessoa?orgao_id=${orgaoId}`);
            assertStatus(res, 200);
            assert.ok(res.body.linhas.some((l: { id: number }) => l.id === dentro.pessoa.id));
            assert.ok(res.body.linhas.every((l: { orgao_id: number }) => l.orgao_id === orgaoId));

            assertStatus(await api(gestor).get('/api/pessoa'), 400);
        });

        it('GET /api/pessoa/reduzido devolve só id, nome_exibicao e orgao_id', async () => {
            const res = await api(gestor, H).get('/api/pessoa/reduzido');
            assertStatus(res, 200);
            assert.ok(res.body.linhas.length > 0);
            for (const linha of res.body.linhas) {
                assert.deepEqual(Object.keys(linha).sort(), ['id', 'nome_exibicao', 'orgao_id']);
            }
        });

        it('403 para GET /api/pessoa/:id sem privilégio de pessoa', async () => {
            assertStatus(await api(semPrivilegio, H).get(`/api/pessoa/${gestor.pessoa.id}`), 403);
        });
    });

    describe('recalc-equipe', () => {
        it('200 para superadmin com resumo do recálculo', async () => {
            const res = await api(admin).patch('/api/pessoa/recalc-equipe');
            assertStatus(res, 200);
            assert.equal(typeof res.body.total_pessoas, 'number');
            assert.ok(Array.isArray(res.body.pessoas_afetadas));
        });
    });

    describe('responsabilidades', () => {
        it('401 sem token e 403 sem CadastroPessoa.editar_responsabilidade', async () => {
            assertStatus(await api().get(`/api/pessoa/responsabilidades?pessoa_id=${gestor.pessoa.id}`), 401);

            const res = await api(semPrivilegio, H).get(`/api/pessoa/responsabilidades?pessoa_id=${gestor.pessoa.id}`);
            assertStatus(res, 403);
            assert.match(res.body.message, /CadastroPessoa\.editar_responsabilidade/);

            assertStatus(await api(semPrivilegio, H).post('/api/pessoa/responsabilidades').send({}), 403);
        });

        it('400 sem pessoa_id e 400 com operação desconhecida', async () => {
            const responsavel = await criarPessoaComPrivilegios(['CadastroPessoa.editar_responsabilidade'], {
                orgao_id: orgaoId,
            });
            assertStatus(await api(responsavel, H).get('/api/pessoa/responsabilidades'), 400);

            const operacao = await api(responsavel, H).post('/api/pessoa/responsabilidades').send({
                origem_pessoa_id: gestor.pessoa.id,
                nova_pessoa_id: null,
                operacao: 'inventada',
                metas: [],
            });
            assertStatus(operacao, 400);
        });

        it('200 com lista de metas vazia para quem não tem PDM no sistema pedido', async () => {
            const responsavel = await criarPessoaComPrivilegios(['CadastroPessoa.editar_responsabilidade'], {
                orgao_id: orgaoId,
            });
            const res = await api(responsavel, H).get(`/api/pessoa/responsabilidades?pessoa_id=${gestor.pessoa.id}`);
            assertStatus(res, 200);
            assert.deepEqual(res.body, { metas: [] });
        });
    });
});
