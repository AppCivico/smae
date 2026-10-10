import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    getApp,
    prisma,
    Sessao,
} from '../lib';
import { UploadService } from '../../src/upload/upload.service';
import { criarCenarioOrcamento } from '../meta-orcamento/fixtures';

describe('importacao-orcamento', () => {
    let gestor: Sessao;
    let semPrivilegio: Sessao;
    let uploadToken: string;

    before(async () => {
        await bootApp();
        // a listagem do PDM ainda exige um PDM.* além de CadastroMeta.orcamento (PDMGetPermissionSet)
        gestor = await criarPessoaComPrivilegios(['CadastroMeta.orcamento', 'PDM.tecnico_cp']);
        semPrivilegio = await criarPessoaSemPrivilegios();
        const arquivo = await prisma().arquivo.create({
            data: {
                tipo: 'ORCAMENTO',
                caminho: 'e2e/orcamento.xlsx',
                nome_original: 'orcamento.xlsx',
                tamanho_bytes: 10,
            },
        });
        uploadToken = (await getApp().get(UploadService).getUploadToken(arquivo.id)).upload_token;
    });

    const novaImportacao = (pdm_id: number, extra: Record<string, unknown> = {}) => ({
        upload: uploadToken,
        pdm_id,
        tipo_pdm: 'PDM',
        ...extra,
    });

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await api().get('/api/importacao-orcamento'), 401);
            assertStatus(await api().post('/api/importacao-orcamento').send({}), 401);
        });

        it('403 sem privilégio de orçamento para importar', async () => {
            const { pdm } = await criarCenarioOrcamento();
            const res = await api(semPrivilegio, { sistema: 'PDM' })
                .post('/api/importacao-orcamento')
                .send(novaImportacao(pdm.id));
            assertStatus(res, 403);
        });

        it('403 na listagem de portfólio sem privilégio de orçamento', async () => {
            assertStatus(await api(semPrivilegio).get('/api/importacao-orcamento/portfolio'), 403);
        });
    });

    describe('validação e regras', () => {
        it('400 na listagem sem smae-sistemas', async () => {
            const res = await api(gestor).get('/api/importacao-orcamento');
            assertStatus(res, 400);
            assert.match(res.body.message, /Não é possível buscar importações/);
        });

        it('400 com upload_token inválido', async () => {
            const { pdm } = await criarCenarioOrcamento();
            const res = await api(gestor, { sistema: 'PDM' })
                .post('/api/importacao-orcamento')
                .send(novaImportacao(pdm.id, { upload: 'abc' }));
            assertStatus(res, 400);
            assert.match(res.body.message, /upload_token inválido/);
        });

        it('400 sem pdm_id nem portfolio_id', async () => {
            const res = await api(gestor, { sistema: 'PDM' })
                .post('/api/importacao-orcamento')
                .send({ upload: uploadToken, tipo_pdm: 'PDM' });
            assertStatus(res, 400);
            assert.match(res.body.message.join(' '), /pdm_id ou portfolio_id/);
        });

        it('400 ao informar tipo de PDM e tipo de projeto juntos', async () => {
            const { pdm } = await criarCenarioOrcamento();
            const res = await api(gestor, { sistema: 'PDM' })
                .post('/api/importacao-orcamento')
                .send(novaImportacao(pdm.id, { tipo_projeto: 'PP' }));
            assertStatus(res, 400);
            assert.match(res.body.message, /apenas um tipo/);
        });

        it('400 ao importar para Programa de Metas inativo', async () => {
            const { pdm } = await criarCenarioOrcamento();
            const res = await api(gestor, { sistema: 'PDM' })
                .post('/api/importacao-orcamento')
                .send(novaImportacao(pdm.id));
            assertStatus(res, 400);
            assert.match(res.body.message, /não está ativo, não é possível importar orçamento/);
        });

        it('cria a importação para um PDM ativo e ela aparece na listagem do sistema', async () => {
            const { pdm } = await criarCenarioOrcamento();
            await prisma().pdm.update({ where: { id: pdm.id }, data: { ativo: true } });

            const criada = await api(gestor, { sistema: 'PDM' })
                .post('/api/importacao-orcamento')
                .send(novaImportacao(pdm.id));
            assertStatus(criada, 201);

            const banco = await prisma().importacaoOrcamento.findUniqueOrThrow({ where: { id: criada.body.id } });
            assert.equal(banco.modulo_sistema, 'PDM');
            assert.equal(banco.pdm_id, pdm.id);
            assert.equal(banco.criado_por, gestor.pessoa.id);

            const lista = await api(gestor, { sistema: 'PDM' }).get('/api/importacao-orcamento?ipp=500');
            assertStatus(lista, 200);
            assert.ok(lista.body.linhas.some((l: { id: number }) => l.id === criada.body.id));
        });
    });
});
