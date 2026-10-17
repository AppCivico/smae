import { before, describe, it } from 'node:test';
import { assert, assertStatus, bootApp, criarOrgao, criarPessoaComPrivilegios, prisma, Sessao } from '../../lib';
import {
    buscarStatusBase,
    cancelarDistribuicao,
    casaCivil,
    completarTransferencia,
    criarDistribuicao,
    criarParlamentar,
    criarTransferencia,
    distribuicaoInicial,
    registrarStatus,
    vincularParlamentar,
} from '../_helpers';

interface LinhaAnalise {
    transferencia_id: number;
    workflow_finalizado: boolean;
    partido_id: number[] | null;
    parlamentar_id: number[] | null;
    valor_total: unknown;
    distribuicao_orgao_id: number | null;
    distribuicao_valor_total: unknown;
    esfera: string;
    ano: number;
}

describe('transferencia: view de análise e ranking de parlamentares', () => {
    let gestor: Sessao;

    before(async () => {
        await bootApp();
        gestor = await criarPessoaComPrivilegios([
            'CadastroTransferencia.inserir',
            'CadastroTransferencia.listar',
            'CadastroTransferencia.editar',
            'CadastroTransferencia.remover',
            'CadastroDistribuicaoStatus.inserir',
        ]);
    });

    const analise = (id: number) =>
        prisma().$queryRaw<LinhaAnalise[]>`
            select * from view_transferencia_analise where transferencia_id = ${id}::int order by distribuicao_valor_total`;

    const ranking = async (parlamentarId: number) => {
        const r = await prisma().$queryRaw<{ count: bigint; valor: unknown }[]>`
            select count, valor from view_ranking_transferencia_parlamentar where parlamentar_id = ${parlamentarId}::int`;
        return r[0] && { count: Number(r[0].count), valor: Number(r[0].valor) };
    };

    const comOrcamento = async (ano = 2026) => {
        const id = await criarTransferencia(gestor, { ano });
        assertStatus(await completarTransferencia(gestor, id, { custeio: 1000, investimento: 500, contrapartida: 100 }), 200);
        return id;
    };

    it('transferência sem distribuição ativa aparece uma vez, com colunas de distribuição nulas', async () => {
        const id = await criarTransferencia(gestor, { ano: 2041 });
        const linhas = await analise(id);
        assert.equal(linhas.length, 1);
        assert.equal(linhas[0].distribuicao_orgao_id, null);
        assert.equal(linhas[0].distribuicao_valor_total, null);
        assert.equal(linhas[0].ano, 2041);
        assert.equal(linhas[0].esfera, 'Estadual');
        assert.equal(linhas[0].parlamentar_id, null);
        assert.equal(linhas[0].partido_id, null);
    });

    it('uma linha por distribuição válida; status terminal tira a distribuição do join', async () => {
        const id = await comOrcamento();
        const inicial = await distribuicaoInicial(id);
        const unica = await analise(id);
        assert.equal(unica.length, 1);
        assert.equal(Number(unica[0].valor_total), 1600);
        assert.equal(Number(unica[0].distribuicao_valor_total), 1600);
        assert.equal(unica[0].distribuicao_orgao_id, inicial.orgao_gestor_id);

        assertStatus(await cancelarDistribuicao(gestor, inicial.id), 201);
        const orgaoA = await criarOrgao();
        const orgaoB = await criarOrgao();
        const a = await criarDistribuicao(gestor, id, { custeio: 600, investimento: 0, contrapartida: 0 }, { orgao_gestor_id: orgaoA.id });
        const b = await criarDistribuicao(gestor, id, { custeio: 400, investimento: 500, contrapartida: 100 }, { orgao_gestor_id: orgaoB.id });
        assertStatus(a, 201);
        assertStatus(b, 201);

        const duas = await analise(id);
        assert.deepEqual(
            duas.map((l) => [Number(l.distribuicao_valor_total), l.distribuicao_orgao_id]),
            [
                [600, orgaoA.id],
                [1000, orgaoB.id],
            ]
        );

        assertStatus(await registrarStatus(gestor, a.body.id, (await buscarStatusBase('Finalizada')).id), 201);
        const umaSo = await analise(id);
        assert.deepEqual(umaSo.map((l) => l.distribuicao_orgao_id), [orgaoB.id]);

        assertStatus(await registrarStatus(gestor, b.body.id, (await buscarStatusBase('Declinada')).id), 201);
        const nenhuma = await analise(id);
        assert.equal(nenhuma.length, 1);
        assert.equal(nenhuma[0].distribuicao_orgao_id, null);
        assert.equal(Number(nenhuma[0].valor_total), 1600);
    });

    it('arrays de parlamentar e partido acompanham vínculo e desvínculo (soft delete)', async () => {
        const id = await criarTransferencia(gestor);
        const p1 = await criarParlamentar();
        assertStatus(await vincularParlamentar(gestor, id, p1.id), 200);

        const linha = await prisma().transferenciaParlamentar.findFirstOrThrow({ where: { transferencia_id: id } });
        const [vinculada] = await analise(id);
        assert.deepEqual(vinculada.parlamentar_id, [p1.id]);
        assert.deepEqual(vinculada.partido_id, [linha.partido_id]);

        await prisma().transferenciaParlamentar.update({ where: { id: linha.id }, data: { removido_em: new Date() } });
        const [removida] = await analise(id);
        assert.equal(removida.parlamentar_id, null);
        assert.equal(removida.partido_id, null);
    });

    it('removida a transferência, a view e o ranking a esquecem', async () => {
        const id = await comOrcamento();
        const p = await criarParlamentar();
        assertStatus(await vincularParlamentar(gestor, id, p.id), 200);
        assert.equal((await ranking(p.id))?.count, 1);

        assertStatus(await casaCivil(gestor).delete(`/api/transferencia/${id}`), 202);
        assert.deepEqual(await analise(id), []);
        assert.equal(await ranking(p.id), undefined);
    });

    it('ranking soma o valor total das transferências do parlamentar', async () => {
        const p = await criarParlamentar();
        const ids = [await comOrcamento(), await comOrcamento()];
        for (const id of ids) assertStatus(await vincularParlamentar(gestor, id, p.id), 200);
        assert.deepEqual(await ranking(p.id), { count: 2, valor: 3200 });
    });

    it(
        'ranking conta a transferência uma vez mesmo com várias distribuições válidas',
        { todo: 'BUG: view_ranking_transferencia_parlamentar parte de view_transferencia_analise (uma linha por distribuição) e multiplica count e valor (0050-view_transferencia_analise.pgsql)' },
        async () => {
            const id = await comOrcamento();
            const p = await criarParlamentar();
            assertStatus(await vincularParlamentar(gestor, id, p.id), 200);
            assertStatus(await cancelarDistribuicao(gestor, (await distribuicaoInicial(id)).id), 201);
            assertStatus(await criarDistribuicao(gestor, id, { custeio: 600, investimento: 0, contrapartida: 0 }), 201);
            assertStatus(await criarDistribuicao(gestor, id, { custeio: 400, investimento: 500, contrapartida: 100 }), 201);

            assert.deepEqual(await ranking(p.id), { count: 1, valor: 1600 });
        }
    );
});
