import { NestExpressApplication } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { join } from 'path';
import { currentPrismaQuerySeq, prismaQueryAls } from './prisma/prisma-query-context';

const SMAE_HEADERS = 'smae-sistemas';
const winston = require('winston'),
    expressWinston = require('express-winston');

export function configureApp(app: NestExpressApplication, opts: { requestLogger?: boolean } = {}) {
    app.setGlobalPrefix('api');

    // Per-request Prisma query buffer (consumed by PrismaErrorFilter)
    app.use((_req: Request, _res: Response, next: () => void) => {
        prismaQueryAls.run({ startSeq: currentPrismaQuerySeq(), entries: [] }, () => next());
    });

    // Request/Response logging
    if (opts.requestLogger !== false) {
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
    }

    // Templates for reports
    app.setBaseViewsDir(join(__dirname, '..', 'templates'));
    app.setViewEngine('ejs');

    if (process.env.ENABLE_CORS) {
        app.enableCors({
            allowedHeaders: [
                ...'Origin,Content-Type,Accept,X-API-Key,Authorization,content-disposition'.split(','),
                ...SMAE_HEADERS.split(','),
            ],
        });
    }
}
