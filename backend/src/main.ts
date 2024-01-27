import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { AppModule } from './app.module';

const winston = require('winston'),
    expressWinston = require('express-winston');

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    app.setGlobalPrefix('api');

    const config = new DocumentBuilder()
        .setTitle('SMAE - OpenAPI file')
        .setDescription(
            '*SMAE*\n\n' +
                '**CONVERSÃO AUTOMÁTICA PARA CSV**' +
                '\n\nTodos os endpoints que devolvem `application/json` também podem devolver CSV, utilize o' +
                'header `Accept: text/csv` para explodir apenas as linhas, ou então `Accept: text/csv; unwind-all` (mais lento, que expande tudo) que transforma todas as arrays em items. ' +
                '\n\nPor padrão todos os campos deep são achatados (flatten).' +
                '\n\né possível liberar o unwind-all apenas pra quem for admin ou alguns endpoints, mas no momento está liberado para todos.'
        )
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'Bearer',
            },
            'access-token'
        )
        .setVersion('1.0')
        .addTag('Público', 'Rotas públicas')
        .addTag('Minha Conta', 'Dados do próprio usuário')
        .addTag('default', 'Informações do sistema')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
            filter: '',
            docExpansion: 'list', // none
        },
    });

    app.use(
        expressWinston.logger({
            transports: [
                new winston.transports.Console({
                    json: true,
                }),
            ],
            meta: true,
            msg: 'HTTP_DEBUG {{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}',
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
