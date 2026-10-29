import { randomBytes } from 'crypto';
import { before, describe, it } from 'node:test';
import {
    assert,
    assertStatus,
    bootApp,
    criarOrgao,
    criarPessoaComPrivilegios,
    loginAsSuperAdmin,
    prisma,
    Sessao,
    uniq,
} from '../../lib';
import {
    cancelarDistribuicao,
    casaCivil,
    completarTransferencia,
    criarDistribuicao,
    criarParlamentar,
    criarPartido,
    criarTipoTransferencia,
    criarTransferencia,
    esperar,
    vincularParlamentar,
} from '../_helpers';

// só letras: o tsquery do endpoint escapa pontuação e números/hífens mudam a tokenização
const palavra = (prefixo = 'zq') =>
    prefixo + [...randomBytes(6)].map((b) => String.fromCharCode(97 + (b % 26))).join('');

describe('transferencia: busca por palavra-chave (tsvector)', () => {
    let gestor: Sessao;

    before(async () => {
        await bootApp();
        gestor = await criarPessoaComPrivilegios([
            'CadastroTransferencia.inserir',
            'CadastroTransferencia.listar',
            'CadastroTransferencia.editar',
            'CadastroTransferencia.remover',
            'CadastroDistribuicaoStatus.inserir',
        ]);
    });

    const buscar = async (termo: string): Promise<number[]> => {
        const res = await casaCivil(gestor).get(
            `/api/transferencia?ipp=500&palavra_chave=${encodeURIComponent(termo)}`
        );
        assertStatus(res, 200);
        return res.body.linhas.map((l: { id: number }) => l.id);
    };

    const acha = (termo: string, id: number) => esperar(async () => (await buscar(termo)).includes(id));
    const naoAcha = async (termo: string, id: number) =>
        assert.equal((await buscar(termo)).includes(id), false, `"${termo}" não deveria achar ${id}`);
    const naoAchaMais = (termo: string, id: number) => esperar(async () => !(await buscar(termo)).includes(id));

    const criarComTexto = async (corpo: Record<string, unknown>) => {
        const tipo = await criarTipoTransferencia();
        const res = await casaCivil(gestor)
            .post('/api/transferencia')
            .send({
                tipo_id: tipo.id,
                orgao_concedente_id: 1,
                esfera: 'Estadual',
                objeto: uniq('objeto'),
                ano: 2026,
                ...corpo,
            });
        assertStatus(res, 201);
        return { id: res.body.id as number, tipo };
    };

    const editar = async (id: number, corpo: Record<string, unknown>) => {
        const t = await prisma().transferencia.findUniqueOrThrow({ where: { id } });
        assertStatus(
            await casaCivil(gestor)
                .patch(`/api/transferencia/${id}`)
                .send({ tipo_id: t.tipo_id, esfera: t.esfera, ...corpo }),
            200
        );
    };

    const vetor = async (id: number) => {
        const r = await prisma().$queryRaw<
            { v: string }[]
        >`select vetores_busca::text v from transferencia where id = ${id}::int`;
        return r[0].v;
    };

    describe('colunas da própria transferência', () => {
        it('indexa na criação e reflete edição: palavra nova acha, palavra velha deixa de achar', async () => {
            const velha = palavra();
            const nova = palavra();
            const { id } = await criarComTexto({ objeto: `Reforma ${velha}` });
            await acha(velha, id);
            await acha(velha.slice(0, 6), id);

            await editar(id, { objeto: `Reforma ${nova}` });
            await acha(nova, id);
            await naoAchaMais(velha, id);
        });

        it('cada coluna textual indexada é encontrável', async () => {
            const campos = ['observacoes', 'demanda', 'emenda', 'programa', 'nome_programa', 'plano_de_acao'] as const;
            const tokens = Object.fromEntries(campos.map((c) => [c, palavra()]));
            const { id } = await criarComTexto(tokens);
            for (const c of campos) await acha(tokens[c], id);
            for (const c of campos) assert.ok((await buscar(tokens[c])).includes(id), c);
        });

        it('ignora acento e caixa, e termos múltiplos funcionam como E', async () => {
            const a = palavra('açaí');
            const b = palavra();
            const { id } = await criarComTexto({ objeto: `Construção ${a} ${b}` });
            await acha('CONSTRUCAO', id);
            await acha(`construcao ${b.toUpperCase()}`, id);
            await naoAcha(`construcao ${palavra()}`, id);
        });

        it('busca por identificador "numero/ano" acha pela coluna identificador', async () => {
            const { id } = await criarComTexto({ ano: 2037 });
            const { identificador } = await prisma().transferencia.findUniqueOrThrow({ where: { id } });
            assert.ok((await buscar(identificador)).includes(id));
        });

        it('transferência removida some da busca', async () => {
            const token = palavra();
            const { id } = await criarComTexto({ objeto: token });
            await acha(token, id);
            assertStatus(await casaCivil(gestor).delete(`/api/transferencia/${id}`), 202);
            await naoAcha(token, id);
        });

        it('rebuild-vetores-busca restaura vetores zerados', async () => {
            const token = palavra();
            const { id } = await criarComTexto({ objeto: token });
            await acha(token, id);

            await prisma().$executeRaw`update transferencia set vetores_busca = null where id = ${id}::int`;
            await naoAcha(token, id);

            assertStatus(
                await casaCivil(await loginAsSuperAdmin()).post('/api/transferencia/rebuild-vetores-busca'),
                202
            );
            await acha(token, id);
            assert.match(await vetor(id), new RegExp(token));
        });

        it('f_rebuild_transferencia_tsvector inclui esfera, ano e tipo', async () => {
            const { id, tipo } = await criarComTexto({ ano: 2038 });
            // o vetor é montado em background depois do POST
            await esperar(async () => (await vetor(id)) !== null);
            const v = await vetor(id);
            assert.match(v, /'estadual'/);
            assert.match(v, /'2038'/);
            assert.ok(v.includes(`'${tipo.nome.split(' ')[0]}'`), v);
        });
    });

    describe('números ignoram pontuação e zeros à esquerda', () => {
        // dígitos aleatórios (1º sempre != 0) para não depender do resto da base
        const digitos = (n: number) =>
            [...randomBytes(n)].map((b, i) => String(i === 0 ? 1 + (b % 9) : b % 10)).join('');

        it('emenda, demanda e observações casam por parte, junto ou outra pontuação', async () => {
            const meio = digitos(4); // emenda 2026.0<meio>.<fim>
            const fim = digitos(5);
            const dem = digitos(5); // demanda 0<dem>/2026
            const a = digitos(3); // observações 00<a>.<b>/7
            const b = digitos(4);
            const { id } = await criarComTexto({
                emenda: `2026.0${meio}.${fim}`,
                demanda: `0${dem}/2026`,
                observacoes: `processo 00${a}.${b}/7 em andamento`,
            });

            // emenda: parte com zero à esquerda, última parte, prefixo do junto, ponto no lugar errado
            await acha(`0${meio}`, id);
            await acha(meio, id);
            await acha(fim, id);
            await acha(`20260${meio}`, id);
            const junto = `20260${meio}${fim}`;
            await acha(`${junto.slice(0, 7)}.${junto.slice(7)}`, id);
            await acha(`2026.0${meio}.${fim}`, id);

            // demanda
            await acha(dem, id);
            await acha(`0${dem}`, id);
            await acha(`${dem}/2026`, id);
            await acha(`0${dem}2026`, id);

            // número nas observações, em outra formatação
            await acha(`${a}${b}`, id);
            await acha(`${a}.${b}-7`, id);

            await naoAcha(`9${digitos(11)}`, id);
            await naoAcha(`${dem}/1999`, id);
        });

        it('busca também pelo final do número, a partir de 3 dígitos', async () => {
            const meio = digitos(4);
            const fim = digitos(6);
            const dem = digitos(6);
            const { id } = await criarComTexto({
                emenda: `2026.0${meio}.${fim}`,
                demanda: `0${dem}/2026`,
            });

            // final de uma parte (3 e 4 dígitos)
            await acha(fim.slice(-3), id);
            await acha(fim.slice(-4), id);
            await acha(`${dem.slice(-4)}`, id);
            // final que atravessa a pontuação, digitado com ou sem ela
            await acha(`${meio.slice(-2)}.${fim}`, id);
            await acha(`${meio.slice(-2)}${fim}`, id);
            await acha(`${dem.slice(-3)}/2026`, id);
            await acha(`${dem.slice(-3)}2026`, id);

            // 12 dígitos aleatórios não são o final de nenhum número desta transferência
            await naoAcha(digitos(12), id);
        });
    });

    describe('triggers de tabelas relacionadas', () => {
        it('renomear o tipo de transferência reindexa as transferências do tipo', async () => {
            const objeto = palavra();
            const { id, tipo } = await criarComTexto({ objeto });
            await acha(objeto, id);
            const token = palavra();
            await prisma().transferenciaTipo.update({ where: { id: tipo.id }, data: { nome: `Tipo ${token}` } });
            assert.ok((await buscar(token)).includes(id), 'trigger é síncrona');
        });

        it('renomear sigla/descrição do órgão concedente reindexa', async () => {
            const orgao = await criarOrgao();
            const tipo = await criarTipoTransferencia();
            const criada = await casaCivil(gestor)
                .post('/api/transferencia')
                .send({
                    tipo_id: tipo.id,
                    orgao_concedente_id: orgao.id,
                    esfera: 'Estadual',
                    objeto: uniq('o'),
                    ano: 2026,
                });
            assertStatus(criada, 201);
            const sigla = palavra('sg');
            const descricao = palavra('ds');
            await prisma().orgao.update({ where: { id: orgao.id }, data: { sigla, descricao } });
            assert.ok((await buscar(sigla)).includes(criada.body.id));
            assert.ok((await buscar(descricao)).includes(criada.body.id));
        });

        it('parlamentar vinculado: nome entra no vetor, renomear reindexa e desvincular tira', async () => {
            const { id } = await criarComTexto({});
            const parlamentar = await criarParlamentar();
            assertStatus(await vincularParlamentar(gestor, id, parlamentar.id), 200);
            const pop = palavra('pop');
            await prisma().parlamentar.update({ where: { id: parlamentar.id }, data: { nome_popular: pop } });
            await acha(pop, id);

            const nome = palavra('nm');
            await prisma().parlamentar.update({ where: { id: parlamentar.id }, data: { nome } });
            await acha(nome, id);
            await acha('vereador', id);

            const linha = await prisma().transferenciaParlamentar.findFirstOrThrow({
                where: { transferencia_id: id, parlamentar_id: parlamentar.id },
            });
            const outro = await criarParlamentar();
            const partido = await criarPartido();
            const t = await prisma().transferencia.findUniqueOrThrow({ where: { id } });
            assertStatus(
                await casaCivil(gestor)
                    .patch(`/api/transferencia/${id}`)
                    .send({
                        tipo_id: t.tipo_id,
                        esfera: t.esfera,
                        parlamentares: [
                            { id: linha.id, parlamentar_id: outro.id, partido_id: partido.id, cargo: 'Vereador' },
                        ],
                    }),
                200
            );
            await naoAchaMais(pop, id);
            await acha(outro.nome_popular!, id);
        });

        it('sigla do partido do parlamentar vinculado reindexa', async () => {
            const { id } = await criarComTexto({});
            const parlamentar = await criarParlamentar();
            assertStatus(await vincularParlamentar(gestor, id, parlamentar.id), 200);
            const linha = await prisma().transferenciaParlamentar.findFirstOrThrow({
                where: { transferencia_id: id, parlamentar_id: parlamentar.id },
            });
            const sigla = palavra('pt');
            await prisma().partido.update({ where: { id: linha.partido_id! }, data: { sigla } });
            assert.ok((await buscar(sigla)).includes(id));
        });

        it('distribuição: nome, objeto e órgão gestor entram no vetor; renomear o órgão reindexa', async () => {
            const { id } = await criarComTexto({});
            assertStatus(
                await completarTransferencia(gestor, id, { custeio: 1000, investimento: 0, contrapartida: 0 }),
                200
            );
            const inicial = await prisma().distribuicaoRecurso.findFirstOrThrow({ where: { transferencia_id: id } });
            assertStatus(await cancelarDistribuicao(gestor, inicial.id), 201);

            const orgao = await criarOrgao();
            const nome = palavra('dn');
            const objeto = palavra('do');
            const nova = await criarDistribuicao(
                gestor,
                id,
                { custeio: 500, investimento: 0, contrapartida: 0 },
                { nome, objeto, orgao_gestor_id: orgao.id }
            );
            assertStatus(nova, 201);
            await acha(nome, id);
            await acha(objeto, id);
            await acha(orgao.sigla, id);

            const novaSigla = palavra('og');
            await prisma().orgao.update({ where: { id: orgao.id }, data: { sigla: novaSigla } });
            assert.ok((await buscar(novaSigla)).includes(id));

            assertStatus(await casaCivil(gestor).delete(`/api/distribuicao-recurso/${nova.body.id}`), 202);
            await naoAchaMais(nome, id);
        });
    });

    describe('PATCH parcial preserva os vínculos', () => {
        it('editar só o objeto não desvincula os parlamentares', async () => {
            const { id } = await criarComTexto({});
            const parlamentar = await criarParlamentar();
            assertStatus(await vincularParlamentar(gestor, id, parlamentar.id), 200);

            await editar(id, { objeto: uniq('novo objeto') });

            const ativos = await prisma().transferenciaParlamentar.count({
                where: { transferencia_id: id, removido_em: null },
            });
            assert.equal(ativos, 1);
        });
    });
});
