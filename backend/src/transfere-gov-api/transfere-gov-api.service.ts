import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Transform, Type, plainToClass } from 'class-transformer';
import { IsArray, IsDate, IsNumber, IsString, ValidateNested, validate } from 'class-validator';
import got, { Got } from 'got';
import { DateTransformDMY } from '../auth/transforms/date.transform';

export class TransfereGovError extends Error {
    constructor(msg: string) {
        console.log(`TransfereGov ERROR: ${msg}`);
        super(msg);
        Object.setPrototypeOf(this, TransfereGovError.prototype);
    }
}

export class TransfGovComunicado {
    @IsNumber()
    numero: number;

    @IsNumber()
    ano: number;

    @IsString()
    titulo: string;

    @IsString()
    link: string;

    @IsDate()
    @Transform(DateTransformDMY)
    data: Date;

    @IsString()
    descricao: string;
}

class ApiResponse {
    @IsString()
    ultima_atualizacao: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TransfGovComunicado)
    comunicados: TransfGovComunicado[];
}

@Injectable()
export class TransfereGovApiService {
    private got: Got;
    private readonly logger = new Logger(TransfereGovApiService.name);
    TRANSFEREGOV_API_PREFIX: string;

    constructor() {
        this.TRANSFEREGOV_API_PREFIX = process.env.TRANSFEREGOV_API_PREFIX || 'http://smae_transferegov:80/';
        this.got = got.extend({
            prefixUrl: this.TRANSFEREGOV_API_PREFIX,
            timeout: 600 * 1000,
            retry: {
                limit: 5,
                methods: ['GET', 'PUT', 'HEAD', 'DELETE', 'OPTIONS', 'TRACE', 'POST'],
                statusCodes: [408, 413, 429, 500, 502, 503, 521, 522, 524],
            },
        });
        this.logger.debug(`API TransfereGov configurada para usar endereço ${this.TRANSFEREGOV_API_PREFIX}`);
    }

    async getGerais(): Promise<TransfGovComunicado[]> {
        return this.fetchComunicados('v1/gerais');
    }

    async getIndividuais(): Promise<TransfGovComunicado[]> {
        return this.fetchComunicados('v1/individuais');
    }

    async getEspeciais(): Promise<TransfGovComunicado[]> {
        return this.fetchComunicados('v1/especiais');
    }

    async getBancada(): Promise<TransfGovComunicado[]> {
        return this.fetchComunicados('v1/bancada');
    }

    private async fetchComunicados(endpoint: string): Promise<TransfGovComunicado[]> {
        this.logger.debug(`chamando GET ${endpoint}`);
        try {
            const response = await this.got.get(endpoint).json();
            this.logger.debug(`resposta: ${JSON.stringify(response)}`);

            // Validate the response
            const apiResponse = plainToClass(ApiResponse, response);
            const errors = await validate(apiResponse);
            if (errors.length > 0) {
                throw new HttpException(errors.map((e) => e.toString()).join('\n'), 400);
            }

            return apiResponse.comunicados;
        } catch (error: any) {
            this.logger.debug(`${endpoint} falhou: ${error}`);
            let body = '';
            if (error instanceof got.HTTPError) {
                body = String(error.response.body);
                this.logger.debug(`${endpoint}.res.body: ${body}`);
            }

            if (error instanceof HttpException) {
                throw error;
            }

            throw new TransfereGovError(
                `Serviço TransfereGov: falha ao acessar serviço: ${error}\n\nResponse.Body: ${body}`
            );
        }
    }
}
