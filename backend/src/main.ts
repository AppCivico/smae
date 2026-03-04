import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { setupSwaggerDocumentation } from './swagger.config';
import { Request, Response } from 'express';

const SMAE_HEADERS = 'smae-sistemas';
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

    // Request/Response logging
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

    // Templates for reports
    app.setBaseViewsDir(join(__dirname, '..', 'templates'));
    app.setViewEngine('ejs');

    app.enableShutdownHooks();

    if (process.env.ENABLE_CORS) {
        app.enableCors({
            allowedHeaders: [
                ...'Origin,Content-Type,Accept,X-API-Key,Authorization,content-disposition'.split(','),
                ...SMAE_HEADERS.split(','),
            ],
        });
    }

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
