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

describe('busca-global', () => {
    let consulta: Sessao;
    let semPrivilegio: Sessao;
    let editorDeTransferencia: Sessao;

    before(async () => {
        await bootApp();
        // Menu.cc_consulta_geral é derivado: só vem junto com CadastroTransferencia.administrador
        consulta = await criarPessoaComPrivilegios(['CadastroTransferencia.administrador']);
        editorDeTransferencia = await criarPessoaComPrivilegios(['CadastroTransferencia.editar']);
        semPrivilegio = await criarPessoaSemPrivilegios();
    });

    it('401 sem token e 403 sem Menu.cc_consulta_geral', async () => {
        assertStatus(await api().post('/api/busca-global/proximidades-table').send({ lat: -23.5, lon: -46.6 }), 401);

        const res = await api(semPrivilegio)
            .post('/api/busca-global/proximidades-table')
            .send({ lat: -23.5, lon: -46.6 });
        assertStatus(res, 403);
        assert.match(res.body.message, /Menu\.cc_consulta_geral/);

        assertStatus(
            await api(editorDeTransferencia)
                .post('/api/busca-global/proximidades-table')
                .send({ lat: -23.5, lon: -46.6 }),
            403
        );
    });

    it('400 sem modo de busca, com dois modos ao mesmo tempo, ou com limites fora do permitido', async () => {
        const semModo = await api(consulta).post('/api/busca-global/proximidades-table').send({});
        assertStatus(semModo, 400);
        assert.match(semModo.body.message, /Forneça um dos seguintes modos/);

        assertStatus(
            await api(consulta)
                .post('/api/busca-global/proximidades-table')
                .send({ lat: -23.5, lon: -46.6, regiao_id: 1 }),
            400
        );
        assertStatus(
            await api(consulta).post('/api/busca-global/proximidades-table').send({ lat: 95, lon: -46.6 }),
            400
        );
        assertStatus(
            await api(consulta)
                .post('/api/busca-global/proximidades-table')
                .send({ lat: -23.5, lon: -46.6, raio_km: 0.05 }),
            400
        );
        assertStatus(
            await api(consulta)
                .post('/api/busca-global/proximidades-table')
                .send({ lat: -23.5, lon: -46.6, raio: 20000 }),
            400
        );
    });

    it('201 por ponto com a tabela unificada: cabeçalhos e linhas', async () => {
        const lat = -23.5505;
        const lon = -46.6333;
        const pdm = await criarPdmAntigo();
        const meta = await prisma().meta.create({
            data: { pdm_id: pdm.id, status: 'Ativo', codigo: uniq('M'), titulo: uniq('Meta geo') },
        });
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

        const res = await api(consulta)
            .post('/api/busca-global/proximidades-table')
            .send({ lat: lat + 0.001, lon, raio: 500 });
        assertStatus(res, 201);
        assert.equal(res.body.headers.mainColumn, 'Endereço');
        assert.equal(res.body.headers.col3, 'Órgão');
        assert.ok(res.body.rows.length > 0);
        const daMeta = res.body.rows.find((l: { row_id: string }) => l.row_id === `meta-${meta.id}`);
        assert.ok(daMeta, 'meta georreferenciada não veio na tabela');
        assert.equal(daMeta.col2, meta.titulo);
        for (const linha of res.body.rows) {
            assert.ok(linha.row_id);
            assert.ok(Array.isArray(linha.dynamic_metadados));
        }
    });
});
