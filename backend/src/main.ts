import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);


    const config = new DocumentBuilder()
        .setTitle('SMAE - OpenAPI file')
        .setDescription('SMAE')
        .addBearerAuth({
            type: 'http', scheme: 'bearer', bearerFormat: 'Bearer',
        }, 'access-token')
        .setVersion('1.0')
        .addTag('pessoas', 'Cadastro de usuários do SMAE')
        .addTag('publico', 'Rotas públicas')
        .addTag('minha-conta', 'Dados do próprio usuário ou sistema')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    app.useGlobalPipes(
        new ValidationPipe({
            dismissDefaultMessages: true,
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true, // conferir com o pessoal do frontend, talvez seja muito strict essa config!
        })
    );

    await app.listen(3001);
}
bootstrap();
