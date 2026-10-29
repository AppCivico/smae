import { randomBytes } from 'crypto';
import { before, describe, it } from 'node:test';
import { assert, bootApp, loginAsSuperAdmin, prisma } from '../lib';
import { criarParlamentar, criarPartido } from './_helpers';

const palavra = (prefixo = 'zq') =>
    prefixo + [...randomBytes(6)].map((b) => String.fromCharCode(97 + (b % 26))).join('');

describe('triggers de tsvector (parlamentar e demanda por e-mail)', () => {
    before(async () => {
        await bootApp();
    });

    const vetor = async (tabela: 'parlamentar' | 'demanda_email_parlamentar', id: number) => {
        const r = await prisma().$queryRawUnsafe<{ v: string | null }[]>(`select vetores_busca::text v from ${tabela} where id = $1`, id);
        return r[0].v ?? '';
    };

    const acha = async (tabela: string, termo: string, id: number) => {
        const r = await prisma().$queryRawUnsafe<{ id: number }[]>(
            `select id from ${tabela} where vetores_busca @@ to_tsquery('simple_unaccent', $1)`,
            `${termo}:*`
        );
        return r.some((x) => x.id === id);
    };

    describe('parlamentar', () => {
        it('indexa nome e nome popular na criação e reindexa na edição, sem acento nem caixa', async () => {
            const nome = palavra('Joã');
            const popular = palavra();
            const p = await prisma().parlamentar.create({ data: { nome, nome_popular: popular, em_atividade: true } });
            assert.ok(await acha('parlamentar', popular, p.id));
            assert.ok(await acha('parlamentar', nome.toUpperCase().replace('Ã', 'A'), p.id));

            const novoPopular = palavra();
            await prisma().parlamentar.update({ where: { id: p.id }, data: { nome_popular: novoPopular } });
            assert.ok(await acha('parlamentar', novoPopular, p.id));
            assert.equal(await acha('parlamentar', popular, p.id), false);
        });

        it('cargo mais recente entra no vetor, com "Deputado Estadual" por extenso', async () => {
            const p = await criarParlamentar();
            await prisma().parlamentar.update({ where: { id: p.id }, data: { cargo_mais_recente: 'DeputadoEstadual' } });
            assert.ok(await acha('parlamentar', 'deputado', p.id));
            assert.ok(await acha('parlamentar', 'estadual', p.id));
        });

        it('mandato (partido da candidatura) entra no vetor e partido renomeado reindexa o parlamentar', async () => {
            const p = await criarParlamentar();
            const partido = await criarPartido();
            const eleicao = await prisma().eleicao.create({
                data: { tipo: 'Municipal', ano: 1900 + Math.floor(Math.random() * 80), atual_para_mandatos: false },
            });
            const mandato = await prisma().parlamentarMandato.create({
                data: {
                    parlamentar_id: p.id,
                    eleicao_id: eleicao.id,
                    partido_candidatura_id: partido.id,
                    partido_atual_id: partido.id,
                    eleito: true,
                    cargo: 'Vereador',
                    uf: 'SP',
                },
            });
            assert.ok(await acha('parlamentar', partido.sigla.toLowerCase(), p.id), 'vetor refeito ao inserir mandato');

            const nome = palavra('pn');
            await prisma().partido.update({ where: { id: partido.id }, data: { nome } });
            assert.ok(await acha('parlamentar', nome, p.id), 'renomear partido invalida e refaz o vetor');

            await prisma().parlamentarMandato.update({ where: { id: mandato.id }, data: { removido_em: new Date() } });
            assert.equal(await acha('parlamentar', nome, p.id), false, 'mandato removido sai do vetor');
        });
    });

    describe('demanda_email_parlamentar', () => {
        it('indexa assunto, corpo e nomes dos parlamentares, e reindexa ao editar', async () => {
            const admin = await loginAsSuperAdmin();
            const assunto = palavra();
            const corpo = palavra();
            const nomes = palavra();
            const lote = await prisma().demandaEmailParlamentar.create({
                data: { assunto, corpo, nomes_parlamentares: nomes, criado_por: admin.pessoa.id },
            });
            for (const termo of [assunto, corpo, nomes]) assert.ok(await acha('demanda_email_parlamentar', termo, lote.id), termo);
            assert.match(await vetor('demanda_email_parlamentar', lote.id), new RegExp(assunto));

            const novoAssunto = palavra();
            await prisma().demandaEmailParlamentar.update({ where: { id: lote.id }, data: { assunto: novoAssunto } });
            assert.ok(await acha('demanda_email_parlamentar', novoAssunto, lote.id));
            assert.equal(await acha('demanda_email_parlamentar', assunto, lote.id), false);
        });
    });
});
