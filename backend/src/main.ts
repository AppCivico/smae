import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';
import { setupSwaggerDocumentation } from './swagger.config';

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

    configureApp(app);

    app.enableShutdownHooks();

    // Setup Swagger documentation
    const loadedRoutes = setupSwaggerDocumentation(app);

    const port = process.env.PORT || 3001;
    await app.listen(port, '0.0.0.0').then(() => {
        console.log(`SMAE API running on port ${port}`);
        console.log('');

        console.log('Swagger Documentation:');
        loadedRoutes.forEach((route) => {
            console.log(`  - ${route.route}: ${route.title} (${route.tags.length} tags, ${route.moduleCount} modules)`);
        });
    });
}

bootstrap();

process.on('unhandledRejection', (reason, promise) => {
    if (reason instanceof Error) {
        console.log('Unhandled Rejection at:', promise, 'reason:', reason, 'Stack trace:', reason.stack);
    } else {
        console.log('Unhandled Rejection at:', promise, 'reason:', reason);
    }
});
