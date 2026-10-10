import { before, describe, it } from 'node:test';
import { UploadService } from '../../src/upload/upload.service';
import { api, assert, assertStatus, bootApp, getApp, prisma, uniq } from '../lib';

// O caminho feliz de GET /publico/arquivos/:token lê o arquivo do S3 (morto nos testes): só o guard e os tokens.
describe('public-upload', () => {
    before(async () => {
        await bootApp();
    });

    const servico = () => getApp().get(UploadService);

    const criarArquivo = () =>
        prisma().arquivo.create({
            data: {
                tipo: 'DOCUMENTO',
                caminho: uniq('uploads/e2e'),
                nome_original: 'a.txt',
                mime_type: 'text/plain',
                tamanho_bytes: 1,
            },
        });

    it('é pública: token inválido dá 400, não 401', async () => {
        const res = await api().get('/api/publico/arquivos/lixo');
        assertStatus(res, 400);
        assert.match(res.body.message, /Token publico invalido/);
    });

    it('400 com token de download ou de upload (audiência diferente da pública)', async () => {
        const arquivo = await criarArquivo();
        const download = servico().getDownloadToken(arquivo.id, undefined).download_token;
        const upload = (await servico().getUploadToken(arquivo.id)).upload_token;

        assertStatus(await api().get(`/api/publico/arquivos/${download}`), 400);
        assertStatus(await api().get(`/api/publico/arquivos/${upload}`), 400);
    });

    it('400 com token público expirado', async () => {
        const arquivo = await criarArquivo();
        const expirado = servico().getPublicDownloadToken(arquivo.id, '-1h');
        assertStatus(await api().get(`/api/publico/arquivos/${expirado}`), 400);
    });

    it('404 com token público de arquivo que não existe', async () => {
        const token = servico().getPublicDownloadToken(999999999, undefined);
        assertStatus(await api().get(`/api/publico/arquivos/${token}`), 404);
    });
});
