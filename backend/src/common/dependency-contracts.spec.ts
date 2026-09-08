/**
 * Trava as APIs de terceiros que o projeto consome de forma não-óbvia: forma de import,
 * assinatura chamada e comportamento de borda. São os pontos que um `npm upgrade` quebra
 * em silêncio, porque o `tsc` não vê `require()` e o erro só aparece na rota em produção.
 *
 * Ao subir uma dessas libs, este arquivo é o primeiro a rodar. Se um teste aqui falhar,
 * o consumidor citado no `describe` precisa ser revisado antes do merge.
 */
import { Parser } from '@json2csv/plainjs';
import { flatten, Transform, unwind } from '@json2csv/transforms';
import { JSDOM } from 'jsdom';
import * as DOMPurify from 'dompurify';
import * as sharp from 'sharp';
import * as jwt from 'jsonwebtoken';
import * as ejs from 'ejs';

describe('csv-parse (consumidor: content.interceptor.ts)', () => {
    // A interceptor usa a forma de callback dentro de uma Promise. csv-parse não expõe
    // versão sync neste entrypoint, então perder o callback quebraria o Accept: xlsx.
    const { parse } = require('csv-parse');

    it('aceita a forma parse(input, opts, callback)', async () => {
        const rows = await new Promise((resolve, reject) => {
            parse('a,b\n1,2\n3,4', { columns: true }, (err: unknown, data: unknown) => {
                if (err) return reject(err);
                resolve(data);
            });
        });

        expect(rows).toEqual([
            { a: '1', b: '2' },
            { a: '3', b: '4' },
        ]);
    });

    it('reporta erro pelo callback em vez de lançar', async () => {
        const err = await new Promise((resolve) => {
            parse('a,b\n1,2,3', { columns: true }, (e: unknown) => resolve(e));
        });

        expect(err).toBeInstanceOf(Error);
    });
});

describe('@dagrejs/graphlib (consumidor: pp/tarefa/tarefa.service.ts)', () => {
    const graphlib = require('@dagrejs/graphlib');

    const montaGrafo = (arestas: [string, string][]) => {
        const grafo = new graphlib.Graph({ directed: true });
        for (const [de, para] of arestas) grafo.setEdge(de, para);
        return grafo;
    };

    it('topsort devolve ordem topológica em grafo acíclico', () => {
        const grafo = montaGrafo([
            ['1_start', '1_end'],
            ['2_start', '2_end'],
            ['1_end', '2_start'],
        ]);

        expect(graphlib.alg.isAcyclic(grafo)).toBe(true);
        expect(graphlib.alg.topsort(grafo)).toEqual(['1_start', '1_end', '2_start', '2_end']);
    });

    it('isAcyclic e findCycles detectam ciclo', () => {
        const grafo = montaGrafo([
            ['1_start', '1_end'],
            ['1_end', '2_start'],
            ['2_start', '2_end'],
            ['2_end', '1_start'],
        ]);

        expect(graphlib.alg.isAcyclic(grafo)).toBe(false);
        const ciclos = graphlib.alg.findCycles(grafo);
        expect(ciclos.length).toBeGreaterThan(0);
        // valida_grafo_dependencias faz nodeId.split('_') para remontar o texto do erro
        expect(ciclos[0].every((n: string) => /^\d+_(start|end)$/.test(n))).toBe(true);
    });

    it('setNode aceita nó isolado e setEdge cria nós implicitamente', () => {
        const grafo = new graphlib.Graph({ directed: true });
        grafo.setNode('9_start');
        grafo.setEdge('9_start', '9_end');

        expect(grafo.nodes().sort()).toEqual(['9_end', '9_start']);
    });
});

describe('ejs (consumidor: templates de relatório via app.setViewEngine)', () => {
    it('renderiza local presente', () => {
        expect(ejs.render('<%= nome %>', { nome: 'SMAE' })).toBe('SMAE');
    });

    // Comportamento herdado do `with()` do ejs: local ausente é ReferenceError, não string
    // vazia. É o que faz projeto-ue.ejs dar 500 quando o service para de mandar um campo.
    it('lança ReferenceError quando o local não foi passado', () => {
        expect(() => ejs.render('<%= ausente %>', {})).toThrow(ReferenceError);
    });
});

describe('dompurify + jsdom (consumidor: common/html-sanitizer.ts)', () => {
    // Mesma construção do html-sanitizer: DOMPurify precisa da window do jsdom para
    // funcionar fora do browser. Se a fábrica deixar de ser chamável, o import quebra.
    const purify = DOMPurify(new JSDOM('').window as any);

    it.each([
        ['<script>alert(1)</script>ok', 'ok'],
        ['<img src=x onerror=alert(1)>', '<img src="x">'],
        ['<a href="javascript:alert(1)">x</a>', '<a>x</a>'],
        ['<iframe src="//evil"></iframe>', ''],
    ])('remove payload perigoso de %s', (sujo, limpo) => {
        expect(purify.sanitize(sujo)).toBe(limpo);
    });

    it('preserva acentuação', () => {
        expect(purify.sanitize('<p>Ação São Paulo</p>')).toBe('<p>Ação São Paulo</p>');
    });
});

describe('adm-zip (consumidor: reports.service.ts, upload.service.ts)', () => {
    const AdmZip = require('adm-zip');

    it('addFile/toBuffer e getEntries fecham o ciclo com nome acentuado', () => {
        const zip = new AdmZip();
        zip.addFile('previsão-custo.csv', Buffer.from('nome,valor\nAção,10\n', 'utf8'));
        const buffer: Buffer = zip.toBuffer();

        expect(buffer.subarray(0, 2).toString()).toBe('PK');

        const entries = new AdmZip(buffer).getEntries();
        expect(entries.map((e: any) => e.entryName)).toEqual(['previsão-custo.csv']);
        expect(entries[0].getData().toString('utf8')).toContain('Ação,10');
    });
});

describe('@json2csv (consumidor: content.interceptor.ts, common/helpers/CsvWriter.ts)', () => {
    it('unwind + flatten achatam o envelope { linhas: [...] }', () => {
        const transforms = [unwind({ paths: ['linhas'] }), flatten()] satisfies [
            Transform<any, any>,
            ...Transform<any, any>[],
        ];
        const csv = new Parser({ transforms }).parse({ linhas: [{ id: 1, org: { sigla: 'GP' } }] });

        expect(csv.split('\n')[0]).toBe('"linhas.id","linhas.org.sigla"');
        expect(csv.split('\n')[1]).toBe('1,"GP"');
    });
});

describe('xlsx (consumidor: content.interceptor.ts)', () => {
    const XLSX = require('xlsx');

    it('json_to_sheet + write(buffer) produzem um xlsx válido', () => {
        const sheet = XLSX.utils.json_to_sheet([{ nome: 'Ação', valor: 10 }]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, sheet, 'Sheet1');
        const buffer: Buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        expect(buffer.subarray(0, 2).toString()).toBe('PK');
    });
});

describe('sharp (consumidor: upload/thumbnail.service.ts)', () => {
    it('gera webp redimensionado a partir de buffer', async () => {
        const origem = await sharp({
            create: { width: 200, height: 100, channels: 3, background: { r: 10, g: 20, b: 30 } },
        })
            .png()
            .toBuffer();

        const thumb = await sharp(origem).resize(50, 50, { fit: 'inside' }).webp().toBuffer();
        const meta = await sharp(thumb).metadata();

        expect(meta.format).toBe('webp');
        expect(meta.width).toBe(50);
    });
});

describe('jsonwebtoken (consumidor: upload.service.ts getDownloadToken)', () => {
    // O motivo do pin de @nestjs/jwt: @types/jsonwebtoken 9.0.10 restringe expiresIn a
    // `number | StringValue`, e getDownloadToken passa uma string livre ('60 minutes').
    it('aceita expiresIn como string com unidade', () => {
        const token = jwt.sign({ arquivo_id: 1, aud: 'dl' }, 'segredo', { expiresIn: '60 minutes' } as any);
        const payload = jwt.verify(token, 'segredo', { audience: 'dl' }) as jwt.JwtPayload;

        expect(payload.arquivo_id).toBe(1);
        expect(payload.exp! - payload.iat!).toBe(3600);
    });
});
