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

describe('relatorio/tribunal-de-contas', () => {
    let executor: Sessao;
    let semPrivilegio: Sessao;
    let tipoId: number;
    let criadorId: number;
    let anoSeq = 2100;
    let seq = 0;

    before(async () => {
        await bootApp();
        executor = await criarPessoaComPrivilegios(['Reports.executar.CasaCivil']);
        semPrivilegio = await criarPessoaSemPrivilegios();
        criadorId = (await loginAsSuperAdmin()).pessoa.id;
        tipoId = (
            await prisma().transferenciaTipo.create({
                data: { nome: uniq('tipo'), categoria: 'Discricionaria', esfera: 'Federal', criado_por: criadorId },
            })
        ).id;
    });

    const url = '/api/relatorio/tribunal-de-contas';

    async function criarDistribuicao(dados: { cancelada?: boolean; ano?: number } = {}) {
        const ano = dados.ano ?? ++anoSeq;
        const transferencia = await prisma().transferencia.create({
            data: {
                tipo_id: tipoId,
                orgao_concedente_id: 1,
                objeto: uniq('objeto'),
                identificador: `TC-${++seq}`,
                identificador_nro: seq,
                esfera: 'Federal',
                ano,
                emenda: 'EM 12.345-6',
                programa: 'PR 77',
                cancelada: dados.cancelada ?? false,
                criado_por: criadorId,
            },
        });
        const distribuicao = await prisma().distribuicaoRecurso.create({
            data: {
                transferencia_id: transferencia.id,
                orgao_gestor_id: 1,
                objeto: uniq('acao'),
                valor: '2500.75',
                valor_empenho: '100.10',
                finalidade: 'Reforma',
                criado_por: criadorId,
            },
        });
        return { ano, transferencia, distribuicao };
    }

    it('401 sem token', async () => {
        assertStatus(await api().post(url).send({}), 401);
    });

    it('403 sem Reports.executar.CasaCivil', async () => {
        const res = await api(semPrivilegio).post(url).send({});
        assertStatus(res, 403);
        assert.match(res.body.message, /Reports\.executar\.CasaCivil/);
    });

    it('400 com esfera ou cancelada fora do enum, ou ano não numérico', async () => {
        assertStatus(await api(executor).post(url).send({ esfera: 'Distrital' }), 400);
        assertStatus(await api(executor).post(url).send({ cancelada: 'Talvez' }), 400);
        assertStatus(await api(executor).post(url).send({ ano_inicio: '2020', ano_fim: 2021 }), 400);
    });

    it('400 quando só um dos anos é enviado', async () => {
        const res = await api(executor).post(url).send({ ano_inicio: 2020 });
        assertStatus(res, 400);
        assert.match(res.body.message, /ambos os anos/);
        assertStatus(await api(executor).post(url).send({ ano_fim: 2020 }), 400);
    });

    it('201 devolve a distribuição com os campos da transferência', async () => {
        const { ano } = await criarDistribuicao();

        const res = await api(executor).post(url).send({ ano_inicio: ano, ano_fim: ano, esfera: 'Federal' });
        assertStatus(res, 201);

        const linhas: Record<string, any>[] = res.body.linhas;
        assert.equal(linhas.length, 1);
        assert.equal(linhas[0].ano, ano);
        assert.equal(linhas[0].emenda, '123456');
        assert.equal(linhas[0].programa, '77');
        assert.equal(linhas[0].valor_repasse, '2500.75');
        assert.equal(linhas[0].valor_empenho, '100.1');
        assert.equal(linhas[0].finalidade, 'Reforma');
        assert.match(linhas[0].gestor_municipal, /^.+ - .+$/);
    });

    it('filtra por esfera e por tipo_id', async () => {
        const { ano } = await criarDistribuicao();

        const outraEsfera = await api(executor).post(url).send({ ano_inicio: ano, ano_fim: ano, esfera: 'Estadual' });
        assertStatus(outraEsfera, 201);
        assert.deepEqual(outraEsfera.body.linhas, []);

        const outroTipo = await api(executor)
            .post(url)
            .send({ ano_inicio: ano, ano_fim: ano, tipo_id: tipoId + 1000 });
        assertStatus(outroTipo, 201);
        assert.deepEqual(outroTipo.body.linhas, []);

        const mesmoTipo = await api(executor).post(url).send({ ano_inicio: ano, ano_fim: ano, tipo_id: tipoId });
        assertStatus(mesmoTipo, 201);
        assert.equal(mesmoTipo.body.linhas.length, 1);
    });

    it('cancelada: transferência cancelada só aparece com Incluir ou Apenas', async () => {
        const { ano } = await criarDistribuicao({ cancelada: true });
        const consulta = async (extra: Record<string, unknown>) => {
            const res = await api(executor)
                .post(url)
                .send({ ano_inicio: ano, ano_fim: ano, ...extra });
            assertStatus(res, 201);
            return res.body.linhas.length as number;
        };

        assert.equal(await consulta({}), 0);
        assert.equal(await consulta({ cancelada: 'NaoIncluir' }), 0);
        assert.equal(await consulta({ cancelada: 'Incluir' }), 1);
        assert.equal(await consulta({ cancelada: 'Apenas' }), 1);
        assert.equal(await consulta({ cancelada: true }), 1);
    });
});
