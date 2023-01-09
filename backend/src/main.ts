import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { TrimPipe } from './common/pipes/trim-pipe';
const winston = require('winston'), expressWinston = require('express-winston');

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    const config = new DocumentBuilder()
        .setTitle('SMAE - OpenAPI file')
        .setDescription('*SMAE*\n\n' +
            '**CONVERSÃO AUTOMÁTICA PARA CSV**' +
            '\n\nTodos os endpoints que devolvem `application/json` também podem devolver CSV, utilize o' +
            'header `Accept: text/csv` para explodir apenas as linhas, ou então `Accept: text/csv; unwind-all` (mais lento, que expande tudo) que transforma todas as arrays em items. ' +
            '\n\nPor padrão todos os campos deep são achatados (flatten).' +
            '\n\né possível liberar o unwind-all apenas pra quem for admin ou alguns endpoints, mas no momento está liberado para todos.'
        )
        .addBearerAuth({
            type: 'http', scheme: 'bearer', bearerFormat: 'Bearer',
        }, 'access-token')
        .setVersion('1.0')
        .addTag('Público', 'Rotas públicas')
        .addTag('Minha Conta', 'Dados do próprio usuário')
        .addTag('default', 'Informações do sistema')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
            docExpansion: 'list', // none
        }
    });

    app.useGlobalPipes(
        new TrimPipe(),
        new ValidationPipe({
            enableDebugMessages: true,
            dismissDefaultMessages: false,
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: false, // conferir com o pessoal do frontend, talvez seja muito strict essa config!
        }),
    );

    app.use(expressWinston.logger({
        transports: [
            new winston.transports.Console({
                json: true,
            })
        ],
        meta: true,
        msg: "HTTP_DEBUG {{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}",
    }));
    expressWinston.requestWhitelist.push('body');
    expressWinston.responseWhitelist.push('body');

    await app.listen(process.env.PORT || 3001, '0.0.0.0');
}
bootstrap();
