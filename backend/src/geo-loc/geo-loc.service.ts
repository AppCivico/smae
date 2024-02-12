import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GeoCamadaConfig } from '@prisma/client';
import { Feature, GeoJSON } from 'geojson';
import { GeoApiService } from '../geo-api/geo-api.service';
import { PrismaService } from '../prisma/prisma.service';
import {
    FilterCamadasDto,
    GeoLocCamadaFullDto,
    GeoLocCamadaSimplesDto,
    GeoLocDto,
    RetornoGeoLoc,
} from './entities/geo-loc.entity';

type TipoToken = 'GeoLoc' | 'Pesquisa';

class GeoTokenJwtBody {
    id: number | null;
    tipo: TipoToken;
    camadas_ids: number[] | null;
}

@Injectable()
export class GeoLocService {
    private readonly logger = new Logger(GeoLocService.name);
    constructor(
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
        private readonly geoApi: GeoApiService
    ) {}

    async geoLoc(input: GeoLocDto): Promise<RetornoGeoLoc> {
        const ret: RetornoGeoLoc = { linhas: [] };

        const camadasConfig = await this.prisma.geoCamadaConfig.findMany();
        const buscaEndereco = await this.geoApi.buscaEndereco({
            busca_endereco: input.busca_endereco,
            camadas: camadasConfig.map((r) => {
                return { alias: r.id.toString(), layer_name: r.tipo_camada };
            }),
        });

        for (const apiEndereco of buscaEndereco) {
            const geoCamadas = await this.upsertCamadas(apiEndereco.camadas_geosampa, camadasConfig);

            const endereco = apiEndereco.endereco;
            if (endereco.type == 'FeatureCollection' && input.tipo == 'Endereco') {
                for (const feature of endereco.features) {
                    ret.linhas.push({
                        endereco: feature,
                        camadas: geoCamadas,
                    });
                }
            } else {
                throw new InternalServerErrorException('Retorno inesperado para tipo de busca executada.');
            }
        }

        return ret;
    }

    private async upsertCamadas(
        camadas: Record<string, GeoJSON> | undefined,
        camadasConfig: GeoCamadaConfig[]
    ): Promise<GeoLocCamadaSimplesDto[]> {
        const ret: GeoLocCamadaSimplesDto[] = [];
        if (!camadas) return ret;

        for (const dbConfig of camadasConfig) {
            const featureCollection = camadas[dbConfig.id];
            if (!featureCollection) continue;

            if (featureCollection.type != 'FeatureCollection') {
                this.logger.warn(`expected featureCollection.type=FeatureCollection`);
                continue;
            }

            if (!('features' in featureCollection) || !Array.isArray(featureCollection.features)) {
                this.logger.warn(`expected featureCollection.features to exists and be array`);
                continue;
            }

            for (const feature of featureCollection.features) {
                if (!feature || !feature.properties) continue;
                const propCodigo = feature.properties[dbConfig.chave_camada];
                const propTitulo = feature.properties[dbConfig.titulo_camada];

                if (!propCodigo || typeof propCodigo != 'string') {
                    this.logger.warn(`expected feature[${dbConfig.chave_camada}] to exists and be string`);
                    continue;
                }
                if (!propTitulo || typeof propTitulo != 'string') {
                    this.logger.warn(`expected feature[${dbConfig.titulo_camada}] to exists and be string`);
                    continue;
                }

                let geoCamada = await this.prisma.geoCamada.findFirst({
                    where: {
                        tipo_camada: dbConfig.tipo_camada,
                        codigo: propCodigo,
                    },
                });

                if (!geoCamada) {
                    geoCamada = await this.criaCamada(dbConfig, feature, propCodigo, propTitulo);
                }

                ret.push({
                    id: geoCamada.id,
                    codigo: geoCamada.codigo,
                    titulo: geoCamada.titulo,
                });
            }
        }

        return ret;
    }

    private async criaCamada(
        dbConfig: {
            id: number;
            tipo_camada: string;
            chave_camada: string;
            nivel_regionalizacao: number | null;
            simplificar_em: number | null;
        },
        feature: Feature,
        propCodigo: string,
        propTitulo: string
    ) {
        // TODO: quando tiver funcionando o decode, da pra rodar a simplificação
        const geoCamada = await this.prisma.geoCamada.create({
            data: {
                tipo_camada: dbConfig.tipo_camada,
                geom_geojson: feature as any,
                geom_geojson_original: feature as any,
                nivel_regionalizacao: dbConfig.nivel_regionalizacao,
                codigo: propCodigo,
                titulo: propTitulo,
            },
        });

        if (dbConfig.nivel_regionalizacao != null && geoCamada) {
            const regioes = await this.prisma.regiao.findMany({
                where: {
                    nivel: dbConfig.nivel_regionalizacao,
                    codigo: propCodigo,
                    removido_em: null,
                },
                select: { id: true },
            });

            await this.prisma.geoCamadaRegiao.createMany({
                data: regioes.map((r) => {
                    return {
                        geo_camada_id: geoCamada!.id,
                        regiao_id: r.id,
                    };
                }),
            });
        }
        return geoCamada;
    }

    private decodeToken(jwt: string | undefined): GeoTokenJwtBody | null {
        let tmp: GeoTokenJwtBody | null = null;
        try {
            if (jwt) tmp = this.jwtService.verify(jwt) as GeoTokenJwtBody;
        } catch {
            throw new BadRequestException('geo token is invalid');
        }
        return tmp;
    }

    private encodeToken(opt: GeoTokenJwtBody): string {
        return this.jwtService.sign(opt);
    }

    async buscaCamadas(dto: FilterCamadasDto): Promise<GeoLocCamadaFullDto[]> {
        const rows = await this.prisma.geoCamada.findMany({
            where: {
                id: { in: dto.camada_ids },
            },
            select: {
                id: true,
                codigo: true,
                titulo: true,
                geom_geojson: true,
            },
        });

        return rows
            .filter((r) => r.geom_geojson?.valueOf())
            .map((r) => {
                return {
                    ...r,
                    geom_geojson: r.geom_geojson?.valueOf() as GeoJSON,
                };
            });
    }
}
