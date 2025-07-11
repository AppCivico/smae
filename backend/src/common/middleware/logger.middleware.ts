import { Injectable, Logger, NestMiddleware } from '@nestjs/common';

import { NextFunction, Request, Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { extractIpAddress } from '../decorators/current-ip';
import { SmaeConfigService } from '../services/smae-config.service';

let request_num = 1;
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    private logger = new Logger('HTTP');
    private logOnDb = false;
    private logSkipUrl: string[] = ['/ping'];

    constructor(
        private readonly prisma: PrismaService,
        private readonly smaeConfigService: SmaeConfigService
    ) {
        this.logOnDb = process.env.LOG_REQ_ON_DB === 'true';
        if (this.logOnDb) this.logger.debug('Database request audit is enabled');
    }

    async onModuleInit() {
        const skipUrl = await this.smaeConfigService.getConfigWithDefault('LOG_DB_SKIP_URL_LIST', '');

        const skipList = skipUrl.split('|').filter(Boolean);
        if (skipList.length) {
            this.logger.warn('Ignoring save on database on more urls: ' + skipList.join('|'));
            this.logSkipUrl.push(...skipList);
        }
    }

    use(request: Request, response: Response, next: NextFunction): void {
        const { ip, method, path: url } = request;
        const userAgent = request.get('user-agent') || '';
        const startReqTime = Date.now();
        this.logger.log(`${method} ${url} from user-agent '${userAgent || '(no-user-agent)'}' IP '${ip || '(no-ip)'}'`);

        response.on('close', () => {
            const { statusCode } = response;
            const contentLength = response.get('content-length');
            const took = Date.now() - startReqTime;

            if (statusCode == 304 || statusCode == 204) {
                this.logger.log(`${method} ${url} ${statusCode} NO CONTENT in ${took} ms`);
            } else {
                this.logger.log(`${method} ${url} ${statusCode} returning ${contentLength} bytes in ${took} ms`);
            }
            const ipAddress = extractIpAddress(request);

            if (request.user && request.user instanceof PessoaFromJwt) this.logAtividade(request.user, ipAddress);

            if (!this.logOnDb) return;
            if (this.logSkipUrl.includes(url)) return;

            try {
                let created_pessoa_id: number | null = null;
                if (request.user && request.user instanceof PessoaFromJwt) created_pessoa_id = request.user.id;

                this.prisma.api_request_log
                    .create({
                        data: {
                            request_num: request_num++,
                            created_at: new Date(),
                            cf_ray: this.getHeaderCfRay(request),
                            ip: ipAddress,
                            req_body: this.getBody(request),
                            req_method: method,
                            req_headers: this.getHeadersParamFromReq(request),
                            req_path: url,
                            req_host: this.getHeaderHost(request),
                            req_query: this.getQueryParamFromReq(request),
                            req_body_size: this.getBodySize(request),
                            res_code: statusCode,
                            response_size: contentLength ? +contentLength : 0,
                            response_time: Math.ceil(took),
                            created_pessoa_id,
                        },
                    })
                    .catch((error) => {
                        this.logger.error(`failed to persist request on database: ${error}`);
                    });
            } catch (error) {
                this.logger.error(`failed to generate log: ${error}`);
            }
        });

        next();
    }

    private getBody(request: Request): string | null {
        if (!request.body) return null;
        if (typeof request.body === 'string') return request.body;
        const json = JSON.stringify(request.body);
        if (request.method == 'GET' && json == '{}') return null;
        return json;
    }

    private getHeaderCfRay(request: Request) {
        return request.headersDistinct['cf-ray']?.join('\n') || '';
    }

    private getHeaderHost(request: Request) {
        return request.headers.host || '(empty)';
    }

    private getBodySize(request: Request): number | null {
        if (
            request.headersDistinct['content-length'] &&
            isNaN(+request.headersDistinct['content-length'][0]) === false
        ) {
            return +request.headersDistinct['content-length'][0];
        }
        if (request.body && request.body.length && isNaN(request.body.length) === false) return request.body.length;
        return null;
    }

    private getQueryParamFromReq(request: Request): string | null {
        if (!request.query) return null;
        if (!request.query.query) return null;

        if (typeof request.query.query === 'string') {
            return request.query.query;
        } else if (typeof request.query.query == 'object' && Object.keys(request.query.query).length == 0) {
            return null;
        }

        return JSON.stringify(request.query.query);
    }

    private getHeadersParamFromReq(request: Request): string | null {
        if (!request.headers) return null;

        const copy = { ...request.headers };

        delete copy.authorization;

        // na prefeitura não está usando cloudflare, mas poderia!
        delete copy['host'];
        delete copy['cf-ray'];
        delete copy['cf-cert-presented'];
        delete copy['cf-cert-revoked'];
        delete copy['cf-cert-verified'];
        delete copy['cdn-loop'];
        delete copy['accept'];
        delete copy['accept-encoding'];
        delete copy['cf-postal-code'];
        delete copy['cf-metro-code'];
        delete copy['cf-iplatitude'];
        delete copy['cf-iplongitude'];
        delete copy['cf-visitor'];
        delete copy['cf-timezone'];
        delete copy['ssl-client-issuer-dn'];
        delete copy['ssl-client-subject-dn'];
        delete copy['ssl-client-verify'];
        delete copy['x-forwarded-for'];
        delete copy['x-forwarded-host'];
        delete copy['x-forwarded-port'];
        delete copy['x-forwarded-proto'];
        delete copy['x-forwarded-scheme'];
        delete copy['x-original-forwarded-for'];

        if (Object.keys(copy).length == 0) return null;

        return JSON.stringify(copy);
    }

    logAtividade(user: PessoaFromJwt, ip: string) {
        this.prisma
            .$executeRaw`SELECT f_insere_log_atividade(${user.id}::int, ${ip}::INET, ${user.session_id}::int);`.catch(
            (e) => {
                this.logger.log(e);
            }
        );
    }
}
