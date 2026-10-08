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
} from '../../lib';

describe('relatorio/obras', () => {
    let executor: Sessao;
    let administrador: Sessao;
    let semPrivilegio: Sessao;
    let criadorId: number;
    let portfolioId: number;
    let grupoTematicoId: number;
    let orgaoId: number;
    let obraCedo: { id: number; nome: string };
    let obraTarde: { id: number; nome: string };

    before(async () => {
        await bootApp();
        executor = await criarPessoaComPrivilegios(['Reports.executar.MDO']);
        administrador = await criarPessoaComPrivilegios(['Reports.executar.MDO', 'ProjetoMDO.administrador']);
        semPrivilegio = await criarPessoaSemPrivilegios();
        criadorId = (await loginAsSuperAdmin()).pessoa.id;

        portfolioId = (
            await prisma().portfolio.create({
                data: { titulo: uniq('portfolio'), tipo_projeto: 'MDO', criado_por: criadorId },
            })
        ).id;
        grupoTematicoId = (
            await prisma().grupoTematico.create({ data: { nome: uniq('grupo'), criado_por: criadorId } })
        ).id;
        orgaoId = (await criarOrgao()).id;

        obraCedo = await criarObra('2028-01-01', { grupo_tematico_id: grupoTematicoId });
        obraTarde = await criarObra('2029-01-01', { orgao_responsavel_id: orgaoId });
    });

    function criarObra(inicio: string, extra: { grupo_tematico_id?: number; orgao_responsavel_id?: number }) {
        return prisma().projeto.create({
            data: {
                portfolio_id: portfolioId,
                tipo: 'MDO',
                nome: uniq('obra'),
                objeto: 'objeto',
                objetivo: 'objetivo',
                publico_alvo: 'público',
                resumo: 'resumo',
                status: 'MDO_EmAndamento',
                fase: 'Registro',
                orgao_gestor_id: 1,
                previsao_inicio: new Date(inicio),
                registrado_em: new Date(),
                registrado_por: criadorId,
                ...extra,
            },
            select: { id: true, nome: true },
        });
    }

    const url = '/api/relatorio/obras';
    // DateTransform quebra (500) quando periodo é omitido: os testes enviam null
    const filtro = (extra: Record<string, unknown> = {}) => ({ portfolio_id: portfolioId, periodo: null, ...extra });
    const obraIds = (res: { body: { linhas: { obra_id: number }[] } }) => res.body.linhas.map((l) => l.obra_id);

    it('401 sem token', async () => {
        assertStatus(await api().post(url).send(filtro()), 401);
    });

    it('403 sem Reports.executar.MDO', async () => {
        const res = await api(semPrivilegio).post(url).send(filtro());
        assertStatus(res, 403);
        assert.match(res.body.message, /Reports\.executar\.MDO/);
    });

    it('400 sem portfolio_id, com portfolio_id não inteiro, periodo inválido ou filtro não inteiro', async () => {
        const enviar = (corpo: Record<string, unknown>) => api(executor).post(url).send(corpo);
        assertStatus(await enviar({ periodo: null }), 400);
        assertStatus(await enviar(filtro({ portfolio_id: 'x' })), 400);
        assertStatus(await enviar(filtro({ periodo: '31/12/2028' })), 400);
        assertStatus(await enviar(filtro({ grupo_tematico_id: 'x' })), 400);
        assertStatus(await enviar(filtro({ orgao_responsavel_id: 1.5 })), 400);
    });

    it(
        '400 com corpo vazio',
        {
            todo: 'BUG: POST /api/relatorio/obras: esperado 400 (portfolio_id obrigatório), veio 500 (DateTransform recebe undefined em periodo)',
        },
        async () => {
            assertStatus(await api(executor).post(url).send({}), 400);
        }
    );

    it(
        '201 sem periodo (campo opcional)',
        {
            todo: 'BUG: POST /api/relatorio/obras: esperado 201 sem periodo (@IsOptional), veio 500 (DateTransform recebe undefined)',
        },
        async () => {
            assertStatus(await api(administrador).post(url).send({ portfolio_id: portfolioId }), 201);
        }
    );

    it('201 devolve as obras do portfólio e as demais seções do relatório', async () => {
        const res = await api(administrador).post(url).send(filtro());
        assertStatus(res, 201);

        assert.deepEqual(obraIds(res).sort(), [obraCedo.id, obraTarde.id].sort());
        const linha = res.body.linhas.find((l: { obra_id: number }) => l.obra_id === obraCedo.id);
        assert.equal(linha.nome, obraCedo.nome);
        assert.equal(linha.status, 'MDO_EmAndamento');
        assert.equal(linha.portfolio_id, portfolioId);
        assert.equal(linha.grupo_tematico_id, grupoTematicoId);
        assert.equal(linha.previsao_inicio, '2028-01-01');
        for (const secao of [
            'cronograma',
            'acompanhamentos',
            'fontes_recurso',
            'contratos',
            'aditivos',
            'origens',
            'processos_sei',
            'enderecos',
        ]) {
            assert.ok(Array.isArray(res.body[secao]), `${secao} deveria ser lista`);
        }
    });

    it('filtra por grupo temático, órgão responsável e início do período', async () => {
        const enviar = async (extra: Record<string, unknown>) => {
            const res = await api(administrador).post(url).send(filtro(extra));
            assertStatus(res, 201);
            return obraIds(res);
        };

        assert.deepEqual(await enviar({ grupo_tematico_id: grupoTematicoId }), [obraCedo.id]);
        assert.deepEqual(await enviar({ orgao_responsavel_id: orgaoId }), [obraTarde.id]);
        assert.deepEqual(await enviar({ periodo: '2028-06-01' }), [obraTarde.id]);
        assert.deepEqual(await enviar({ periodo: '2030-01-01' }), []);
    });

    it('portfólio inexistente devolve linhas e cronograma vazios', async () => {
        const res = await api(administrador)
            .post(url)
            .send(filtro({ portfolio_id: 999999 }));
        assertStatus(res, 201);
        assert.equal(res.body.linhas.length, 0);
        assert.equal(res.body.cronograma.length, 0);
    });

    it('quem não tem nenhum papel em obras recebe 400 de permissão', async () => {
        const res = await api(executor).post(url).send(filtro());
        assertStatus(res, 400);
        assert.match(res.body.message, /permiss/i);
    });
});
