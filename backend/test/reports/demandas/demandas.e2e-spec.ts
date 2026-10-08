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

describe('relatorio/demandas', () => {
    let executor: Sessao;
    let executorEscopado: Sessao;
    let validador: Sessao;
    let semPrivilegio: Sessao;
    let criadorId: number;
    let areaTematicaId: number;

    before(async () => {
        await bootApp();
        executor = await criarPessoaComPrivilegios(['Reports.executar.CasaCivil']);
        executorEscopado = await criarPessoaComPrivilegios(['Reports.executar.CasaCivil:Demandas']);
        validador = await criarPessoaComPrivilegios(['Reports.executar.CasaCivil', 'CadastroDemanda.validar']);
        semPrivilegio = await criarPessoaSemPrivilegios();
        criadorId = (await loginAsSuperAdmin()).pessoa.id;
        areaTematicaId = (await prisma().areaTematica.create({ data: { nome: uniq('Area'), criado_por: criadorId } }))
            .id;
    });

    const url = '/api/relatorio/demandas';

    function criarDemanda(dados: { orgao_id?: number; status?: 'Registro' | 'Publicado'; registro?: string } = {}) {
        return prisma().demanda.create({
            data: {
                orgao_id: dados.orgao_id ?? 1,
                unidade_responsavel: 'Unidade E2E',
                nome_responsavel: 'Responsavel E2E',
                cargo_responsavel: 'Cargo',
                email_responsavel: 'resp@e2e.test',
                telefone_responsavel: '11999999999',
                nome_projeto: uniq('projeto'),
                descricao: 'descricao',
                justificativa: 'justificativa',
                valor: '3200.40',
                finalidade: 'Investimento',
                area_tematica_id: areaTematicaId,
                status: dados.status ?? 'Registro',
                data_status_atual: new Date(),
                data_registro: new Date(dados.registro ?? '2030-03-10T12:00:00Z'),
                criado_por: criadorId,
            },
        });
    }

    const ids = (res: { body: { linhas: { id: number }[] } }) => res.body.linhas.map((l) => l.id);

    it('401 sem token', async () => {
        assertStatus(await api().post(url).send({}), 401);
    });

    it('403 sem Reports.executar.CasaCivil nem o escopado :Demandas', async () => {
        const res = await api(semPrivilegio).post(url).send({});
        assertStatus(res, 403);
        assert.match(res.body.message, /Reports\.executar\.CasaCivil/);
    });

    it('400 com status fora do enum, status fora de array ou orgao_id não inteiro', async () => {
        assertStatus(
            await api(executor)
                .post(url)
                .send({ status: ['Rascunho'] }),
            400
        );
        assertStatus(await api(executor).post(url).send({ status: 'Registro' }), 400);
        assertStatus(await api(executor).post(url).send({ orgao_id: 1.5 }), 400);
        assertStatus(await api(executor).post(url).send({ data_registro_inicio: 20300101 }), 400);
    });

    it(
        '400 com data_registro_inicio que não é data',
        {
            todo: 'BUG: POST /api/relatorio/demandas: esperado 400 para data_registro_inicio inválida, veio 500 (cast ::timestamptz no SQL)',
        },
        async () => {
            assertStatus(await api(executor).post(url).send({ data_registro_inicio: 'ontem' }), 400);
        }
    );

    it('201 devolve linhas e enderecos, e os campos da demanda do próprio órgão', async () => {
        const demanda = await criarDemanda();

        const res = await api(executor).post(url).send({ area_tematica_id: areaTematicaId });
        assertStatus(res, 201);
        assert.ok(Array.isArray(res.body.enderecos));

        const linha = res.body.linhas.find((l: { id: number }) => l.id === demanda.id);
        assert.ok(linha, 'demanda do órgão do usuário não aparece');
        assert.equal(linha.nome_projeto, demanda.nome_projeto);
        assert.equal(linha.status, 'Registro');
        assert.equal(linha.data_registro, '2030-03-10');
        assert.equal(linha.finalidade, 'Investimento');
        assert.equal(Number(linha.valor), 3200.4);
        assert.equal(linha.unidade_responsavel, 'Unidade E2E');
    });

    it('usuário sem CadastroDemanda.validar só vê o próprio órgão, com validar vê todos', async () => {
        const outroOrgao = await criarOrgao();
        const propria = await criarDemanda();
        const alheia = await criarDemanda({ orgao_id: outroOrgao.id });
        const corpo = { area_tematica_id: areaTematicaId };

        const doExecutor = await api(executor).post(url).send(corpo);
        assertStatus(doExecutor, 201);
        assert.ok(ids(doExecutor).includes(propria.id));
        assert.equal(ids(doExecutor).includes(alheia.id), false);

        const doValidador = await api(validador).post(url).send(corpo);
        assertStatus(doValidador, 201);
        assert.ok(ids(doValidador).includes(propria.id));
        assert.ok(ids(doValidador).includes(alheia.id));
    });

    it('filtra por status, órgão e data de registro', async () => {
        const outroOrgao = await criarOrgao();
        const registro = await criarDemanda({ registro: '2031-05-01T12:00:00Z' });
        const publicada = await criarDemanda({ status: 'Publicado', registro: '2032-05-01T12:00:00Z' });
        const alheia = await criarDemanda({ orgao_id: outroOrgao.id, registro: '2031-05-02T12:00:00Z' });
        const consulta = async (corpo: Record<string, unknown>) => {
            const res = await api(validador)
                .post(url)
                .send({ area_tematica_id: areaTematicaId, ...corpo });
            assertStatus(res, 201);
            return ids(res);
        };

        const porStatus = await consulta({ status: ['Publicado'] });
        assert.ok(porStatus.includes(publicada.id));
        assert.equal(porStatus.includes(registro.id), false);

        const porOrgao = await consulta({ orgao_id: outroOrgao.id });
        assert.ok(porOrgao.includes(alheia.id));
        assert.equal(porOrgao.includes(registro.id), false);

        const porData = await consulta({
            data_registro_inicio: '2031-05-01T00:00:00Z',
            data_registro_fim: '2031-12-31T00:00:00Z',
        });
        assert.ok(porData.includes(registro.id));
        assert.ok(porData.includes(alheia.id));
        assert.equal(porData.includes(publicada.id), false);
    });

    it('privilégio escopado Reports.executar.CasaCivil:Demandas passa no guard', async () => {
        const demanda = await criarDemanda();

        const res = await api(executorEscopado).post(url).send({ area_tematica_id: areaTematicaId });
        assertStatus(res, 201);
        assert.ok(ids(res).includes(demanda.id));
    });
});
