// TODO: REMOVER — proxy temporário de debug para o backend de geoloc.
// Encaminha qualquer requisição em /api/geoloc-debug/* para o GEO_API_PREFIX
// (configurado por ambiente), reusando o endereço que a própria API já conhece.
// Sem autenticação de propósito, apenas para depuração. NÃO deve ir para produção.
import { All, Controller, Req, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Request, Response } from 'express';
import got from 'got';
import { IsPublic } from '../auth/decorators/is-public.decorator';
import { GeoApiService } from '../geo-api/geo-api.service';

@ApiExcludeController()
@Controller('')
export class GeoLocDebugController {
    constructor(private readonly geoApi: GeoApiService) {}

    @IsPublic()
    @All('geoloc-debug/*rest')
    async proxy(@Req() req: Request, @Res() res: Response): Promise<void> {
        const rest = (req.params as Record<string, unknown>)['rest'];
        const path = (Array.isArray(rest) ? rest.join('/') : String(rest ?? '')).replace(/^\/+/, '');

        const base = (this.geoApi.GEO_API_PREFIX ?? '').replace(/\/+$/, '');
        const url = `${base}/${path}`;

        const hasBody = !['GET', 'HEAD'].includes(req.method);

        const upstream = await got(url, {
            method: req.method as any,
            searchParams: req.query as Record<string, string>,
            ...(hasBody ? { json: req.body } : {}),
            throwHttpErrors: false,
            responseType: 'buffer',
        });

        res.status(upstream.statusCode);
        const contentType = upstream.headers['content-type'];
        if (contentType) res.setHeader('content-type', contentType);
        res.send(upstream.body);
    }
}
