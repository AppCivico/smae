import { before, describe, it } from 'node:test';
import {
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
import {
    cancelarDistribuicao,
    casaCivil,
    completarTransferencia,
    criarDistribuicao,
    criarParlamentar,
    criarTipoTransferencia,
    criarTransferencia,
    distribuicaoInicial,
    registrarStatus,
    vincularParlamentar,
} from '../_helpers';

describe('transferencia', () => {
    let gestor: Sessao;
    let administrador: Sessao;
    let anexos: Sessao;
    let semPrivilegio: Sessao;

    before(async () => {
        await bootApp();
        gestor = await criarPessoaComPrivilegios([
            'CadastroTransferencia.inserir',
            'CadastroTransferencia.listar',
            'CadastroTransferencia.editar',
            'CadastroTransferencia.remover',
            'CadastroDistribuicaoStatus.inserir',
        ]);
        administrador = await criarPessoaComPrivilegios([
            'CadastroTransferencia.inserir',
            'CadastroTransferencia.listar',
            'CadastroTransferencia.editar',
            'CadastroTransferencia.administrador',
            'CadastroDistribuicaoStatus.inserir',
        ]);
        anexos = await criarPessoaComPrivilegios(['CadastroTransferenciaAnexo.inserir', 'CadastroTransferenciaAnexo.listar']);
        semPrivilegio = await criarPessoaSemPrivilegios();
    });

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await casaCivil().get('/api/transferencia'), 401);
            assertStatus(await casaCivil().post('/api/transferencia').send({}), 401);
        });

        it('403 sem CadastroTransferencia.inserir / listar', async () => {
            const criar = await casaCivil(semPrivilegio).post('/api/transferencia').send({});
            assertStatus(criar, 403);
            assert.match(criar.body.message, /CadastroTransferencia\.inserir/);

            const listar = await casaCivil(semPrivilegio).get('/api/transferencia');
            assertStatus(listar, 403);
            assert.match(listar.body.message, /CadastroTransferencia\.listar/);
        });

        it('403 em limpar-workflow sem CadastroTransferencia.administrador', async () => {
            const id = await criarTransferencia(gestor);
            const res = await casaCivil(gestor).post(`/api/transferencia/${id}/limpar-workflow`);
            assertStatus(res, 403);
            assert.match(res.body.message, /CadastroTransferencia\.administrador/);
        });

        it('rebuild-vetores-busca exige SMAE.superadmin', async () => {
            assertStatus(await casaCivil(gestor).post('/api/transferencia/rebuild-vetores-busca'), 403);
            assertStatus(await casaCivil(await loginAsSuperAdmin()).post('/api/transferencia/rebuild-vetores-busca'), 202);
        });
    });

    describe('validação', () => {
        it('400 com corpo vazio ou esfera fora do enum', async () => {
            const tipo = await criarTipoTransferencia();
            assertStatus(await casaCivil(gestor).post('/api/transferencia').send({}), 400);
            const invalida = await casaCivil(gestor).post('/api/transferencia').send({
                tipo_id: tipo.id,
                orgao_concedente_id: 1,
                esfera: 'Municipal',
                objeto: uniq('objeto'),
                ano: 2026,
            });
            assertStatus(invalida, 400);
        });

        it('400 com ano fora do intervalo 1889-2050', async () => {
            const tipo = await criarTipoTransferencia();
            const res = await casaCivil(gestor).post('/api/transferencia').send({
                tipo_id: tipo.id,
                orgao_concedente_id: 1,
                esfera: 'Estadual',
                objeto: uniq('objeto'),
                ano: 2051,
            });
            assertStatus(res, 400);
        });

        it('400 quando tipo não existe', async () => {
            const res = await casaCivil(gestor).post('/api/transferencia').send({
                tipo_id: 999999,
                orgao_concedente_id: 1,
                esfera: 'Estadual',
                objeto: uniq('objeto'),
                ano: 2026,
            });
            assertStatus(res, 400);
            assert.match(res.body.message, /Tipo não encontrado/);
        });

        it('400 quando a esfera difere da esfera do tipo', async () => {
            const tipo = await criarTipoTransferencia('Federal');
            const res = await casaCivil(gestor).post('/api/transferencia').send({
                tipo_id: tipo.id,
                orgao_concedente_id: 1,
                esfera: 'Estadual',
                objeto: uniq('objeto'),
                ano: 2026,
            });
            assertStatus(res, 400);
            assert.match(res.body.message, /Esfera da transferência e esfera do tipo devem ser iguais/);
        });

        it('400 quando classificacao_id não existe', async () => {
            const tipo = await criarTipoTransferencia();
            const res = await casaCivil(gestor).post('/api/transferencia').send({
                tipo_id: tipo.id,
                orgao_concedente_id: 1,
                esfera: 'Estadual',
                objeto: uniq('objeto'),
                ano: 2026,
                classificacao_id: 999999,
            });
            assertStatus(res, 400);
            assert.match(res.body.message, /Classificação não encontrada/);
        });

        it('400 com :id não numérico', async () => {
            assertStatus(await casaCivil(gestor).get('/api/transferencia/abc'), 400);
        });
    });

    describe('CRUD', () => {
        it('cria, busca, edita e lista; identificador termina com o ano', async () => {
            const tipo = await criarTipoTransferencia('Federal');
            const objeto = uniq('objeto');
            const criado = await casaCivil(gestor).post('/api/transferencia').send({
                tipo_id: tipo.id,
                orgao_concedente_id: 1,
                esfera: 'Federal',
                objeto,
                ano: 2031,
                observacoes: 'observação e2e',
            });
            assertStatus(criado, 201);
            const id: number = criado.body.id;

            const banco = await prisma().transferencia.findUniqueOrThrow({ where: { id } });
            assert.ok(banco.identificador.endsWith('/2031'), banco.identificador);

            const detalhe = await casaCivil(gestor).get(`/api/transferencia/${id}`);
            assertStatus(detalhe, 200);
            assert.equal(detalhe.body.id, id);
            assert.equal(detalhe.body.objeto, objeto);
            assert.equal(detalhe.body.observacoes, 'observação e2e');
            assert.equal(detalhe.body.cancelada, false);
            assert.equal(detalhe.body.valor_distribuido, 0);

            const novoObjeto = uniq('objeto editado');
            const edicao = { objeto: novoObjeto, tipo_id: tipo.id, esfera: 'Federal' };
            assertStatus(await casaCivil(gestor).patch(`/api/transferencia/${id}`).send(edicao), 200);
            const depoisEdicao = await casaCivil(gestor).get(`/api/transferencia/${id}`);
            assert.equal(depoisEdicao.body.objeto, novoObjeto);

            const lista = await casaCivil(gestor).get('/api/transferencia?ano=2031');
            assertStatus(lista, 200);
            const linha = lista.body.linhas.find((l: { id: number }) => l.id === id);
            assert.ok(linha, 'transferência criada não aparece na listagem filtrada por ano');
            assert.equal(linha.objeto, novoObjeto);
            assert.equal(linha.esfera, 'Federal');
        });

        it('404 ao editar transferência inexistente', async () => {
            assertStatus(await casaCivil(gestor).patch('/api/transferencia/999999').send({ objeto: uniq() }), 404);
        });

        it('404 ao buscar transferência removida', async () => {
            const id = await criarTransferencia(gestor);
            assertStatus(await casaCivil(gestor).delete(`/api/transferencia/${id}`), 202);
            assertStatus(await casaCivil(gestor).get(`/api/transferencia/${id}`), 404);
        });
    });

    describe('valores e limites (completar-registro)', () => {
        const valores = { custeio: 1000, investimento: 500, contrapartida: 100 };

        it('400 quando repasse diferente de custeio + investimento', async () => {
            const id = await criarTransferencia(gestor);
            const res = await completarTransferencia(gestor, id, valores, { valor: '999.00' });
            assertStatus(res, 400);
            assert.match(res.body.message, /Valor do repasse deve ser a soma/);
        });

        it('400 quando valor total diferente de repasse + contrapartida', async () => {
            const id = await criarTransferencia(gestor);
            const res = await completarTransferencia(gestor, id, valores, { valor_total: '1000.00' });
            assertStatus(res, 400);
            assert.match(res.body.message, /Valor total deve ser a soma/);
        });

        it('grava os valores e cria a distribuição inicial', async () => {
            const id = await criarTransferencia(gestor);
            assertStatus(await completarTransferencia(gestor, id, valores), 200);

            const banco = await prisma().transferencia.findUniqueOrThrow({ where: { id } });
            assert.equal(Number(banco.custeio), 1000);
            assert.equal(Number(banco.valor), 1500);
            assert.equal(Number(banco.valor_contrapartida), 100);
            assert.equal(Number(banco.valor_total), 1600);

            const inicial = await distribuicaoInicial(id);
            assert.equal(Number(inicial.custeio), 1000);
            assert.equal(Number(inicial.valor_total), 1600);
        });

        it('distribuição contabilizada trava a redução do custeio da transferência', async () => {
            const id = await criarTransferencia(gestor);
            assertStatus(await completarTransferencia(gestor, id, valores), 200);

            const reduzir = await completarTransferencia(gestor, id, { ...valores, custeio: 900 });
            assertStatus(reduzir, 400);
            assert.match(reduzir.body.message, /Soma de custeio de todas as distribuições/);
        });

        it('distribuição cancelada não trava a redução dos valores', async () => {
            const id = await criarTransferencia(gestor);
            assertStatus(await completarTransferencia(gestor, id, valores), 200);
            assertStatus(await cancelarDistribuicao(gestor, (await distribuicaoInicial(id)).id), 201);

            const detalhe = await casaCivil(gestor).get(`/api/transferencia/${id}`);
            assert.equal(detalhe.body.valor_distribuido, 0);

            assertStatus(await completarTransferencia(gestor, id, { ...valores, custeio: 500 }), 200);
        });

        it('distribuição sem nenhum status entra no valor distribuído', async () => {
            const id = await criarTransferencia(gestor);
            assertStatus(await completarTransferencia(gestor, id, valores), 200);
            const inicial = await distribuicaoInicial(id);
            const antes = (await casaCivil(gestor).get(`/api/transferencia/${id}`)).body.valor_distribuido;
            assert.ok(antes > 0, 'valor distribuído deveria estar preenchido');

            await prisma().distribuicaoRecursoStatus.deleteMany({ where: { distribuicao_id: inicial.id } });
            const depois = await casaCivil(gestor).get(`/api/transferencia/${id}`);
            assert.equal(depois.body.valor_distribuido, antes);
        });

        it('distribuição sem nenhum status trava a redução dos valores', async () => {
            const id = await criarTransferencia(gestor);
            assertStatus(await completarTransferencia(gestor, id, valores), 200);
            await prisma().distribuicaoRecursoStatus.deleteMany({ where: { distribuicao_id: (await distribuicaoInicial(id)).id } });

            const reduzir = await completarTransferencia(gestor, id, { ...valores, custeio: 900 });
            assertStatus(reduzir, 400);
            assert.match(reduzir.body.message, /Soma de custeio/);
        });

        it('400 ao zerar valores com distribuição contabilizada', async () => {
            const id = await criarTransferencia(gestor);
            assertStatus(await completarTransferencia(gestor, id, valores), 200);

            const zerar = await completarTransferencia(gestor, id, { custeio: 0, investimento: 0, contrapartida: 0 });
            assertStatus(zerar, 400);
            assert.match(zerar.body.message, /Soma de/);
        });

        it('400 quando a soma dos parlamentares passa do repasse', async () => {
            const id = await criarTransferencia(gestor);
            const p1 = await criarParlamentar();
            const p2 = await criarParlamentar();
            const res = await completarTransferencia(gestor, id, valores, {
                parlamentares: [
                    { parlamentar_id: p1.id, valor: '1000.00' },
                    { parlamentar_id: p2.id, valor: '1000.00' },
                ],
            });
            assertStatus(res, 400);
            assert.match(res.body.message, /soma dos valores dos parlamentares/);
        });

        it('valor do parlamentar não pode ficar abaixo do já distribuído, mas cancelada não conta', async () => {
            const id = await criarTransferencia(gestor);
            const parlamentar = await criarParlamentar();
            assertStatus(await vincularParlamentar(gestor, id, parlamentar.id), 200);
            const linha = await prisma().transferenciaParlamentar.findFirstOrThrow({
                where: { transferencia_id: id, parlamentar_id: parlamentar.id },
            });
            assertStatus(
                await completarTransferencia(gestor, id, valores, {
                    parlamentares: [{ id: linha.id, parlamentar_id: parlamentar.id, valor: '800.00' }],
                }),
                200
            );

            // A distribuição inicial ocupa todo o custeio; cancelada, ela sai dos limites para caber a nova.
            assertStatus(await cancelarDistribuicao(gestor, (await distribuicaoInicial(id)).id), 201);
            const distribuicao = await criarDistribuicao(gestor, id, { custeio: 500, investimento: 0, contrapartida: 0 }, {
                parlamentares: [{ parlamentar_id: parlamentar.id, valor: '500.00' }],
            });
            assertStatus(distribuicao, 201);

            const abaixo = await completarTransferencia(gestor, id, valores, {
                parlamentares: [{ id: linha.id, parlamentar_id: parlamentar.id, valor: '300.00' }],
            });
            assertStatus(abaixo, 400);
            assert.match(abaixo.body.message, /não pode ser inferior ao valor já distribuído/);

            assertStatus(await cancelarDistribuicao(gestor, distribuicao.body.id), 201);
            const depois = await completarTransferencia(gestor, id, valores, {
                parlamentares: [{ id: linha.id, parlamentar_id: parlamentar.id, valor: '300.00' }],
            });
            assertStatus(depois, 200);
        });
    });

    describe('workflow, cancelamento e histórico', () => {
        it('reiniciar-workflow 400 quando o tipo não tem workflow ativo', async () => {
            const id = await criarTransferencia(gestor);
            const res = await casaCivil(gestor).post(`/api/transferencia/${id}/reiniciar-workflow`);
            assertStatus(res, 400);
            assert.match(res.body.message, /Não há workflow ativo/);
        });

        it('cancela, bloqueia segundo cancelamento e filtra pela flag cancelada', async () => {
            const ano = 2044;
            const ativa = await criarTransferencia(gestor, { ano });
            const cancelar = await criarTransferencia(gestor, { ano });

            assertStatus(await casaCivil(gestor).post(`/api/transferencia/${cancelar}/cancelar`), 201);
            const segundo = await casaCivil(gestor).post(`/api/transferencia/${cancelar}/cancelar`);
            assertStatus(segundo, 400);
            assert.match(segundo.body.message, /já está cancelada/);

            const ids = async (filtro: string) =>
                (await casaCivil(gestor).get(`/api/transferencia?ano=${ano}&cancelada=${filtro}`)).body.linhas.map(
                    (l: { id: number }) => l.id
                );
            assert.deepEqual(await ids('NaoIncluir'), [ativa]);
            assert.deepEqual((await ids('Incluir')).sort(), [ativa, cancelar].sort());
            assert.deepEqual(await ids('Apenas'), [cancelar]);

            const detalhe = await casaCivil(gestor).get(`/api/transferencia/${cancelar}`);
            assert.equal(detalhe.body.cancelada, true);
            assert.equal(detalhe.body.cancelada_por.id, gestor.pessoa.id);
        });

        it('PATCH de transferência cancelada trocando o tipo: 400', async () => {
            const id = await criarTransferencia(gestor);
            assertStatus(await casaCivil(gestor).post(`/api/transferencia/${id}/cancelar`), 201);
            const outroTipo = await criarTipoTransferencia();
            const res = await casaCivil(gestor).patch(`/api/transferencia/${id}`).send({ tipo_id: outroTipo.id });
            assertStatus(res, 400);
            assert.match(res.body.message, /cancelada não permite alteração do tipo/);
        });

        it('CONFIRMAR PATCH só com objeto em transferência ativa', { todo: 'CONFIRMAR (https://github.com/AppCivico/smae/issues/689): PATCH sem tipo_id/esfera responde 400 "Esfera da transferência e esfera do tipo devem ser iguais" (updateTransferencia compara com undefined); se o contrato é PATCH parcial, é bug' }, async () => {
            const id = await criarTransferencia(gestor);
            assertStatus(await casaCivil(gestor).patch(`/api/transferencia/${id}`).send({ objeto: uniq('objeto') }), 200);
        });

        it('BUG cancelada aceita edição de identificação sem enviar tipo_id', { todo: 'BUG (https://github.com/AppCivico/smae/issues/689): transferência cancelada aceita edição de identificação segundo o comentário do service, mas PATCH sem tipo_id responde 400 (dto.tipo_id undefined difere de self.tipo_id)' }, async () => {
            const id = await criarTransferencia(gestor);
            assertStatus(await casaCivil(gestor).post(`/api/transferencia/${id}/cancelar`), 201);
            assertStatus(await casaCivil(gestor).patch(`/api/transferencia/${id}`).send({ objeto: uniq('objeto') }), 200);
        });

        it('limpar-workflow responde 201 com CadastroTransferencia.administrador', async () => {
            const id = await criarTransferencia(administrador);
            assertStatus(await casaCivil(administrador).post(`/api/transferencia/${id}/limpar-workflow`), 201);
        });

        it('histórico responde lista de movimentações', async () => {
            const id = await criarTransferencia(gestor);
            const res = await casaCivil(gestor).get(`/api/transferencia/${id}/historico`);
            assertStatus(res, 200);
            assert.ok(Array.isArray(res.body.linhas));
        });
    });

    describe('anexos', () => {
        it('401 sem token e 403 sem CadastroTransferenciaAnexo.inserir', async () => {
            const id = await criarTransferencia(gestor);
            assertStatus(await casaCivil().post(`/api/transferencia/${id}/anexo`).send({}), 401);
            const res = await casaCivil(gestor).post(`/api/transferencia/${id}/anexo`).send({});
            assertStatus(res, 403);
            assert.match(res.body.message, /CadastroTransferenciaAnexo\.inserir/);
        });

        it('400 sem upload_token (o upload em si depende de S3 e não é testado)', async () => {
            const id = await criarTransferencia(gestor);
            assertStatus(await casaCivil(anexos).post(`/api/transferencia/${id}/anexo`).send({}), 400);
        });

        it('lista anexos vazia para transferência nova', async () => {
            const id = await criarTransferencia(gestor);
            const res = await casaCivil(anexos).get(`/api/transferencia/${id}/anexo`);
            assertStatus(res, 200);
            assert.deepEqual(res.body.linhas, []);
        });
    });
});
