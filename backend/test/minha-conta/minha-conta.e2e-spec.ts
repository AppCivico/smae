import { before, describe, it } from 'node:test';
import { api, assert, assertStatus, bootApp, criarPessoaComPrivilegios, prisma, Sessao } from '../lib';

const SENHA = '!286!QDM7H';
const HASH_SENHA = '$2b$10$2DUUZc55NxezhEydgfUSTexk4.1qjbvb.873cZhCpIvjw4izkFqcW';
const NOVA_SENHA = 'Nova*Senha1';

describe('minha-conta', () => {
    before(async () => {
        await bootApp();
    });

    async function pessoaComSenhaConhecida(): Promise<Sessao> {
        const sessao = await criarPessoaComPrivilegios(['CadastroPessoa.editar']);
        await prisma().pessoa.update({ where: { id: sessao.pessoa.id }, data: { senha: HASH_SENHA } });
        return sessao;
    }

    describe('MinhaContaController', () => {
        it('GET /api/minha-conta não lista SMAE entre os sistemas da sessão', async () => {
            const sessao = await pessoaComSenhaConhecida();
            const res = await api(sessao).get('/api/minha-conta');
            assertStatus(res, 200);
            assert.equal(res.body.sessao.sistemas.includes('SMAE'), false);
            assert.ok(res.body.sessao.privilegios.includes('CadastroPessoa.editar'));
        });

        it('POST /api/teste-sistema: 401 sem token e 400 com data inválida', async () => {
            assertStatus(await api().post('/api/teste-sistema').send({ data: '2024-01-31' }), 401);

            const sessao = await pessoaComSenhaConhecida();
            assertStatus(await api(sessao).post('/api/teste-sistema').send({ data: 'não é data' }), 400);
        });

        it('POST /api/teste-sistema devolve o nome da pessoa e a data no formato enviado', async () => {
            const sessao = await pessoaComSenhaConhecida();
            const res = await api(sessao).post('/api/teste-sistema').send({ data: '2024-01-31' });
            assertStatus(res, 201);
            assert.match(res.text, new RegExp(sessao.pessoa.nome_exibicao.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
            assert.match(res.text, /2024-01-31/);
        });
    });

    describe('POST /api/trocar-senha', () => {
        it('401 sem token', async () => {
            assertStatus(
                await api().post('/api/trocar-senha').send({ senha_corrente: SENHA, senha_nova: NOVA_SENHA }),
                401
            );
        });

        it('400 com senha nova fora da regra', async () => {
            const sessao = await pessoaComSenhaConhecida();
            const res = await api(sessao)
                .post('/api/trocar-senha')
                .send({ senha_corrente: SENHA, senha_nova: 'curta' });
            assertStatus(res, 400);
        });

        it('400 quando a senha atual não confere', async () => {
            const sessao = await pessoaComSenhaConhecida();
            const res = await api(sessao)
                .post('/api/trocar-senha')
                .send({ senha_corrente: 'errada', senha_nova: NOVA_SENHA });
            assertStatus(res, 400);
            assert.match(res.body.message, /Senha atual não confere/);
        });

        it('204 troca a senha, mantém a sessão atual e o login usa a nova senha', async () => {
            const sessao = await pessoaComSenhaConhecida();

            const res = await api(sessao)
                .post('/api/trocar-senha')
                .send({ senha_corrente: SENHA, senha_nova: NOVA_SENHA });
            assertStatus(res, 204);

            assertStatus(await api(sessao).get('/api/minha-conta'), 200);
            assertStatus(await api().post('/api/login').send({ email: sessao.pessoa.email, senha: SENHA }), 401);
            assertStatus(await api().post('/api/login').send({ email: sessao.pessoa.email, senha: NOVA_SENHA }), 200);
        });
    });
});
