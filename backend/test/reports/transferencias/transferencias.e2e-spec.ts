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

describe('relatorio/transferencias', () => {
    let executor: Sessao;
    let semPrivilegio: Sessao;
    let tipoId: number;
    let criadorId: number;
    let seq = 0;

    before(async () => {
        await bootApp();
        executor = await criarPessoaComPrivilegios(['Reports.executar.CasaCivil']);
        semPrivilegio = await criarPessoaSemPrivilegios();
        criadorId = (await loginAsSuperAdmin()).pessoa.id;
        tipoId = (
            await prisma().transferenciaTipo.create({
                data: { nome: uniq('tipo'), categoria: 'Discricionaria', esfera: 'Estadual', criado_por: criadorId },
            })
        ).id;
    });

    const url = '/api/relatorio/transferencias';

    function criarTransferencia(dados: { cancelada?: boolean; ano?: number } = {}) {
        const objeto = uniq('objeto');
        return prisma().transferencia.create({
            data: {
                tipo_id: tipoId,
                orgao_concedente_id: 1,
                objeto,
                identificador: `TR-${++seq}`,
                identificador_nro: seq,
                esfera: 'Estadual',
                ano: dados.ano ?? 2031,
                cancelada: dados.cancelada ?? false,
                criado_por: criadorId,
            },
        });
    }

    it('401 sem token', async () => {
        assertStatus(await api().post(url).send({ tipo: 'Geral' }), 401);
    });

    it('403 sem Reports.executar.CasaCivil', async () => {
        const res = await api(semPrivilegio).post(url).send({ tipo: 'Geral' });
        assertStatus(res, 403);
        assert.match(res.body.message, /Reports\.executar\.CasaCivil/);
    });

    it('400 sem tipo, com tipo ou esfera fora do enum', async () => {
        assertStatus(await api(executor).post(url).send({}), 400);
        assertStatus(await api(executor).post(url).send({ tipo: 'Completo' }), 400);
        assertStatus(await api(executor).post(url).send({ tipo: 'Geral', esfera: 'Distrital' }), 400);
        assertStatus(await api(executor).post(url).send({ tipo: 'Geral', cancelada: 'Talvez' }), 400);
    });

    it('201 devolve a transferência filtrada por objeto, com distribuição', async () => {
        const transferencia = await criarTransferencia();
        const distribuicao = await prisma().distribuicaoRecurso.create({
            data: {
                transferencia_id: transferencia.id,
                orgao_gestor_id: 1,
                objeto: uniq('objeto distribuicao'),
                valor: '1500.50',
                criado_por: criadorId,
            },
        });

        const res = await api(executor).post(url).send({ tipo: 'Resumido', objeto: transferencia.objeto });
        assertStatus(res, 201);
        assert.equal(res.body.tipo, 'Resumido');
        assert.ok(Array.isArray(res.body.linhas_cronograma));

        const linhas: { id: number; [k: string]: any }[] = res.body.linhas;
        assert.equal(linhas.length, 1);
        const [linha] = linhas;
        assert.equal(linha.id, transferencia.id);
        assert.equal(linha.identificador, transferencia.identificador);
        assert.equal(linha.ano, 2031);
        assert.equal(linha.esfera, 'Estadual');
        assert.equal(linha.status, 'Ativa');
        assert.equal(linha.orgao_concedente.id, 1);
        assert.equal(linha.distribuicao_recurso.id, distribuicao.id);
        assert.equal(Number(linha.distribuicao_recurso.valor), 1500.5);
    });

    it('filtros por ano e esfera restringem o resultado', async () => {
        const transferencia = await criarTransferencia({ ano: 2032 });

        const mesmoAno = await api(executor).post(url).send({ tipo: 'Geral', ano: 2032, esfera: 'Estadual' });
        assertStatus(mesmoAno, 201);
        assert.ok(mesmoAno.body.linhas.some((l: { id: number }) => l.id === transferencia.id));

        const outraEsfera = await api(executor).post(url).send({ tipo: 'Geral', ano: 2032, esfera: 'Federal' });
        assertStatus(outraEsfera, 201);
        assert.equal(
            outraEsfera.body.linhas.some((l: { id: number }) => l.id === transferencia.id),
            false
        );
    });

    it('cancelada: NaoIncluir (padrão) oculta, Apenas e Incluir mostram, true equivale a Incluir', async () => {
        const cancelada = await criarTransferencia({ cancelada: true });
        const ativa = await criarTransferencia();
        const ids = async (extra: Record<string, unknown>, objeto: string) => {
            const res = await api(executor)
                .post(url)
                .send({ tipo: 'Geral', objeto, ...extra });
            assertStatus(res, 201);
            return res.body.linhas.map((l: { id: number }) => l.id);
        };

        assert.deepEqual(await ids({}, cancelada.objeto), []);
        assert.deepEqual(await ids({ cancelada: 'NaoIncluir' }, cancelada.objeto), []);
        assert.deepEqual(await ids({ cancelada: 'Apenas' }, cancelada.objeto), [cancelada.id]);
        assert.deepEqual(await ids({ cancelada: 'Incluir' }, cancelada.objeto), [cancelada.id]);
        assert.deepEqual(await ids({ cancelada: true }, cancelada.objeto), [cancelada.id]);
        assert.deepEqual(await ids({ cancelada: 'Apenas' }, ativa.objeto), []);
        assert.deepEqual(await ids({}, ativa.objeto), [ativa.id]);
    });
});
