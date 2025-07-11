import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Type, plainToClass } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, MaxLength, ValidateNested, validate } from 'class-validator';
import { GeoJSON } from 'geojson';
import got, { Got } from 'got';
import { IsGeoJSONMap } from '../auth/decorators/is-geojson-map.decorator';
import { IsGeoJSON } from '../auth/decorators/is-geojson.decorator';
import { SmaeConfigService } from 'src/common/services/smae-config.service';

export class GeoError extends Error {
    constructor(msg: string) {
        console.log(`Geo service Error: ${msg}`);
        super(msg);
        Object.setPrototypeOf(this, GeoError.prototype);
    }
}

export class RetornoEnderecoReverso {
    @IsGeoJSON()
    endereco: GeoJSON;
}

export class RetornoEndereco {
    @IsGeoJSON()
    endereco: GeoJSON;

    @IsGeoJSONMap()
    camadas_geosampa?: Record<string, GeoJSON>;
}

export class RetornoIntegracaoGeoSampa {
    @IsGeoJSON()
    point: GeoJSON;

    @IsGeoJSONMap()
    camadas_geosampa?: Record<string, GeoJSON>;
}

export type RetornoEnderecoArr = RetornoEndereco[];

export class InputGeolocalizarCamadas {
    @IsString()
    @MaxLength(100)
    alias: string;

    @IsString()
    @MaxLength(100)
    layer_name: string;

    @IsNumber()
    @IsOptional()
    distance?: number = 5;
}

export class InputGeolocalizarEndereco {
    @IsString()
    @MaxLength(100)
    busca_endereco: string;

    @ValidateNested()
    @IsArray()
    @Type(() => InputGeolocalizarCamadas)
    camadas: InputGeolocalizarCamadas[];
}

export class InputGeolocalizarCEP {
    @IsString()
    @MaxLength(9)
    cep: string;

    @ValidateNested()
    @IsArray()
    @Type(() => InputGeolocalizarCamadas)
    camadas: InputGeolocalizarCamadas[];
}

export class InputGeolocalizarByLatLong {
    @IsNumber()
    lat: number;
    @IsNumber()
    long: number;

    @ValidateNested()
    @IsArray()
    @Type(() => InputGeolocalizarCamadas)
    camadas: InputGeolocalizarCamadas[];
}

@Injectable()
export class GeoApiService {
    private got: Got;
    private readonly logger = new Logger(GeoApiService.name);
    GEO_API_PREFIX: string;

    constructor(private readonly smaeConfigService: SmaeConfigService) {
        this.got = got;
    }

    async onModuleInit() {
        const geoPrefix = await this.smaeConfigService.getConfigWithDefault<string>(
            'GEO_API_PREFIX',
            'http://smae_geoloc:80/'
        );

        this.GEO_API_PREFIX = geoPrefix;
        console.log(this.GEO_API_PREFIX);

        this.got = this.got.extend({
            prefixUrl: this.GEO_API_PREFIX,
            timeout: 18 * 1000,
            retry: {
                limit: 2,
                methods: ['GET', 'PUT', 'HEAD', 'DELETE', 'OPTIONS', 'TRACE', 'POST'],
                statusCodes: [408, 413, 429, 500, 502, 503, 521, 522, 524],
            },
        });

        this.logger.debug(`GEO SOF configurada para usar endereço ${this.GEO_API_PREFIX}`);
    }

    async buscaEndereco(input: InputGeolocalizarEndereco): Promise<RetornoEndereco[]> {
        const dto = plainToClass(InputGeolocalizarEndereco, input);
        const errors = await validate(dto, { enableDebugMessages: true });
        if (errors.length) throw new Error(JSON.stringify(errors));

        dto.busca_endereco = dto.busca_endereco.trim();
        // encaminha para busca por CEP se for um CEP
        if (dto.busca_endereco.match(/^\d{5}-?\d{3}$/)) {
            return this.buscaCEP({ cep: dto.busca_endereco, camadas: dto.camadas });
        }

        const endpoint = 'geolocalizar_endereco/';
        const ret: RetornoEndereco[] = [];

        this.logger.debug(`chamando POST ${endpoint}`);
        try {
            await this.buscaGeoEndereco(endpoint, dto, ret);

            return ret;
        } catch (error: any) {
            this.handleGotError(error, endpoint);
        }
    }

    async buscaCEP(input: InputGeolocalizarCEP): Promise<RetornoEndereco[]> {
        input.cep = input.cep.replace(/\\-+/g, '');
        const dto = plainToClass(InputGeolocalizarCEP, input);
        const errors = await validate(dto, { enableDebugMessages: true });
        if (errors.length) throw new Error(JSON.stringify(errors));
        dto.cep = dto.cep.replace(/\\-+/g, '');
        if (dto.cep.length != 8) throw new Error('CEP inválido');
        dto.cep = dto.cep.substring(0, 5) + '-' + dto.cep.substring(5, 8);

        const endpoint = 'geolocalizar_cep/';
        const ret: RetornoEndereco[] = [];

        this.logger.debug(`chamando POST ${endpoint}`);
        try {
            await this.buscaGeoEndereco(endpoint, dto, ret);

            return ret;
        } catch (error: any) {
            this.handleGotError(error, endpoint);
        }
    }

    private async buscaGeoEndereco(
        endpoint: string,
        dto: InputGeolocalizarCEP | InputGeolocalizarEndereco,
        ret: RetornoEndereco[]
    ) {
        const responseAsJson = await this.got
            .post<any>(endpoint, {
                json: {
                    endereco: 'busca_endereco' in dto ? dto.busca_endereco : undefined,
                    cep: 'cep' in dto ? dto.cep : undefined,
                    camadas: dto.camadas,
                },
            })
            .json();
        this.logger.debug(`resposta: ${JSON.stringify(responseAsJson)}`);

        if (Array.isArray(responseAsJson)) {
            for (const r of responseAsJson) {
                const obj = plainToClass(RetornoEndereco, r);
                const errors = await validate(obj, { enableDebugMessages: true });
                if (errors.length) throw new Error(JSON.stringify(errors));

                ret.push(obj);
            }
        } else {
            throw new Error('Resposta fora do padrão esperado');
        }
    }

    async buscaEnderecoReverso(lat: number, long: number): Promise<RetornoEnderecoReverso> {
        const endpoint = `geolocalizacao_reversa/${encodeURIComponent(long)},${encodeURIComponent(lat)}`;

        this.logger.debug(`chamando GET ${endpoint}`);
        try {
            const responseAsJson: any = await this.got.get<any>(endpoint).json();
            this.logger.debug(`resposta: ${JSON.stringify(responseAsJson)}`);

            if ('type' in responseAsJson && responseAsJson.type == 'FeatureCollection') {
                const obj = plainToClass(RetornoEnderecoReverso, { endereco: responseAsJson });
                const errors = await validate(obj, { enableDebugMessages: true });
                if (errors.length) throw new Error(JSON.stringify(errors));

                return obj;
            }

            throw new Error('Resposta fora do padrão esperado');
        } catch (error: any) {
            this.handleGotError(error, endpoint);
        }
    }

    async buscaCamadasGeoSampa(input: InputGeolocalizarByLatLong): Promise<RetornoIntegracaoGeoSampa> {
        const dto = plainToClass(InputGeolocalizarByLatLong, input);
        const errors = await validate(dto, { enableDebugMessages: true });
        if (errors.length) throw new Error(JSON.stringify(errors));

        const endpoint = `integracao_geosampa/`;

        this.logger.debug(`chamando POST ${endpoint}`);
        try {
            const responseAsJson: any = await this.got
                .post<any>(endpoint, {
                    json: {
                        point: {
                            y: dto.lat,
                            x: dto.long,
                        },
                        camadas: dto.camadas,
                    },
                })
                .json();
            this.logger.debug(`resposta: ${JSON.stringify(responseAsJson)}`);

            if ('point' in responseAsJson) {
                const obj = plainToClass(RetornoIntegracaoGeoSampa, responseAsJson);
                const errors = await validate(obj, { enableDebugMessages: true });
                if (errors.length) throw new Error(JSON.stringify(errors));

                return obj;
            }

            throw new Error('Resposta fora do padrão esperado');
        } catch (error: any) {
            this.handleGotError(error, endpoint);
        }
    }

    /**
     * @throws {HttpException|GeoError} Always throws an exception
     */
    private handleGotError(error: any, endpoint: string): never {
        this.logger.debug(`${endpoint} falhou: ${error}`);
        console.log(error);
        let body = '';
        if (error instanceof got.HTTPError) {
            body = String(error.response.body);
            this.logger.debug(`${endpoint}.res.body: ${body}`);

            if (error.response.statusCode == 404) {
                throw new HttpException('Não há resultados para a pesquisa, confira os valores informados.', 400);
            } else if (error.response.statusCode == 422) {
                throw new HttpException(`Confira os valores informados: ${body}`, 400);
            }
        }

        throw new GeoError(`Serviço GeoService: falha ao acessar serviço: ${error}\n\nResponse.Body: ${body}`);
    }
}
