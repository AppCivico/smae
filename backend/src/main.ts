import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

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
