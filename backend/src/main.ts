import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { AppModule } from './app.module';
import { AppModuleProjeto } from './app.module.projeto';
import { AppModuleCommon } from './app.module.common';
import { INestApplication } from '@nestjs/common';
import { AppModulePdm } from './app.module.pdm';
import { BlocoNotasModule } from './bloco-nota/bloco-notas.module';
import { Request, Response } from 'express';

const winston = require('winston'),
    expressWinston = require('express-winston');

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    // Add global unhandled promise rejection handler
    process.on('unhandledRejection', (reason: Error, promise: Promise<any>) => {
        console.error('Unhandled Promise Rejection:');
        console.error('Promise:', promise);
        console.error('Reason:', reason);
    });

    // Add global uncaught exception handler
    process.on('uncaughtException', (error: Error) => {
        console.error('Uncaught Exception:');
        console.error(error);
    });

    app.setGlobalPrefix('api');
    const desc = `*SMAE* (Sistema de Monitoramento e Acompanhamento Estratégico) é um software livre e de código aberto.

### CONVERSÃO AUTOMÁTICA PARA CSV

<p>
Todos os endpoints que devolvem \`application/json\` também podem devolver CSV, utilize o
header \`Accept: text/csv\` para explodir apenas as linhas, ou então \`Accept: text/csv; unwind-all\`
(mais lento, que expande tudo) que transforma todas as arrays em items.
<br>Por padrão todos os campos deep são achatados (flatten).<br>
</p>
</div>

----

# Add to insomnia

Usar o link do do swagger + "-json"

# Disponível também

- [Módulos fundamentais](/api/swagger-base)
- [OpenAPI - Módulos de Programa de Metas](/api/swagger-pdm)
- [OpenAPI - Módulos de Projetos](/api/swagger-projetos)
- [OpenAPI - Módulos de bloco de notas](/api/swagger-bloco-notas)
`;

    const configProjeto = createSwaggerConfig('SMAE - OpenAPI - Módulos de Projetos', desc);
    setupSwaggerModule('api/swagger-projetos', app, configProjeto.build(), [AppModuleProjeto]);

    const configCommon = createSwaggerConfig('SMAE - OpenAPI - Módulos fundamentais', desc);
    setupSwaggerModule('api/swagger-base', app, configCommon.build(), [AppModuleCommon]);

    const configPdm = createSwaggerConfig('SMAE - OpenAPI - Módulos Programa de Metas', desc);
    setupSwaggerModule('api/swagger-pdm', app, configPdm.build(), [AppModulePdm]);

    const blocoNotasPdm = createSwaggerConfig('SMAE - OpenAPI - Bloco de notas', desc);
    setupSwaggerModule('api/swagger-bloco-notas', app, blocoNotasPdm.build(), [BlocoNotasModule]);

    const config = createSwaggerConfig('SMAE - OpenAPI - Aplicação completa', desc);

    setupSwaggerModule(
        'api',
        app,
        config
            .addTag('Público', 'Rotas públicas')
            .addTag('Minha Conta', 'Dados do próprio usuário')
            .addTag('default', 'Informações do sistema')
            .build(),
        []
    );

    app.use(
        expressWinston.logger({
            transports: [
                new winston.transports.Console({
                    json: true,
                }),
            ],
            meta: true,
            msg: 'HTTP_DEBUG {{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}',
            ignoreRoute: (req: Request, _res: Response) => {
                if (req.url.startsWith('/api/relatorio/')) return true;

                return false;
            },
            skip: (_req: Request, res: Response) => {
                return res.statusCode < 400;
            },
        })
    );
    expressWinston.requestWhitelist.push('body');
    expressWinston.responseWhitelist.push('body');

    // templates para gerar relatorios
    app.setBaseViewsDir(join(__dirname, '..', 'templates'));
    app.setViewEngine('ejs');

    app.enableShutdownHooks();

    if (process.env.ENABLE_CORS) app.enableCors();

    await app.listen(process.env.PORT || 3001, '0.0.0.0');
}
bootstrap();
process.on('unhandledRejection', (reason, promise) => {
    if (reason instanceof Error) {
        console.log('Unhandled Rejection at:', promise, 'reason:', reason, 'Stack trace:', reason.stack);
    } else {
        console.log('Unhandled Rejection at:', promise, 'reason:', reason);
    }
});

function createSwaggerConfig(title: string, description: string) {
    return new DocumentBuilder()
        .setTitle(title)
        .setDescription(description)
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'Bearer',
            },
            'access-token'
        )
        .setVersion('1.0')
        .addGlobalParameters({
            name: 'smae-sistemas',
            in: 'header',
            required: false,
            example: 'SMAE,PDM,CasaCivil,Projetos,PlanoSetorial,MDO',
        })
        .addGlobalParameters({
            name: 'smae-tipo',
            in: 'header',
            required: false,
            example: 'PS',
        });
}

function setupSwaggerModule(
    route: string,
    app: INestApplication,
    config: Omit<OpenAPIObject, 'paths'>,
    includeModules: any[]
) {
    const document = SwaggerModule.createDocument(app, config, {
        include: includeModules,
        deepScanRoutes: true,
    });

    SwaggerModule.setup(route, app, document, {
        swaggerOptions: {
            persistAuthorization: true,
            filter: '',
            syntaxHighlight: false,
            docExpansion: 'list', // none
        },
    });
}
