import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
    let app: INestApplication;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });
    afterAll(async () => {
        await app.close();
    });

    it('/ (GET) should be 404', async () => {
        return await request(app.getHttpServer()).get('/').expect(404);
    });

    it('/ping (GET)', async () => {
        return await request(app.getHttpServer()).get('/ping').expect(200);
    });
});
