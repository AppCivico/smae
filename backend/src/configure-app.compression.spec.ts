import { Controller, Get, Res } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { Response } from 'express';
import { Readable } from 'stream';
import * as request from 'supertest';
import { PipeJsonLinesToResponse } from './common/helpers/Streaming';
import { configureApp } from './configure-app';

const bigRows = Array.from({ length: 500 }, (_, i) => ({ id: i, texto: 'x'.repeat(200) }));

@Controller('probe')
class ProbeController {
    @Get('big')
    big() {
        return bigRows;
    }

    @Get('small')
    small() {
        return { ok: true };
    }

    @Get('binary')
    binary(@Res() res: Response) {
        res.type('application/octet-stream').send(Buffer.alloc(64 * 1024, 1));
    }

    @Get('lines')
    lines(@Res() res: Response) {
        PipeJsonLinesToResponse(Readable.from(bigRows), res);
    }
}

describe('configureApp: compressão gzip', () => {
    let app: NestExpressApplication;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({ controllers: [ProbeController] }).compile();
        app = moduleRef.createNestApplication<NestExpressApplication>();
        configureApp(app, { requestLogger: false });
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('comprime JSON grande quando o cliente aceita gzip, com o mesmo corpo', async () => {
        const res = await request(app.getHttpServer()).get('/api/probe/big').set('Accept-Encoding', 'gzip');

        expect(res.status).toBe(200);
        expect(res.headers['content-encoding']).toBe('gzip');
        expect(res.body).toEqual(bigRows);
    });

    it('não comprime quando o cliente não aceita gzip', async () => {
        const res = await request(app.getHttpServer()).get('/api/probe/big').set('Accept-Encoding', 'identity');

        expect(res.headers['content-encoding']).toBeUndefined();
        expect(res.body).toEqual(bigRows);
    });

    it('não comprime JSON abaixo do threshold', async () => {
        const res = await request(app.getHttpServer()).get('/api/probe/small').set('Accept-Encoding', 'gzip');

        expect(res.headers['content-encoding']).toBeUndefined();
        expect(res.body).toEqual({ ok: true });
    });

    it('não comprime binário', async () => {
        const res = await request(app.getHttpServer()).get('/api/probe/binary').set('Accept-Encoding', 'gzip');

        expect(res.headers['content-encoding']).toBeUndefined();
        expect(res.headers['content-length']).toBe(String(64 * 1024));
    });

    it('comprime o stream de JSON lines sem perder linhas', async () => {
        const res = await request(app.getHttpServer())
            .get('/api/probe/lines')
            .set('Accept-Encoding', 'gzip')
            .buffer(true)
            .parse((r, cb) => {
                let data = '';
                r.setEncoding('utf8');
                r.on('data', (c: string) => (data += c));
                r.on('end', () => cb(null, data));
            });

        expect(res.headers['content-encoding']).toBe('gzip');
        const linhas = (res.body as string).trim().split('\n').map((l) => JSON.parse(l));
        expect(linhas).toEqual(bigRows);
    });

    it('mantém ETag e 304 com o corpo comprimido', async () => {
        const first = await request(app.getHttpServer()).get('/api/probe/big').set('Accept-Encoding', 'gzip');
        const etag = first.headers['etag'];
        expect(etag).toBeDefined();

        const second = await request(app.getHttpServer())
            .get('/api/probe/big')
            .set('Accept-Encoding', 'gzip')
            .set('If-None-Match', etag);

        expect(second.status).toBe(304);
    });
});
