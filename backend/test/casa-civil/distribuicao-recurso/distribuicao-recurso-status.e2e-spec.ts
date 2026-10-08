import { before, describe, it } from 'node:test';
import { assert, assertStatus, bootApp, criarPessoaComPrivilegios, criarPessoaSemPrivilegios, prisma, Sessao } from '../../lib';
import {
    buscarStatusBase,
    casaCivil,
    criarTransferenciaComOrcamento,
    distribuicaoInicial,
    registrarStatus,
} from '../_helpers';

const amanha = () => new Date(Date.now() + 24 * 60 * 60 * 1000);

describe('distribuicao-recurso/:id/status (histórico de status)', () => {
    let gestor: Sessao;
    let leitor: Sessao;
    let semPrivilegio: Sessao;

    before(async () => {
        await bootApp();
        gestor = await criarPessoaComPrivilegios([
            'CadastroTransferencia.inserir',
            'CadastroTransferencia.listar',
            'CadastroTransferencia.editar',
            'CadastroDistribuicaoStatus.inserir',
            'CadastroDistribuicaoStatus.listar',
            'CadastroDistribuicaoStatus.editar',
            'CadastroDistribuicaoStatus.remover',
        ]);
        leitor = await criarPessoaComPrivilegios(['CadastroDistribuicaoStatus.listar']);
        semPrivilegio = await criarPessoaSemPrivilegios();
    });

    const corpo = (extra: Record<string, unknown> = {}) => ({
        orgao_responsavel_id: 1,
        nome_responsavel: 'Responsável E2E',
        motivo: 'Motivo E2E',
        data_troca: new Date().toISOString().slice(0, 10),
        ...extra,
    });

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await casaCivil().get('/api/distribuicao-recurso/1/status'), 401);
            assertStatus(await casaCivil().post('/api/distribuicao-recurso/1/status').send({}), 401);
        });

        it('403 sem CadastroDistribuicaoStatus.listar / inserir / editar / remover', async () => {
            const { id } = await criarTransferenciaComOrcamento(gestor);
            const lista = await casaCivil(semPrivilegio).get(`/api/distribuicao-recurso/${id}/status`);
            assertStatus(lista, 403);
            assert.match(lista.body.message, /CadastroDistribuicaoStatus\.listar/);

            const criar = await casaCivil(leitor).post(`/api/distribuicao-recurso/${id}/status`).send(corpo());
            assertStatus(criar, 403);
            assert.match(criar.body.message, /CadastroDistribuicaoStatus\.inserir/);
        });
    });

    describe('validação', () => {
        it('400 sem status_id nem status_base_id, e 400 com os dois', async () => {
            const { id } = await criarTransferenciaComOrcamento(gestor);
            const nenhum = await casaCivil(gestor).post(`/api/distribuicao-recurso/${id}/status`).send(corpo());
            assertStatus(nenhum, 400);
            assert.match(nenhum.body.message, /É necessário enviar um ID de status/);

            const ambos = await casaCivil(gestor)
                .post(`/api/distribuicao-recurso/${id}/status`)
                .send(corpo({ status_base_id: 1, status_id: 1 }));
            assertStatus(ambos, 400);
            assert.match(ambos.body.message, /É permitido apenas um ID de status/);
        });

        it('400 sem motivo', async () => {
            const { id } = await criarTransferenciaComOrcamento(gestor);
            const semMotivo = corpo({ status_base_id: (await buscarStatusBase('Em Andamento')).id });
            delete (semMotivo as Record<string, unknown>).motivo;
            assertStatus(await casaCivil(gestor).post(`/api/distribuicao-recurso/${id}/status`).send(semMotivo), 400);
        });
    });

    describe('histórico', () => {
        it('registra novo status, lista o histórico e bloqueia novo registro após status terminal', async () => {
            const { id, inicial } = await criarTransferenciaComOrcamento(gestor);
            const emAndamento = await buscarStatusBase('Em Andamento');
            const cancelada = await buscarStatusBase('Cancelada');

            const andamento = await registrarStatus(gestor, inicial.id, emAndamento.id);
            assertStatus(andamento, 201);

            const historico = await casaCivil(leitor).get(`/api/distribuicao-recurso/${inicial.id}/status`);
            assertStatus(historico, 200);
            assert.ok(historico.body.linhas.some((l: { id: number }) => l.id === andamento.body.id));
            assert.ok(historico.body.linhas.length >= 2);

            assertStatus(await registrarStatus(gestor, inicial.id, cancelada.id, amanha()), 201);
            const bloqueado = await registrarStatus(gestor, inicial.id, emAndamento.id);
            assertStatus(bloqueado, 400);
            assert.match(bloqueado.body.message, /Status atual não permite novos registros/);

            const detalhe = await casaCivil(gestor).get(`/api/transferencia/${id}`);
            assert.equal(detalhe.body.valor_distribuido, 0);
        });

        it('BUG status terminal registrado no mesmo dia não bloqueia novo registro', { todo: 'BUG: create de status escolhe o status anterior só por data_troca desc (sem id desc); com data_troca igual a escolha é arbitrária, e o "último status" do limite usa data_troca desc, id desc' }, async () => {
            const { inicial } = await criarTransferenciaComOrcamento(gestor);
            assertStatus(await registrarStatus(gestor, inicial.id, (await buscarStatusBase('Cancelada')).id), 201);
            assertStatus(await registrarStatus(gestor, inicial.id, (await buscarStatusBase('Em Andamento')).id), 400);
        });

        it('edita o status atual, mas não um status anterior', async () => {
            const { inicial } = await criarTransferenciaComOrcamento(gestor);
            const anterior = await prisma().distribuicaoRecursoStatus.findFirstOrThrow({
                where: { distribuicao_id: inicial.id },
            });
            const atual = await registrarStatus(gestor, inicial.id, (await buscarStatusBase('Em Andamento')).id, amanha());
            assertStatus(atual, 201);

            const editarAnterior = await casaCivil(gestor)
                .patch(`/api/distribuicao-recurso/${inicial.id}/status/${anterior.id}`)
                .send({ motivo: 'Tentativa' });
            assertStatus(editarAnterior, 400);
            assert.match(editarAnterior.body.message, /não é o status atual/);

            const motivo = 'Motivo editado E2E';
            assertStatus(
                await casaCivil(gestor)
                    .patch(`/api/distribuicao-recurso/${inicial.id}/status/${atual.body.id}`)
                    .send({ motivo }),
                200
            );
            const gravado = await prisma().distribuicaoRecursoStatus.findUniqueOrThrow({ where: { id: atual.body.id } });
            assert.equal(gravado.motivo, motivo);
        });
    });
});
