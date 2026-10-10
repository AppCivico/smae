import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarPessoaSemPrivilegios,
    loginAsSuperAdmin,
    prisma,
    Sessao,
    uniq,
} from '../lib';

const SEGREDO = uniq('segredo-geojson');
process.env.GEOJSON_SECRET = SEGREDO;

const feicao = (coordenadas: number[][]) => ({
    type: 'Feature',
    properties: { nome: 'area' },
    geometry: { type: 'Polygon', coordinates: [coordenadas] },
});

const QUADRADO = [
    [0, 0],
    [2, 0],
    [2, 2],
    [0, 2],
    [0, 0],
];

const enderecoGeoJson = (extra: Record<string, unknown> = {}) => ({
    type: 'Feature',
    properties: { string_endereco: uniq('Av. Paulista, 1000'), ...extra },
    geometry: { type: 'Point', coordinates: [-46.65, -23.56] },
});

describe('geo-loc', () => {
    let admin: Sessao;
    let usuario: Sessao;

    before(async () => {
        await bootApp();
        admin = await loginAsSuperAdmin();
        usuario = await criarPessoaSemPrivilegios();
    });

    async function criarCamada(
        opts: { regiaoId?: number; nivel?: number; simplificarEm?: number; geom?: object; codigo?: string } = {}
    ) {
        const nivel = opts.nivel ?? 2;
        const geom = opts.geom ?? feicao(QUADRADO);
        const config = await prisma().geoCamadaConfig.create({
            data: {
                tipo_camada: uniq('tipo'),
                chave_camada: 'chave',
                titulo_camada: 'titulo',
                descricao: uniq('Descrição'),
                nivel_regionalizacao: nivel,
                cor: '#112233',
                simplificar_em: opts.simplificarEm,
            },
        });
        const camada = await prisma().geoCamada.create({
            data: {
                tipo_camada: config.tipo_camada,
                codigo: opts.codigo ?? uniq('COD'),
                titulo: uniq('Camada'),
                nivel_regionalizacao: nivel,
                geo_camada_config: config.id,
                geom_geojson_original: geom,
                geom_geojson: geom,
                GeoCamadaRegiao: opts.regiaoId ? { create: { regiao_id: opts.regiaoId } } : undefined,
            },
        });
        return { config, camada };
    }

    const criarRegiao = (nivel: number, extra: { parente_id?: number; codigo?: string } = {}) =>
        prisma().regiao.create({ data: { descricao: uniq('Região'), nivel, ...extra } });

    describe('autenticação e privilégios', () => {
        it('401 sem token em todas as rotas autenticadas', async () => {
            assertStatus(await api().post('/api/geolocalizar').send({ busca_endereco: 'x', tipo: 'Endereco' }), 401);
            assertStatus(
                await api().post('/api/geolocalizar-reverso').send({ lat: 1, long: 1, tipo: 'Endereco' }),
                401
            );
            assertStatus(await api().get('/api/camada'), 401);
            assertStatus(await api().post('/api/geolocalizacao').send({ tipo: 'Endereco', endereco: {} }), 401);
            assertStatus(await api().patch('/api/camada/simplificar'), 401);
            assertStatus(await api().patch('/api/camada/sync-regioes'), 401);
        });

        it('403 sem SMAE.superadmin nas rotas PATCH de camada', async () => {
            const simplificar = await api(usuario).patch('/api/camada/simplificar');
            assertStatus(simplificar, 403);
            assert.match(simplificar.body.message, /SMAE\.superadmin/);
            assertStatus(await api(usuario).patch('/api/camada/sync-regioes'), 403);
        });
    });

    // geolocalizar e geolocalizar-reverso chamam a API externa de geo (morta nos testes): sem caminho feliz
    describe('geolocalizar e geolocalizar-reverso (validação)', () => {
        it('400 sem busca_endereco ou com tipo inválido', async () => {
            assertStatus(await api(usuario).post('/api/geolocalizar').send({ tipo: 'Endereco' }), 400);
            assertStatus(
                await api(usuario).post('/api/geolocalizar').send({ busca_endereco: 'Rua A', tipo: 'X' }),
                400
            );
        });

        it('400 com lat/long não numéricos ou tipo inválido', async () => {
            const cliente = api(usuario);
            assertStatus(
                await cliente.post('/api/geolocalizar-reverso').send({ lat: 'x', long: 1, tipo: 'Endereco' }),
                400
            );
            assertStatus(await cliente.post('/api/geolocalizar-reverso').send({ lat: 1, tipo: 'Endereco' }), 400);
            assertStatus(await cliente.post('/api/geolocalizar-reverso').send({ lat: 1, long: 1, tipo: 'X' }), 400);
        });
    });

    describe('GET camada', () => {
        it('400 com filtros numéricos inválidos', async () => {
            assertStatus(await api(usuario).get('/api/camada?camada_nivel_regionalizacao=abc'), 400);
            assertStatus(await api(usuario).get('/api/camada?camada_nivel_regionalizacao=-1'), 400);
            assertStatus(await api(usuario).get('/api/camada?camada_ids=abc'), 400);
        });

        it('filtra por ids e nível e devolve as regiões ligadas à camada', async () => {
            const pai = await criarRegiao(1);
            const regiao = await criarRegiao(2, { parente_id: pai.id });
            const { camada, config } = await criarCamada({ regiaoId: regiao.id, nivel: 2 });
            const outra = await criarCamada({ nivel: 3 });

            const lista = await api(usuario).get(`/api/camada?camada_ids=${camada.id},${outra.camada.id}`);
            assertStatus(lista, 200);
            const linha = lista.body.linhas.find((l: { id: number }) => l.id === camada.id);
            assert.equal(linha.codigo, camada.codigo);
            assert.equal(linha.titulo, camada.titulo);
            assert.equal(linha.descricao, config.descricao);
            assert.equal(linha.cor, '#112233');
            assert.equal(linha.nivel_regionalizacao, 2);
            assert.equal(linha.geom_geojson.type, 'Feature');
            assert.equal(linha.regiao, undefined);
            assert.ok(lista.body.linhas.some((l: { id: number }) => l.id === outra.camada.id));

            const nivel2 = await api(usuario).get(
                `/api/camada?camada_ids=${camada.id},${outra.camada.id}&camada_nivel_regionalizacao=2&retornar_regioes=true`
            );
            assertStatus(nivel2, 200);
            assert.deepEqual(
                nivel2.body.linhas.map((l: { id: number }) => l.id),
                [camada.id]
            );
            assert.deepEqual(nivel2.body.linhas[0].regiao, [
                { id: regiao.id, descricao: regiao.descricao, nivel_regionalizacao: 2 },
            ]);
        });

        it('filha_de_regiao_id só traz camadas ligadas a regiões descendentes', async () => {
            const pai = await criarRegiao(1);
            const filha = await criarRegiao(2, { parente_id: pai.id });
            const solta = await criarRegiao(2);
            const { camada } = await criarCamada({ regiaoId: filha.id });
            const { camada: camadaSolta } = await criarCamada({ regiaoId: solta.id });
            const ids = `${camada.id},${camadaSolta.id}`;

            const res = await api(usuario).get(`/api/camada?camada_ids=${ids}&filha_de_regiao_id=${pai.id}`);
            assertStatus(res, 200);
            assert.deepEqual(
                res.body.linhas.map((l: { id: number }) => l.id),
                [camada.id]
            );
        });
    });

    describe('POST geolocalizacao', () => {
        it('400 com tipo inválido, GeoJSON inválido ou endereço fora das regras', async () => {
            const cliente = api(usuario);
            assertStatus(
                await cliente.post('/api/geolocalizacao').send({ tipo: 'X', endereco: enderecoGeoJson() }),
                400
            );
            assertStatus(
                await cliente.post('/api/geolocalizacao').send({ tipo: 'Endereco', endereco: { type: 'Foo' } }),
                400
            );

            const colecao = { type: 'FeatureCollection', features: [enderecoGeoJson()] };
            const naoFeature = await cliente.post('/api/geolocalizacao').send({ tipo: 'Endereco', endereco: colecao });
            assertStatus(naoFeature, 400);
            assert.match(naoFeature.body.message, /do tipo Feature/);

            const poligono = await cliente
                .post('/api/geolocalizacao')
                .send({ tipo: 'Endereco', endereco: { ...feicao(QUADRADO), properties: { string_endereco: 'x' } } });
            assertStatus(poligono, 400);
            assert.match(poligono.body.message, /Ponto/);

            const semEndereco = await cliente
                .post('/api/geolocalizacao')
                .send({ tipo: 'Endereco', endereco: { ...enderecoGeoJson(), properties: {} } });
            assertStatus(semEndereco, 400);
            assert.match(semEndereco.body.message, /string_endereco/);
        });

        it('cria a geolocalização, devolve token e herda as regiões da camada', async () => {
            const pai = await criarRegiao(1);
            const regiao = await criarRegiao(2, { parente_id: pai.id });
            const { camada } = await criarCamada({ regiaoId: regiao.id });
            const endereco = enderecoGeoJson();

            const res = await api(usuario)
                .post('/api/geolocalizacao')
                .send({ tipo: 'Endereco', endereco, camadas: [camada.id] });
            assertStatus(res, 201);
            assert.equal(res.body.endereco_exibicao, endereco.properties.string_endereco);
            assert.equal(res.body.tipo, 'Endereco');
            assert.equal(typeof res.body.token, 'string');
            assert.deepEqual(
                res.body.camadas.map((c: { id: number }) => c.id),
                [camada.id]
            );
            assert.deepEqual(
                res.body.regioes.nivel_2.map((r: { id: number }) => r.id),
                [regiao.id]
            );
            assert.deepEqual(
                res.body.regioes.nivel_1.map((r: { id: number }) => r.id),
                [pai.id]
            );

            const linha = await prisma().geoLocalizacao.findFirstOrThrow({
                where: { endereco_exibicao: endereco.properties.string_endereco },
            });
            assert.equal(linha.lon, -46.65);
            assert.equal(linha.lat, -23.56);
            assert.deepEqual(linha.metadata, { criado_por: usuario.pessoa.id });
        });

        it('cria sem camadas', async () => {
            const res = await api(usuario)
                .post('/api/geolocalizacao')
                .send({ tipo: 'Endereco', endereco: enderecoGeoJson() });
            assertStatus(res, 201);
            assert.deepEqual(res.body.camadas, []);
            assert.deepEqual(res.body.regioes.nivel_1, []);
        });

        it('400 com camada inexistente', async () => {
            const res = await api(usuario)
                .post('/api/geolocalizacao')
                .send({ tipo: 'Endereco', endereco: enderecoGeoJson(), camadas: [999999999] });
            assertStatus(res, 400);
        });
    });

    describe('GET geojson-collection (público, exige secret)', () => {
        it('403 sem secret ou com secret errado, sem precisar de token', async () => {
            const semSecret = await api().get('/api/geojson-collection?tipo_camada=x');
            assertStatus(semSecret, 403);
            assert.match(semSecret.body.message, /Invalid Secret/);

            const errado = await api().get('/api/geojson-collection?tipo_camada=x&secret=errado');
            assertStatus(errado, 403);
            assert.match(errado.body.message, /Invalid Secret/);
        });

        it('400 sem tipo_camada mesmo com o secret certo', async () => {
            assertStatus(await api().get(`/api/geojson-collection?secret=${encodeURIComponent(SEGREDO)}`), 400);
        });

        it('com o secret certo devolve a FeatureCollection das regiões da camada', async () => {
            const regiao = await criarRegiao(2);
            const { config } = await criarCamada({ regiaoId: regiao.id });

            const res = await api().get(
                `/api/geojson-collection?tipo_camada=${encodeURIComponent(config.tipo_camada)}&secret=${encodeURIComponent(SEGREDO)}`
            );
            assertStatus(res, 200);
            assert.equal(res.body.type, 'FeatureCollection');
            assert.equal(res.body.features.length, 1);
            assert.equal(res.body.features[0].properties.regiao_id, regiao.id);
            assert.equal(res.body.features[0].properties.nome, 'area');
            assert.equal(res.body.features[0].geometry.type, 'Polygon');
        });
    });

    describe('PATCH camada (superadmin)', () => {
        it('simplificar reduz a geometria só das camadas com simplificar_em', async () => {
            const comPontoExtra = [
                [0, 0],
                [1, 0.0001],
                [2, 0],
                [2, 2],
                [0, 2],
                [0, 0],
            ];
            const geom = feicao(comPontoExtra);
            const { camada } = await criarCamada({ simplificarEm: 0.01, geom });
            const { camada: semConfig } = await criarCamada({ geom });

            const res = await api(admin).patch('/api/camada/simplificar');
            assertStatus(res, 200);
            assert.equal(res.text, 'OK');

            const depois = await prisma().geoCamada.findUniqueOrThrow({ where: { id: camada.id } });
            const coords = (depois.geom_geojson as any).geometry.coordinates[0];
            assert.ok(coords.length < comPontoExtra.length, `esperava menos de ${comPontoExtra.length} pontos`);
            assert.deepEqual((depois.geom_geojson_original as any).geometry.coordinates[0], comPontoExtra);

            const intacta = await prisma().geoCamada.findUniqueOrThrow({ where: { id: semConfig.id } });
            assert.deepEqual((intacta.geom_geojson as any).geometry.coordinates[0], comPontoExtra);
        });

        it('sync-regioes liga a camada à região de mesmo nível e código, sem duplicar', async () => {
            const codigo = uniq('SYNC');
            const regiao = await criarRegiao(3, { codigo });
            const { camada } = await criarCamada({ nivel: 3, codigo });

            const primeira = await api(admin).patch('/api/camada/sync-regioes');
            assertStatus(primeira, 200);
            assert.ok(primeira.body.created >= 1);
            assert.ok(primeira.body.checked >= 1);
            const ligacoes = await prisma().geoCamadaRegiao.findMany({ where: { geo_camada_id: camada.id } });
            assert.deepEqual(
                ligacoes.map((l) => l.regiao_id),
                [regiao.id]
            );

            const segunda = await api(admin).patch('/api/camada/sync-regioes');
            assertStatus(segunda, 200);
            assert.equal(segunda.body.created, 0);
            assert.equal(await prisma().geoCamadaRegiao.count({ where: { geo_camada_id: camada.id } }), 1);
        });
    });
});
