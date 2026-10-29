import { before, describe, it } from 'node:test';
import { assert, assertStatus, bootApp, criarPessoaComPrivilegios, prisma, Sessao } from '../../lib';
import {
    buscarStatusBase,
    cancelarDistribuicao,
    casaCivil,
    completarTransferencia,
    criarDistribuicao,
    criarTransferencia,
    distribuicaoInicial,
    registrarStatus,
} from '../_helpers';

describe('distribuicao-recurso: SEI, valor distribuído e preenchimento', () => {
    let s: Sessao;

    before(async () => {
        await bootApp();
        s = await criarPessoaComPrivilegios([
            'CadastroTransferencia.inserir',
            'CadastroTransferencia.listar',
            'CadastroTransferencia.editar',
            'CadastroTransferencia.remover',
            'CadastroDistribuicaoStatus.inserir',
        ]);
    });

    const valores = { custeio: 1000, investimento: 500, contrapartida: 100 };

    async function comOrcamentoLivre() {
        const id = await criarTransferencia(s);
        assertStatus(await completarTransferencia(s, id, valores), 200);
        assertStatus(await cancelarDistribuicao(s, (await distribuicaoInicial(id)).id), 201);
        return id;
    }

    const detalhe = async (id: number) => (await casaCivil(s).get(`/api/transferencia/${id}`)).body;
    const seisDe = (distribuicaoId: number) =>
        prisma().distribuicaoRecursoSei.findMany({ where: { distribuicao_recurso_id: distribuicaoId, removido_em: null } });

    describe('registros SEI', () => {
        const sei = (n: number) => `6016.2023/${String(n).padStart(7, '0')}-1`;
        const criarComSei = (transferenciaId: number, registros_sei: Record<string, unknown>[]) =>
            criarDistribuicao(s, transferenciaId, { custeio: 100, investimento: 0, contrapartida: 0 }, { registros_sei });

        it(
            'rejeita o mesmo processo SEI escrito em formatos diferentes',
            async () => {
                const id = await comOrcamentoLivre();
                const duplicada = await criarComSei(id, [{ processo_sei: sei(11) }, { processo_sei: '6016202300000111' }]);
                assertStatus(duplicada, 400);
                assert.match(duplicada.body.message, /SEI duplicado/);
            }
        );

        it('rejeita processo SEI repetido com a mesma pontuação', async () => {
            const id = await comOrcamentoLivre();
            const duplicada = await criarComSei(id, [{ processo_sei: sei(10) }, { processo_sei: sei(10) }]);
            assertStatus(duplicada, 400);
            assert.match(duplicada.body.message, /SEI duplicado/);
        });

        it('guarda só os dígitos e devolve formatado', async () => {
            const id = await comOrcamentoLivre();
            const criada = await criarComSei(id, [{ processo_sei: sei(12), nome: 'principal' }]);
            assertStatus(criada, 201);
            const guardados = await seisDe(criada.body.id);
            assert.deepEqual(
                guardados.map((r) => r.processo_sei),
                ['6016202300000121']
            );

            const lido = await casaCivil(s).get(`/api/distribuicao-recurso/${criada.body.id}`);
            assertStatus(lido, 200);
            assert.equal(lido.body.registros_sei[0].processo_sei, sei(12));
            assert.equal(lido.body.registros_sei[0].nome, 'principal');
            assert.equal(lido.body.registros_sei[0].integracao_sei, null, 'SEI inalcançável: sem integração');
        });

        it('PATCH mantém por id, acrescenta e remove; sem registros_sei limpa todos', async () => {
            const id = await comOrcamentoLivre();
            const criada = await criarComSei(id, [{ processo_sei: sei(21) }, { processo_sei: sei(22) }]);
            assertStatus(criada, 201);
            const [a, b] = (await seisDe(criada.body.id)).sort((x, y) => x.id - y.id);

            const novo = sei(23);
            assertStatus(
                await casaCivil(s)
                    .patch(`/api/distribuicao-recurso/${criada.body.id}`)
                    .send({ registros_sei: [{ id: a.id, processo_sei: sei(21) }, { processo_sei: novo, nome: 'novo' }] }),
                200
            );
            const depois = await seisDe(criada.body.id);
            assert.equal(depois.some((r) => r.id === b.id), false, 'o que não foi reenviado sai');
            assert.deepEqual(depois.map((r) => r.processo_sei).sort(), ['6016202300000211', '6016202300000231']);

            assertStatus(await casaCivil(s).patch(`/api/distribuicao-recurso/${criada.body.id}`).send({ objeto: 'sem sei' }), 200);
            assert.deepEqual(await seisDe(criada.body.id), []);
        });

        it('listagem de transferências acha pelo número do processo SEI (com ou sem pontuação) e deixa de achar ao remover', async () => {
            const id = await comOrcamentoLivre();
            const numero = sei(31);
            const criada = await criarComSei(id, [{ processo_sei: numero }]);
            assertStatus(criada, 201);

            const buscar = async (termo: string) =>
                (await casaCivil(s).get(`/api/transferencia?ipp=500&palavra_chave=${encodeURIComponent(termo)}`)).body.linhas.map(
                    (l: { id: number }) => l.id
                );
            assert.ok((await buscar(numero)).includes(id));
            assert.ok((await buscar('6016202300000311')).includes(id));

            assertStatus(await casaCivil(s).patch(`/api/distribuicao-recurso/${criada.body.id}`).send({ objeto: 'x' }), 200);
            assert.equal((await buscar(numero)).includes(id), false);
        });
    });

    describe('valor distribuído conforme o status atual', () => {
        const casos = [
            { status: 'Registrada', conta: true },
            { status: 'Em Andamento', conta: true },
            { status: 'Finalizada', conta: true },
            { status: 'Declinada', conta: true },
            { status: 'Cancelada', conta: false },
            { status: 'Impedida Tecnicamente', conta: false },
            { status: 'Redirecionada', conta: false },
        ];

        it('segue valor_distribuicao_contabilizado de cada status base', async () => {
            const id = await comOrcamentoLivre();
            let esperado = 0;
            for (const { status, conta } of casos) {
                const nova = await criarDistribuicao(s, id, { custeio: 100, investimento: 0, contrapartida: 0 });
                assertStatus(nova, 201);
                assertStatus(await registrarStatus(s, nova.body.id, (await buscarStatusBase(status)).id), 201);
                if (conta) esperado += 100;
                assert.equal((await detalhe(id)).valor_distribuido, esperado, status);
            }
        });

        it('o último status vale: voltar de Registrada para Em Andamento mantém, terminal libera', async () => {
            const id = await comOrcamentoLivre();
            const nova = await criarDistribuicao(s, id, { custeio: 400, investimento: 0, contrapartida: 0 });
            assertStatus(nova, 201);
            assert.equal((await detalhe(id)).valor_distribuido, 400);
            assertStatus(await registrarStatus(s, nova.body.id, (await buscarStatusBase('Em Andamento')).id), 201);
            assert.equal((await detalhe(id)).valor_distribuido, 400);
            assertStatus(await cancelarDistribuicao(s, nova.body.id), 201);
            assert.equal((await detalhe(id)).valor_distribuido, 0);
        });

        it('remover a distribuição tira o valor e libera o limite para outra', async () => {
            const id = await comOrcamentoLivre();
            const cheia = await criarDistribuicao(s, id, { custeio: 1000, investimento: 500, contrapartida: 100 });
            assertStatus(cheia, 201);
            assert.equal((await detalhe(id)).valor_distribuido, 1500);

            assertStatus(await criarDistribuicao(s, id, { custeio: 100, investimento: 0, contrapartida: 0 }), 400);
            assertStatus(await casaCivil(s).delete(`/api/distribuicao-recurso/${cheia.body.id}`), 202);
            assert.equal((await detalhe(id)).valor_distribuido, 0);
            assertStatus(await criarDistribuicao(s, id, { custeio: 100, investimento: 0, contrapartida: 0 }), 201);
        });
    });

    describe('preenchimento de valores da transferência', () => {
        it('nasce pendente e completar-registro marca como preenchida, refletindo no filtro da lista', async () => {
            const ano = 2047;
            const id = await criarTransferencia(s, { ano });
            const ids = async (completo: boolean) =>
                (await casaCivil(s).get(`/api/transferencia?ano=${ano}&preenchimento_completo=${completo}`)).body.linhas.map(
                    (l: { id: number }) => l.id
                );

            assert.equal((await detalhe(id)).pendente_preenchimento_valores, true);
            assert.deepEqual(await ids(false), [id]);
            assert.deepEqual(await ids(true), []);

            assertStatus(await completarTransferencia(s, id, valores), 200);
            assert.equal((await detalhe(id)).pendente_preenchimento_valores, false);
            assert.deepEqual(await ids(true), [id]);
            assert.deepEqual(await ids(false), []);
        });

        it('a primeira conclusão cria uma única distribuição inicial com os valores da transferência', async () => {
            const id = await criarTransferencia(s);
            assertStatus(await completarTransferencia(s, id, valores), 200);
            assertStatus(await completarTransferencia(s, id, { ...valores, contrapartida: 200 }), 200);
            const distribuicoes = await prisma().distribuicaoRecurso.findMany({ where: { transferencia_id: id, removido_em: null } });
            assert.equal(distribuicoes.length, 1);
        });
    });
});
