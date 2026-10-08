import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    loginAsSuperAdmin,
    prisma,
    Sessao,
    uniq,
} from '../../lib';

// supertest só entende JSON único: o corpo jsonlines é lido como texto cru
const lerTexto = (res: unknown, cb: (err: Error | null, body: unknown) => void) => {
    const stream = res as NodeJS.ReadableStream;
    let texto = '';
    stream.setEncoding('utf8');
    stream.on('data', (parte: string) => (texto += parte));
    stream.on('end', () => cb(null, texto));
};

describe('relatorio/projetos', () => {
    let executor: Sessao;
    let administrador: Sessao;
    let semPrivilegio: Sessao;
    let criadorId: number;
    let portfolioId: number;
    let registrado: { id: number; nome: string };
    let fechado: { id: number; nome: string };

    before(async () => {
        await bootApp();
        executor = await criarPessoaComPrivilegios(['Reports.executar.MDO']);
        administrador = await criarPessoaComPrivilegios(['Reports.executar.MDO', 'Projeto.administrador']);
        semPrivilegio = await criarPessoaSemPrivilegios();
        criadorId = (await loginAsSuperAdmin()).pessoa.id;

        portfolioId = (
            await prisma().portfolio.create({
                data: { titulo: uniq('portfolio'), tipo_projeto: 'PP', criado_por: criadorId },
            })
        ).id;
        registrado = await criarProjeto('Registrado', 'Registro');
        fechado = await criarProjeto('Fechado', 'Encerramento');
    });

    function criarProjeto(status: 'Registrado' | 'Fechado', fase: 'Registro' | 'Encerramento') {
        return prisma().projeto.create({
            data: {
                portfolio_id: portfolioId,
                tipo: 'PP',
                nome: uniq('projeto'),
                objeto: 'objeto',
                objetivo: 'objetivo',
                publico_alvo: 'público',
                resumo: 'resumo',
                status,
                fase,
                orgao_gestor_id: 1,
                registrado_em: new Date(),
                registrado_por: criadorId,
            },
            select: { id: true, nome: true },
        });
    }

    const url = '/api/relatorio/projetos';
    const filtro = (extra: Record<string, unknown> = {}) => ({
        portfolio_id: portfolioId,
        orgao_responsavel_id: null,
        ...extra,
    });
    const ids = (linhas: Record<string, any>[]) => linhas.map((l) => l.id as number);

    it('401 sem token', async () => {
        assertStatus(await api().post(url).send(filtro()), 401);
        assertStatus(await api().post(`${url}/stream-projetos`).send(filtro()), 401);
    });

    it('403 sem Reports.executar.MDO', async () => {
        for (const rota of [url, `${url}/stream-projetos`]) {
            const res = await api(semPrivilegio).post(rota).send(filtro());
            assertStatus(res, 403);
            assert.match(res.body.message, /Reports\.executar\.MDO/);
        }
    });

    it('400 sem portfolio_id, com portfolio_id não numérico ou status fora do enum', async () => {
        for (const rota of [url, `${url}/stream-projetos`]) {
            const enviar = (corpo: Record<string, unknown>) => api(executor).post(rota).send(corpo);
            assertStatus(await enviar({ orgao_responsavel_id: null }), 400);
            assertStatus(await enviar(filtro({ portfolio_id: 'x' })), 400);
            assertStatus(await enviar(filtro({ status: 'Foo' })), 400);
            assertStatus(await enviar(filtro({ codigo: 10 })), 400);
        }
    });

    it('201 sem orgao_responsavel_id (campo opcional)', async () => {
        assertStatus(await api(administrador).post(url).send({ portfolio_id: portfolioId }), 201);
    });

    it('201 devolve os projetos do portfólio com os campos do projeto', async () => {
        const res = await api(administrador).post(url).send(filtro());
        assertStatus(res, 201);

        const linhas: Record<string, any>[] = res.body.linhas;
        assert.deepEqual(ids(linhas).sort(), [registrado.id, fechado.id].sort());
        const linha = linhas.find((l) => l.id === registrado.id)!;
        assert.equal(linha.nome, registrado.nome);
        assert.equal(linha.portfolio_id, portfolioId);
        assert.equal(linha.status, 'Registrado');
        assert.equal(linha.objeto, 'objeto');
        for (const secao of ['cronograma', 'riscos', 'contratos', 'enderecos', 'termos_encerramento']) {
            assert.ok(Array.isArray(res.body[secao]), `${secao} deveria ser lista`);
        }
    });

    it('filtra por status, projeto_id e codigo', async () => {
        const porStatus = await api(administrador)
            .post(url)
            .send(filtro({ status: 'Fechado' }));
        assertStatus(porStatus, 201);
        assert.deepEqual(ids(porStatus.body.linhas), [fechado.id]);

        const porProjeto = await api(administrador)
            .post(url)
            .send(filtro({ projeto_id: [registrado.id] }));
        assertStatus(porProjeto, 201);
        assert.deepEqual(ids(porProjeto.body.linhas), [registrado.id]);

        const porCodigo = await api(administrador)
            .post(url)
            .send(filtro({ codigo: 'inexistente' }));
        assertStatus(porCodigo, 201);
        assert.deepEqual(porCodigo.body.linhas, []);
    });

    it('400 para quem não tem nenhum papel em projetos', async () => {
        const res = await api(executor).post(url).send(filtro());
        assertStatus(res, 400);
        assert.match(res.body.message, /Sem permissões para acesso aos projetos/);
    });

    it('stream-projetos devolve um objeto jsonlines por projeto', async () => {
        const res = await api(administrador).post(`${url}/stream-projetos`).send(filtro()).buffer(true).parse(lerTexto);
        assertStatus(res, 200);
        assert.match(res.headers['content-type'], /application\/jsonlines\+json/);

        const itens = (res.body as string)
            .split('\n')
            .filter(Boolean)
            .map((l) => JSON.parse(l) as { projeto_id: number; dados: { linhas: { id: number; nome: string }[] } });
        assert.deepEqual(ids(itens.map((i) => ({ id: i.projeto_id }))).sort(), [registrado.id, fechado.id].sort());
        const item = itens.find((i) => i.projeto_id === fechado.id)!;
        assert.equal(item.dados.linhas[0].id, fechado.id);
        assert.equal(item.dados.linhas[0].nome, fechado.nome);
    });

    it(
        'stream-projetos sem nenhum papel em projetos responde 400',
        {
            todo: 'BUG: POST /api/relatorio/projetos/stream-projetos: esperado 400 (como no POST sem stream), veio 200 com {"error":...} no corpo',
        },
        async () => {
            const res = await api(executor).post(`${url}/stream-projetos`).send(filtro()).buffer(true).parse(lerTexto);
            assertStatus(res, 400);
        }
    );
});
