import { Database } from 'duckdb-async';
import { matchStringFuzzy } from './func';
import {
    CadastroDeObrasProjetosApi,
    Configuration,
    IniciativaApi,
    MetaApi,
    MonitoramentoDeObrasCadastroBsicoEmpreendimentoApi,
    MonitoramentoDeObrasCadastroBsicoEquipamentoApi,
    MonitoramentoDeObrasCadastroBsicoGrupoTemticoApi,
    MonitoramentoDeObrasCadastroBsicoTipoDeIntervenoApi,
    PessoaApi,
    PortflioDeObrasApi,
    ProgramasProjetoMDOExclusivoParaObrasApi,
    ProjetoAcompanhamentoDeObrasApi,
    ProjetoApi,
    ProjetoEtapaDeObrasApi,
    ProjetoMDOApi,
    ProjetoOrigemTipo,
    ProjetoStatus,
    RegiaoApi,
    RgoApi,
    type CreateProjetoDto,
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
    internal_id: number;
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
    parsed_processos_sei: string[];
    parsed_contratos: string[];
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

const projetoApi = new CadastroDeObrasProjetosApi(config);
const processoApi = new ProjetoAcompanhamentoDeObrasApi(config);

const empreendimentoApi = new MonitoramentoDeObrasCadastroBsicoEmpreendimentoApi(config);
const equipamentoApi = new MonitoramentoDeObrasCadastroBsicoEquipamentoApi(config);
const grupoTematicoApi = new MonitoramentoDeObrasCadastroBsicoGrupoTemticoApi(config);
const tipoIntervencaoApi = new MonitoramentoDeObrasCadastroBsicoTipoDeIntervenoApi(config);
const metaApi = new MetaApi(config);
const iniciativaApi = new IniciativaApi(config);

const PDM_STR = 'Programa de Metas 2021-2024 - Versão Alteração Programática';

const rel_responsaveis_no_orgao_gestor_id: Record<string, number> = {};
const rel_responsavel_id: Record<string, number> = {};
const orgaos: Record<string, number> = {};
const portfolios: Record<string, number> = {};
const orgao2id: Record<string, number> = {};
const etapas: Record<string, number> = {};
const etapa2id: Record<string, number> = {};
const regioes: Record<string, number> = {};
const regiao2id: Record<string, number> = {};
const programas: Record<string, number> = {};
const programa2id: Record<string, number> = {};
const tipo_intervencao: Record<string, number> = {};
const tipo_intervencao2id: Record<string, number> = {};
const equipamentos: Record<string, number> = {};
const equipamento2id: Record<string, number> = {};
const grupo_tematico: Record<string, number> = {};
const grupo_tematico2id: Record<string, number> = {};
const pdm2id: Record<string, number> = {
    [PDM_STR]: 11,
};
const memMeta: Record<string, number> = {};
const memMeta2id: Record<string, number> = {};
const memMeta2cod: Record<string, string> = {};
const memIniciativa: Record<string, Record<string, number>> = {};
const memIniciativa2id: Record<string, Record<string, number>> = {};

export const CONST_PROC_SEI_SINPROC_REGEXP = /(?:\d{4}\.?\d{4}\/?\d{7}\-?\d|\d{4}\-?\d\.?\d{3}\.?\d{3}\-?\d)/;
const seiRegexp = new RegExp(CONST_PROC_SEI_SINPROC_REGEXP, 'g');

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
        incrementResponsaveis(row);
        incrementOrgaos(row);
        incrementPortfolioCount(row);
        incrementEtapaCount(row);
        incrementRegiaoCount(row);
        incrementProgramCount(row);
        incrementTipoIntervencaoCount(row);
        incrementEquipamentoCount(row);
        incrementGroupThemeCount(row);
        incrementIniciativaCount(row);
        extractAndNormalizeSEIProcesses(row);
        extractContracts(row);

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
    await validaMetas();
    await validaIniciativas();
    console.log(orgao2id);

    if (!runImport) {
        console.log('Importação não pode ser realizada');
        return;
    }

    const empreendimentos = await empreendimentoApi.empreendimentoControllerFindAll();
    const empreendimentosMap: Record<string, number> = {};
    const empreendimento2id: Record<string, number> = {};
    for (const emp of empreendimentos.data.linhas) {
        empreendimentosMap[emp.identificador] = emp.id!;
    }

    for (const row of rows) {
        if (!row.rel_empreendimento_id) continue;
        const exists = empreendimentosMap[row.rel_empreendimento_id];
        if (exists) continue;

        try {
            const emp = await empreendimentoApi.empreendimentoControllerCreate({
                CreateEmpreendimentoDto: {
                    nome: row.rel_empreendimento_id,
                    identificador: row.rel_empreendimento_id,
                },
            });
            empreendimento2id[row.rel_empreendimento_id] = emp.data.id;
        } catch (error) {
            console.log('Erro ao criar empreendimento', row.projeto_nome, row.rel_empreendimento_id);
            console.error(row.rel_empreendimento_id, (error as any).response?.data);
        }
    }

    for (const row of rows) {
        let origem_tipo: ProjetoOrigemTipo = 'Outro';
        let iniciativa_id: number | undefined;
        let meta_id: number | undefined;
        let origem_outro: string | null;

        if (row.origem_pdm) {
            origem_tipo = 'PdmSistema';
            origem_outro = null;
            if (row.origem_iniciativa_id) {
                iniciativa_id = memIniciativa2id[row.origem_meta_id!][row.origem_iniciativa_id];
            } else if (row.origem_meta_id) {
                meta_id = memMeta2id[row.origem_meta_id];
            } else {
                //console.error(`-> Erro ao buscar iniciativa ou meta para a obra ${row.projeto_nome}, ${JSON.stringify(row)}`);
                origem_tipo = 'Outro';
                origem_outro = 'Meta ou iniciativa não informada';
            }
        } else {
            origem_outro = row.origem_outro || '-';
        }

        const regiao_id =
            row.rel_subprefeitura_id == 'Várias'
                ? undefined
                : row.rel_subprefeitura_id
                ? regiao2id[row.rel_subprefeitura_id]
                : undefined;

        const regiao = regiao_id ? regiao2id[regiao_id] : undefined;

        const info: CreateProjetoDto = {
            nome: row.projeto_nome,
            status: row.projeto_status as ProjetoStatus,
            grupo_tematico_id: row.rel_grupo_tematico_id ? grupo_tematico2id[row.rel_grupo_tematico_id] : undefined,
            tipo_intervencao_id: row.rel_tipo_intervencao_id
                ? tipo_intervencao2id[row.rel_tipo_intervencao_id]
                : undefined,
            equipamento_id: row.rel_equipamento_id ? equipamento2id[row.rel_equipamento_id] : undefined,
            orgao_origem_id: row.rel_orgao_origem_id ? orgao2id[row.rel_orgao_origem_id] : undefined,
            orgao_executor_id: row.rel_orgao_executor_id ? orgao2id[row.rel_orgao_executor_id] : undefined,
            empreendimento_id: empreendimento2id[row.rel_empreendimento_id],
            mdo_detalhamento: row.mdo_detalhamento ?? '',

            previsao_inicio: row.previsao_inicio?.toISOString().substring(0, 10) ?? (null as any),
            previsao_termino: row.previsao_termino?.toISOString().substring(0, 10) ?? null,
            tolerancia_atraso: 0,
            mdo_previsao_inauguracao: null,

            previsao_custo: row.previsao_custo ? +row.previsao_custo.toPrecision(2) : null,

            mdo_observacoes:
                row.rel_subprefeitura_id == 'Várias'
                    ? `${row.mdo_observacoes ?? ''} - Várias regiões`
                    : row.mdo_observacoes ?? '',

            orgao_gestor_id: orgao2id[row.rel_orgao_gestor_id],
            responsaveis_no_orgao_gestor: [pessoasCollabProjeto[row.rel_responsaveis_no_orgao_gestor_id]],
            secretario_executivo: row.secretario_executivo?.toLowerCase() ?? null,

            orgao_responsavel_id: orgao2id[row.orgao_responsavel_id],
            responsavel_id: pessoasGestorDeProjeto[row.rel_responsavel_id],
            secretario_responsavel: row.secretario_responsavel?.toLowerCase(),

            orgao_colaborador_id: row.rel_orgao_colaborador_id ? orgao2id[row.rel_orgao_colaborador_id] : undefined,

            colaboradores_no_orgao: row.rel_colaboradores_no_orgao
                ? [pessoasCollabProjeto[row.rel_colaboradores_no_orgao]]
                : undefined,
            secretario_colaborador: row.secretario_colaborador?.toLowerCase() ?? null,

            portfolio_id: portfolios[row.rel_portfolio_id],
            mdo_n_familias_beneficiadas: row.mdo_n_familias_beneficiadas,
            mdo_n_unidades_habitacionais: row.mdo_n_unidades_habitacionais,
            programa_id: row.rel_programa_id ? programa2id[row.rel_programa_id] : undefined,
            regiao_ids: regiao ? [regiao] : undefined,
            origem_tipo,
            origem_outro: origem_outro,
            iniciativa_id,
            meta_id,

            orgaos_participantes: [],
            geolocalizacao: [],
        };

        if (!row.projeto_id) {
            try {
                const projetoId = await projetoApi.projetoMDOControllerCreate({
                    CreateProjetoDto: info,
                });
                console.log(`Projeto ${row.projeto_nome} criado com sucesso!`);
                await db.run(
                    `update importacao set projeto_id = ${projetoId.data.id} where internal_id = ${row.internal_id}`
                );
                row.projeto_id = projetoId.data.id;
            } catch (error) {
                console.log(`Erro ao criar projeto ${row.projeto_nome}`);

                const errAsObj = (error as any).response?.data;
                console.error(errAsObj, info);

                const asJson = JSON.stringify({ response: errAsObj, request: info });

                await db.run(`
                    update importacao set err_msg = '${asJson}' where internal_id = ${row.internal_id}
                `);
            }
        }
        if (!row.projeto_id) continue;
        const can_associate = row.parsed_processos_sei.length == 1 && row.parsed_contratos.length == 1;

        if (row.parsed_contratos.length) {
            for (const contrato of row.parsed_contratos) {
                try {
                    await processoApi.contratoMDOControllerCreate({
                        CreateContratoDto: {
                            contrato_exclusivo: false,
                            fontes_recurso: [],
                            numero: contrato,
                            processos_sei: can_associate ? row.parsed_processos_sei : [],
                            status: 'Assinado',
                        },
                        id: row.projeto_id,
                    });

                    console.log(`Contrato ${contrato} do projeto ${row.projeto_nome} criados com sucesso!`);
                } catch (error) {
                    const err = (error as any).response?.data;
                    if (err?.message == 'Número igual ou semelhante já existe em outro registro ativo') {
                        console.log(`Contrato ${contrato} do projeto ${row.projeto_nome} já existe`);
                        continue;
                    }
                    console.log(`Erro ao criar contrato do projeto ${row.projeto_nome}`);
                    console.error((error as any).response?.data);
                }
            }
        }

        if (row.parsed_processos_sei.length) {
            for (const n_sei of row.parsed_processos_sei) {
                try {
                    await projetoApi.projetoMDOControllerCreateSEI({
                        CreateProjetoSeiDto: {
                            processo_sei: n_sei,
                            descricao: '',
                            link: undefined as any,
                        },
                        id: row.projeto_id,
                    });

                    console.log(`SEI ${n_sei} do projeto ${row.projeto_nome} criado com sucesso!`);
                } catch (error) {
                    const err = (error as any).response?.data;
                    if (err?.message?.includes('existe um registro do processo')) {
                        console.log(`SEI ${n_sei} do projeto ${row.projeto_nome} já existe`);
                        continue;
                    }
                    console.log(`Erro ao criar sei do projeto ${row.projeto_nome}`);
                    console.error((error as any).response?.data);
                }
            }
        }
    }
}

main();

function extractContracts(row: ProjetoRow) {
    row.parsed_contratos = [];
    if (row.mdo_numero_contrato) {
        row.parsed_contratos = row.mdo_numero_contrato.split(/,|\n/).map((r) => r.trim());
    }
}

function extractAndNormalizeSEIProcesses(row: ProjetoRow) {
    row.parsed_processos_sei = [];
    if (row.rel_processo_sei) {
        const processos: string[] = [];

        let match = seiRegexp.exec(row.rel_processo_sei);
        while (match != null) {
            processos.push(match[0].trim());
            match = seiRegexp.exec(row.rel_processo_sei);
        }
        row.parsed_processos_sei = processos.map((r) => normalizeProcesso(r));
    }
}

function incrementPortfolioCount(row: ProjetoRow) {
    if (!portfolios[row.rel_portfolio_id]) portfolios[row.rel_portfolio_id] = 0;
    portfolios[row.rel_portfolio_id] += 1;
}

function incrementResponsaveis(row: ProjetoRow) {
    if (!rel_responsaveis_no_orgao_gestor_id[row.rel_responsaveis_no_orgao_gestor_id])
        rel_responsaveis_no_orgao_gestor_id[row.rel_responsaveis_no_orgao_gestor_id] = 0;
    rel_responsaveis_no_orgao_gestor_id[row.rel_responsaveis_no_orgao_gestor_id] += 1;

    if (row.rel_colaboradores_no_orgao) {
        if (!rel_responsaveis_no_orgao_gestor_id[row.rel_colaboradores_no_orgao])
            rel_responsaveis_no_orgao_gestor_id[row.rel_colaboradores_no_orgao] = 0;
        rel_responsaveis_no_orgao_gestor_id[row.rel_colaboradores_no_orgao] += 1;
    }

    if (!rel_responsavel_id[row.rel_responsavel_id]) rel_responsavel_id[row.rel_responsavel_id] = 0;
    rel_responsavel_id[row.rel_responsavel_id] += 1;
}

function incrementOrgaos(row: ProjetoRow) {
    for (const col of LISTA_COL_ORGAO) {
        const rowValue = row[col]?.trim();
        if (!rowValue) continue;
        if (!orgaos[rowValue]) orgaos[rowValue] = 0;

        orgaos[rowValue] += 1;
    }
}

function incrementEtapaCount(row: ProjetoRow) {
    const etapa = row.rel_projeto_etapa_id?.trim();
    if (etapa) {
        if (!etapas[etapa]) etapas[etapa] = 0;
        etapas[etapa] += 1;
    }
}

function incrementProgramCount(row: ProjetoRow) {
    const programa = row.rel_programa_id?.trim();
    if (programa) {
        if (!programas[programa]) programas[programa] = 0;
        programas[programa] += 1;
    }
}

function incrementRegiaoCount(row: ProjetoRow) {
    const regiao = row.rel_subprefeitura_id?.trim();
    if (regiao) {
        if (!regioes[regiao]) regioes[regiao] = 0;
        regioes[regiao] += 1;
    }
}

function incrementIniciativaCount(row: ProjetoRow) {
    const metaX = row.origem_meta_id?.trim();
    if (metaX) {
        if (!memMeta[metaX]) memMeta[metaX] = 0;
        memMeta[metaX] += 1;
    }

    const iniciativa = row.origem_iniciativa_id?.trim();
    if (iniciativa && metaX) {
        if (!memIniciativa[metaX]) memIniciativa[metaX] = {};
        if (!memIniciativa[metaX][iniciativa]) memIniciativa[metaX][iniciativa] = 0;

        memIniciativa[metaX][iniciativa] += 1;
    }
}

function incrementGroupThemeCount(row: ProjetoRow) {
    const grupoTematico = row.rel_grupo_tematico_id?.trim();
    if (grupoTematico) {
        if (!grupo_tematico[grupoTematico]) grupo_tematico[grupoTematico] = 0;
        grupo_tematico[grupoTematico] += 1;
    }
}

function incrementEquipamentoCount(row: ProjetoRow) {
    const equipamento = row.rel_equipamento_id?.trim();
    if (equipamento) {
        if (!equipamentos[equipamento]) equipamentos[equipamento] = 0;
        equipamentos[equipamento] += 1;
    }
}

function incrementTipoIntervencaoCount(row: ProjetoRow) {
    const tipoIntervencao = row.rel_tipo_intervencao_id?.trim();
    if (tipoIntervencao) {
        if (!tipo_intervencao[tipoIntervencao]) tipo_intervencao[tipoIntervencao] = 0;
        tipo_intervencao[tipoIntervencao] += 1;
    }
}

async function validaIniciativas() {
    for (const metaCodigoOrCodigo in memIniciativa) {
        const metaId = memMeta2id[metaCodigoOrCodigo];
        if (!metaId) {
            runImport = false;
            continue;
        }
        const metaCod = memMeta2cod[metaCodigoOrCodigo];
        const iniciativasNaApi = await iniciativaApi.iniciativaControllerFindAll({
            meta_id: memMeta2id[metaCodigoOrCodigo],
        });
        for (const iniciativaCodigo in memIniciativa[metaCodigoOrCodigo]) {
            const matchByCodigo = iniciativasNaApi.data.linhas.find((iniciativa) =>
                matchStringFuzzy(iniciativa.codigo, metaCod + '.' + iniciativaCodigo)
            );
            if (matchByCodigo) {
                memIniciativa2id[metaCodigoOrCodigo] = memIniciativa2id[metaCodigoOrCodigo] || {};
                memIniciativa2id[metaCodigoOrCodigo][iniciativaCodigo] = (matchByCodigo as any).id;
                continue;
            }
            console.log(
                'Iniciativa',
                iniciativaCodigo,
                'não encontrado, necessário em',
                memIniciativa[metaCodigoOrCodigo][iniciativaCodigo],
                'registros'
            );
            runImport = false;
        }
    }
}

async function validaMetas() {
    const metasNaApi = await metaApi.metaControllerFindAll({
        pdm_id: 11,
    });

    for (const contentRaw in memMeta) {
        let content = contentRaw;
        if (content.includes('-')) {
            content = content.split('-')[0].trim();
        }

        const metaByCodigo = metasNaApi.data.linhas.find((meta) => matchStringFuzzy(meta.codigo, content));
        if (metaByCodigo) {
            memMeta2id[contentRaw] = metaByCodigo.id!;
            memMeta2cod[contentRaw] = metaByCodigo.codigo;
            continue;
        }

        const metaByDesc = metasNaApi.data.linhas.find((meta) => matchStringFuzzy(meta.titulo, content));
        if (metaByDesc) {
            memMeta2id[contentRaw] = metaByDesc.id!;
            memMeta2cod[contentRaw] = metaByDesc.codigo;
            continue;
        }

        console.log('Meta', content, 'não encontrado, necessário em', memMeta[contentRaw], 'registros');
        runImport = false;
    }
}

async function validaGrupoTematico() {
    const grupoTematico = await grupoTematicoApi.grupoTematicoControllerFindAll();
    for (const content in grupo_tematico) {
        const matchByTitulo = grupoTematico.data.linhas.find((grupo) => matchStringFuzzy(grupo.nome, content));
        if (matchByTitulo) {
            grupo_tematico2id[content] = (matchByTitulo as any).id;
            continue;
        }

        console.log('Grupo temático', content, 'não encontrado, necessário em', grupo_tematico[content], 'registros');
        runImport = false;
    }
}

async function validaEquipamento() {
    const equipamentosRows = await equipamentoApi.equipamentoControllerFindAll();
    for (const content in equipamentos) {
        const matchByTitulo = equipamentosRows.data.linhas.find((equip) => matchStringFuzzy(equip.nome, content));
        if (matchByTitulo) {
            equipamento2id[content] = (matchByTitulo as any).id;
            continue;
        }

        console.log('Equipamento', content, 'não encontrado, necessário em', equipamentos[content], 'registros');
        runImport = false;
    }
}

async function validaTipoIntervencao() {
    const tipoIntervencao = await tipoIntervencaoApi.tipoIntervencaoControllerFindAll();
    for (const content in tipo_intervencao) {
        const matchByTitulo = tipoIntervencao.data.linhas.find((tipo) => matchStringFuzzy(tipo.nome, content));
        if (matchByTitulo) {
            tipo_intervencao2id[content] = (matchByTitulo as any).id;
            continue;
        }

        console.log(
            'Tipo de intervenção',
            content,
            'não encontrado, necessário em',
            tipo_intervencao[content],
            'registros'
        );
        runImport = false;
    }
}

async function validaPrograma() {
    const programasNoDb = await programaApi.projetoProgramaMDOControllerFindAll();
    for (const programa in programas) {
        const matchByTitulo = programasNoDb.data.linhas.find((prog) => matchStringFuzzy(prog.nome, programa));

        if (matchByTitulo) {
            programa2id[programa] = (matchByTitulo as any).id;
            continue;
        }

        console.log('Programa', programa, 'não encontrado, necessário em', programas[programa], 'registros');
        runImport = false;
    }
}

async function validaRegioes() {
    const regioesNoDb = await regiaoApi.regiaoControllerFindAll();
    for (const regiao in regioes) {
        if (regiao == 'Várias') continue;

        const matchByNome = regioesNoDb.data.linhas.find((reg) => matchStringFuzzy(reg.descricao, regiao));

        if (matchByNome) {
            if (matchByNome.nivel == 4) {
                regiao2id[regiao] = matchByNome.parente_id!;
                continue;
            } else if (matchByNome.nivel == 3) {
                regiao2id[regiao] = matchByNome.id!;
                continue;
            }
        }

        console.log('Região', regiao, 'não encontrado, necessário em', regioes[regiao], 'registros');
        runImport = false;
    }
}

async function validaEtapas() {
    const etapasNoDb = await etapaApi.projetoEtapaMDOControllerFindAll();
    for (const content in etapas) {
        const matchByTitulo = etapasNoDb.data.linhas.find((etapa) => matchStringFuzzy(etapa.descricao, content));
        if (matchByTitulo) {
            etapa2id[content] = (matchByTitulo as any).id;
            continue;
        }

        console.log('Etapa', content, 'não encontrado, necessário em', etapas[content], 'registros');
        runImport = false;
    }
}

async function validaPortfolios() {
    const portfoliosNoDb = await portApi.portfolioMDOControllerFindAll();
    for (const portifolio in portfolios) {
        const matchByTitulo = portfoliosNoDb.data.linhas.find((port) => matchStringFuzzy(port.titulo, portifolio));

        if (matchByTitulo) {
            portfolios[portifolio] = matchByTitulo.id!;
            continue;
        }

        console.log('Portifolio', portifolio, 'não encontrado, necessário em', portfolios[portifolio], 'registros');
        runImport = false;
    }
}

async function validaOrgaos() {
    const orgaosNoDb = await orgaoApi.orgaoControllerFindAll();
    for (const contentRaw in orgaos) {
        let content = contentRaw;
        if (content.includes(' - ')) {
            content = content.split(' - ')[0].trim();
        }
        const matchByCodigo = orgaosNoDb.data.linhas.find((orgao) => matchStringFuzzy(orgao.sigla, content));
        if (matchByCodigo) {
            orgao2id[contentRaw] = matchByCodigo.id!;
            continue;
        }

        const matchByNome = orgaosNoDb.data.linhas.find(
            (orgao) => matchStringFuzzy(orgao.descricao, content) || matchStringFuzzy(orgao.descricao, contentRaw)
        );
        if (matchByNome) {
            orgao2id[contentRaw] = matchByNome.id!;
            continue;
        }

        console.log('Órgão', contentRaw, 'não encontrado, necessário em', orgaos[contentRaw], 'registros');
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
    for (const email in rel_responsaveis_no_orgao_gestor_id) {
        const count = rel_responsaveis_no_orgao_gestor_id[email];
        if (!pessoasGestorDeProjeto[email]) {
            runImport = false;
            console.log('Faltando pessoasGestorDeProjeto', email, 'necessário em', count, 'registros');
        }
    }

    for (const email in rel_responsavel_id) {
        const count = rel_responsavel_id[email];
        if (!pessoasCollabProjeto[email]) {
            runImport = false;
            console.log('Faltando rel_responsavel_id', email, 'necessário em', count, 'registros');
        }
    }
}

function normalizeProcesso(processo: string): string {
    const cleanedProcesso = processo.replace(/[^0-9]/g, '');

    if (cleanedProcesso.length === 16) {
        // SEI format (DDDDDD.DDDD/DDDDDDD-D):
        const part1 = cleanedProcesso.substring(0, 4);
        const part2 = cleanedProcesso.substring(4, 8);
        const part3 = cleanedProcesso.substring(8, 15);
        const part4 = cleanedProcesso.substring(15, 16);
        return `${part1}.${part2}/${part3}-${part4}`;
    } else if (cleanedProcesso.length === 12) {
        // SINPROC format (YYYY-D.DDD.DDD-D):
        const year = cleanedProcesso.substring(0, 4);
        const part2 = cleanedProcesso.substring(4, 5);
        const part3 = cleanedProcesso.substring(5, 8);
        const part4 = cleanedProcesso.substring(8, 11);
        const part5 = cleanedProcesso.substring(11, 12);
        return `${year}-${part2}.${part3}.${part4}-${part5}`;
    } else {
        return processo;
    }
}
