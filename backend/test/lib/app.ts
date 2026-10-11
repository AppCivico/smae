import { HttpException, LogLevel } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/configure-app';
import { PrismaService } from '../../src/prisma/prisma.service';
import { clonarBancoDeTeste } from './db';

let appPromise: Promise<NestExpressApplication> | undefined;
let appInstance: NestExpressApplication | undefined;

// AllExceptionsFilter imprime todo HttpException; 4xx são esperados nos testes, 5xx continuam visíveis
function silenciarErrosEsperados() {
    for (const metodo of ['log', 'error'] as const) {
        const original = console[metodo].bind(console);
        console[metodo] = (...args: unknown[]) => {
            if (args[0] instanceof HttpException && args[0].getStatus() < 500) return;
            original(...args);
        };
    }
}

async function criarApp(): Promise<NestExpressApplication> {
    if (!process.env.E2E_LOG) silenciarErrosEsperados();
    await clonarBancoDeTeste();

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const logger: LogLevel[] = process.env.E2E_LOG ? ['log', 'error', 'warn', 'debug'] : ['error'];
    const app = moduleRef.createNestApplication<NestExpressApplication>({ logger });
    configureApp(app, { requestLogger: !!process.env.E2E_LOG });
    await app.init();
    appInstance = app;
    return app;
}

/** Sobe o AppModule completo com banco isolado. Cacheado por processo (= por arquivo de spec). */
export function bootApp(): Promise<NestExpressApplication> {
    if (!appPromise) appPromise = criarApp();
    return appPromise;
}

export function getApp(): NestExpressApplication {
    if (!appInstance) throw new Error('chame "await bootApp()" num before() antes de usar os helpers');
    return appInstance;
}

/** PrismaService da aplicação, para preparar dados ou conferir o banco diretamente. */
export function prisma(): PrismaService {
    return getApp().get(PrismaService);
}
