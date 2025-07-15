import { HttpException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Transform, Type, plainToClass } from 'class-transformer';
import { IsArray, IsDate, IsInt, IsNumber, IsOptional, IsString, ValidateNested, validate } from 'class-validator';
import got, { Got, HTTPError } from 'got';
import { DateTransformDMY } from '../auth/transforms/date.transform';
import { NumberTransform } from '../auth/transforms/number.transform';
import { SmaeConfigService } from '../common/services/smae-config.service';

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

    @IsDate()
    @Transform(DateTransformDMY)
    data_disponibilizacao: string;

    @IsNumber()
    ano_disponibilizacao: number;

    @IsDate()
    @Transform(DateTransformDMY)
    dt_ini_receb: string;

    @IsDate()
    @Transform(DateTransformDMY)
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

export class Finalidade {
    @IsString()
    codigo: string;

    @IsString()
    descricao: string;
}

export class PlanoAcaoDetalhado {
    @IsInt()
    @Transform(NumberTransform)
    id: number;

    @IsString()
    codigo_do_programa: string;

    @IsString()
    situacao: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => Finalidade)
    finalidades?: Finalidade[];

    @IsString()
    @IsOptional()
    uf?: string;

    @IsString()
    modalidade: string;

    @IsString()
    @IsOptional()
    orgao: string | null;

    @IsDate()
    @IsOptional()
    @Transform(DateTransformDMY)
    dt_inicio_propostas: Date | null;

    @IsDate()
    @IsOptional()
    @Transform(DateTransformDMY)
    dt_fim_propostas: Date | null;
}

export class ApiResponsePlanosAcao {
    @IsInt()
    @Transform(NumberTransform)
    total: number;

    @IsInt()
    @Transform(NumberTransform)
    @IsOptional()
    skip?: number;

    @IsInt()
    @Transform(NumberTransform)
    @IsOptional()
    limit?: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PlanoAcaoDetalhado)
    data: PlanoAcaoDetalhado[];
}

@Injectable()
export class TransfereGovApiService implements OnModuleInit {
    private got: Got;
    private readonly logger = new Logger(TransfereGovApiService.name);

    constructor(private readonly configService: SmaeConfigService) {}

    async onModuleInit() {
        this.got = got.extend({
            timeout: 600 * 1000,
            retry: {
                limit: 5,
                methods: ['GET', 'PUT', 'HEAD', 'DELETE', 'OPTIONS', 'TRACE', 'POST'],
                statusCodes: [408, 413, 429, 500, 502, 503, 521, 522, 524],
            },
        });
    }

    private async getApiUrl(): Promise<string> {
        const base = await this.configService.getNormalizedUrl(
            'TRANSFEREGOV_API_PREFIX',
            'http://smae_transferegov:80/'
        );
        return base;
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
        const apiUrl = await this.getApiUrl();
        this.logger.debug(`chamando GET ${endpoint} com base URL ${apiUrl}`);

        try {
            const gotInstance = this.got.extend({
                prefixUrl: apiUrl,
            });

            const response = await gotInstance.get(endpoint).json();
            this.logger.debug(`resposta: ${JSON.stringify(response)}`);

            // Validar a resposta
            const apiResponse = plainToClass(ApiResponseComunicados, response);
            const errors = await validate(apiResponse);
            if (errors.length > 0) {
                throw new HttpException(
                    `Falha na validação: ${errors.map((e) => e.toString()).join('\n')} - ${JSON.stringify(response)}`,
                    400
                );
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
export class TransfereGovApiTransferenciasService implements OnModuleInit {
    private got: Got;
    private readonly logger = new Logger(TransfereGovApiTransferenciasService.name);

    constructor(private readonly configService: SmaeConfigService) {}

    async onModuleInit() {
        this.got = got.extend({
            timeout: 600 * 1000,
            retry: {
                limit: 5,
                methods: ['GET', 'PUT', 'HEAD', 'DELETE', 'OPTIONS', 'TRACE', 'POST'],
                statusCodes: [408, 413, 429, 500, 502, 503, 521, 522, 524],
            },
        });
    }

    private async getApiUrl(): Promise<string> {
        const base = await this.configService.getNormalizedUrl(
            'TRANSFEREGOV_API_TRANSFERENCIAS_PREFIX',
            'http://smae_transferegov_transferencias:80/'
        );
        return base;
    }

    private async getPageSize(): Promise<number> {
        return await this.configService.getConfigWithDefault('TRANSFEREGOV_API_TRANSFERENCIAS_PAGE_SIZE', 100);
    }

    private async getDefaultPage(): Promise<number> {
        return await this.configService.getConfigWithDefault('TRANSFEREGOV_API_TRANSFERENCIAS_DEFAULT_PAGE', 1);
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
        const apiUrl = await this.getApiUrl();
        const pageSize = await this.getPageSize();
        const defaultPage = await this.getDefaultPage();

        this.logger.debug(`API TransfereGov (Transferências) configurada para usar endereço ${apiUrl}`);

        let totalPaginas: number = defaultPage + 1;
        for (let pagina = defaultPage; pagina < totalPaginas; pagina++) {
            this.logger.debug(`chamando GET ${endpoint} - página ${pagina}`);
            try {
                const gotInstance = this.got.extend({
                    prefixUrl: apiUrl,
                });

                const response = await gotInstance.get(endpoint + `?page=${pagina}&size=${pageSize}`).json();
                this.logger.debug(`resposta: ${JSON.stringify(response)}`);

                // Validar a resposta
                const apiResponse = plainToClass(ApiResponseTransferencias, response);
                const errors = await validate(apiResponse);
                if (errors.length > 0) {
                    throw new HttpException(
                        `Falha na validação: ${errors.map((e) => e.toString()).join('\n')} - ${JSON.stringify(response)}`,
                        400
                    );
                }

                totalPaginas = apiResponse.pages;

                transferencias.push(
                    ...apiResponse.items.filter(
                        (item) =>
                            item.uf_programa == 'SP' &&
                            item.natureza_juridica_programa == 'Administração Pública Municipal'
                    )
                );
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

@Injectable()
export class TransfereGovApiOportunidadesApiService implements OnModuleInit {
    private got: Got;
    private readonly logger = new Logger(TransfereGovApiOportunidadesApiService.name);

    constructor(private readonly configService: SmaeConfigService) {}

    async onModuleInit() {
        this.got = got.extend({
            timeout: { request: 60000 }, // 60 segundos
            retry: {
                limit: 5,
                methods: ['GET', 'POST', 'PUT', 'HEAD', 'DELETE', 'OPTIONS', 'TRACE'],
                statusCodes: [408, 413, 429, 500, 502, 503, 504, 521, 522, 524],
            },
        });
    }

    private async getPageSize(): Promise<number> {
        return await this.configService.getConfigWithDefault('TRANSFEREGOV_API_OPORTUNIDADES_PAGE_SIZE', 100);
    }

    private async getIdFiltro(): Promise<string> {
        return await this.configService.getConfigWithDefault(
            'TRANSFEREGOV_API_OPORTUNIDADES_ID_BENEFICIARIO',
            '3445' // esse ID representa a cidade de São Paulo
        );
    }

    /**
     * Busca todos os planos de ação detalhados para um beneficiário específico, tratando a paginação automaticamente.
     * @param idBeneficiario O ID do beneficiário para consulta.
     * @returns Uma promise que resolve para um array de todos os planos de ação detalhados.
     */
    async getPlanosAcaoDetalhados(): Promise<PlanoAcaoDetalhado[]> {
        const allPlanos: PlanoAcaoDetalhado[] = [];
        let skip = 0;
        let hasMore = true;
        const base = await this.configService.getNormalizedUrl(
            'TRANSFEREGOV_API_ESPECIAIS_PREFIX',
            'http://localhost:8000/'
        );
        const endpoint = base + 'planos-acao-detailed/beneficiario/';
        const pageSize = await this.getPageSize();
        const idBeneficiario = await this.getIdFiltro();

        this.logger.debug(`OportunidadesApiService_API configurada para usar endereço ${endpoint}`);

        while (hasMore) {
            this.logger.debug(
                `Chamando GET ${endpoint} - idBeneficiario: ${idBeneficiario}, skip: ${skip}, limit: ${pageSize}`
            );

            try {
                // Construir a URL com os parâmetros de consulta
                const searchParams = new URLSearchParams({
                    id_beneficiario: idBeneficiario,
                    skip: skip.toString(),
                    limit: pageSize.toString(),
                });

                const response = await this.got.get(endpoint, { searchParams }).json();
                this.logger.debug(`Resposta recebida para skip=${skip}`);

                // Validar a resposta usando os DTOs
                const apiResponse = plainToClass(ApiResponsePlanosAcao, response);

                const errors = await validate(apiResponse);
                if (errors.length > 0) {
                    throw new HttpException(
                        `Falha na validação: ${errors.map((e) => e.toString()).join('\n')} - ${JSON.stringify(response)}`,
                        400
                    );
                }

                // Adicionar os itens obtidos à nossa coleção
                allPlanos.push(...apiResponse.data);

                // Determinar se existem mais páginas para buscar
                if (allPlanos.length >= apiResponse.total) {
                    hasMore = false;
                } else {
                    // Preparar para a próxima iteração
                    skip += pageSize;
                }
            } catch (error: any) {
                this.logger.error(`${endpoint} falhou: ${error.message}`);
                let body = '';
                if (error instanceof HTTPError) {
                    body = String(error.response.body);
                    this.logger.error(`${endpoint}.res.body: ${body}`);
                }

                if (error instanceof HttpException) {
                    throw error;
                }

                throw new TransfereGovError(
                    `Serviço Oportunidades: falha ao acessar o serviço: ${error.message}\n\nResponse.Body: ${body}`
                );
            }
        }

        this.logger.log(
            `Total de ${allPlanos.length} planos de ação detalhados obtidos para o beneficiário ${idBeneficiario}.`
        );
        return allPlanos;
    }
}
