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
} from '../lib';

describe('feature-flag', () => {
    let superadmin: Sessao;
    let semSuperadmin: Sessao;

    before(async () => {
        await bootApp();
        superadmin = await loginAsSuperAdmin();
        semSuperadmin = await criarPessoaSemPrivilegios();
    });

    it('401 sem token', async () => {
        assertStatus(
            await api().patch('/api/feature-flag').send({ pp_pe: true, ps_cp_readonly_pdm_config: true }),
            401
        );
    });

    it('403 sem SMAE.superadmin', async () => {
        const res = await api(semSuperadmin)
            .patch('/api/feature-flag')
            .send({ pp_pe: true, ps_cp_readonly_pdm_config: true });
        assertStatus(res, 403);
    });

    it('400 com flag ausente ou não booleana', async () => {
        assertStatus(await api(superadmin).patch('/api/feature-flag').send({ pp_pe: true }), 400);
        assertStatus(
            await api(superadmin).patch('/api/feature-flag').send({ pp_pe: 'sim', ps_cp_readonly_pdm_config: false }),
            400
        );
    });

    it('grava as flags na linha única e sobrescreve na segunda chamada', async () => {
        assertStatus(
            await api(superadmin).patch('/api/feature-flag').send({ pp_pe: true, ps_cp_readonly_pdm_config: true }),
            200
        );
        let linha = await prisma().feature_flag.findUniqueOrThrow({ where: { id: 1 } });
        assert.equal(linha.pp_pe, true);
        assert.equal(linha.ps_cp_readonly_pdm_config, true);

        assertStatus(
            await api(superadmin).patch('/api/feature-flag').send({ pp_pe: false, ps_cp_readonly_pdm_config: false }),
            200
        );
        linha = await prisma().feature_flag.findUniqueOrThrow({ where: { id: 1 } });
        assert.equal(linha.pp_pe, false);
        assert.equal(linha.ps_cp_readonly_pdm_config, false);
    });
});
