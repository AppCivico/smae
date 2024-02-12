import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Type, plainToClass } from 'class-transformer';
import { IsArray, IsString, MaxLength, ValidateNested, validate } from 'class-validator';
import got, { Got } from 'got';
import { IsGeoJSONMap } from '../auth/decorators/is-geojson-map.decorator';
import { IsGeoJSON } from '../auth/decorators/is-geojson.decorator';
import { GeoJSON } from 'geojson';

export class GeoError extends Error {
    constructor(msg: string) {
        console.log(`SOF ERROR: ${msg}`);
        super(msg);
        Object.setPrototypeOf(this, GeoError.prototype);
    }
}

export class RetornoEndereco {
    @IsGeoJSON()
    endereco: GeoJSON;

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

@Injectable()
export class GeoApiService {
    private got: Got;
    private readonly logger = new Logger(GeoApiService.name);
    GEO_API_PREFIX: string;

    constructor() {
        this.GEO_API_PREFIX = process.env.GEO_API_PREFIX || 'http://smae_geo:80/';
    }

    onModuleInit() {
        this.got = got.extend({
            prefixUrl: this.GEO_API_PREFIX,
            timeout: 20 * 1000,
            retry: {
                limit: 2,
                methods: ['GET', 'PUT', 'HEAD', 'DELETE', 'OPTIONS', 'TRACE', 'POST'],
                statusCodes: [408, 413, 429, 500, 502, 503, 521, 522, 524],
            },
        });
        this.logger.debug(`API SOF configurada para usar endereço ${this.GEO_API_PREFIX}`);
    }

    async buscaEndereco(input: InputGeolocalizarEndereco): Promise<RetornoEndereco[]> {
        const dto = plainToClass(InputGeolocalizarEndereco, input);
        const errors = await validate(dto, { enableDebugMessages: true });
        if (errors.length) throw new Error(JSON.stringify(errors));

        const endpoint = 'geolocalizar_endereco/';
        const ret: RetornoEndereco[] = [];

        this.logger.debug(`chamando POST ${endpoint}`);
        try {
            const responseAsJson = await this.got
                .post<any>(endpoint, {
                    json: {
                        endereco: dto.busca_endereco,
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

            return ret;
        } catch (error: any) {
            this.logger.debug(`${endpoint} falhou: ${error}`);
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

            throw new GeoError(`Serviço SOF: falha ao acessar serviço: ${error}\n\nResponse.Body: ${body}`);
        }
    }
}
