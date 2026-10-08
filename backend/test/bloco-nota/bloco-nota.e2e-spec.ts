import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    getApp,
    loginAsSuperAdmin,
    prisma,
    Sessao,
    uniq,
} from '../lib';
import { BlocoNotaService } from '../../src/bloco-nota/bloco-nota/bloco-nota.service';

let projetoSeq = 800000;
const DATA = '2026-09-01';

describe('bloco-nota', () => {
    let superadmin: Sessao;
    let gestor: Sessao;
    let semPrivilegio: Sessao;
    let tipoRespostas: number;
    let tipoPrivado: number;
    let tipoSemReplica: number;
    let bloco: string;

    before(async () => {
        await bootApp();
        superadmin = await loginAsSuperAdmin();
        gestor = await criarPessoaComPrivilegios([
            'CadastroNota.inserir',
            'CadastroNota.listar',
            'CadastroNota.editar',
            'CadastroNota.remover',
        ]);
        semPrivilegio = await criarPessoaSemPrivilegios();

        const criarTipo = async (extra: Record<string, unknown>) => {
            const res = await api(superadmin)
                .post('/api/tipo-nota')
                .send({
                    codigo: uniq('Tipo'),
                    permite_revisao: true,
                    visivel_resp_orgao: true,
                    eh_publico: true,
                    permite_enderecamento: true,
                    permite_email: true,
                    permite_replica: true,
                    modulos: ['PlanoSetorial'],
                    ...extra,
                });
            assertStatus(res, 201);
            return res.body.id as number;
        };
        tipoRespostas = await criarTipo({});
        tipoPrivado = await criarTipo({ eh_publico: false });
        tipoSemReplica = await criarTipo({ permite_replica: false });
        bloco = await tokenBloco(++projetoSeq);
    });

    const tokenBloco = (projeto_id: number) =>
        getApp().get(BlocoNotaService).getTokenFor({ projeto_id }, { id: gestor.pessoa.id });

    const novaNota = async (extra: Record<string, unknown> = {}) => {
        const res = await api(gestor)
            .post('/api/nota')
            .send({
                nota: uniq('Texto da nota'),
                data_nota: DATA,
                bloco_token: bloco,
                tipo_nota_id: tipoRespostas,
                status: 'Programado',
                titulo: uniq('Título'),
                ...extra,
            });
        assertStatus(res, 201);
        return res.body as { id: number; id_jwt: string };
    };

    describe('TipoNotaController', () => {
        it('401 sem token e 403 sem SMAE.superadmin', async () => {
            assertStatus(await api().get('/api/tipo-nota'), 401);
            assertStatus(await api().post('/api/tipo-nota').send({}), 401);

            assertStatus(await api(semPrivilegio).get('/api/tipo-nota'), 200);
            const criar = await api(gestor).post('/api/tipo-nota').send({});
            assertStatus(criar, 403);
            assert.match(criar.body.message, /SMAE\.superadmin/);
        });

        it('400 com corpo inválido e módulo inexistente', async () => {
            assertStatus(await api(superadmin).post('/api/tipo-nota').send({ codigo: uniq() }), 400);
            const modulo = await api(superadmin)
                .post('/api/tipo-nota')
                .send({
                    codigo: uniq(),
                    permite_revisao: false,
                    visivel_resp_orgao: false,
                    eh_publico: true,
                    permite_enderecamento: false,
                    permite_email: false,
                    permite_replica: false,
                    modulos: ['Inexistente'],
                });
            assertStatus(modulo, 400);
        });

        it('cria, lista, edita e remove; código repetido é recusado', async () => {
            const codigo = uniq('Ofício');
            const criado = await api(superadmin)
                .post('/api/tipo-nota')
                .send({
                    codigo,
                    permite_revisao: false,
                    visivel_resp_orgao: true,
                    eh_publico: true,
                    permite_enderecamento: true,
                    permite_email: false,
                    permite_replica: true,
                    modulos: ['PlanoSetorial'],
                });
            assertStatus(criado, 201);
            const id: number = criado.body.id;

            const lista = await api(semPrivilegio).get('/api/tipo-nota');
            const linha = lista.body.linhas.find((l: { id: number }) => l.id === id);
            assert.equal(linha.codigo, codigo);
            assert.equal(linha.permite_replica, true);
            assert.deepEqual(linha.modulos, ['PlanoSetorial']);

            const repetido = await api(superadmin)
                .post('/api/tipo-nota')
                .send({
                    codigo: codigo.toUpperCase(),
                    permite_revisao: false,
                    visivel_resp_orgao: true,
                    eh_publico: true,
                    permite_enderecamento: true,
                    permite_email: false,
                    permite_replica: true,
                    modulos: ['PlanoSetorial'],
                });
            assertStatus(repetido, 400);
            assert.match(repetido.body.message, /Código igual ou semelhante/);

            assertStatus(await api(superadmin).patch(`/api/tipo-nota/${id}`).send({ permite_email: true }), 200);
            const editada = await api(semPrivilegio).get('/api/tipo-nota');
            assert.equal(editada.body.linhas.find((l: { id: number }) => l.id === id).permite_email, true);

            assertStatus(await api(superadmin).delete(`/api/tipo-nota/${id}`), 202);
            const depois = await api(semPrivilegio).get('/api/tipo-nota');
            assert.equal(
                depois.body.linhas.some((l: { id: number }) => l.id === id),
                false
            );
        });
    });

    describe('NotaController', () => {
        it('401 sem token e 403 por privilégio em cada rota', async () => {
            assertStatus(await api().post('/api/nota').send({}), 401);
            assertStatus(await api().get('/api/nota/busca-por-bloco?blocos_token=x'), 401);

            const criar = await api(semPrivilegio).post('/api/nota').send({});
            assertStatus(criar, 403);
            assert.match(criar.body.message, /CadastroNota\.inserir/);

            const listar = await api(semPrivilegio).get('/api/nota/busca-por-bloco?blocos_token=x');
            assertStatus(listar, 403);
            assert.match(listar.body.message, /CadastroNota\.listar/);

            assertStatus(await api(semPrivilegio).delete('/api/nota/x'), 403);
        });

        it('400 com bloco_token inválido, data de nota ausente ou nota privada encaminhada', async () => {
            const blocoInvalido = await api(gestor).post('/api/nota').send({
                nota: 'x',
                data_nota: DATA,
                bloco_token: 'lixo',
                tipo_nota_id: tipoRespostas,
                status: 'Programado',
            });
            assertStatus(blocoInvalido, 400);
            assert.match(blocoInvalido.body.message, /bloco_nota inválido/);

            assertStatus(
                await api(gestor).post('/api/nota').send({
                    nota: 'x',
                    bloco_token: bloco,
                    tipo_nota_id: tipoRespostas,
                    status: 'Programado',
                }),
                400
            );

            const privada = await api(gestor)
                .post('/api/nota')
                .send({
                    nota: 'x',
                    data_nota: DATA,
                    bloco_token: bloco,
                    tipo_nota_id: tipoPrivado,
                    status: 'Programado',
                    enderecamentos: [{ orgao_enderecado_id: 1, pessoa_enderecado_id: null }],
                });
            assertStatus(privada, 400);
            assert.match(privada.body.message, /Não é possível encaminhar notas privadas/);
        });

        it('cria nota, detalha pelo id_jwt, busca pelo bloco e edita', async () => {
            const titulo = uniq('Pauta');
            const criada = await novaNota({ titulo });
            assert.ok(criada.id_jwt);

            const detalhe = await api(gestor).get(`/api/nota/${encodeURIComponent(criada.id_jwt)}`);
            assertStatus(detalhe, 200);
            assert.equal(detalhe.body.titulo, titulo);
            assert.equal(detalhe.body.tipo_nota_id, tipoRespostas);

            const busca = await api(gestor).get(`/api/nota/busca-por-bloco?blocos_token=${encodeURIComponent(bloco)}`);
            assertStatus(busca, 200);
            assert.ok(busca.body.linhas.some((l: { titulo: string }) => l.titulo === titulo));

            const novoTitulo = uniq('Pauta revisada');
            assertStatus(
                await api(gestor)
                    .patch(`/api/nota/${encodeURIComponent(detalhe.body.id_jwt)}`)
                    .send({ titulo: novoTitulo }),
                200
            );
            const depois = await api(gestor).get(`/api/nota/${encodeURIComponent(detalhe.body.id_jwt)}`);
            assert.equal(depois.body.titulo, novoTitulo);
        });

        it(
            'todo: BUG o id_jwt devolvido pelo POST não permite editar a própria nota',
            { todo: 'BUG: nota.service.create devolve token com write=false' },
            async () => {
                const criada = await novaNota();
                assertStatus(
                    await api(gestor)
                        .patch(`/api/nota/${encodeURIComponent(criada.id_jwt)}`)
                        .send({ titulo: uniq() }),
                    200
                );
            }
        );

        it('400 quando a data de revisão já passou', async () => {
            const res = await api(gestor).post('/api/nota').send({
                nota: 'x',
                data_nota: DATA,
                bloco_token: bloco,
                tipo_nota_id: tipoRespostas,
                status: 'Programado',
                rever_em: '2020-01-01',
            });
            assertStatus(res, 400);
            assert.match(res.body.message, /Data de revisão inválida/);
        });

        it('resposta: cria pelo encaminhamento, recusa em tipo sem réplica e remove a própria', async () => {
            const nota = await novaNota({
                enderecamentos: [{ orgao_enderecado_id: 1, pessoa_enderecado_id: null }],
            });
            const detalhe = await api(gestor).get(`/api/nota/${encodeURIComponent(nota.id_jwt)}`);
            const enderecamentoId = detalhe.body.enderecamentos[0].id;

            const resposta = await api(gestor)
                .patch(`/api/nota/${encodeURIComponent(nota.id_jwt)}/resposta`)
                .send({ resposta: uniq('Resposta'), nota_enderecamento_id: enderecamentoId });
            assertStatus(resposta, 200);

            const comResposta = await api(gestor).get(`/api/nota/${encodeURIComponent(nota.id_jwt)}`);
            assert.equal(comResposta.body.respostas.length, 1);
            const respostaId: number = comResposta.body.respostas[0].id;

            assertStatus(
                await api(gestor).delete(`/api/nota/${encodeURIComponent(nota.id_jwt)}/resposta/${respostaId}`),
                202
            );

            const semReplica = await novaNota({ tipo_nota_id: tipoSemReplica });
            const recusada = await api(gestor)
                .patch(`/api/nota/${encodeURIComponent(semReplica.id_jwt)}/resposta`)
                .send({ resposta: 'x', nota_enderecamento_id: 1 });
            assertStatus(recusada, 400);
            assert.match(recusada.body.message, /não permite replica/);
        });

        it('remove a nota e ela some da busca', async () => {
            const nota = await novaNota();
            const { body: detalhe } = await api(gestor).get(`/api/nota/${encodeURIComponent(nota.id_jwt)}`);
            assertStatus(await api(gestor).delete(`/api/nota/${encodeURIComponent(detalhe.id_jwt)}`), 202);

            const busca = await api(gestor).get(`/api/nota/busca-por-bloco?blocos_token=${encodeURIComponent(bloco)}`);
            assert.equal(
                busca.body.linhas.some((l: { id: number }) => l.id === nota.id),
                false
            );
        });
    });

    describe('NotaComunicadoController', () => {
        let blocoId: number;
        let comunicadoId: number;
        let titulo: string;

        before(async () => {
            await prisma().tipoNota.upsert({
                where: { id: -2 },
                update: {},
                create: {
                    id: -2,
                    codigo: 'TransfereGov',
                    permite_revisao: false,
                    permite_enderecamento: false,
                    permite_email: false,
                    permite_replica: false,
                    visivel_resp_orgao: true,
                    eh_publico: true,
                },
            });
            blocoId = (
                await prisma().blocoNota.create({ data: { bloco: uniq('TransfereGov'), criado_por: gestor.pessoa.id } })
            ).id;
            titulo = uniq('Comunicado');
            comunicadoId = (
                await prisma().nota.create({
                    data: {
                        bloco_nota_id: blocoId,
                        tipo_nota_id: -2,
                        data_nota: new Date(DATA),
                        pessoa_responsavel_id: gestor.pessoa.id,
                        criado_por: gestor.pessoa.id,
                        nota: 'Conteúdo do comunicado',
                        titulo,
                        status: 'Programado',
                        usuarios_lidos: [],
                    },
                    select: { id: true },
                })
            ).id;
        });

        const listar = (query = '') => api(gestor).get(`/api/nota-comunicados${query}`);

        it('401 sem token', async () => {
            assertStatus(await api().get('/api/nota-comunicados'), 401);
            assertStatus(await api().patch(`/api/nota-comunicados/${comunicadoId}/lido`).send({ lido: true }), 401);
        });

        it('400 quando data_inicio é maior que data_fim', async () => {
            const res = await listar('?data_inicio=2026-10-01&data_fim=2026-09-01');
            assertStatus(res, 400);
            assert.match(res.body.message, /Data de início não pode ser maior/);
        });

        it('lista comunicados não lidos, marca como lido e filtra por lido', async () => {
            const naoLidos = await listar(`?palavra_chave=${encodeURIComponent(titulo)}&lido=false`);
            assertStatus(naoLidos, 200);
            assert.equal(naoLidos.body.linhas.length, 1);
            assert.equal(naoLidos.body.linhas[0].id, comunicadoId);
            assert.equal(naoLidos.body.linhas[0].lido, false);

            assertStatus(
                await api(gestor).patch(`/api/nota-comunicados/${comunicadoId}/lido`).send({ lido: true }),
                200
            );

            const lidos = await listar(`?palavra_chave=${encodeURIComponent(titulo)}&lido=true`);
            assert.equal(lidos.body.linhas.length, 1);
            assert.equal(lidos.body.linhas[0].lido, true);

            const aindaNaoLidos = await listar(`?palavra_chave=${encodeURIComponent(titulo)}&lido=false`);
            assert.equal(aindaNaoLidos.body.linhas.length, 0);
        });

        it('400 ao marcar lido um registro que não é comunicado', async () => {
            const res = await api(gestor).patch('/api/nota-comunicados/999999/lido').send({ lido: true });
            assertStatus(res, 400);
            assert.match(res.body.message, /Comunicado não encontrado/);
        });
    });
});
