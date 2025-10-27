import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CampoVinculo, GeoCamadaConfig, Prisma } from '@prisma/client';
import * as turf from '@turf/simplify';
import { Feature, GeoJSON, GeoJsonObject } from 'geojson';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { SmaeConfigService } from '../common/services/smae-config.service';
import { GeoApiService } from '../geo-api/geo-api.service';
import { PrismaService } from '../prisma/prisma.service';
import {
    CreateEnderecoDto,
    CreateGeoEnderecoReferenciaDto,
    FilterCamadasDto,
    FilterGeoJsonDto,
    FindGeoEnderecoReferenciaDto,
    GeoLocCamadaFullDto,
    GeoLocCamadaSimplesDto,
    GeoLocDto,
    GeoLocDtoByLatLong,
    GeolocalizacaoDto,
    RetornoCreateEnderecoDto,
    RetornoGeoLoc,
} from './entities/geo-loc.entity';
import { VinculoService } from 'src/casa-civil/vinculo/vinculo.service';

class GeoTokenJwtBody {
    id: number;
}

export class UpsertEnderecoRegiaoDto {
    nivel: number;
    id: number;
}

export class UpsertEnderecoIdDto {
    endereco_id: number;
    regioes: UpsertEnderecoRegiaoDto[];
}

export class UpsertEnderecoDto {
    enderecos: UpsertEnderecoIdDto[];
    novos_enderecos: UpsertEnderecoIdDto[];
}

// resultado aproximado, ta bom pra distancias curtas
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // raio da terra, em km, para terror dos terraplanistas
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const dφ = ((lat2 - lat1) * Math.PI) / 180;
    const dl = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(dφ / 2) * Math.sin(dφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dl / 2) * Math.sin(dl / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;

    return d;
}

@Injectable()
export class GeoLocService {
    private readonly logger = new Logger(GeoLocService.name);
    constructor(
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
        private readonly geoApi: GeoApiService,
        private readonly smaeConfigService: SmaeConfigService,
        private readonly vinculoService: VinculoService
    ) {}

    async geoLoc(input: GeoLocDto): Promise<RetornoGeoLoc> {
        const ret: RetornoGeoLoc = { linhas: [] };

        const geoCamadaConfig = await this.smaeConfigService.getConfig('GEO_CAMADA_IDS');
        const camadaIds = geoCamadaConfig ? geoCamadaConfig.split(',').map((r) => parseInt(r)) : undefined;

        const camadasConfig = await this.prisma.geoCamadaConfig.findMany({
            where: camadaIds ? { id: { in: camadaIds } } : undefined,
        });
        const buscaEndereco = await this.geoApi.buscaEndereco({
            busca_endereco: input.busca_endereco,
            camadas: this.apelidosCamadas(camadasConfig),
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

    private apelidosCamadas(
        camadasConfig: {
            id: number;
            tipo_camada: string;
            chave_camada: string;
            titulo_camada: string;
            descricao: string;
            nivel_regionalizacao: number | null;
            cor: string | null;
            simplificar_em: number | null;
        }[]
    ) {
        return camadasConfig.map((r) => {
            return { alias: r.id.toString(), layer_name: r.tipo_camada };
        });
    }

    async findGeoLocByLatLong(input: GeoLocDtoByLatLong): Promise<RetornoGeoLoc> {
        const ret: RetornoGeoLoc = { linhas: [] };

        const camadasConfig = await this.prisma.geoCamadaConfig.findMany();
        const buscaPontos = await this.geoApi.buscaEnderecoReverso(input.lat, input.long);

        if (buscaPontos.endereco.type != 'FeatureCollection') {
            throw new InternalServerErrorException('Retorno inesperado para tipo de busca executada.');
        }

        const pointFeatures = buscaPontos.endereco.features.filter((f) => f.geometry.type == 'Point');
        if (pointFeatures.length == 0) {
            throw new BadRequestException('Nenhum endereço encontrado para as coordenadas informadas.');
        }

        const { closestPoint, minDistance } = findClosestPoint();
        this.logger.debug(`closestPoint ${JSON.stringify(closestPoint)}, distance ${minDistance}`);

        if (closestPoint.geometry.type != 'Point')
            throw new InternalServerErrorException('Retorno inesperado para tipo de busca executada.');

        const buscaCamadas = await this.geoApi.buscaCamadasGeoSampa({
            camadas: this.apelidosCamadas(camadasConfig),
            lat: closestPoint.geometry.coordinates[1],
            long: closestPoint.geometry.coordinates[0],
        });
        const geoCamadas = await this.upsertCamadas(buscaCamadas.camadas_geosampa, camadasConfig);

        ret.linhas.push({
            endereco: closestPoint,
            camadas: geoCamadas,
        });

        return ret;

        function findClosestPoint() {
            let closestPoint = pointFeatures[0];
            let minDistance = getDistance(
                input.lat,
                input.long,
                (closestPoint.geometry as any).coordinates[1],
                (closestPoint.geometry as any).coordinates[0]
            );

            for (let i = 1; i < pointFeatures.length; i++) {
                const distance = getDistance(
                    input.lat,
                    input.long,
                    (pointFeatures[i].geometry as any).coordinates[1],
                    (pointFeatures[i].geometry as any).coordinates[0]
                );
                if (distance < minDistance) {
                    minDistance = distance;
                    closestPoint = pointFeatures[i];
                }
            }
            return { closestPoint, minDistance };
        }
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
                    descricao: dbConfig.descricao,
                    cor: dbConfig.cor,
                    nivel_regionalizacao: dbConfig.nivel_regionalizacao,
                });
            }
        }

        return ret;
    }

    async processGeoJsonSimplification(): Promise<void> {
        const geoCamadas = await this.prisma.geoCamada.findMany({
            where: {
                config: {
                    simplificar_em: { not: null }, // resolution
                },
            },
            select: {
                id: true,
                geom_geojson_original: true,
                config: {
                    select: {
                        simplificar_em: true,
                    },
                },
            },
        });

        for (const r of geoCamadas) {
            const originalGeoJson = r.geom_geojson_original as any as GeoJSON;

            if (originalGeoJson.type === 'Feature' && originalGeoJson.geometry.type === 'Polygon') {
                try {
                    const simplifiedGeoJson = turf.simplify(originalGeoJson, {
                        tolerance: r.config.simplificar_em!,
                        highQuality: false,
                        mutate: true,
                    });

                    await this.prisma.geoCamada.update({
                        where: { id: r.id },
                        data: {
                            geom_geojson: simplifiedGeoJson as unknown as Prisma.InputJsonValue,
                        },
                    });
                } catch (error) {
                    this.logger.error(`Error simplifying GeoJSON for id ${r.id}: ${error}`, 'GeoLocService');
                }
            } else {
                this.logger.warn(`GeoJSON with id ${r.id} is not a Polygon. Skipping simplification.`, 'GeoLocService');
            }
        }
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
                geo_camada_config: dbConfig.id,
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

    private decodeToken(jwt: string): GeoTokenJwtBody {
        let tmp: GeoTokenJwtBody | null = null;
        try {
            if (jwt) tmp = this.jwtService.verify(jwt) as GeoTokenJwtBody;
        } catch {
            // ignore
        }
        if (!tmp) throw new BadRequestException('geo token is invalid');
        return tmp;
    }

    private encodeToken(opt: GeoTokenJwtBody): string {
        return this.jwtService.sign(opt);
    }

    async buscaCamadas(dto: FilterCamadasDto): Promise<GeoLocCamadaFullDto[]> {
        let filtroRegioes: number[] | undefined = undefined;

        if (dto.filha_de_regiao_id) {
            const regioes = await this.prisma.$queryRaw<{ id: number }[]>`
                WITH RECURSIVE subRegioes AS (
                    -- Base case: começa com a região
                    SELECT id, parente_id, nivel
                    FROM regiao
                    WHERE id = ${dto.filha_de_regiao_id}
                    AND removido_em IS NULL
                    UNION ALL
                    -- Recursive case: busca os filhos
                    SELECT r.id, r.parente_id, r.nivel
                    FROM regiao r
                    INNER JOIN subRegioes sr ON r.parente_id = sr.id
                    WHERE r.removido_em IS NULL
                )
                SELECT id
                FROM subRegioes
                WHERE true
                AND (
                    ${dto.regiao_nivel_regionalizacao}::int IS NULL
                    OR
                    nivel = ${dto.regiao_nivel_regionalizacao}::int
                )
            `;

            filtroRegioes = regioes.map((r) => r.id);
        }

        const rows = await this.prisma.geoCamada.findMany({
            where: {
                id: { in: dto.camada_ids },
                nivel_regionalizacao: dto.camada_nivel_regionalizacao,
                GeoCamadaRegiao: filtroRegioes
                    ? {
                          some: {
                              regiao: {
                                  id: filtroRegioes ? { in: filtroRegioes } : undefined,
                              },
                          },
                      }
                    : undefined,
            },
            select: {
                id: true,
                codigo: true,
                titulo: true,
                geom_geojson: true,
                config: true,
                GeoCamadaRegiao: dto.retornar_regioes
                    ? {
                          select: {
                              regiao: {
                                  select: {
                                      id: true,
                                      descricao: true,
                                      nivel: true,
                                  },
                              },
                          },
                      }
                    : undefined,
            },
        });

        return rows
            .filter((r) => r.geom_geojson?.valueOf())
            .map((r) => {
                const regiaoFiltro =
                    dto.retornar_regioes && 'GeoCamadaRegiao' in r
                        ? r.GeoCamadaRegiao.filter(
                              (r) =>
                                  !dto.regiao_nivel_regionalizacao ||
                                  ('regiao' in r && dto.regiao_nivel_regionalizacao == (r as any).regiao.nivel)
                          ).map((r) => {
                              const regiao = (r as any).regiao;
                              return {
                                  id: regiao.id,
                                  descricao: regiao.descricao,
                                  nivel_regionalizacao: regiao.nivel,
                              };
                          })
                        : undefined;

                delete (r as any).GeoCamadaRegiao;
                return {
                    ...r,
                    regiao: regiaoFiltro,
                    descricao: r.config.descricao,
                    cor: r.config.cor,
                    nivel_regionalizacao: r.config.nivel_regionalizacao,
                    geom_geojson: r.geom_geojson?.valueOf() as GeoJSON,
                } satisfies GeoLocCamadaFullDto;
            });
    }

    async createEndereco(dto: CreateEnderecoDto, user: PessoaFromJwt): Promise<RetornoCreateEnderecoDto> {
        let endereco_exibicao = '';
        let lat = 0;
        let lon = 0;
        if (dto.tipo == 'Endereco' && dto.endereco.type != 'Feature')
            throw new BadRequestException('Para o tipo Endereço o GeoJson precisa ser do tipo Feature');

        if (dto.tipo == 'Endereco' && dto.endereco.type == 'Feature') {
            if (dto.endereco.geometry.type == 'Point') {
                [lon, lat] = [...dto.endereco.geometry.coordinates];
            } else {
                throw new BadRequestException('Para o tipo Endereço o GeoJson ter uma coordenada do tipo Ponto');
            }

            const propEndereco = dto.endereco.properties ? dto.endereco.properties['string_endereco'] : null;
            if (typeof propEndereco != 'string')
                throw new BadRequestException('Para o tipo Endereço o GeoJson ter a propriedade string_endereco');
            endereco_exibicao = propEndereco;
        }

        const now = new Date(Date.now());
        return await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RetornoCreateEnderecoDto> => {
                const endereco = await prismaTx.geoLocalizacao.create({
                    data: {
                        endereco_exibicao,
                        lat,
                        lon,
                        tipo: dto.tipo,
                        geom_geojson: dto.endereco as any,
                        metadata: { criado_por: user.id },
                        criado_em: now,
                        GeoEnderecoCamada: dto.camadas
                            ? {
                                  createMany: {
                                      data: dto.camadas.map((camada_id) => {
                                          return {
                                              geo_camada_id: camada_id,
                                          };
                                      }),
                                      skipDuplicates: true,
                                  },
                              }
                            : undefined,
                    },
                    select: {
                        id: true,
                        endereco_exibicao: true,
                        geom_geojson: true,
                        tipo: true,
                        GeoEnderecoCamada: {
                            select: {
                                geo_camada: {
                                    select: {
                                        id: true,
                                        titulo: true,
                                        codigo: true,
                                        config: true,
                                    },
                                },
                            },
                        },
                    },
                });

                return {
                    endereco_exibicao: endereco.endereco_exibicao,
                    token: this.encodeToken({ id: endereco.id }),
                    tipo: endereco.tipo,
                    endereco: endereco.geom_geojson as any as GeoJSON,
                    camadas: endereco.GeoEnderecoCamada.map((c) => {
                        return {
                            codigo: c.geo_camada.codigo,
                            titulo: c.geo_camada.titulo,
                            id: c.geo_camada.id,
                            descricao: c.geo_camada.config.descricao,
                            nivel_regionalizacao: c.geo_camada.config.nivel_regionalizacao,
                            cor: c.geo_camada.config.cor,
                        };
                    }),
                };
            }
        );
    }

    async upsertGeolocalizacao(
        dto: CreateGeoEnderecoReferenciaDto,
        user: PessoaFromJwt,
        prismaTx: Prisma.TransactionClient,
        now: Date
    ): Promise<UpsertEnderecoDto> {
        if (!dto.tokens)
            return {
                novos_enderecos: [],
                enderecos: [],
            };

        dto.validaReferencia();

        const inputIds: number[] = [];
        for (const token of dto.tokens) {
            const enderecoJwt = this.decodeToken(token);

            if (inputIds.includes(enderecoJwt.id) == false) inputIds.push(enderecoJwt.id);
        }

        const endereco = await prismaTx.geoLocalizacao.findMany({
            where: { id: { in: inputIds } },
            select: {
                id: true,
                tipo: true,
                GeoEnderecoCamada: {
                    select: {
                        geo_camada: {
                            select: {
                                GeoCamadaRegiao: {
                                    select: {
                                        regiao: {
                                            select: {
                                                nivel: true,
                                                id: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        const novos: UpsertEnderecoIdDto[] = [];
        const enderecos: UpsertEnderecoIdDto[] = endereco.map((endereco) => {
            return {
                endereco_id: endereco.id,
                regioes: endereco.GeoEnderecoCamada.flatMap((camada) => {
                    return camada.geo_camada.GeoCamadaRegiao.flatMap((camadaRegiao) => {
                        return camadaRegiao.regiao;
                    });
                }),
            };
        });

        const enderecoById: Record<number, (typeof endereco)[0]> = {};
        for (const r of endereco) {
            enderecoById[r.id] = r;

            if (r.tipo != dto.tipo)
                throw new BadRequestException(
                    `Tipo da geolocalização ${r.tipo} precisa ser o mesmo tipo da associação ${dto.tipo}`
                );
        }

        for (const id of inputIds) {
            if (!enderecoById[id]) throw new BadRequestException(`Geolocalização ID ${id} não encontrada.`);
        }

        if (
            Array.isArray(dto.projeto_id) ||
            Array.isArray(dto.iniciativa_id) ||
            Array.isArray(dto.atividade_id) ||
            Array.isArray(dto.meta_id) ||
            Array.isArray(dto.etapa_id)
        ) {
            throw new BadRequestException(`Associação ${dto.referencia()} não pode ser array durante a criação.`);
        }

        const referencia = dto.referencia();

        const prevRelationRecords = await prismaTx.geoLocalizacaoReferencia.findMany({
            where: {
                removido_em: null,

                [referencia]: dto[referencia],
            },
            select: {
                id: true,
                geo_localizacao: {
                    select: { id: true, endereco_exibicao: true },
                },

                // Dados do projeto serão utilizados para invalidar vínculo caso o projeto tenha vínculos de distribuição de recursos e a ref de geolocalização seja removida.
                projeto: {
                    select: {
                        id: true,
                        vinculosDistribuicaoRecursos: {
                            where: { removido_em: null, campo_vinculo: CampoVinculo.Endereco },
                            select: { id: true, valor_vinculo: true },
                        },
                    },
                },
            },
        });

        for (const end of endereco) {
            // se já existe, n precisa recriar
            if (prevRelationRecords.filter((r) => r.geo_localizacao.id == end.id)[0]) continue;

            novos.push(enderecos.find((r) => r.endereco_id == end.id)!);

            // cria o relacionamento
            await prismaTx.geoLocalizacaoReferencia.create({
                data: {
                    tipo: dto.tipo,
                    criado_em: new Date(Date.now()),
                    criador_por: user.id,
                    geo_localizacao_id: end.id,

                    [referencia]: dto[referencia],
                },
                select: { id: true },
            });
        }

        for (const prevRecord of prevRelationRecords) {
            // se ainda ta na lista dos presentes, n precisa remover
            if (inputIds.filter((r) => r == prevRecord.geo_localizacao.id)[0]) continue;

            // Verificando se o projeto possui vínculos de distribuição de recursos.
            // Se tiver, invalidamos o vínculo.
            if (prevRecord.projeto && prevRecord.projeto.vinculosDistribuicaoRecursos.length > 0) {
                // Também verificamos pelo campo de endereço, para garantir que o vínculo seja referente ao endereço que está sendo removido.
                for (const vinculo of prevRecord.projeto.vinculosDistribuicaoRecursos) {
                    if (vinculo.valor_vinculo === prevRecord.geo_localizacao.endereco_exibicao) {
                        await this.vinculoService.invalidarVinculo(
                            { id: vinculo.id },
                            'Remoção de endereço vinculado ao projeto.',
                            prismaTx
                        );
                    }
                }
            }

            await prismaTx.geoLocalizacaoReferencia.update({
                where: {
                    id: prevRecord.id,
                    removido_em: null,
                },
                data: {
                    removido_em: now,
                    removido_por: user.id,
                },
            });
        }

        return { enderecos: enderecos, novos_enderecos: novos };
    }

    async carregaReferencias(dto: FindGeoEnderecoReferenciaDto): Promise<Map<number, GeolocalizacaoDto[]>> {
        dto.validaReferencia();

        const ret = new Map<number, GeolocalizacaoDto[]>();

        const referencia = dto.referencia();

        const records = await this.prisma.geoLocalizacaoReferencia.findMany({
            where: {
                removido_em: null,

                [referencia]:
                    dto[referencia] && Array.isArray(dto[referencia]) ? { in: dto[referencia] } : dto[referencia],
            },
            include: {
                geo_localizacao: {
                    select: {
                        id: true,
                        endereco_exibicao: true,
                        geom_geojson: true,
                        tipo: true,
                        GeoEnderecoCamada: {
                            select: {
                                geo_camada: {
                                    select: {
                                        id: true,
                                        titulo: true,
                                        codigo: true,
                                        config: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        for (const r of records) {
            const endereco = r.geo_localizacao;

            const item = {
                endereco_exibicao: endereco.endereco_exibicao,
                token: this.encodeToken({ id: endereco.id }),
                tipo: endereco.tipo,
                endereco: endereco.geom_geojson as any as GeoJSON,
                camadas: endereco.GeoEnderecoCamada.map((c) => {
                    return {
                        codigo: c.geo_camada.codigo,
                        titulo: c.geo_camada.titulo,
                        id: c.geo_camada.id,
                        descricao: c.geo_camada.config.descricao,
                        nivel_regionalizacao: c.geo_camada.config.nivel_regionalizacao,
                        cor: c.geo_camada.config.cor,
                    };
                }),
            };

            const id = r[referencia] as number;
            if (!id) {
                this.logger.warn(`${referencia} is undefined, but expected to be filtered at database level`);
                continue;
            }

            let container = ret.get(id);
            if (!container) {
                container = [];
                ret.set(id, container);
            }
            container.push(item);
        }

        return ret;
    }

    async geoJsonCollection(filter: FilterGeoJsonDto): Promise<GeoJsonObject> {
        const geoCamada = await this.prisma.geoCamada.findMany({
            where: {
                tipo_camada: filter.tipo_camada,

                GeoCamadaRegiao: {
                    some: {
                        regiao: {
                            removido_em: null,
                            nivel: filter.nivel ? { in: filter.nivel } : undefined,
                            id: filter.regiao_ids ? { in: filter.regiao_ids } : undefined,
                        },
                    },
                },
            },
            select: { id: true },
        });
        const geoCamadaIds = geoCamada.map((r) => r.id);

        const geoJson: { geojson: GeoJsonObject }[] = await this.prisma.$queryRaw`WITH geo_data AS (
            SELECT
                a.id,
                a.pdm_codigo_sufixo,
                c.geom_geojson
            FROM regiao a
                JOIN geo_camada_regiao b ON b.regiao_id = a.id
                JOIN geo_camada c ON c.id = b.geo_camada_id
            WHERE a.removido_em IS NULL
            AND c.id = ANY(${geoCamadaIds})
        )
        SELECT jsonb_build_object(
            'type', 'FeatureCollection',
            'features', jsonb_agg(
                jsonb_build_object(
                    'type', 'Feature',
                    'geometry', g.geom_geojson->'geometry',
                    'properties', g.geom_geojson->'properties' || jsonb_build_object(
                        'regiao_id', g.id,
                        'pdm_codigo_sufixo', coalesce(g.pdm_codigo_sufixo, '')
                    )
                )
            )
        ) AS geojson FROM geo_data g
        `;

        return geoJson[0].geojson;
    }
}
