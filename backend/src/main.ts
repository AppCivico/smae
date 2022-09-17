import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { TrimPipe } from 'src/common/pipes/trim-pipe';
import { AppModule } from './app.module';
import * as requestIp from 'request-ip';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    const config = new DocumentBuilder()
        .setTitle('SMAE - OpenAPI file')
        .setDescription('SMAE')
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
            persistAuthorization: true
        }
    });

    app.useGlobalPipes(
        new TrimPipe(),
        new ValidationPipe({
            dismissDefaultMessages: true,
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: false, // conferir com o pessoal do frontend, talvez seja muito strict essa config!
        }),
    );

    await app.listen(3001, '0.0.0.0');
}
bootstrap();
