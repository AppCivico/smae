import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

import { AuthService } from '../src/auth/auth.service';
import { AccessToken } from '../src/auth/models/AccessToken';
import { OrganizacaoExpert, PessoaExpert } from './lib/common';
import { Orgao } from '../src/orgao/entities/orgao.entity';

describe('AppController (e2e)', () => {
    let app: INestApplication;
    let exitingOrg: Orgao;
    let session: AccessToken;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        exitingOrg = await OrganizacaoExpert.getOrCreateOrg(app, {
            descricao: 'test-org',
            sigla: 'org name',
        });
        console.log(exitingOrg);

        const authService = app.get(AuthService);

        const findCustomer = await PessoaExpert.getOrCreatePessoa(app, {
            email: 'test@local.com',
            orgao_id: exitingOrg.id,
        });

        session = await authService.criarSession(findCustomer.id);

        await app.init();
    });
    afterAll(async () => {
        await app.close();
    });

    it('/minha-conta (GET) should be 401 without session', async () => {
        return await request(app.getHttpServer()).get('/minha-conta').expect(401);
    });

    it('/minha-conta (GET) should be 401 with invalid session', async () => {
        return await request(app.getHttpServer()).get('/minha-conta').auth('het', { type: 'bearer' }).expect(401);
    });

    it('/minha-conta (GET) should be 200', async () => {
        return await request(app.getHttpServer()).get('/minha-conta').auth(session.access_token, { type: 'bearer' }).expect(200);
    });
});
