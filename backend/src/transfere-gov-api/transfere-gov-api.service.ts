import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Transform, Type, plainToClass } from 'class-transformer';
import { IsArray, IsDate, IsEnum, IsNumber, IsString, ValidateNested, validate } from 'class-validator';
import got, { Got } from 'got';
import { DateTransformDMY } from '../auth/transforms/date.transform';
import { TransfereGovOportunidadeTipo } from '@prisma/client';

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

export class TransfGovTransferencia {
    @IsNumber()
    cod_orgao_sup_programa: number;

    @IsEnum(TransfereGovOportunidadeTipo)
    tipo?: TransfereGovOportunidadeTipo;

    @IsNumber()
    id_programa: number;

    @IsString()
    desc_orgao_sup_programa: string;

    @IsNumber()
    cod_programa: number;

    @IsString()
    nome_programa: string;

    @IsString()
    sit_programa: string;

    @IsString()
    data_disponibilizacao: string;

    @IsNumber()
    ano_disponibilizacao: number;

    @IsString()
    dt_ini_receb: string;

    @IsString()
    dt_fim_receb: string;

    @IsString()
    modalidade_programa: string;

    @IsString()
    acao_orcamentaria: string;

    @IsString()
    natureza_juridica_programa: string;

    @IsString()
    uf_programa: string;
}

class ApiResponseComunicados {
    @IsString()
    ultima_atualizacao: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TransfGovComunicado)
    comunicados: TransfGovComunicado[];
}

class ApiResponseTransferencias {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TransfGovTransferencia)
    items: TransfGovTransferencia[];

    @IsNumber()
    total: number;

    @IsNumber()
    page: number;

    @IsNumber()
    size: number;

    @IsNumber()
    pages: number;
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
            const apiResponse = plainToClass(ApiResponseComunicados, response);
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

@Injectable()
export class TransfereGovApiTransferenciasService {
    private got: Got;
    private readonly logger = new Logger(TransfereGovApiService.name);
    TRANSFEREGOV_API_TRANSFERENCIAS_PREFIX: string;
    PAGE_SIZE: number;
    DEFAULT_PAGE: number;

    constructor() {
        this.TRANSFEREGOV_API_TRANSFERENCIAS_PREFIX =
            process.env.TRANSFEREGOV_API_TRANSFERENCIAS_PREFIX || 'http://smae_transferegov_transferencias:80/';
        this.got = got.extend({
            prefixUrl: this.TRANSFEREGOV_API_TRANSFERENCIAS_PREFIX,
            timeout: 600 * 1000,
            retry: {
                limit: 5,
                methods: ['GET', 'PUT', 'HEAD', 'DELETE', 'OPTIONS', 'TRACE', 'POST'],
                statusCodes: [408, 413, 429, 500, 502, 503, 521, 522, 524],
            },
        });
        this.logger.debug(
            `API TransfereGov configurada para usar endereço ${this.TRANSFEREGOV_API_TRANSFERENCIAS_PREFIX}`
        );
        this.DEFAULT_PAGE = 1;
        this.PAGE_SIZE = 100;
    }

    async getVoluntarias(): Promise<TransfGovTransferencia[]> {
        return this.fetchTransferencias('v1/voluntarias');
    }

    async getEspecificas(): Promise<TransfGovTransferencia[]> {
        return this.fetchTransferencias('v1/especificas');
    }

    async getEmendas(): Promise<TransfGovTransferencia[]> {
        return this.fetchTransferencias('v1/emendas');
    }

    private async fetchTransferencias(endpoint: string): Promise<TransfGovTransferencia[]> {
        const transferencias: TransfGovTransferencia[] = [];

        let totalPaginas: number = this.DEFAULT_PAGE + 1;
        for (let pagina = this.DEFAULT_PAGE; pagina < totalPaginas; pagina++) {
            this.logger.debug(`chamando GET ${endpoint} - página ${pagina}`);
            try {
                const response = await this.got.get(endpoint + `?page=${pagina}&size=${this.PAGE_SIZE}`).json();
                this.logger.debug(`resposta: ${JSON.stringify(response)}`);

                // Validate the response
                const apiResponse = plainToClass(ApiResponseTransferencias, response);
                const errors = await validate(apiResponse);
                if (errors.length > 0) {
                    throw new HttpException(errors.map((e) => e.toString()).join('\n'), 400);
                }

                totalPaginas = apiResponse.pages;

                transferencias.push(...apiResponse.items.filter((item) => item.uf_programa == 'SP'));
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
                    `Serviço TransfereGov (Transferências): falha ao acessar serviço: ${error}\n\nResponse.Body: ${body}`
                );
            }
        }

        return transferencias;
    }
}
