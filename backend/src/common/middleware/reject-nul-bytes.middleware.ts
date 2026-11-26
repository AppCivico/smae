import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

// Postgres text/jsonb não aceita U+0000: viraria 500 (22021) no meio de uma query.
export function containsNulByte(value: unknown, depth = 0): boolean {
    if (typeof value === 'string') return value.includes('\u0000');
    if (depth > 32 || value === null || typeof value !== 'object') return false;
    for (const [k, v] of Object.entries(value)) {
        if (k.includes('\u0000') || containsNulByte(v, depth + 1)) return true;
    }
    return false;
}

@Injectable()
export class RejectNulBytesMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction): void {
        if (!/%00/i.test(req.originalUrl) && !containsNulByte(req.body)) return next();
        res.status(400).json({ message: 'Requisição contém o caractere NUL (\\u0000).' });
    }
}
