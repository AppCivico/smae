import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarPdmAntigo,
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    prisma,
    Sessao,
    uniq,
} from '../lib';

type Entidade = { id: number; localizacoes: { distancia_metros?: number; endereco_exibicao: string }[] };

describe('geo-busca', () => {
    let consulta: Sessao;
    let semPrivilegio: Sessao;

    before(async () => {
        await bootApp();
        // Menu.cc_consulta_geral é virtual: a sessão ganha o privilégio quando a pessoa tem CadastroTransferencia.administrador
        consulta = await criarPessoaComPrivilegios(['CadastroTransferencia.administrador']);
        semPrivilegio = await criarPessoaSemPrivilegios();
    });

    const buscar = (corpo: Record<string, unknown>) => api(consulta).post('/api/busca-proximidades').send(corpo);

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await api().post('/api/busca-proximidades').send({ lat: -23.5, lon: -46.6 }), 401);
        });

        it('403 sem Menu.cc_consulta_geral, mesmo com CadastroTransferencia.editar', async () => {
            const res = await api(semPrivilegio).post('/api/busca-proximidades').send({ lat: -23.5, lon: -46.6 });
            assertStatus(res, 403);
            assert.match(res.body.message, /Menu\.cc_consulta_geral/);

            const editor = await criarPessoaComPrivilegios(['CadastroTransferencia.editar']);
            assertStatus(await api(editor).post('/api/busca-proximidades').send({ lat: -23.5, lon: -46.6 }), 403);
        });
    });

    describe('validação', () => {
        it('400 sem modo de busca, com mais de um modo ou com camada sem código', async () => {
            const nenhum = await buscar({});
            assertStatus(nenhum, 400);
            assert.match(nenhum.body.message, /Forneça um dos seguintes modos/);

            const dois = await buscar({ lat: -23.5, lon: -46.6, regiao_id: 1 });
            assertStatus(dois, 400);
            assert.match(dois.body.message, /apenas um modo/);

            assertStatus(await buscar({ geo_camada_config_id: 1 }), 400);
        });

        it('400 com coordenada fora do intervalo, raio fora dos limites ou lat não numérica', async () => {
            assertStatus(await buscar({ lat: 91, lon: 0 }), 400);
            assertStatus(await buscar({ lat: 0, lon: -181 }), 400);
            assertStatus(await buscar({ lat: 0, lon: 0, raio: 10001 }), 400);
            assertStatus(await buscar({ lat: 0, lon: 0, raio: 99 }), 400);
            assertStatus(await buscar({ lat: 0, lon: 0, raio_km: 11 }), 400);
            assertStatus(await buscar({ lat: 'x', lon: 0 }), 400);
        });
    });

    describe('busca', () => {
        it('404 para região sem geolocalização e para camada inexistente', async () => {
            const regiao = await buscar({ regiao_id: 999999 });
            assertStatus(regiao, 404);
            assert.match(regiao.body.message, /Nenhuma geolocalização encontrada/);

            const camada = await buscar({ geo_camada_config_id: 999999, geo_camada_codigo: 'XX' });
            assertStatus(camada, 404);
            assert.match(camada.body.message, /não encontrado/);
        });

        it('devolve listas vazias quando nada está no raio', async () => {
            const res = await buscar({ lat: 80.1, lon: 10.1, raio: 100 });
            assertStatus(res, 201);
            assert.deepEqual(res.body.metas, []);
            assert.deepEqual(res.body.projetos, []);
            assert.deepEqual(res.body.metas_info, []);
        });

        it('acha a meta georreferenciada por ponto e raio, com a distância', async () => {
            const pdm = await criarPdmAntigo();
            const meta = await prisma().meta.create({
                data: { pdm_id: pdm.id, status: 'Ativo', codigo: uniq('M'), titulo: uniq('Meta geo') },
            });
            const lat = -23.55;
            const lon = -46.63;
            const geo = await prisma().geoLocalizacao.create({
                data: {
                    tipo: 'Endereco',
                    endereco_exibicao: uniq('Rua Teste'),
                    geom_geojson: { type: 'Feature', geometry: { type: 'Point', coordinates: [lon, lat] } },
                    metadata: {},
                    lat,
                    lon,
                },
            });
            await prisma().geoLocalizacaoReferencia.create({
                data: { geo_localizacao_id: geo.id, tipo: 'Endereco', meta_id: meta.id },
            });

            const perto = await buscar({ lat: lat + 0.001, lon, raio: 500 });
            assertStatus(perto, 201);
            const achada = perto.body.metas.find((m: Entidade) => m.id === meta.id);
            assert.ok(achada, 'meta georreferenciada não veio na busca');
            assert.equal(achada.localizacoes[0].endereco_exibicao, geo.endereco_exibicao);
            assert.ok(achada.distancia_metros > 50 && achada.distancia_metros < 200, `${achada.distancia_metros}`);

            const info = perto.body.metas_info.find((m: { id: number }) => m.id === meta.id);
            assert.equal(info.codigo, meta.codigo);
            assert.equal(info.pdm_id, pdm.id);
            assert.ok(perto.body.pdm_info.some((p: { id: number }) => p.id === pdm.id));

            const longe = await buscar({ lat: lat + 0.5, lon, raio: 500 });
            assertStatus(longe, 201);
            assert.equal(
                longe.body.metas.some((m: Entidade) => m.id === meta.id),
                false
            );
        });

        it('ignora referência removida e meta inativa', async () => {
            const pdm = await criarPdmAntigo();
            const lat = -22.9;
            const lon = -43.2;
            const geo = await prisma().geoLocalizacao.create({
                data: {
                    tipo: 'Endereco',
                    endereco_exibicao: uniq('Rua Removida'),
                    geom_geojson: { type: 'Feature', geometry: { type: 'Point', coordinates: [lon, lat] } },
                    metadata: {},
                    lat,
                    lon,
                },
            });
            const metaInativa = await prisma().meta.create({
                data: { pdm_id: pdm.id, status: 'Ativo', codigo: uniq('MI'), titulo: uniq('Inativa'), ativo: false },
            });
            const metaRemovida = await prisma().meta.create({
                data: { pdm_id: pdm.id, status: 'Ativo', codigo: uniq('MR'), titulo: uniq('Removida') },
            });
            await prisma().geoLocalizacaoReferencia.createMany({
                data: [
                    { geo_localizacao_id: geo.id, tipo: 'Endereco', meta_id: metaInativa.id },
                    { geo_localizacao_id: geo.id, tipo: 'Endereco', meta_id: metaRemovida.id, removido_em: new Date() },
                ],
            });

            const res = await buscar({ lat, lon, raio_km: 1 });
            assertStatus(res, 201);
            const ids = res.body.metas.map((m: Entidade) => m.id);
            assert.equal(ids.includes(metaInativa.id), false);
            assert.equal(ids.includes(metaRemovida.id), false);
        });
    });
});
