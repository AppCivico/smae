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
    Sessao,
    uniq,
} from '../../lib';

describe('relatorio/projeto', () => {
    let executor: Sessao;
    let administrador: Sessao;
    let semPrivilegio: Sessao;
    let portfolioId: number;
    let portfolioTitulo: string;
    let projeto: { id: number; nome: string };
    let obra: { id: number };

    before(async () => {
        await bootApp();
        executor = await criarPessoaComPrivilegios(['Reports.executar.Projetos']);
        administrador = await criarPessoaComPrivilegios(['Reports.executar.Projetos', 'Projeto.administrador']);
        semPrivilegio = await criarPessoaSemPrivilegios();
        const criadorId = (await loginAsSuperAdmin()).pessoa.id;

        portfolioTitulo = uniq('portfolio');
        portfolioId = (
            await prisma().portfolio.create({
                data: { titulo: portfolioTitulo, tipo_projeto: 'PP', criado_por: criadorId },
            })
        ).id;
        const dados = {
            portfolio_id: portfolioId,
            objeto: 'objeto do projeto',
            objetivo: 'objetivo',
            publico_alvo: 'público',
            resumo: 'resumo',
            fase: 'Registro' as const,
            orgao_gestor_id: 1,
            registrado_em: new Date(),
            registrado_por: criadorId,
        };
        projeto = await prisma().projeto.create({
            data: { ...dados, tipo: 'PP', nome: uniq('projeto'), status: 'Registrado' },
            select: { id: true, nome: true },
        });
        const portfolioMdo = await prisma().portfolio.create({
            data: { titulo: uniq('portfolio'), tipo_projeto: 'MDO', criado_por: criadorId },
        });
        obra = await prisma().projeto.create({
            data: {
                ...dados,
                portfolio_id: portfolioMdo.id,
                tipo: 'MDO',
                nome: uniq('obra'),
                status: 'MDO_EmAndamento',
            },
            select: { id: true },
        });
    });

    const url = '/api/relatorio/projeto';

    it('401 sem token', async () => {
        assertStatus(await api().post(url).send({ projeto_id: projeto.id }), 401);
    });

    it('403 sem Reports.executar.Projetos', async () => {
        const res = await api(semPrivilegio).post(url).send({ projeto_id: projeto.id });
        assertStatus(res, 403);
        assert.match(res.body.message, /Reports\.executar\.Projetos/);
    });

    it('400 sem projeto_id ou com projeto_id não numérico', async () => {
        assertStatus(await api(administrador).post(url).send({}), 400);
        assertStatus(await api(administrador).post(url).send({ projeto_id: 'x' }), 400);
        assertStatus(await api(administrador).post(url).send({ projeto_id: 1.5 }), 400);
    });

    it('201 devolve o detalhe do projeto e as seções vazias', async () => {
        const res = await api(administrador).post(url).send({ projeto_id: projeto.id });
        assertStatus(res, 201);

        assert.equal(res.body.detail.projeto_id, projeto.id);
        assert.equal(res.body.detail.nome, projeto.nome);
        assert.equal(res.body.detail.portfolio_id, portfolioId);
        assert.equal(res.body.detail.portfolio_titulo, portfolioTitulo);
        assert.equal(res.body.detail.status, 'Registrado');
        assert.equal(res.body.detail.objeto, 'objeto do projeto');
        assert.equal(res.body.detail.orgao_gestor_id, 1);
        for (const secao of ['cronograma', 'riscos', 'planos_acao', 'acompanhamentos', 'contratos', 'enderecos']) {
            assert.deepEqual(res.body[secao], [], `${secao} deveria estar vazia`);
        }
    });

    it('400 para projeto inexistente ou que é obra', async () => {
        for (const id of [999999, obra.id]) {
            const res = await api(administrador).post(url).send({ projeto_id: id });
            assertStatus(res, 400);
            assert.match(res.body.message, /Projeto não encontrado ou sem permissão/);
        }
    });

    it('400 para quem não tem nenhum papel em projetos', async () => {
        const res = await api(executor).post(url).send({ projeto_id: projeto.id });
        assertStatus(res, 400);
        assert.match(res.body.message, /Sem permissões para acesso aos projetos/);
    });
});
