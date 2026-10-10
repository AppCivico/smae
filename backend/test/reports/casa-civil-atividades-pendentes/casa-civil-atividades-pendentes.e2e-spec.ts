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

describe('relatorio/casa-civil-atividades-pendentes', () => {
    let executor: Sessao;
    let semPrivilegio: Sessao;
    let criadorId: number;
    let seq = 0;

    before(async () => {
        await bootApp();
        executor = await criarPessoaComPrivilegios(['Reports.executar.CasaCivil']);
        semPrivilegio = await criarPessoaSemPrivilegios();
        criadorId = (await loginAsSuperAdmin()).pessoa.id;
    });

    const url = '/api/relatorio/casa-civil-atividades-pendentes';

    async function criarAtividade(
        dados: { cancelada?: boolean; terminoPlanejado?: string; terminoReal?: string | null; tipoId?: number } = {}
    ) {
        const tipoId =
            dados.tipoId ??
            (
                await prisma().transferenciaTipo.create({
                    data: {
                        nome: uniq('tipo'),
                        categoria: 'Discricionaria',
                        esfera: 'Estadual',
                        criado_por: criadorId,
                    },
                })
            ).id;
        const transferencia = await prisma().transferencia.create({
            data: {
                tipo_id: tipoId,
                orgao_concedente_id: 1,
                objeto: uniq('objeto'),
                identificador: `AP-${++seq}`,
                identificador_nro: seq,
                esfera: 'Estadual',
                cancelada: dados.cancelada ?? false,
                criado_por: criadorId,
            },
        });
        const cronograma = await prisma().tarefaCronograma.create({ data: { transferencia_id: transferencia.id } });
        const tarefa = await prisma().tarefa.create({
            data: {
                tarefa_cronograma_id: cronograma.id,
                tarefa: uniq('atividade'),
                descricao: 'descricao',
                recursos: uniq('responsavel'),
                numero: 1,
                nivel: 1,
                orgao_id: 1,
                inicio_planejado: new Date('2020-01-01'),
                termino_planejado: new Date(dados.terminoPlanejado ?? '2020-02-01'),
                termino_real: dados.terminoReal ? new Date(dados.terminoReal) : null,
            },
        });
        return { tipoId, transferencia, tarefa };
    }

    // DateTransform quebra (500) quando data_inicio/data_termino são omitidos: os testes enviam null
    const semDatas = { data_inicio: null, data_termino: null };

    const consultar = async (corpo: Record<string, unknown>) => {
        const res = await api(executor)
            .post(url)
            .send({ ...semDatas, ...corpo });
        assertStatus(res, 201);
        return res.body as Record<string, any>[];
    };

    it('401 sem token', async () => {
        assertStatus(await api().post(url).send({}), 401);
    });

    it('403 sem Reports.executar.CasaCivil', async () => {
        const res = await api(semPrivilegio).post(url).send({});
        assertStatus(res, 403);
        assert.match(res.body.message, /Reports\.executar\.CasaCivil/);
    });

    it('400 com tipo_id/orgao_id fora de array, esfera, cancelada ou data inválidas', async () => {
        const enviar = (corpo: Record<string, unknown>) =>
            api(executor)
                .post(url)
                .send({ ...semDatas, ...corpo });
        assertStatus(await enviar({ tipo_id: 1 }), 400);
        assertStatus(await enviar({ orgao_id: 1 }), 400);
        assertStatus(await enviar({ esfera: 'Distrital' }), 400);
        assertStatus(await enviar({ cancelada: 'Talvez' }), 400);
        assertStatus(await enviar({ data_inicio: '31/12/2020' }), 400);
    });

    it('201 com corpo vazio (datas omitidas)', async () => {
        assertStatus(await api(executor).post(url).send({}), 201);
    });

    it('201 devolve a atividade vencida e sem término real, com os campos da transferência', async () => {
        const { tipoId, transferencia, tarefa } = await criarAtividade();

        const linhas = await consultar({ tipo_id: [tipoId] });
        assert.equal(linhas.length, 1);
        assert.equal(linhas[0].identificador, transferencia.identificador);
        assert.equal(linhas[0].atividade, tarefa.tarefa);
        assert.equal(linhas[0].responsavel_atividade, tarefa.recursos);
        assert.equal(linhas[0].inicio_planejado, '2020-01-01');
        assert.equal(linhas[0].termino_planejado, '2020-02-01');
        assert.equal(linhas[0].inicio_real, null);
        assert.ok(linhas[0].orgao_responsavel);
    });

    it('ignora atividade concluída ou com término planejado no futuro', async () => {
        const concluida = await criarAtividade({ terminoReal: '2020-02-02' });
        const futura = await criarAtividade({ terminoPlanejado: '2999-01-01' });

        assert.deepEqual(await consultar({ tipo_id: [concluida.tipoId] }), []);
        assert.deepEqual(await consultar({ tipo_id: [futura.tipoId] }), []);
    });

    it('filtra por esfera, orgao_id e intervalo de datas', async () => {
        const { tipoId } = await criarAtividade();

        assert.equal((await consultar({ tipo_id: [tipoId], esfera: 'Estadual' })).length, 1);
        assert.equal((await consultar({ tipo_id: [tipoId], esfera: 'Federal' })).length, 0);
        assert.equal((await consultar({ tipo_id: [tipoId], orgao_id: [1] })).length, 1);
        assert.equal((await consultar({ tipo_id: [tipoId], orgao_id: [999999] })).length, 0);
        assert.equal(
            (await consultar({ tipo_id: [tipoId], data_inicio: '2019-12-31', data_termino: '2020-02-01' })).length,
            1
        );
        assert.equal((await consultar({ tipo_id: [tipoId], data_inicio: '2020-01-02' })).length, 0);
        assert.equal((await consultar({ tipo_id: [tipoId], data_termino: '2020-01-31' })).length, 0);
    });

    it('cancelada: transferência cancelada só aparece com Incluir ou Apenas', async () => {
        const { tipoId } = await criarAtividade({ cancelada: true });

        assert.equal((await consultar({ tipo_id: [tipoId] })).length, 0);
        assert.equal((await consultar({ tipo_id: [tipoId], cancelada: 'NaoIncluir' })).length, 0);
        assert.equal((await consultar({ tipo_id: [tipoId], cancelada: 'Incluir' })).length, 1);
        assert.equal((await consultar({ tipo_id: [tipoId], cancelada: 'Apenas' })).length, 1);
        assert.equal((await consultar({ tipo_id: [tipoId], cancelada: true })).length, 1);
    });
});
