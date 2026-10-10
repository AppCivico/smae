import { before, describe, it } from 'node:test';
import { UploadService } from '../../src/upload/upload.service';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarPdmAntigo,
    criarPessoaSemPrivilegios,
    getApp,
    prisma,
    Sessao,
    uniq,
} from '../lib';

// Os caminhos felizes de POST /upload e GET /download gravam/leem no S3 (morto nos testes): só auth, validação e tokens.
describe('upload', () => {
    let usuario: Sessao;

    before(async () => {
        await bootApp();
        usuario = await criarPessoaSemPrivilegios();
    });

    const servico = () => getApp().get(UploadService);

    const criarArquivo = (extra: Record<string, unknown> = {}) =>
        prisma().arquivo.create({
            data: {
                tipo: 'DOCUMENTO',
                caminho: uniq('uploads/e2e'),
                nome_original: 'a.txt',
                mime_type: 'text/plain',
                tamanho_bytes: 1,
                ...extra,
            },
        });

    const enviar = (campos: Record<string, string>, arquivo?: { conteudo: Buffer; nome: string; tipo?: string }) => {
        let req = api(usuario).post('/api/upload');
        for (const [k, v] of Object.entries(campos)) req = req.field(k, v);
        if (arquivo)
            req = req.attach('arquivo', arquivo.conteudo, { filename: arquivo.nome, contentType: arquivo.tipo });
        return req;
    };

    describe('POST upload', () => {
        it('401 sem token', async () => {
            const res = await api()
                .post('/api/upload')
                .field('tipo', 'DOCUMENTO')
                .attach('arquivo', Buffer.from('x'), 'a.txt');
            assertStatus(res, 401);
        });

        it('400 sem tipo ou com tipo desconhecido', async () => {
            const arquivo = { conteudo: Buffer.from('x'), nome: 'a.txt' };
            assertStatus(await enviar({}, arquivo), 400);

            const res = await enviar({ tipo: 'NAO_EXISTE' }, arquivo);
            assertStatus(res, 400);
            assert.match(JSON.stringify(res.body.message), /Precisa ser um dos seguintes valores/);
        });

        it('404 com tipo_documento_id inexistente', async () => {
            const res = await enviar(
                { tipo: 'DOCUMENTO', tipo_documento_id: '999999999' },
                { conteudo: Buffer.from('x'), nome: 'a.txt' }
            );
            assertStatus(res, 404);
            assert.match(res.body.message, /Tipo de Documento não encontrado/);
        });

        it(
            '400 para DOCUMENTO sem tipo_documento_id',
            {
                todo: 'https://github.com/AppCivico/smae/issues/694 BUG: POST /api/upload tipo=DOCUMENTO sem tipo_documento_id: esperado 400 (ValidateIf exige o campo), veio sem erro de validação e só falhou no S3 (IsOptional anula o ValidateIf)',
            },
            async () => {
                const res = await enviar({ tipo: 'DOCUMENTO' }, { conteudo: Buffer.from('x'), nome: 'a.txt' });
                assertStatus(res, 400);
                assert.match(JSON.stringify(res.body.message), /Necessário ID do Tipo Documento/);
            }
        );

        it('400 quando a extensão não é aceita pelo tipo de documento', async () => {
            const tipoDoc = await prisma().tipoDocumento.create({
                data: { codigo: uniq('TD'), titulo: uniq('Só PDF'), extensoes: 'pdf' },
            });
            const res = await enviar(
                { tipo: 'DOCUMENTO', tipo_documento_id: String(tipoDoc.id) },
                { conteudo: Buffer.from('x'), nome: 'planilha.xlsx' }
            );
            assertStatus(res, 400);
            assert.match(res.body.message, /Arquivo deve conter uma das extensões: pdf/);
        });

        it('400 com arquivo de 0 byte', async () => {
            const res = await enviar(
                { tipo: 'DOCUMENTO', tipo_documento_id: '0' },
                { conteudo: Buffer.alloc(0), nome: 'vazio.txt' }
            );
            assertStatus(res, 400);
            assert.match(res.body.message, /ao menos 1 byte/);
        });

        it('400 quando o campo arquivo não é enviado', async () => {
            const res = await enviar({ tipo: 'ICONE_TAG' });
            assertStatus(res, 400);
        });

        it('400 quando nome, extensão ou conteúdo não servem ao tipo de upload', async () => {
            const texto = Buffer.from('conteudo qualquer');
            const casos: { tipo: string; nome: string; mime?: string; conteudo?: string; esperado: RegExp }[] = [
                { tipo: 'ICONE_TAG', nome: 'icone.txt', esperado: /PNG, JPEG ou SVG/ },
                { tipo: 'ICONE_PORTFOLIO', nome: 'icone.png', esperado: /não é uma imagem válida/ },
                { tipo: 'ICONE_TAG', nome: 'icone.svg', conteudo: '<html/>', esperado: /SVG válido/ },
                { tipo: 'LOGO_PDM', nome: 'logo.jpg', esperado: /SVG ou PNG/ },
                { tipo: 'FOTO_PARLAMENTAR', nome: 'foto.gif', esperado: /PNG, JPG ou JPEG/ },
                { tipo: 'IMPORTACAO_PARLAMENTAR', nome: 'parlamentares.csv', esperado: /\.sqlite/ },
                { tipo: 'IMPORTACAO_ORCAMENTO', nome: 'orcamento.txt', esperado: /xls, XLSX ou CSV/ },
                { tipo: 'SHAPEFILE', nome: 'mapa.rar', mime: 'application/zip', esperado: /arquivo ZIP/ },
                { tipo: 'SHAPEFILE', nome: 'mapa.zip', mime: 'text/plain', esperado: /arquivo ZIP/ },
                { tipo: 'SHAPEFILE', nome: 'mapa.zip', mime: 'application/zip', esperado: /Erro ao abrir arquivo zip/ },
            ];

            for (const c of casos) {
                const conteudo = c.conteudo ? Buffer.from(c.conteudo) : texto;
                const res = await enviar({ tipo: c.tipo }, { conteudo, nome: c.nome, tipo: c.mime });
                assertStatus(res, 400);
                assert.match(res.body.message, c.esperado, `${c.tipo} ${c.nome}`);
            }
        });
    });

    describe('POST upload (SVG)', () => {
        it('400 com SVG que nem é XML', async () => {
            const res = await enviar(
                { tipo: 'ICONE_TAG' },
                { conteudo: Buffer.from('isto não é xml'), nome: 'icone.svg' }
            );
            assertStatus(res, 400);
        });
    });

    describe('GET download/:token', () => {
        it('é pública: token inválido não gera 401', async () => {
            assert.notEqual((await api().get('/api/download/lixo')).status, 401);
        });

        it('400 com token inválido, de outro tipo ou de arquivo inexistente', async () => {
            const arquivo = await criarArquivo();
            const tokenUpload = (await servico().getUploadToken(arquivo.id)).upload_token;
            const tokenInexistente = servico().getDownloadToken(999999999, undefined).download_token;

            assertStatus(await api().get('/api/download/lixo'), 400);
            assertStatus(await api().get(`/api/download/${tokenUpload}`), 400);
            assertStatus(await api().get(`/api/download/${tokenInexistente}`), 400);
        });
    });

    describe('PATCH diretorio/:token', () => {
        it('400 com token inválido, token público, arquivo inexistente ou sem caminho', async () => {
            const arquivo = await criarArquivo();
            const tokenUpload = (await servico().getUploadToken(arquivo.id)).upload_token;

            assertStatus(await api().patch('/api/diretorio/lixo?caminho=a'), 400);

            const publico = servico().getPublicDownloadToken(arquivo.id, undefined);
            assertStatus(await api().patch(`/api/diretorio/${publico}?caminho=a`), 400);

            const inexistente = (await servico().getUploadToken(999999999)).upload_token;
            const semArquivo = await api().patch(`/api/diretorio/${inexistente}?caminho=a`);
            assertStatus(semArquivo, 400);
            assert.match(semArquivo.body.message, /Arquivo não encontrado/);

            assertStatus(await api().patch(`/api/diretorio/${tokenUpload}`), 400);
        });

        it('grava o caminho normalizado com token de upload ou de download, sem exigir login', async () => {
            const arquivo = await criarArquivo();
            const tokenUpload = (await servico().getUploadToken(arquivo.id)).upload_token;
            assertStatus(await api().patch(`/api/diretorio/${tokenUpload}`).query({ caminho: 'docs//2024' }), 200);
            let linha = await prisma().arquivo.findUniqueOrThrow({ where: { id: arquivo.id } });
            assert.equal(linha.diretorio_caminho, '/docs/2024/');

            const tokenDownload = servico().getDownloadToken(arquivo.id, undefined).download_token;
            assertStatus(await api().patch(`/api/diretorio/${tokenDownload}`).query({ caminho: 'outra/pasta/' }), 200);
            linha = await prisma().arquivo.findUniqueOrThrow({ where: { id: arquivo.id } });
            assert.equal(linha.diretorio_caminho, '/outra/pasta/');
        });

        it('arquivo de documento de PDM também cria a árvore de diretórios do PDM', async () => {
            const pdm = await criarPdmAntigo();
            const arquivo = await criarArquivo();
            await prisma().pdmDocumento.create({ data: { arquivo_id: arquivo.id, pdm_id: pdm.id } });
            const token = (await servico().getUploadToken(arquivo.id)).upload_token;

            assertStatus(await api().patch(`/api/diretorio/${token}`).query({ caminho: 'atas/2024' }), 200);

            const dirs = await prisma().diretorio.findMany({ where: { pdm_id: pdm.id } });
            const caminhos = dirs.map((d) => d.caminho);
            assert.ok(caminhos.includes('/atas/'));
            assert.ok(caminhos.includes('/atas/2024/'));
        });
    });
});
