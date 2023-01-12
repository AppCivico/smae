"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient({ log: ['query'] });
var PrivConfig = {
    CadastroCargo: false,
    CadastroCoordenadoria: false,
    CadastroDepartamento: false,
    CadastroDivisaoTecnica: false,
    CadastroFonteRecurso: [
        ['CadastroFonteRecurso.inserir', 'Inserir Fonte de Recurso'],
        ['CadastroFonteRecurso.editar', 'Editar Fonte de Recurso'],
        ['CadastroFonteRecurso.remover', 'Remover Fonte de Recurso'],
    ],
    CadastroOds: [
        ['CadastroOds.inserir', 'Inserir ODS'],
        ['CadastroOds.editar', 'Editar ODS'],
        ['CadastroOds.remover', 'Remover ODS'],
    ],
    CadastroOrgao: [
        ['CadastroOrgao.inserir', 'Inserir órgão'],
        ['CadastroOrgao.editar', 'Editar órgão'],
        ['CadastroOrgao.remover', 'Remover órgão'],
    ],
    CadastroTipoOrgao: [
        ['CadastroTipoOrgao.inserir', 'Inserir tipo órgão'],
        ['CadastroTipoOrgao.editar', 'Editar tipo órgão'],
        ['CadastroTipoOrgao.remover', 'Remover tipo órgão'],
    ],
    CadastroTipoDocumento: [
        ['CadastroTipoDocumento.inserir', 'Inserir tipo de documento'],
        ['CadastroTipoDocumento.editar', 'Editar tipo de documento'],
        ['CadastroTipoDocumento.remover', 'Remover tipo de documento'],
    ],
    CadastroPessoa: [
        ['CadastroPessoa.inserir', 'Inserir novas pessoas com o mesmo órgão'],
        ['CadastroPessoa.editar', 'Editar dados das pessoas com o mesmo órgão'],
        ['CadastroPessoa.inativar', 'Inativar pessoas com o mesmo órgão'],
        ['CadastroPessoa.ativar', 'Ativar pessoas com o mesmo órgão'],
        ['CadastroPessoa.administrador', 'Editar/Inserir/Inativar/Ativar qualquer pessoa, até mesmo outros administradores'],
    ],
    CadastroEixo: false,
    CadastroMacroTema: [
        ['CadastroMacroTema.inserir', 'Inserir Macro Tema'],
        ['CadastroMacroTema.editar', 'Editar Macro Tema'],
        ['CadastroMacroTema.remover', 'Remover Macro Tema'],
    ],
    CadastroObjetivoEstrategico: false,
    CadastroTema: [
        ['CadastroTema.inserir', 'Inserir Macro Tema'],
        ['CadastroTema.editar', 'Editar Macro Tema'],
        ['CadastroTema.remover', 'Remover Macro Tema'],
    ],
    CadastroSubTema: [
        ['CadastroSubTema.inserir', 'Inserir Macro Tema'],
        ['CadastroSubTema.editar', 'Editar Macro Tema'],
        ['CadastroSubTema.remover', 'Remover Macro Tema'],
    ],
    CadastroTag: [
        ['CadastroTag.inserir', 'Inserir Tag'],
        ['CadastroTag.editar', 'Editar Tag'],
        ['CadastroTag.remover', 'Remover Tag'],
    ],
    CadastroPdm: [
        ['CadastroPdm.inserir', 'Inserir PDM'],
        ['CadastroPdm.editar', 'Editar PDM'],
        ['CadastroPdm.inativar', 'Inativar PDM'],
        ['CadastroPdm.ativar', 'Ativar PDM'],
    ],
    CadastroRegiao: [
        ['CadastroRegiao.inserir', 'Inserir Regiões'],
        ['CadastroRegiao.editar', 'Editar Regiões'],
        ['CadastroRegiao.remover', 'Remover Regiões'],
    ],
    CadastroMeta: [
        ['CadastroMeta.inserir', 'Inserir Metas'],
        ['CadastroMeta.editar', 'Editar Metas'],
        ['CadastroMeta.remover', 'Remover Metas'],
        ['CadastroMeta.inativar', 'Inativar Metas'],
        ['CadastroMeta.ativar', 'Ativar Metas'],
        ['CadastroMeta.orcamento', 'Atualizar a Execução Orçamentária'],
    ],
    CadastroIndicador: [
        // quem puder editar ou inserir indicador, vai poder gerenciar as variáveis
        ['CadastroIndicador.inserir', 'Inserir Indicadores e variáveis'],
        ['CadastroIndicador.editar', 'Editar Indicadores e variáveis'],
        ['CadastroIndicador.remover', 'Remover Indicadores e variáveis'],
        ['CadastroIndicador.inativar', 'Inativar Indicadores e variáveis'],
        ['CadastroIndicador.ativar', 'Ativar Indicadores e variáveis'],
    ],
    CadastroUnidadeMedida: [
        ['CadastroUnidadeMedida.inserir', 'Inserir Unidade de Medida'],
        ['CadastroUnidadeMedida.editar', 'Editar Unidade de Medida'],
        ['CadastroUnidadeMedida.remover', 'Remover Unidade de Medida'],
    ],
    CadastroIniciativa: [
        ['CadastroIniciativa.inserir', 'Inserir Iniciativas'],
        ['CadastroIniciativa.editar', 'Editar Iniciativas'],
        ['CadastroIniciativa.remover', 'Remover Iniciativas'],
        ['CadastroIniciativa.inativar', 'Inativar Iniciativas'],
        ['CadastroIniciativa.ativar', 'Ativar Iniciativas'],
    ],
    CadastroAtividade: [
        ['CadastroAtividade.inserir', 'Inserir Atividades'],
        ['CadastroAtividade.editar', 'Editar Atividades'],
        ['CadastroAtividade.remover', 'Remover Atividades'],
        ['CadastroAtividade.inativar', 'Inativar Atividades'],
        ['CadastroAtividade.ativar', 'Ativar Atividades'],
    ],
    CadastroCronograma: [
        ['CadastroCronograma.inserir', 'Inserir Cronogramas'],
        ['CadastroCronograma.editar', 'Editar Cronogramas'],
        ['CadastroCronograma.remover', 'Remover Cronogramas'],
        ['CadastroCronograma.inativar', 'Inativar Cronogramas'],
        ['CadastroCronograma.ativar', 'Ativar Cronogramas'],
    ],
    CadastroEtapa: [
        ['CadastroEtapa.inserir', 'Inserir Etapas'],
        ['CadastroEtapa.editar', 'Editar Etapas'],
        ['CadastroEtapa.remover', 'Remover Etapas'],
        ['CadastroEtapa.inativar', 'Inativar Etapas'],
        ['CadastroEtapa.ativar', 'Ativar Etapas'],
    ],
    CadastroCicloFisico: [
        ['CadastroCicloFisico.inserir', 'Inserir Ciclos Físicos'],
        ['CadastroCicloFisico.editar', 'Editar Ciclos Físicos'],
        ['CadastroCicloFisico.remover', 'Remover Ciclos Físicos'],
        ['CadastroCicloFisico.inativar', 'Inativar Ciclos Físicos'],
        ['CadastroCicloFisico.ativar', 'Ativar Ciclos Físicos'],
    ],
    CadastroPainel: [
        ['CadastroPainel.inserir', 'Inserir Painéis'],
        ['CadastroPainel.editar', 'Editar Painéis'],
        ['CadastroPainel.remover', 'Remover Painéis'],
        ['CadastroPainel.inativar', 'Inativar Painéis'],
        ['CadastroPainel.ativar', 'Ativar Painéis'],
    ],
    CadastroGrupoPaineis: [
        ['CadastroGrupoPaineis.inserir', 'Inserir Painéis'],
        ['CadastroGrupoPaineis.editar', 'Editar Painéis'],
        ['CadastroGrupoPaineis.inativar', 'Inativar Painéis'],
        ['CadastroGrupoPaineis.ativar', 'Ativar Painéis'],
    ],
    Config: [
        ['Config.editar', 'Editar configuração de textos do sistema'],
    ],
    Reports: [
        ['Reports.executar', 'Executar relatórios'],
        ['Reports.remover', 'Remover relatórios'],
    ],
    PDM: [
        ['PDM.coordenador_responsavel_cp', '(PDM) Coordenador Responsável CP'],
        ['PDM.tecnico_cp', '(PDM) Técnico CP'],
        ['PDM.admin_cp', '(PDM) Administrador CP'],
        ['PDM.ponto_focal', '(PDM) Ponto Focal'],
    ]
};
var ModuloDescricao = {
    CadastroOrgao: 'Cadastro de Órgão',
    CadastroTipoOrgao: 'Cadastro de Tipo de Órgão',
    CadastroPessoa: 'Cadastro de pessoas',
    CadastroOds: 'Cadastro de ODS',
    CadastroPdm: 'Cadastro do PDM',
    CadastroFonteRecurso: 'Cadastro de Fonte de Recurso',
    CadastroTipoDocumento: 'Cadastro de Tipo de Arquivo',
    CadastroTag: 'Cadastro de Tag',
    CadastroMacroTema: 'Cadastro de Macro Tema',
    CadastroSubTema: 'Cadastro de Sub Tema',
    CadastroTema: 'Cadastro de Tema',
    CadastroRegiao: 'Cadastro de Regiões',
    CadastroMeta: 'Cadastro de Metas',
    CadastroIndicador: 'Cadastro de Indicadores',
    CadastroUnidadeMedida: 'Cadastro de Unidade de Medidas',
    CadastroIniciativa: 'Cadastro de Iniciativas',
    CadastroAtividade: 'Cadastro de Atividades',
    CadastroCronograma: 'Cadastro de Cronogramas',
    CadastroEtapa: 'Cadastro de Etapas',
    CadastroCicloFisico: 'Cadastro de Ciclos Físicos',
    CadastroPainel: 'Cadastro de Painéis',
    CadastroGrupoPaineis: 'Cadastro de Grupos de Painéis',
    Config: 'Configurações do Sistema',
    Reports: 'Relatórios',
    PDM: 'Regras de Negocio do PDM'
};
var todosPrivilegios = [];
for (var codModulo in PrivConfig) {
    var privilegio = PrivConfig[codModulo];
    if (privilegio === false)
        continue;
    for (var _i = 0, privilegio_1 = privilegio; _i < privilegio_1.length; _i++) {
        var priv = privilegio_1[_i];
        todosPrivilegios.push(priv[0]);
    }
}
console.log(todosPrivilegios);
var PerfilAcessoConfig = [
    {
        nome: 'Administrador Geral',
        descricao: 'Administrador Geral',
        privilegios: todosPrivilegios.filter(function (e) { return /^PDM\./.test(e) === false; })
    },
    {
        nome: 'Coordenadoria de Planejamento',
        descricao: 'Coordenadoria de Planejamento',
        privilegios: []
    },
    {
        nome: 'Unidade de Entregas',
        descricao: 'Unidade de Entregas',
        privilegios: []
    },
    {
        nome: 'Responsável por meta na CP',
        descricao: 'Usuários com esta opção podem ser selecionados como Responsável da Coordenadoria na criação/edição de Metas',
        privilegios: [
            'PDM.coordenador_responsavel_cp',
            'PDM.tecnico_cp',
        ]
    },
    {
        nome: 'Administrador CP',
        descricao: 'Pode visualizar e editar dados de todas as metas, em todos os ciclos',
        privilegios: [
            'PDM.admin_cp',
        ]
    },
    {
        nome: 'Técnico CP',
        descricao: 'REMOVER',
        privilegios: []
    },
    {
        nome: 'Ponto Focal',
        descricao: 'Vê somente as metas onde há dados para registrar evolução no ciclo corrente',
        privilegios: [
            'PDM.ponto_focal',
        ]
    },
];
console.log(PerfilAcessoConfig);
function main() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, criar_emaildb_config()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, criar_texto_config()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, atualizar_modulos_e_privilegios()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, atualizar_perfil_acesso()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, atualizar_superadmin()];
                case 5:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/*

async function atualizar_orgao() {
    let list = [{ sigla: 'SEPEP', desc: 'Secretaria Executiva de Planejamento e Entregas Prioritárias', tipo: 'Secretaria' }];

    for (const item of list) {
        const tipo = await prisma.tipoOrgao.findFirstOrThrow({
            where: { descricao: item.tipo },
        });

        await prisma.orgao.upsert({
            where: { descricao: item.desc },
            update: {
                sigla: item.sigla,
                tipo_orgao_id: tipo.id,
            },
            create: {
                sigla: item.sigla,
                descricao: item.desc,
                tipo_orgao_id: tipo.id,
            },
        });
    }
}

async function atualizar_ods() {
    let list = [{ numero: 1, titulo: 'Erradicação da Pobreza' }];

    for (const desc of list) {
        await prisma.ods.upsert({
            where: { numero: desc.numero },
            update: { titulo: desc.titulo },
            create: {
                numero: desc.numero as number,
                titulo: desc.titulo,
                descricao: ''
            },
        });
    }
}

async function atualizar_tipo_orgao() {
    let list = ['Secretaria', 'Subprefeitura', 'Autarquia', 'Empresa Pública'];

    for (const desc of list) {
        let found = await prisma.tipoOrgao.findFirst({ where: { descricao: desc }, select: { id: true } });
        if (!found) {
            found = await prisma.tipoOrgao.create({
                data: {
                    descricao: desc
                }, select: { id: true }
            });
        }
    }
}
*/
function atualizar_modulos_e_privilegios() {
    return __awaiter(this, void 0, void 0, function () {
        var promises, _a, _b, _c, _i, codModulo, privilegio, moduloObject, _d, privilegio_2, priv;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    promises = [];
                    _a = PrivConfig;
                    _b = [];
                    for (_c in _a)
                        _b.push(_c);
                    _i = 0;
                    _e.label = 1;
                case 1:
                    if (!(_i < _b.length)) return [3 /*break*/, 8];
                    _c = _b[_i];
                    if (!(_c in _a)) return [3 /*break*/, 7];
                    codModulo = _c;
                    privilegio = PrivConfig[codModulo];
                    if (!(privilegio === false)) return [3 /*break*/, 5];
                    return [4 /*yield*/, prisma.perfilPrivilegio.deleteMany({
                            where: {
                                privilegio: {
                                    modulo: {
                                        codigo: codModulo
                                    }
                                }
                            }
                        })];
                case 2:
                    _e.sent();
                    return [4 /*yield*/, prisma.privilegio.deleteMany({
                            where: {
                                modulo: {
                                    codigo: codModulo
                                }
                            }
                        })];
                case 3:
                    _e.sent();
                    return [4 /*yield*/, prisma.modulo.deleteMany({
                            where: {
                                codigo: codModulo
                            }
                        })];
                case 4:
                    _e.sent();
                    return [3 /*break*/, 7];
                case 5: return [4 /*yield*/, prisma.modulo.upsert({
                        where: { codigo: codModulo },
                        update: {
                            descricao: ModuloDescricao[codModulo]
                        },
                        create: {
                            codigo: codModulo,
                            descricao: ModuloDescricao[codModulo]
                        }
                    })];
                case 6:
                    moduloObject = _e.sent();
                    for (_d = 0, privilegio_2 = privilegio; _d < privilegio_2.length; _d++) {
                        priv = privilegio_2[_d];
                        promises.push(upsert_privilegios(moduloObject.id, priv[0], priv[1]));
                    }
                    _e.label = 7;
                case 7:
                    _i++;
                    return [3 /*break*/, 1];
                case 8: return [4 /*yield*/, Promise.all(promises)];
                case 9:
                    _e.sent();
                    return [4 /*yield*/, prisma.perfilPrivilegio.deleteMany({
                            where: {
                                privilegio: {
                                    codigo: {
                                        notIn: todosPrivilegios
                                    }
                                }
                            }
                        })];
                case 10:
                    _e.sent();
                    return [4 /*yield*/, prisma.privilegio.deleteMany({
                            where: {
                                codigo: {
                                    notIn: todosPrivilegios
                                }
                            }
                        })];
                case 11:
                    _e.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function criar_texto_config() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma.textoConfig.upsert({
                        where: { id: 1 },
                        update: {},
                        create: {
                            bemvindo_email: 'Ao acessar o SMAE, Você está ciente e autoriza...',
                            tos: '...O acesso ao SMAE indica ciencia e concordancia com os termos acima'
                        }
                    })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function criar_emaildb_config() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma.emaildbConfig.upsert({
                        where: { id: 1 },
                        update: {},
                        create: {
                            from: '"FooBar" user@example.com',
                            template_resolver_class: 'Shypper::TemplateResolvers::HTTP',
                            template_resolver_config: { "base_url": "https://example.com/static/template-emails/" },
                            email_transporter_class: 'Email::Sender::Transport::SMTP::Persistent',
                            email_transporter_config: { "sasl_password": "...", "sasl_username": "apikey", "port": "587", "host": "smtp.sendgrid.net" }
                        }
                    })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function upsert_privilegios(moduloId, codigo, arg2) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, prisma.privilegio.upsert({
                    where: { codigo: codigo },
                    update: { nome: arg2, modulo_id: moduloId },
                    create: {
                        nome: arg2,
                        modulo_id: moduloId,
                        codigo: codigo
                    }
                })];
        });
    });
}
function atualizar_perfil_acesso() {
    return __awaiter(this, void 0, void 0, function () {
        var promises, _loop_1, _i, PerfilAcessoConfig_1, perfilAcessoConf;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    promises = [];
                    _loop_1 = function (perfilAcessoConf) {
                        var perfilAcesso, _loop_2, _b, _c, codPriv;
                        return __generator(this, function (_d) {
                            switch (_d.label) {
                                case 0: return [4 /*yield*/, prisma.perfilAcesso.findFirst({ where: { nome: perfilAcessoConf.nome }, select: { id: true } })];
                                case 1:
                                    perfilAcesso = _d.sent();
                                    if (!!perfilAcesso) return [3 /*break*/, 3];
                                    return [4 /*yield*/, prisma.perfilAcesso.create({
                                            data: {
                                                nome: perfilAcessoConf.nome,
                                                descricao: perfilAcessoConf.descricao
                                            }, select: { id: true }
                                        })];
                                case 2:
                                    perfilAcesso = _d.sent();
                                    return [3 /*break*/, 5];
                                case 3: return [4 /*yield*/, prisma.perfilAcesso.updateMany({
                                        where: {
                                            id: perfilAcesso.id
                                        },
                                        data: {
                                            nome: perfilAcessoConf.nome,
                                            descricao: perfilAcessoConf.descricao
                                        }
                                    })];
                                case 4:
                                    _d.sent();
                                    _d.label = 5;
                                case 5:
                                    _loop_2 = function (codPriv) {
                                        var idPriv;
                                        return __generator(this, function (_e) {
                                            switch (_e.label) {
                                                case 0:
                                                    console.log(codPriv);
                                                    return [4 /*yield*/, prisma.privilegio.findFirstOrThrow({ where: { codigo: codPriv } })];
                                                case 1:
                                                    idPriv = (_e.sent()).id;
                                                    prisma.perfilPrivilegio.findFirst({
                                                        where: {
                                                            perfil_acesso_id: perfilAcesso.id,
                                                            privilegio_id: idPriv
                                                        }
                                                    }).then(function (match) { return __awaiter(_this, void 0, void 0, function () {
                                                        return __generator(this, function (_a) {
                                                            switch (_a.label) {
                                                                case 0:
                                                                    if (!!match) return [3 /*break*/, 2];
                                                                    return [4 /*yield*/, prisma.perfilPrivilegio.create({
                                                                            data: {
                                                                                perfil_acesso_id: perfilAcesso === null || perfilAcesso === void 0 ? void 0 : perfilAcesso.id,
                                                                                privilegio_id: idPriv
                                                                            }
                                                                        })];
                                                                case 1:
                                                                    _a.sent();
                                                                    _a.label = 2;
                                                                case 2: return [2 /*return*/];
                                                            }
                                                        });
                                                    }); });
                                                    return [2 /*return*/];
                                            }
                                        });
                                    };
                                    _b = 0, _c = perfilAcessoConf.privilegios;
                                    _d.label = 6;
                                case 6:
                                    if (!(_b < _c.length)) return [3 /*break*/, 9];
                                    codPriv = _c[_b];
                                    return [5 /*yield**/, _loop_2(codPriv)];
                                case 7:
                                    _d.sent();
                                    _d.label = 8;
                                case 8:
                                    _b++;
                                    return [3 /*break*/, 6];
                                case 9: return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, PerfilAcessoConfig_1 = PerfilAcessoConfig;
                    _a.label = 1;
                case 1:
                    if (!(_i < PerfilAcessoConfig_1.length)) return [3 /*break*/, 4];
                    perfilAcessoConf = PerfilAcessoConfig_1[_i];
                    return [5 /*yield**/, _loop_1(perfilAcessoConf)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [4 /*yield*/, Promise.all(promises)];
                case 5:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function atualizar_superadmin() {
    return __awaiter(this, void 0, void 0, function () {
        var pessoa, idPerfilAcesso, pessoaPerfilAdmin;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma.tipoOrgao.upsert({
                        where: { id: 1 },
                        update: {},
                        create: {
                            id: 1,
                            descricao: 'registro 1 do tipo orgao'
                        }
                    })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, prisma.orgao.upsert({
                            where: { id: 1 },
                            update: {},
                            create: {
                                id: 1,
                                descricao: 'registro 1 do orgao',
                                sigla: 'ID1',
                                tipo_orgao_id: 1
                            }
                        })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, prisma.pessoa.upsert({
                            where: { email: 'superadmin@admin.com' },
                            update: {},
                            create: {
                                pessoa_fisica: {
                                    create: {
                                        cargo: '',
                                        cpf: '',
                                        lotacao: '',
                                        orgao_id: 1
                                    }
                                },
                                senha_bloqueada: false,
                                qtde_senha_invalida: 0,
                                nome_completo: 'super admin',
                                nome_exibicao: 'super admin',
                                email: 'superadmin@admin.com',
                                senha: '$2b$10$2DUUZc55NxezhEydgfUSTexk4.1qjbvb.873cZhCpIvjw4izkFqcW' // "!286!QDM7H",
                            }
                        })];
                case 3:
                    pessoa = _a.sent();
                    return [4 /*yield*/, prisma.perfilAcesso.findFirstOrThrow({ where: { nome: 'Administrador Geral' } })];
                case 4:
                    idPerfilAcesso = (_a.sent()).id;
                    return [4 /*yield*/, prisma.pessoaPerfil.findFirst({
                            where: {
                                pessoa_id: pessoa.id,
                                perfil_acesso_id: idPerfilAcesso
                            }
                        })];
                case 5:
                    pessoaPerfilAdmin = _a.sent();
                    if (!!pessoaPerfilAdmin) return [3 /*break*/, 7];
                    return [4 /*yield*/, prisma.pessoaPerfil.create({
                            data: {
                                pessoa_id: pessoa.id,
                                perfil_acesso_id: idPerfilAcesso
                            }
                        })];
                case 6:
                    pessoaPerfilAdmin = _a.sent();
                    _a.label = 7;
                case 7: return [2 /*return*/];
            }
        });
    });
}
main()
    .then(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); })["catch"](function (e) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.error(e);
                return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                process.exit(1);
                return [2 /*return*/];
        }
    });
}); });
