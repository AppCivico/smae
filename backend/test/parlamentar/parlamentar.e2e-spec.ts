import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    prisma,
    Sessao,
    uniq,
} from '../lib';

let cpfSeq = 0;
// CPF com dígitos verificadores válidos, único por chamada
function cpfValido(): string {
    const base = String(10000000 + ((process.pid * 1000 + ++cpfSeq) % 89999999)).padStart(9, '0');
    const nums = base.split('').map(Number);
    const digito = (digitos: number[]) => {
        const soma = digitos.reduce((acc, n, i) => acc + n * (digitos.length + 1 - i), 0);
        const resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    };
    const d1 = digito(nums);
    const d2 = digito([...nums, d1]);
    return `${base.slice(0, 3)}.${base.slice(3, 6)}.${base.slice(6)}-${d1}${d2}`;
}

describe('parlamentar', () => {
    let gestor: Sessao;
    let leitor: Sessao;
    let semPrivilegio: Sessao;
    let partidos: number[];
    let eleicaoId: number;

    before(async () => {
        await bootApp();
        gestor = await criarPessoaComPrivilegios([
            'CadastroParlamentar.inserir',
            'CadastroParlamentar.listar',
            'CadastroParlamentar.editar',
            'CadastroParlamentar.remover',
            'SMAE.acesso_telefone',
        ]);
        leitor = await criarPessoaComPrivilegios(['CadastroParlamentar.listar']);
        semPrivilegio = await criarPessoaSemPrivilegios();

        partidos = [];
        for (let i = 0; i < 2; i++) {
            const partido = await prisma().partido.create({
                data: { nome: uniq('Partido'), sigla: uniq('PP').replace(/\s/g, ''), numero: 20 + i },
            });
            partidos.push(partido.id);
        }
        eleicaoId = (await prisma().eleicao.findFirstOrThrow({ where: { removido_em: null }, select: { id: true } }))
            .id;
    });

    const novoParlamentar = (extra: Record<string, unknown> = {}) => ({
        nome: uniq('Parlamentar'),
        nome_popular: uniq('Popular'),
        cpf: cpfValido(),
        em_atividade: true,
        ...extra,
    });

    const novoMandato = (extra: Record<string, unknown> = {}) => ({
        eleicao_id: eleicaoId,
        partido_candidatura_id: partidos[0],
        partido_atual_id: partidos[1],
        eleito: true,
        cargo: 'DeputadoEstadual',
        uf: 'SP',
        ...extra,
    });

    it('401 sem token', async () => {
        assertStatus(await api().get('/api/parlamentar'), 401);
        assertStatus(await api().post('/api/parlamentar').send(novoParlamentar()), 401);
        assertStatus(await api().get('/api/parlamentar/1'), 401);
        assertStatus(await api().patch('/api/parlamentar/1').send({ nome: uniq() }), 401);
        assertStatus(await api().delete('/api/parlamentar/1'), 401);
    });

    it('403 sem o privilégio de cada rota', async () => {
        const listar = await api(semPrivilegio).get('/api/parlamentar');
        assertStatus(listar, 403);
        assert.match(listar.body.message, /CadastroParlamentar\.listar/);

        const criar = await api(semPrivilegio).post('/api/parlamentar').send(novoParlamentar());
        assertStatus(criar, 403);
        assert.match(criar.body.message, /CadastroParlamentar\.inserir/);

        assertStatus(await api(semPrivilegio).patch('/api/parlamentar/1').send({ nome: uniq() }), 403);
        assertStatus(await api(leitor).delete('/api/parlamentar/1'), 403);
    });

    it('400 com CPF inválido e com telefone sem SMAE.acesso_telefone', async () => {
        assertStatus(
            await api(gestor)
                .post('/api/parlamentar')
                .send(novoParlamentar({ cpf: '123.456.789-00' })),
            400
        );

        const semAcessoTelefone = await criarPessoaComPrivilegios([
            'CadastroParlamentar.inserir',
            'CadastroParlamentar.listar',
        ]);
        const res = await api(semAcessoTelefone)
            .post('/api/parlamentar')
            .send(novoParlamentar({ telefone: '11999999999' }));
        assertStatus(res, 400);
        assert.match(res.body.message, /permissão para cadastro de telefone/);
    });

    it('cria, lista, detalha, edita e remove', async () => {
        const dados = novoParlamentar();
        const criado = await api(gestor).post('/api/parlamentar').send(dados);
        assertStatus(criado, 201);
        const id: number = criado.body.id;

        const lista = await api(leitor).get('/api/parlamentar');
        assertStatus(lista, 200);
        assert.equal(typeof lista.body.tem_mais, 'boolean');
        assert.ok(lista.body.linhas.some((l: { id: number }) => l.id === id));

        const detalhe = await api(leitor).get(`/api/parlamentar/${id}`);
        assertStatus(detalhe, 200);
        assert.equal(detalhe.body.nome, dados.nome);
        assert.equal(detalhe.body.cpf, dados.cpf);
        assert.equal(detalhe.body.em_atividade, true);

        const novoNome = uniq('Renomeado');
        assertStatus(
            await api(gestor).patch(`/api/parlamentar/${id}`).send({ nome: novoNome, em_atividade: false }),
            200
        );
        const editado = await api(leitor).get(`/api/parlamentar/${id}`);
        assert.equal(editado.body.nome, novoNome);
        assert.equal(editado.body.em_atividade, false);

        assertStatus(await api(gestor).delete(`/api/parlamentar/${id}`), 202);
        const depois = await api(leitor).get('/api/parlamentar');
        assert.equal(
            depois.body.linhas.some((l: { id: number }) => l.id === id),
            false
        );
    });

    it('400 com CPF já cadastrado, na criação e na edição', async () => {
        const existente = await api(gestor).post('/api/parlamentar').send(novoParlamentar());
        assertStatus(existente, 201);
        const cpf = (await api(leitor).get(`/api/parlamentar/${existente.body.id}`)).body.cpf;

        const criacao = await api(gestor).post('/api/parlamentar').send(novoParlamentar({ cpf }));
        assertStatus(criacao, 400);
        assert.match(criacao.body.message, /CPF já cadastrado/);

        const outro = await api(gestor).post('/api/parlamentar').send(novoParlamentar());
        const edicao = await api(gestor).patch(`/api/parlamentar/${outro.body.id}`).send({ cpf });
        assertStatus(edicao, 400);
        assert.match(edicao.body.message, /CPF já cadastrado/);
    });

    it('mandato: cria, recusa segundo mandato na mesma eleição e partido inválido', async () => {
        const parlamentar = await api(gestor).post('/api/parlamentar').send(novoParlamentar());
        const id: number = parlamentar.body.id;

        const invalido = await api(gestor)
            .post(`/api/parlamentar/${id}/mandato`)
            .send(novoMandato({ partido_atual_id: 999999 }));
        assertStatus(invalido, 400);
        assert.match(invalido.body.message, /Partido atual inválido/);

        const criado = await api(gestor).post(`/api/parlamentar/${id}/mandato`).send(novoMandato());
        assertStatus(criado, 201);

        const repetido = await api(gestor).post(`/api/parlamentar/${id}/mandato`).send(novoMandato());
        assertStatus(repetido, 400);
        assert.match(repetido.body.message, /já possui mandato para esta eleição/);

        const detalhe = await api(leitor).get(`/api/parlamentar/${id}`);
        assertStatus(detalhe, 200);
        assert.ok(JSON.stringify(detalhe.body).includes(`"id":${criado.body.id}`));

        assertStatus(await api(gestor).delete(`/api/parlamentar/${id}/mandato/${criado.body.id}`), 202);
    });

    it('equipe: cria membro com tipo válido e recusa tipo fora do enum', async () => {
        const parlamentar = await api(gestor).post('/api/parlamentar').send(novoParlamentar());
        const id: number = parlamentar.body.id;
        const membro = { nome: uniq('Assessor'), telefone: '11988887777', email: 'assessor@e2e.test' };

        assertStatus(
            await api(gestor)
                .post(`/api/parlamentar/${id}/equipe`)
                .send({ ...membro, tipo: 'Inexistente' }),
            400
        );
        assertStatus(
            await api(gestor)
                .post(`/api/parlamentar/${id}/equipe`)
                .send({ ...membro, tipo: 'Assessor' }),
            201
        );
    });

    it('eleicao-comparecimento: 401 sem token, 403 sem listar, 400 sem eleição ou mandato', async () => {
        assertStatus(await api().get('/api/parlamentar/eleicao-comparecimento'), 401);
        assertStatus(await api(semPrivilegio).get('/api/parlamentar/eleicao-comparecimento'), 403);
        assertStatus(await api(leitor).get('/api/parlamentar/eleicao-comparecimento'), 400);
        assertStatus(await api(leitor).get(`/api/parlamentar/eleicao-comparecimento?eleicao_id=${eleicaoId}`), 200);
    });

    describe('membros, mandatos e representatividade', () => {
        const membroNovo = () => ({
            nome: uniq('Assessor'),
            telefone: '11988887777',
            email: 'a@e2e.test',
            tipo: 'Assessor',
        });

        async function parlamentarComMandato() {
            const parlamentar = await api(gestor).post('/api/parlamentar').send(novoParlamentar());
            const mandato = await api(gestor)
                .post(`/api/parlamentar/${parlamentar.body.id}/mandato`)
                .send(novoMandato());
            assertStatus(mandato, 201);
            return { id: parlamentar.body.id as number, mandatoId: mandato.body.id as number };
        }

        it('equipe: edita e remove membro do próprio parlamentar', async () => {
            const { id } = await parlamentarComMandato();
            const membro = await api(gestor).post(`/api/parlamentar/${id}/equipe`).send(membroNovo());
            assertStatus(membro, 201);

            const nome = uniq('Chefe de gabinete');
            assertStatus(
                await api(gestor).patch(`/api/parlamentar/${id}/equipe/${membro.body.id}`).send({ nome }),
                200
            );
            assertStatus(await api(gestor).delete(`/api/parlamentar/${id}/equipe/${membro.body.id}`), 202);
        });

        it('recusa editar equipe pela URL de outro parlamentar', async () => {
            const dono = await parlamentarComMandato();
            const outro = await parlamentarComMandato();
            const membro = await api(gestor).post(`/api/parlamentar/${dono.id}/equipe`).send(membroNovo());

            assertStatus(
                await api(gestor).patch(`/api/parlamentar/${outro.id}/equipe/${membro.body.id}`).send({ nome: uniq() }),
                400
            );
        });

        it('mandato: edita campos do mandato', async () => {
            const { id, mandatoId } = await parlamentarComMandato();
            assertStatus(
                await api(gestor).patch(`/api/parlamentar/${id}/mandato/${mandatoId}`).send({ gabinete: 'Sala 10' }),
                200
            );
        });

        it('edição de mandato recusa partido atual inexistente com 400', async () => {
            const { id, mandatoId } = await parlamentarComMandato();
            const invalido = await api(gestor)
                .patch(`/api/parlamentar/${id}/mandato/${mandatoId}`)
                .send({ partido_atual_id: 999999 });
            assertStatus(invalido, 400);
            assert.match(invalido.body.message, /Partido atual inválido/);
        });

        it('representatividade: regras de nível, mandato inexistente e região repetida', async () => {
            const { id, mandatoId } = await parlamentarComMandato();
            const regiao = await prisma().regiao.create({ data: { descricao: uniq('Região'), nivel: 1 } });
            const base = {
                regiao_id: regiao.id,
                mandato_id: mandatoId,
                nivel: 'Estado',
                numero_votos: 100,
                numero_comparecimento: 1000,
                ranking: 1,
            };
            const url = `/api/parlamentar/${id}/representatividade`;

            assertStatus(
                await api(gestor)
                    .post(url)
                    .send({ ...base, mandato_id: 999999 }),
                404
            );
            assertStatus(
                await api(gestor)
                    .post(url)
                    .send({ ...base, municipio_tipo: 'Capital' }),
                400
            );
            assertStatus(
                await api(gestor)
                    .post(url)
                    .send({ ...base, nivel: 'Municipio' }),
                400
            );

            const criada = await api(gestor).post(url).send(base);
            assertStatus(criada, 201);

            const repetida = await api(gestor).post(url).send(base);
            assertStatus(repetida, 400);
            assert.match(repetida.body.message, /Já existe um mandato para esta região/);

            assertStatus(await api(gestor).delete(`${url}/${criada.body.id}`), 202);
        });
    });
});
