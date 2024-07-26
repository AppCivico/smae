import { Database } from 'duckdb-async';
import {
    Configuration,
    IniciativaApi,
    MetaApi,
    MonitoramentoDeObrasCadastroBsicoEquipamentoApi,
    MonitoramentoDeObrasCadastroBsicoGrupoTemticoApi,
    MonitoramentoDeObrasCadastroBsicoTipoDeIntervenoApi,
    PDMApi,
    PessoaApi,
    PortflioDeObrasApi,
    ProgramasProjetoMDOExclusivoParaObrasApi,
    ProjetoEtapaDeObrasApi,
    RegiaoApi,
    RgoApi,
} from './generated';
if (!process.env.BASE_PATH) throw new Error('BASE_PATH for API is required');
if (!process.env.ACCESS_TOKEN) throw new Error('ACCESS_TOKEN is required');
if (!process.env.DB_PATH) throw new Error('env DB_PATH for database is required');

// Configure the API client
const config = new Configuration({
    basePath: process.env.BASE_PATH,
    accessToken: process.env.ACCESS_TOKEN,
});

interface ProjetoRow {
    // -- pre-cadastro global --
    // pessoa
    rel_responsaveis_no_orgao_gestor_id: string;
    rel_responsavel_id: string;
    rel_colaboradores_no_orgao: string | null;

    // orgao
    rel_orgao_gestor_id: string;
    orgao_responsavel_id: string;
    rel_orgao_origem_id: string;
    rel_orgao_colaborador_id: string | null;
    rel_orgao_executor_id: string | null;

    rel_portfolio_id: string;
    rel_projeto_etapa_id: string | null;
    rel_subprefeitura_id: string | null;
    rel_programa_id: string | null;
    rel_tipo_intervencao_id: string | null;
    rel_equipamento_id: string | null;
    rel_grupo_tematico_id: string | null;

    origem_tipo: string | null;
    origem_outro: string | null;
    origem_iniciativa_id: string | null;
    origem_meta_id: string | null;
    origem_pdm: string | null;

    // cadastrado por obra
    rel_empreendimento_id: string;
    rel_processo_sei: string | null;

    // update ou insert
    projeto_id: number | null;

    // colunas simples
    projeto_nome: string;
    projeto_status: string;
    previsao_inicio: Date | null;
    previsao_termino: Date | null;
    secretario_responsavel: string;
    projeto_codigo: string | null;
    previsao_custo: number | null;
    mdo_observacoes: string | null;
    mdo_detalhamento: string | null;
    secretario_colaborador: string | null;
    secretario_executivo: string | null;
    mdo_numero_contrato: string | null;
    mdo_n_unidades_habitacionais: number | null;
    mdo_n_familias_beneficiadas: number | null;

    // novas colunas sem destino
    status_contratacao: string | null;
    mdo_n_familias_beneficiadas_ate_agora: number | null;
}
const LISTA_COL_ORGAO = [
    'rel_orgao_gestor_id',
    'orgao_responsavel_id',
    'rel_orgao_origem_id',
    'rel_orgao_colaborador_id',
    'rel_orgao_executor_id',
] as const;

const pessoaApi = new PessoaApi(config);
const orgaoApi = new RgoApi(config); // Órgão sem `Ó` e `ã` hehe, não fui eu que escolhi isso!
const portApi = new PortflioDeObrasApi(config);
const etapaApi = new ProjetoEtapaDeObrasApi(config);
const regiaoApi = new RegiaoApi(config);
const programaApi = new ProgramasProjetoMDOExclusivoParaObrasApi(config);

const equipamentoApi = new MonitoramentoDeObrasCadastroBsicoEquipamentoApi(config);
const grupoTematicoApi = new MonitoramentoDeObrasCadastroBsicoGrupoTemticoApi(config);
const tipoIntervencaoApi = new MonitoramentoDeObrasCadastroBsicoTipoDeIntervenoApi(config);

const metaApi = new MetaApi(config);
const metas = metaApi.metaControllerFindAll({

});


const iniApi = new IniciativaApi(config);
const ini = ini

const PDM_STR = 'Programa de Metas 2021-2024 - Versão Alteração Programática';
const memory = {
    rel_responsaveis_no_orgao_gestor_id: {} as any,
    rel_responsavel_id: {} as any,
    orgaos: {} as any,
    portfolios: {} as any,
    orgao2id: {} as Record<string, number>,
    etapas: {} as any,
    etapa2id: {} as Record<string, number>,
    regioes: {} as any,
    regiao2id: {} as Record<string, number>,
    programas: {} as any,
    programa2id: {} as Record<string, number>,
    tipo_intervencao: {} as any,
    tipo_intervencao2id: {} as Record<string, number>,
    equipamentos: {} as any,
    equipamento2id: {} as Record<string, number>,
    grupo_tematico: {} as any,
    grupo_tematico2id: {} as Record<string, number>,
    pdm2id: {
        [PDM_STR]: 11,
    } as Record<string, number>,
    meta: {} as any,
    meta2id: {} as Record<string, number>,
    iniciativa: {} as any,
    iniciativa2id: {} as Record<string, number>,
};
let runImport = true;
async function main() {
    const {
        pessoasCollabProjeto,
        pessoasGestorDeProjeto,
    }: { pessoasCollabProjeto: Record<string, number>; pessoasGestorDeProjeto: Record<string, number> } =
        await buscaPessoas();

    //console.log(pessoasCollabProjeto, pessoasGestorDeProjeto);

    const db = await Database.create(process.env.DB_PATH!);
    const rows = (await db.all(`select * from importacao`)) as ProjetoRow[];

    for (const row of rows) {
        if (!memory.rel_responsaveis_no_orgao_gestor_id[row.rel_responsaveis_no_orgao_gestor_id])
            memory.rel_responsaveis_no_orgao_gestor_id[row.rel_responsaveis_no_orgao_gestor_id] = 0;
        memory.rel_responsaveis_no_orgao_gestor_id[row.rel_responsaveis_no_orgao_gestor_id] += 1;

        if (row.rel_colaboradores_no_orgao) {
            if (!memory.rel_responsaveis_no_orgao_gestor_id[row.rel_colaboradores_no_orgao])
                memory.rel_responsaveis_no_orgao_gestor_id[row.rel_colaboradores_no_orgao] = 0;
            memory.rel_responsaveis_no_orgao_gestor_id[row.rel_colaboradores_no_orgao] += 1;
        }

        if (!memory.rel_responsavel_id[row.rel_responsavel_id]) memory.rel_responsavel_id[row.rel_responsavel_id] = 0;
        memory.rel_responsavel_id[row.rel_responsavel_id] += 1;

        for (const col of LISTA_COL_ORGAO) {
            let rowValue = row[col]?.trim();
            if (!rowValue) continue;

            if (rowValue.includes('-')) {
                rowValue = rowValue.split('-')[0].trim();
            }
            if (!memory.orgaos[rowValue]) memory.orgaos[rowValue] = 0;

            memory.orgaos[rowValue] += 1;
        }

        if (!memory.portfolios[row.rel_portfolio_id]) memory.portfolios[row.rel_portfolio_id] = 0;
        memory.portfolios[row.rel_portfolio_id] += 1;

        const etapa = row.rel_projeto_etapa_id?.trim();
        if (etapa) {
            if (!memory.etapas[etapa]) memory.etapas[etapa] = 0;
            memory.etapas[etapa] += 1;
        }

        const regiao = row.rel_subprefeitura_id?.trim();
        if (regiao) {
            if (!memory.regioes[regiao]) memory.regioes[regiao] = 0;
            memory.regioes[regiao] += 1;
        }

        const programa = row.rel_programa_id?.trim();
        if (programa) {
            if (!memory.programas[programa]) memory.programas[programa] = 0;
            memory.programas[programa] += 1;
        }

        const tipoIntervencao = row.rel_tipo_intervencao_id?.trim();
        if (tipoIntervencao) {
            if (!memory.tipo_intervencao[tipoIntervencao]) memory.tipo_intervencao[tipoIntervencao] = 0;
            memory.tipo_intervencao[tipoIntervencao] += 1;
        }

        const equipamento = row.rel_equipamento_id?.trim();
        if (equipamento) {
            if (!memory.equipamentos[equipamento]) memory.equipamentos[equipamento] = 0;
            memory.equipamentos[equipamento] += 1;
        }

        const grupoTematico = row.rel_grupo_tematico_id?.trim();
        if (grupoTematico) {
            if (!memory.grupo_tematico[grupoTematico]) memory.grupo_tematico[grupoTematico] = 0;
            memory.grupo_tematico[grupoTematico] += 1;
        }

        const meta = row.origem_meta_id?.trim();
        if (meta) {
            if (!memory.meta[meta]) memory.meta[meta] = 0;
            memory.meta[meta] += 1;
        }

        const iniciativa = row.origem_iniciativa_id?.trim();
        if (iniciativa) {
            if (!memory.iniciativa[iniciativa]) memory.iniciativa[iniciativa] = 0;
            memory.iniciativa[iniciativa] += 1;
        }

        const origem_pdms = row.origem_pdm?.trim();
        if (origem_pdms) {
            if (origem_pdms != PDM_STR) {
                console.log('Origem PDM diferente do esperado:', origem_pdms);
                runImport = false;
            }
        }
    }

    validaPessoas(pessoasCollabProjeto, pessoasGestorDeProjeto);
    await validaOrgaos();
    await validaPortfolios();
    await validaEtapas();
    await validaRegioes();
    await validaPrograma();
    await validaTipoIntervencao();
    await validaEquipamento();
    await validaGrupoTematico();

//    const meta = await metaApi.metaControllerFindAll();
//    for (const contentRaw in memory.meta) {
//        let content = contentRaw;
//        if (content.includes('-')) {
//            content = content.split('-')[0].trim();
//        }
//
//        if (meta.data.linhas.length > 0) {
//            memory.meta2id[content] = meta.data.linhas[0].id!;
//            continue;
//        }
//
//        console.log('Meta', content, 'não encontrado, necessário em', memory.meta[content], 'registros');
//        runImport = false;
//    }

    //
    //    for (const contentRaw in memory.iniciativa) {
    //        let content = contentRaw;
    //        if (content.includes('-')) {
    //            content = content.split('-')[0].trim();
    //        }
    //        const iniciativa = await iniApi.inici({
    //            //descricao: content,
    //        });
    //        if (iniciativa.data.linhas.length > 0) {
    //            memory.iniciativa2id[content] = iniciativa.data.linhas[0].id!;
    //            continue;
    //        }
    //
    //        console.log('Iniciativa', content, 'não encontrado, necessário em', memory.iniciativa[content], 'registros');
    //        runImport = false;
    //    }

    if (!runImport) {
        console.log('Importação não pode ser realizada');
        return;
    }
}

main();

async function validaGrupoTematico() {
    const grupoTematico = await grupoTematicoApi.grupoTematicoControllerFindAll();
    for (const content in memory.grupo_tematico) {
        const matchByTitulo = grupoTematico.data.linhas.find((grupo) => matchStringFuzzy(grupo.nome, content));
        if (matchByTitulo) {
            memory.grupo_tematico2id[content] = (matchByTitulo as any).id;
            continue;
        }

        console.log(
            'Grupo temático',
            content,
            'não encontrado, necessário em',
            memory.grupo_tematico[content],
            'registros'
        );
        runImport = false;
    }
}

async function validaEquipamento() {
    const equipamentos = await equipamentoApi.equipamentoControllerFindAll();
    for (const content in memory.equipamentos) {
        const matchByTitulo = equipamentos.data.linhas.find((equip) => matchStringFuzzy(equip.nome, content));
        if (matchByTitulo) {
            memory.equipamento2id[content] = (matchByTitulo as any).id;
            continue;
        }

        console.log('Equipamento', content, 'não encontrado, necessário em', memory.equipamentos[content], 'registros');
        runImport = false;
    }
}

async function validaTipoIntervencao() {
    const tipoIntervencao = await tipoIntervencaoApi.tipoIntervencaoControllerFindAll();
    for (const content in memory.tipo_intervencao) {
        const matchByTitulo = tipoIntervencao.data.linhas.find((tipo) => matchStringFuzzy(tipo.nome, content));
        if (matchByTitulo) {
            memory.tipo_intervencao2id[content] = (matchByTitulo as any).id;
            continue;
        }
        const pdmApi = new PDMApi(config);

        console.log(
            'Tipo de intervenção',
            content,
            'não encontrado, necessário em',
            memory.tipo_intervencao[content],
            'registros'
        );
        runImport = false;
    }
}

async function validaPrograma() {
    const programas = await programaApi.projetoProgramaMDOControllerFindAll();
    for (const programa in memory.programas) {
        const matchByTitulo = programas.data.linhas.find((prog) => matchStringFuzzy(prog.nome, programa));

        if (matchByTitulo) {
            memory.programa2id[programa] = (matchByTitulo as any).id;
            continue;
        }

        console.log('Programa', programa, 'não encontrado, necessário em', memory.programas[programa], 'registros');
        runImport = false;
    }
}

async function validaRegioes() {
    const regioes = await regiaoApi.regiaoControllerFindAll();
    for (const regiao in memory.regioes) {
        const matchByNome = regioes.data.linhas.find((reg) => matchStringFuzzy(reg.descricao, regiao));

        if (matchByNome) {
            if (matchByNome.nivel == 4) {
                memory.regiao2id[regiao] = matchByNome.parente_id!;
                continue;
            } else if (matchByNome.nivel == 3) {
                memory.regiao2id[regiao] = matchByNome.id!;
                continue;
            }
        }

        console.log('Região', regiao, 'não encontrado, necessário em', memory.regioes[regiao], 'registros');
        runImport = false;
    }
}

async function validaEtapas() {
    const etapas = await etapaApi.projetoEtapaMDOControllerFindAll();
    for (const content in memory.etapas) {
        const matchByTitulo = etapas.data.linhas.find((etapa) => matchStringFuzzy(etapa.descricao, content));
        if (matchByTitulo) {
            memory.etapa2id[content] = (matchByTitulo as any).id;
            continue;
        }

        console.log('Etapa', content, 'não encontrado, necessário em', memory.etapas[content], 'registros');
        runImport = false;
    }
}

async function validaPortfolios() {
    const portfolios = await portApi.portfolioMDOControllerFindAll();
    for (const portifolio in memory.portfolios) {
        const matchByTitulo = portfolios.data.linhas.find((port) => matchStringFuzzy(port.titulo, portifolio));

        if (matchByTitulo) {
            memory.portfolios[portifolio] = matchByTitulo.id!;
            continue;
        }

        console.log(
            'Portifolio',
            portifolio,
            'não encontrado, necessário em',
            memory.portfolios[portifolio],
            'registros'
        );
        runImport = false;
    }
}

async function validaOrgaos() {
    const orgaos = await orgaoApi.orgaoControllerFindAll();
    for (const content in memory.orgaos) {
        const matchByCodigo = orgaos.data.linhas.find((orgao) => matchStringFuzzy(orgao.sigla, content));

        if (matchByCodigo) {
            memory.orgao2id[content] = matchByCodigo.id!;
            continue;
        }

        const matchByNome = orgaos.data.linhas.find((orgao) => orgao.descricao === content);

        if (matchByNome) {
            memory.orgao2id[content] = matchByNome.id!;
            continue;
        }

        console.log('Órgão', content, 'não encontrado, necessário em', memory.orgaos[content], 'registros');
        runImport = false;
    }
}

async function buscaPessoas() {
    const dbPessoasCollabProjeto = await pessoaApi.pessoaControllerFindAll({
        mdo_colaborador_de_projeto: true,
    });
    const dbPessoasGestorDeProjeto = await pessoaApi.pessoaControllerFindAll({
        mdo_gestor_de_projeto: true,
    });

    const pessoasCollabProjeto: Record<string, number> = {};
    for (const pessoa of dbPessoasCollabProjeto.data.linhas) {
        pessoasCollabProjeto[pessoa.email] = pessoa.id;
    }
    const pessoasGestorDeProjeto: Record<string, number> = {};
    for (const pessoa of dbPessoasGestorDeProjeto.data.linhas) {
        pessoasGestorDeProjeto[pessoa.email] = pessoa.id;
    }
    return { pessoasCollabProjeto, pessoasGestorDeProjeto };
}

function validaPessoas(pessoasCollabProjeto: Record<string, number>, pessoasGestorDeProjeto: Record<string, number>) {
    for (const email in memory.rel_responsaveis_no_orgao_gestor_id) {
        const count = memory.rel_responsaveis_no_orgao_gestor_id[email];
        if (!pessoasCollabProjeto[email]) {
            runImport = false;
            console.log('Faltando rel_responsaveis_no_orgao_gestor_id', email, 'necessário em', count, 'registros');
        }
    }
    for (const email in memory.rel_responsavel_id) {
        const count = memory.rel_responsavel_id[email];
        if (!pessoasGestorDeProjeto[email]) {
            runImport = false;
            console.log('Faltando rel_responsavel_id', email, 'necessário em', count, 'registros');
        }
    }
}

function matchStringFuzzy(str1: string | undefined | null, str2: string | undefined | null): boolean {
    if (!str1 || !str2) {
        return false;
    }

    const normalizeString = (str: string): string => {
        let tmp = str
            .toLocaleLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

        tmp = tmp.replace(/\s+/g, ' ');
        tmp = tmp.replace(/[^a-z0-9 ]/g, '');
        return tmp;
    };

    return normalizeString(str1) === normalizeString(str2);
}
