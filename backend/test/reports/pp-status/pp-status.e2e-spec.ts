import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarOrgao,
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    loginAsSuperAdmin,
    prisma,
    Sessao,
    uniq,
} from '../../lib';

type Tipo = 'PP' | 'MDO';

async function criarPortfolio(tipo: Tipo) {
    const criadoPor = (await loginAsSuperAdmin()).pessoa.id;
    return prisma().portfolio.create({
        data: { titulo: uniq('portfolio'), tipo_projeto: tipo, criado_por: criadoPor },
    });
}

async function criarProjeto(tipo: Tipo, portfolioId: number, extra: { orgao_responsavel_id?: number } = {}) {
    const criadoPor = (await loginAsSuperAdmin()).pessoa.id;
    return prisma().projeto.create({
        data: {
            portfolio_id: portfolioId,
            tipo,
            nome: uniq('projeto'),
            objeto: 'objeto',
            objetivo: 'objetivo',
            publico_alvo: 'público',
            resumo: 'resumo',
            status: tipo === 'PP' ? 'Registrado' : 'MDO_EmAndamento',
            fase: 'Registro',
            orgao_gestor_id: 1,
            registrado_em: new Date(),
            registrado_por: criadoPor,
            ...extra,
        },
        select: { id: true, nome: true },
    });
}

// DateTransform quebra (500) quando periodo_inicio/periodo_fim são omitidos: os testes enviam null
const semPeriodo = { periodo_inicio: null, periodo_fim: null };

function descreverRelatorio(
    nome: string,
    url: string,
    tipo: Tipo,
    privilegios: 'Reports.executar.Projetos' | 'Reports.executar.MDO',
    admin: 'Projeto.administrador' | 'ProjetoMDO.administrador'
) {
    describe(nome, () => {
        let executor: Sessao;
        let administrador: Sessao;
        let semPrivilegio: Sessao;
        let portfolioId: number;
        let orgaoId: number;
        let orgaoSigla: string;
        let projetoEmDia: { id: number; nome: string };
        let projetoAtrasado: { id: number; nome: string };

        before(async () => {
            await bootApp();
            executor = await criarPessoaComPrivilegios([privilegios]);
            administrador = await criarPessoaComPrivilegios([privilegios, admin]);
            semPrivilegio = await criarPessoaSemPrivilegios();

            const orgao = await criarOrgao();
            orgaoId = orgao.id;
            orgaoSigla = orgao.sigla;
            portfolioId = (await criarPortfolio(tipo)).id;
            projetoEmDia = await criarProjeto(tipo, portfolioId, { orgao_responsavel_id: orgaoId });
            projetoAtrasado = await criarProjeto(tipo, portfolioId);

            const cronograma = await prisma().tarefaCronograma.create({
                data: { projeto_id: projetoAtrasado.id, em_atraso: true },
            });
            await prisma().tarefa.create({
                data: {
                    tarefa_cronograma_id: cronograma.id,
                    tarefa: 'Fundação',
                    descricao: 'descricao',
                    recursos: 'equipe',
                    numero: 1,
                    nivel: 1,
                },
            });
            await prisma().projetoAcompanhamento.create({
                data: {
                    projeto_id: projetoAtrasado.id,
                    ordem: 1,
                    data_registro: new Date('2028-05-10'),
                    participantes: 'todos',
                    detalhamento: 'detalhe do acompanhamento',
                    pontos_atencao: 'ponto de atenção',
                    criado_em: new Date(),
                    criado_por: (await loginAsSuperAdmin()).pessoa.id,
                },
            });
        });

        const corpo = (extra: Record<string, unknown> = {}) => ({ portfolio_id: portfolioId, ...semPeriodo, ...extra });
        const porId = (res: { body: { linhas: { id: number }[] } }, id: number) =>
            res.body.linhas.find((l) => l.id === id);

        it('401 sem token', async () => {
            assertStatus(await api().post(url).send(corpo()), 401);
        });

        it(`403 sem ${privilegios}`, async () => {
            const res = await api(semPrivilegio).post(url).send(corpo());
            assertStatus(res, 403);
            assert.match(res.body.message, new RegExp(privilegios.replace(/\./g, '\\.')));
        });

        it('400 sem portfolio_id, com portfolio_id não inteiro ou período fora do formato', async () => {
            const enviar = (extra: Record<string, unknown>) => api(administrador).post(url).send(corpo(extra));
            assertStatus(await enviar({ portfolio_id: 'x' }), 400);
            assertStatus(await enviar({ periodo_inicio: '10/05/2028' }), 400);
            assertStatus(
                await api(administrador)
                    .post(url)
                    .send({ ...semPeriodo }),
                400
            );
        });

        it(
            '400 com corpo vazio',
            {
                todo: `BUG: POST ${url}: esperado 400 (portfolio_id obrigatório), veio 500 (DateTransform recebe undefined em periodo_inicio/periodo_fim)`,
            },
            async () => {
                assertStatus(await api(administrador).post(url).send({}), 400);
            }
        );

        it(
            '201 sem periodo_inicio/periodo_fim (campos opcionais)',
            {
                todo: `BUG: POST ${url}: esperado 201 sem periodo_inicio/periodo_fim (@IsOptional), veio 500 (DateTransform recebe undefined)`,
            },
            async () => {
                assertStatus(await api(administrador).post(url).send({ portfolio_id: portfolioId }), 201);
            }
        );

        it('201 devolve os projetos do portfólio com cronograma, tarefas e último acompanhamento', async () => {
            const res = await api(administrador).post(url).send(corpo());
            assertStatus(res, 201);

            const emDia = porId(res, projetoEmDia.id) as Record<string, any>;
            assert.equal(emDia.nome, projetoEmDia.nome);
            assert.equal(emDia.portfolio_id, portfolioId);
            assert.equal(emDia.cronograma, 'Em dia');
            assert.equal(emDia.orgao_responsavel_sigla, orgaoSigla);
            assert.equal(emDia.tarefas, null);
            assert.equal(emDia.detalhamento, null);

            const atrasado = porId(res, projetoAtrasado.id) as Record<string, any>;
            assert.equal(atrasado.cronograma, 'Atrasado');
            assert.equal(atrasado.tarefas, 'Fundação=Não iniciada');
            assert.equal(atrasado.detalhamento, 'detalhe do acompanhamento');
            assert.equal(atrasado.pontos_atencao, 'ponto de atenção');
        });

        it('filtra por projeto_id e o período recorta o acompanhamento', async () => {
            const porProjeto = await api(administrador)
                .post(url)
                .send(corpo({ projeto_id: projetoEmDia.id }));
            assertStatus(porProjeto, 201);
            assert.deepEqual(
                porProjeto.body.linhas.map((l: { id: number }) => l.id),
                [projetoEmDia.id]
            );

            const foraDoPeriodo = await api(administrador)
                .post(url)
                .send(corpo({ periodo_inicio: '2029-01-01', periodo_fim: '2029-12-31' }));
            assertStatus(foraDoPeriodo, 201);
            assert.equal((porId(foraDoPeriodo, projetoAtrasado.id) as Record<string, any>).detalhamento, null);
        });

        it('400 "Não há linhas" para portfólio sem projetos', async () => {
            const vazio = await criarPortfolio(tipo);

            const res = await api(administrador)
                .post(url)
                .send(corpo({ portfolio_id: vazio.id }));
            assertStatus(res, 400);
            assert.match(res.body.message, /Não há linhas para estas condições/);
        });

        it('400 para quem não tem nenhum papel em projetos', async () => {
            const res = await api(executor).post(url).send(corpo());
            assertStatus(res, 400);
            assert.match(res.body.message, /Sem permissões para acesso aos projetos/);
        });

        it('não mistura tipos: portfólio do outro tipo não tem linhas', async () => {
            const outro = await criarPortfolio(tipo === 'PP' ? 'MDO' : 'PP');
            await criarProjeto(tipo === 'PP' ? 'MDO' : 'PP', outro.id);

            const res = await api(administrador)
                .post(url)
                .send(corpo({ portfolio_id: outro.id }));
            assertStatus(res, 400);
            assert.match(res.body.message, /Não há linhas para estas condições/);
        });
    });
}

descreverRelatorio(
    'relatorio/projeto-status',
    '/api/relatorio/projeto-status',
    'PP',
    'Reports.executar.Projetos',
    'Projeto.administrador'
);
descreverRelatorio(
    'relatorio/mdo-projeto-status',
    '/api/relatorio/mdo-projeto-status',
    'MDO',
    'Reports.executar.MDO',
    'ProjetoMDO.administrador'
);
