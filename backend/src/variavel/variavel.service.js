"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
exports.VariavelService = void 0;
var common_1 = require("@nestjs/common");
var date2ymd_1 = require("../common/date2ymd");
var variavel_entity_1 = require("./entities/variavel.entity");
var InicioFimErrMsg = 'Inicio/Fim da medição da variável não pode ser nulo quando a periodicidade da variável é diferente do indicador';
var VariavelService = /** @class */ (function () {
    function VariavelService(jwtService, prisma) {
        this.jwtService = jwtService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(VariavelService_1.name);
    }
    VariavelService_1 = VariavelService;
    VariavelService.prototype.buildVarResponsaveis = function (variableId, responsaveis) {
        return __awaiter(this, void 0, void 0, function () {
            var arr, _i, responsaveis_1, pessoaId;
            return __generator(this, function (_a) {
                arr = [];
                for (_i = 0, responsaveis_1 = responsaveis; _i < responsaveis_1.length; _i++) {
                    pessoaId = responsaveis_1[_i];
                    arr.push({
                        variavel_id: variableId,
                        pessoa_id: pessoaId
                    });
                }
                return [2 /*return*/, arr];
            });
        });
    };
    VariavelService.prototype.create = function (createVariavelDto, user) {
        return __awaiter(this, void 0, void 0, function () {
            var responsaveis, indicador_id, indicador, created;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        responsaveis = createVariavelDto.responsaveis;
                        delete createVariavelDto.responsaveis;
                        indicador_id = createVariavelDto.indicador_id;
                        delete createVariavelDto.indicador_id;
                        if (createVariavelDto.atraso_meses === undefined)
                            createVariavelDto.atraso_meses = 1;
                        return [4 /*yield*/, this.prisma.indicador.findFirst({
                                where: { id: indicador_id },
                                select: {
                                    id: true,
                                    iniciativa_id: true,
                                    atividade_id: true,
                                    meta_id: true,
                                    periodicidade: true
                                }
                            })];
                    case 1:
                        indicador = _a.sent();
                        if (!indicador)
                            throw new common_1.HttpException('Indicador não encontrado', 400);
                        if (createVariavelDto.periodicidade === indicador.periodicidade) {
                            createVariavelDto.fim_medicao = null;
                            createVariavelDto.inicio_medicao = null;
                        }
                        else {
                            ['inicio_medicao', 'fim_medicao'].forEach(function (e) {
                                if (!createVariavelDto[e]) {
                                    throw new common_1.HttpException("".concat(e, "| ").concat(InicioFimErrMsg), 400);
                                }
                            });
                        }
                        return [4 /*yield*/, this.prisma.$transaction(function (prismaThx) { return __awaiter(_this, void 0, void 0, function () {
                                var variavel, _a, _b;
                                var _c;
                                return __generator(this, function (_d) {
                                    switch (_d.label) {
                                        case 0: return [4 /*yield*/, prismaThx.variavel.create({
                                                data: __assign(__assign({}, createVariavelDto), { indicador_variavel: {
                                                        create: {
                                                            indicador_id: indicador_id
                                                        }
                                                    } }),
                                                select: { id: true }
                                            })];
                                        case 1:
                                            variavel = _d.sent();
                                            return [4 /*yield*/, this.resyncIndicadorVariavel(indicador, variavel.id, prismaThx)];
                                        case 2:
                                            _d.sent();
                                            _b = (_a = prismaThx.variavelResponsavel).createMany;
                                            _c = {};
                                            return [4 /*yield*/, this.buildVarResponsaveis(variavel.id, responsaveis)];
                                        case 3: return [4 /*yield*/, _b.apply(_a, [(_c.data = _d.sent(),
                                                    _c)])];
                                        case 4:
                                            _d.sent();
                                            return [4 /*yield*/, this.recalc_variaveis_acumulada([variavel.id], prismaThx)];
                                        case 5:
                                            _d.sent();
                                            return [2 /*return*/, variavel];
                                    }
                                });
                            }); })];
                    case 2:
                        created = _a.sent();
                        return [2 /*return*/, { id: created.id }];
                }
            });
        });
    };
    VariavelService.prototype.resyncIndicadorVariavel = function (indicador, variavel_id, prisma) {
        return __awaiter(this, void 0, void 0, function () {
            var atividade, indicadorDaIniciativa, data, indicadorDaMeta, data, iniciativa, indicadorDaMeta, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma.indicadorVariavel.deleteMany({
                            where: {
                                variavel_id: variavel_id,
                                NOT: { indicador_origem_id: null }
                            }
                        })];
                    case 1:
                        _a.sent();
                        this.logger.log("resyncIndicadorVariavel: variavel ".concat(variavel_id, ", indicador: ").concat(JSON.stringify(indicador)));
                        if (!indicador.atividade_id) return [3 /*break*/, 10];
                        return [4 /*yield*/, prisma.atividade.findFirstOrThrow({
                                where: {
                                    id: indicador.atividade_id
                                },
                                select: {
                                    compoe_indicador_iniciativa: true,
                                    iniciativa: {
                                        select: {
                                            compoe_indicador_meta: true,
                                            meta_id: true,
                                            Indicador: {
                                                where: {
                                                    removido_em: null
                                                },
                                                select: {
                                                    id: true
                                                }
                                            }
                                        }
                                    }
                                }
                            })];
                    case 2:
                        atividade = _a.sent();
                        this.logger.log("resyncIndicadorVariavel: atividade encontrada ".concat(JSON.stringify(atividade)));
                        if (!atividade.compoe_indicador_iniciativa) return [3 /*break*/, 9];
                        indicadorDaIniciativa = atividade.iniciativa.Indicador[0];
                        if (!!indicadorDaIniciativa) return [3 /*break*/, 3];
                        this.logger.warn("resyncIndicadorVariavel: Atividade ID=".concat(indicador.atividade_id, " compoe_indicador_iniciativa mas n\u00E3o tem indicador ativo"));
                        return [3 /*break*/, 5];
                    case 3:
                        data = {
                            indicador_id: indicadorDaIniciativa.id,
                            variavel_id: variavel_id,
                            indicador_origem_id: indicador.id
                        };
                        this.logger.log("resyncIndicadorVariavel: criando ".concat(JSON.stringify(data)));
                        return [4 /*yield*/, prisma.indicadorVariavel.create({ data: data })];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        if (!atividade.iniciativa.compoe_indicador_meta) return [3 /*break*/, 9];
                        this.logger.log("resyncIndicadorVariavel: iniciativa da atividade compoe_indicador_meta, buscando indicador da meta");
                        return [4 /*yield*/, this.prisma.indicador.findFirst({
                                where: {
                                    removido_em: null,
                                    meta_id: atividade.iniciativa.meta_id
                                },
                                select: {
                                    id: true
                                }
                            })];
                    case 6:
                        indicadorDaMeta = _a.sent();
                        if (!!indicadorDaMeta) return [3 /*break*/, 7];
                        this.logger.warn("resyncIndicadorVariavel: indicador da meta ".concat(atividade.iniciativa.meta_id, " n\u00E3o foi encontrado!"));
                        return [3 /*break*/, 9];
                    case 7:
                        data = {
                            indicador_id: indicadorDaMeta.id,
                            variavel_id: variavel_id,
                            indicador_origem_id: indicadorDaIniciativa.id
                        };
                        this.logger.log("resyncIndicadorVariavel: criando ".concat(JSON.stringify(data)));
                        return [4 /*yield*/, prisma.indicadorVariavel.create({
                                data: data
                            })];
                    case 8:
                        _a.sent();
                        _a.label = 9;
                    case 9: return [3 /*break*/, 14];
                    case 10:
                        if (!indicador.iniciativa_id) return [3 /*break*/, 14];
                        return [4 /*yield*/, prisma.iniciativa.findFirstOrThrow({
                                where: {
                                    id: indicador.iniciativa_id
                                },
                                select: {
                                    compoe_indicador_meta: true,
                                    meta: {
                                        select: {
                                            id: true,
                                            indicador: {
                                                where: {
                                                    removido_em: null
                                                },
                                                select: {
                                                    id: true
                                                }
                                            }
                                        }
                                    }
                                }
                            })];
                    case 11:
                        iniciativa = _a.sent();
                        this.logger.log("resyncIndicadorVariavel: iniciativa encontrada ".concat(JSON.stringify(iniciativa)));
                        if (!iniciativa.compoe_indicador_meta) return [3 /*break*/, 14];
                        indicadorDaMeta = iniciativa.meta.indicador[0];
                        if (!!indicadorDaMeta) return [3 /*break*/, 12];
                        this.logger.warn("resyncIndicadorVariavel: Iniciativa ".concat(indicador.iniciativa_id, " compoe_indicador_meta mas n\u00E3o tem indicador ativo na meta"));
                        return [3 /*break*/, 14];
                    case 12:
                        data = {
                            indicador_id: indicadorDaMeta.id,
                            variavel_id: variavel_id,
                            indicador_origem_id: indicador.id
                        };
                        this.logger.log("resyncIndicadorVariavel: criando ".concat(JSON.stringify(data)));
                        return [4 /*yield*/, prisma.indicadorVariavel.create({ data: data })];
                    case 13:
                        _a.sent();
                        _a.label = 14;
                    case 14: return [2 /*return*/];
                }
            });
        });
    };
    VariavelService.prototype.findAll = function (filters) {
        if (filters === void 0) { filters = undefined; }
        return __awaiter(this, void 0, void 0, function () {
            var filterQuery, removidoStatus, listActive, ret;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        filterQuery = {};
                        removidoStatus = (filters === null || filters === void 0 ? void 0 : filters.remover_desativados) == true ? false : undefined;
                        // TODO alterar pra testar todos os casos de exclusividade
                        if ((filters === null || filters === void 0 ? void 0 : filters.indicador_id) && (filters === null || filters === void 0 ? void 0 : filters.meta_id)) {
                            throw new common_1.HttpException('Apenas filtrar por meta_id ou indicador_id por vez', 400);
                        }
                        if (filters === null || filters === void 0 ? void 0 : filters.indicador_id) {
                            filterQuery = {
                                indicador_variavel: {
                                    some: {
                                        desativado: removidoStatus,
                                        indicador_id: filters === null || filters === void 0 ? void 0 : filters.indicador_id
                                    }
                                }
                            };
                        }
                        else if (filters === null || filters === void 0 ? void 0 : filters.meta_id) {
                            filterQuery = {
                                indicador_variavel: {
                                    some: {
                                        desativado: removidoStatus,
                                        indicador: {
                                            meta_id: filters === null || filters === void 0 ? void 0 : filters.meta_id
                                        }
                                    }
                                }
                            };
                        }
                        else if (filters === null || filters === void 0 ? void 0 : filters.iniciativa_id) {
                            filterQuery = {
                                indicador_variavel: {
                                    some: {
                                        desativado: removidoStatus,
                                        indicador: {
                                            iniciativa_id: filters === null || filters === void 0 ? void 0 : filters.iniciativa_id
                                        }
                                    }
                                }
                            };
                        }
                        else if (filters === null || filters === void 0 ? void 0 : filters.atividade_id) {
                            filterQuery = {
                                indicador_variavel: {
                                    some: {
                                        desativado: removidoStatus,
                                        indicador: {
                                            atividade_id: filters === null || filters === void 0 ? void 0 : filters.atividade_id
                                        }
                                    }
                                }
                            };
                        }
                        return [4 /*yield*/, this.prisma.variavel.findMany({
                                where: __assign({}, filterQuery),
                                select: {
                                    id: true,
                                    titulo: true,
                                    codigo: true,
                                    acumulativa: true,
                                    casas_decimais: true,
                                    fim_medicao: true,
                                    inicio_medicao: true,
                                    atraso_meses: true,
                                    unidade_medida: {
                                        select: {
                                            id: true,
                                            descricao: true,
                                            sigla: true
                                        }
                                    },
                                    ano_base: true,
                                    valor_base: true,
                                    periodicidade: true,
                                    orgao: {
                                        select: {
                                            id: true,
                                            descricao: true,
                                            sigla: true
                                        }
                                    },
                                    regiao: {
                                        select: {
                                            id: true,
                                            nivel: true,
                                            descricao: true,
                                            parente_id: true,
                                            codigo: true
                                        }
                                    },
                                    indicador_variavel: {
                                        select: {
                                            desativado: true,
                                            id: true,
                                            indicador_origem: {
                                                select: {
                                                    id: true,
                                                    titulo: true,
                                                    meta: {
                                                        select: {
                                                            id: true,
                                                            titulo: true
                                                        }
                                                    },
                                                    iniciativa: {
                                                        select: {
                                                            id: true,
                                                            titulo: true
                                                        }
                                                    },
                                                    atividade: {
                                                        select: {
                                                            id: true,
                                                            titulo: true
                                                        }
                                                    }
                                                }
                                            },
                                            indicador: {
                                                select: {
                                                    id: true,
                                                    titulo: true,
                                                    meta: {
                                                        select: {
                                                            id: true,
                                                            titulo: true
                                                        }
                                                    },
                                                    iniciativa: {
                                                        select: {
                                                            id: true,
                                                            titulo: true
                                                        }
                                                    },
                                                    atividade: {
                                                        select: {
                                                            id: true,
                                                            titulo: true
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    variavel_responsavel: {
                                        select: {
                                            pessoa: { select: { id: true, nome_exibicao: true } }
                                        }
                                    }
                                }
                            })];
                    case 1:
                        listActive = _a.sent();
                        ret = listActive.map(function (row) {
                            var _a, _b;
                            var responsaveis = row.variavel_responsavel.map(function (responsavel) {
                                return {
                                    id: responsavel.pessoa.id,
                                    nome_exibicao: responsavel.pessoa.nome_exibicao
                                };
                            });
                            var indicador_variavel = [];
                            // filtra as variaveis novamente caso tiver filtros por indicador ou atividade
                            if ((filters === null || filters === void 0 ? void 0 : filters.indicador_id) || (filters === null || filters === void 0 ? void 0 : filters.iniciativa_id) || (filters === null || filters === void 0 ? void 0 : filters.atividade_id)) {
                                for (var _i = 0, _c = row.indicador_variavel; _i < _c.length; _i++) {
                                    var iv = _c[_i];
                                    if ((filters === null || filters === void 0 ? void 0 : filters.atividade_id) && (filters === null || filters === void 0 ? void 0 : filters.atividade_id) === ((_a = iv.indicador.atividade) === null || _a === void 0 ? void 0 : _a.id)) {
                                        indicador_variavel.push(iv);
                                    }
                                    else if ((filters === null || filters === void 0 ? void 0 : filters.indicador_id) && (filters === null || filters === void 0 ? void 0 : filters.indicador_id) === iv.indicador.id) {
                                        indicador_variavel.push(iv);
                                    }
                                    else if ((filters === null || filters === void 0 ? void 0 : filters.iniciativa_id) && (filters === null || filters === void 0 ? void 0 : filters.iniciativa_id) === ((_b = iv.indicador.iniciativa) === null || _b === void 0 ? void 0 : _b.id)) {
                                        indicador_variavel.push(iv);
                                    }
                                }
                            }
                            else {
                                indicador_variavel = row.indicador_variavel;
                            }
                            return __assign(__assign({}, row), { inicio_medicao: date2ymd_1.Date2YMD.toStringOrNull(row.inicio_medicao), fim_medicao: date2ymd_1.Date2YMD.toStringOrNull(row.fim_medicao), variavel_responsavel: undefined, indicador_variavel: indicador_variavel, responsaveis: responsaveis });
                        });
                        return [2 /*return*/, ret];
                }
            });
        });
    };
    VariavelService.prototype.update = function (variavelId, updateVariavelDto, user) {
        return __awaiter(this, void 0, void 0, function () {
            var selfIdicadorVariavel, oldValorBase, indicador, oldValue;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.prisma.indicadorVariavel.findFirst({
                            where: { variavel_id: variavelId, indicador_origem_id: null },
                            select: { indicador_id: true, variavel: { select: { valor_base: true, periodicidade: true } } }
                        })];
                    case 1:
                        selfIdicadorVariavel = _a.sent();
                        if (!selfIdicadorVariavel)
                            throw new common_1.HttpException('Variavel não encontrada', 400);
                        oldValorBase = selfIdicadorVariavel.variavel.valor_base;
                        return [4 /*yield*/, this.prisma.indicador.findFirst({
                                where: { id: selfIdicadorVariavel.indicador_id },
                                select: {
                                    id: true,
                                    iniciativa_id: true,
                                    atividade_id: true,
                                    meta_id: true,
                                    periodicidade: true
                                }
                            })];
                    case 2:
                        indicador = _a.sent();
                        if (!indicador)
                            throw new common_1.HttpException('Indicador não encontrado', 400);
                        oldValue = selfIdicadorVariavel.variavel.periodicidade;
                        if (updateVariavelDto.periodicidade)
                            oldValue = updateVariavelDto.periodicidade;
                        if (oldValue === indicador.periodicidade) {
                            updateVariavelDto.fim_medicao = null;
                            updateVariavelDto.inicio_medicao = null;
                        }
                        else {
                            ['inicio_medicao', 'fim_medicao'].forEach(function (e) {
                                if (updateVariavelDto[e] === null) {
                                    throw new common_1.HttpException("".concat(e, "| ").concat(InicioFimErrMsg), 400);
                                }
                            });
                        }
                        return [4 /*yield*/, this.prisma.$transaction(function (prismaTxn) { return __awaiter(_this, void 0, void 0, function () {
                                var responsaveis, updated, _a, _b;
                                var _c;
                                return __generator(this, function (_d) {
                                    switch (_d.label) {
                                        case 0:
                                            responsaveis = updateVariavelDto.responsaveis;
                                            delete updateVariavelDto.responsaveis;
                                            return [4 /*yield*/, prismaTxn.variavel.update({
                                                    where: { id: variavelId },
                                                    data: __assign({}, updateVariavelDto),
                                                    select: {
                                                        valor_base: true
                                                    }
                                                })];
                                        case 1:
                                            updated = _d.sent();
                                            if (!responsaveis) return [3 /*break*/, 6];
                                            return [4 /*yield*/, this.resyncIndicadorVariavel(indicador, variavelId, prismaTxn)];
                                        case 2:
                                            _d.sent();
                                            return [4 /*yield*/, prismaTxn.variavelResponsavel.deleteMany({
                                                    where: { variavel_id: variavelId }
                                                })];
                                        case 3:
                                            _d.sent();
                                            _b = (_a = prismaTxn.variavelResponsavel).createMany;
                                            _c = {};
                                            return [4 /*yield*/, this.buildVarResponsaveis(variavelId, responsaveis)];
                                        case 4: return [4 /*yield*/, _b.apply(_a, [(_c.data = _d.sent(),
                                                    _c)])];
                                        case 5:
                                            _d.sent();
                                            _d.label = 6;
                                        case 6:
                                            if (!(Number(oldValorBase).toString() !== Number(updated.valor_base).toString())) return [3 /*break*/, 8];
                                            return [4 /*yield*/, this.recalc_variaveis_acumulada([variavelId], prismaTxn)];
                                        case 7:
                                            _d.sent();
                                            _d.label = 8;
                                        case 8: return [2 /*return*/];
                                    }
                                });
                            }); })];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, { id: variavelId }];
                }
            });
        });
    };
    VariavelService.prototype.getIndicadorViaVariavel = function (variavel_id) {
        return __awaiter(this, void 0, void 0, function () {
            var indicador;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.prisma.indicador.findFirst({
                            where: {
                                IndicadorVariavel: {
                                    some: {
                                        variavel_id: variavel_id,
                                        indicador_origem_id: null
                                    }
                                }
                            },
                            select: {
                                IndicadorVariavel: {
                                    select: {
                                        variavel: {
                                            select: {
                                                id: true,
                                                casas_decimais: true,
                                                periodicidade: true,
                                                acumulativa: true
                                            }
                                        }
                                    }
                                }
                            }
                        })];
                    case 1:
                        indicador = _a.sent();
                        if (!indicador)
                            throw new common_1.HttpException('Indicador ou variavel não encontrada', 404);
                        return [2 /*return*/, indicador];
                }
            });
        });
    };
    VariavelService.prototype.getValorSerieExistente = function (variavelId, series) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.prisma.serieVariavel.findMany({
                            where: {
                                variavel_id: variavelId,
                                serie: {
                                    "in": series
                                }
                            },
                            select: {
                                valor_nominal: true,
                                id: true,
                                data_valor: true,
                                serie: true,
                                conferida: true
                            }
                        })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    VariavelService.prototype.getValorSerieExistentePorPeriodo = function (valoresExistentes, variavel_id) {
        var porPeriodo = new variavel_entity_1.SerieValorPorPeriodo();
        for (var _i = 0, valoresExistentes_1 = valoresExistentes; _i < valoresExistentes_1.length; _i++) {
            var serieValor = valoresExistentes_1[_i];
            if (!porPeriodo[date2ymd_1.Date2YMD.toString(serieValor.data_valor)]) {
                porPeriodo[date2ymd_1.Date2YMD.toString(serieValor.data_valor)] = {
                    Previsto: undefined,
                    PrevistoAcumulado: undefined,
                    Realizado: undefined,
                    RealizadoAcumulado: undefined
                };
            }
            porPeriodo[date2ymd_1.Date2YMD.toString(serieValor.data_valor)][serieValor.serie] = {
                data_valor: date2ymd_1.Date2YMD.toString(serieValor.data_valor),
                valor_nominal: serieValor.valor_nominal.toPrecision(),
                referencia: this.getEditExistingSerieJwt(serieValor.id, variavel_id),
                conferida: serieValor.conferida
            };
        }
        return porPeriodo;
    };
    VariavelService.prototype.getSeriePrevistoRealizado = function (variavelId) {
        return __awaiter(this, void 0, void 0, function () {
            var indicador, indicadorVariavelRelList, variavel, valoresExistentes, porPeriodo, result, todosPeriodos, _i, todosPeriodos_1, periodoYMD, seriesExistentes, existeValor;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getIndicadorViaVariavel(variavelId)];
                    case 1:
                        indicador = _a.sent();
                        indicadorVariavelRelList = indicador.IndicadorVariavel.filter(function (v) {
                            return v.variavel.id === variavelId;
                        });
                        variavel = indicadorVariavelRelList[0].variavel;
                        return [4 /*yield*/, this.getValorSerieExistente(variavelId, ['Previsto', 'PrevistoAcumulado', 'Realizado', 'RealizadoAcumulado'])];
                    case 2:
                        valoresExistentes = _a.sent();
                        porPeriodo = this.getValorSerieExistentePorPeriodo(valoresExistentes, variavelId);
                        result = {
                            variavel: {
                                id: variavelId,
                                casas_decimais: variavel.casas_decimais,
                                periodicidade: variavel.periodicidade,
                                acumulativa: variavel.acumulativa
                            },
                            linhas: [],
                            ordem_series: ['Previsto', 'PrevistoAcumulado', 'Realizado', 'RealizadoAcumulado']
                        };
                        return [4 /*yield*/, this.gerarPeriodoVariavelEntreDatas(variavel.id)];
                    case 3:
                        todosPeriodos = _a.sent();
                        for (_i = 0, todosPeriodos_1 = todosPeriodos; _i < todosPeriodos_1.length; _i++) {
                            periodoYMD = todosPeriodos_1[_i];
                            seriesExistentes = [];
                            existeValor = porPeriodo[periodoYMD];
                            if (existeValor && (existeValor.Previsto
                                || existeValor.PrevistoAcumulado
                                || existeValor.Realizado
                                || existeValor.RealizadoAcumulado)) {
                                if (existeValor.Previsto) {
                                    seriesExistentes.push(existeValor.Previsto);
                                }
                                else {
                                    seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD, variavelId, 'Previsto'));
                                }
                                if (existeValor.PrevistoAcumulado) {
                                    seriesExistentes.push(this.referencia_boba(variavel.acumulativa, existeValor.PrevistoAcumulado));
                                }
                                else {
                                    seriesExistentes.push(this.referencia_boba(variavel.acumulativa, this.buildNonExistingSerieValor(periodoYMD, variavelId, 'PrevistoAcumulado')));
                                }
                                if (existeValor.Realizado) {
                                    seriesExistentes.push(existeValor.Realizado);
                                }
                                else {
                                    seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD, variavelId, 'Realizado'));
                                }
                                if (existeValor.RealizadoAcumulado) {
                                    seriesExistentes.push(this.referencia_boba(variavel.acumulativa, existeValor.RealizadoAcumulado));
                                }
                                else {
                                    seriesExistentes.push(this.referencia_boba(variavel.acumulativa, this.buildNonExistingSerieValor(periodoYMD, variavelId, 'RealizadoAcumulado')));
                                }
                            }
                            else {
                                seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD, variavelId, 'Previsto'));
                                seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD, variavelId, 'PrevistoAcumulado'));
                                seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD, variavelId, 'Realizado'));
                                seriesExistentes.push(this.buildNonExistingSerieValor(periodoYMD, variavelId, 'RealizadoAcumulado'));
                            }
                            result.linhas.push({
                                periodo: periodoYMD.substring(0, 4 + 2 + 1),
                                // TODO: botar o label de acordo com a periodicidade"
                                agrupador: periodoYMD.substring(0, 4),
                                series: seriesExistentes
                            });
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    };
    VariavelService.prototype.referencia_boba = function (varServerSideAcumulativa, sv) {
        if (varServerSideAcumulativa) {
            sv.referencia = 'SS';
        }
        return sv;
    };
    VariavelService.prototype.buildNonExistingSerieValor = function (periodo, variavelId, serie) {
        return {
            data_valor: periodo,
            referencia: this.getEditNonExistingSerieJwt(variavelId, periodo, serie),
            valor_nominal: ''
        };
    };
    VariavelService.prototype.getEditExistingSerieJwt = function (id, variavelId) {
        // TODO opcionalmente adicionar o modificado_em aqui
        return this.jwtService.sign({
            id: id,
            v: variavelId
        });
    };
    VariavelService.prototype.getEditNonExistingSerieJwt = function (variavelId, period, serie) {
        return this.jwtService.sign({
            p: period,
            v: variavelId,
            s: serie
        });
    };
    VariavelService.prototype.gerarPeriodoVariavelEntreDatas = function (variavelId) {
        return __awaiter(this, void 0, void 0, function () {
            var dados;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.prisma.$queryRaw(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n            select to_char(p.p, 'yyyy-mm-dd') as dt\n            from busca_periodos_variavel(", "::int) as g(p, inicio, fim),\n            generate_series(inicio, fim, p) p\n        "], ["\n            select to_char(p.p, 'yyyy-mm-dd') as dt\n            from busca_periodos_variavel(", "::int) as g(p, inicio, fim),\n            generate_series(inicio, fim, p) p\n        "])), variavelId)];
                    case 1:
                        dados = _a.sent();
                        return [2 /*return*/, dados.map(function (e) { return e.dt; })];
                }
            });
        });
    };
    VariavelService.prototype.validarValoresJwt = function (valores) {
        var valids = [];
        console.log({ log: 'validation', valores: valores });
        for (var _i = 0, valores_1 = valores; _i < valores_1.length; _i++) {
            var valor = valores_1[_i];
            if (valor.referencia === 'SS') // server-side
                continue;
            var referenciaDecoded = null;
            try {
                referenciaDecoded = this.jwtService.decode(valor.referencia);
            }
            catch (error) {
                this.logger.error(error);
            }
            if (!referenciaDecoded)
                throw new common_1.HttpException('Tempo para edição dos valores já expirou. Abra em uma nova aba e faça o preenchimento novamente.', 400);
            valids.push({
                valor: valor.valor,
                referencia: referenciaDecoded
            });
        }
        this.logger.debug(JSON.stringify({ log: 'validation', valids: valids }));
        return valids;
    };
    VariavelService.prototype.batchUpsertSerie = function (valores, user) {
        return __awaiter(this, void 0, void 0, function () {
            var valoresValidos, variaveisModificadas;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        valoresValidos = this.validarValoresJwt(valores);
                        variaveisModificadas = {};
                        return [4 /*yield*/, this.prisma.$transaction(function (prismaTxn) { return __awaiter(_this, void 0, void 0, function () {
                                var idsToBeRemoved, updatePromises, createList, anySerieIsToBeCreatedOnVariable, _i, valoresValidos_1, valor, variaveisMod;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            idsToBeRemoved = [];
                                            updatePromises = [];
                                            createList = [];
                                            for (_i = 0, valoresValidos_1 = valoresValidos; _i < valoresValidos_1.length; _i++) {
                                                valor = valoresValidos_1[_i];
                                                // busca os valores vazios mas que já existem, para serem removidos
                                                if (valor.valor === '' && "id" in valor.referencia) {
                                                    idsToBeRemoved.push(valor.referencia.id);
                                                    if (!variaveisModificadas[valor.referencia.v]) {
                                                        variaveisModificadas[valor.referencia.v] = true;
                                                    }
                                                }
                                                else if (valor.valor) {
                                                    if (!variaveisModificadas[valor.referencia.v]) {
                                                        variaveisModificadas[valor.referencia.v] = true;
                                                    }
                                                    if ("id" in valor.referencia) {
                                                        updatePromises.push(prismaTxn.serieVariavel.updateMany({
                                                            where: {
                                                                id: valor.referencia.id,
                                                                valor_nominal: {
                                                                    not: valor.valor
                                                                }
                                                            },
                                                            data: {
                                                                valor_nominal: valor.valor,
                                                                atualizado_em: new Date(Date.now()),
                                                                atualizado_por: user.id,
                                                                conferida: true
                                                            }
                                                        }));
                                                    }
                                                    else {
                                                        if (!anySerieIsToBeCreatedOnVariable)
                                                            anySerieIsToBeCreatedOnVariable = valor.referencia.v;
                                                        createList.push({
                                                            valor_nominal: valor.valor,
                                                            variavel_id: valor.referencia.v,
                                                            serie: valor.referencia.s,
                                                            data_valor: date2ymd_1.Date2YMD.fromString(valor.referencia.p),
                                                            conferida: true
                                                        });
                                                    }
                                                } // else "não há valor" e não tem ID, ou seja, n precisa acontecer nada no banco
                                            }
                                            console.log({ idsToBeRemoved: idsToBeRemoved, anySerieIsToBeCreatedOnVariable: anySerieIsToBeCreatedOnVariable, updatePromises: updatePromises, createList: createList });
                                            if (!anySerieIsToBeCreatedOnVariable) return [3 /*break*/, 2];
                                            return [4 /*yield*/, prismaTxn.variavel.findFirst({ where: { id: anySerieIsToBeCreatedOnVariable }, select: { id: true } })];
                                        case 1:
                                            _a.sent();
                                            _a.label = 2;
                                        case 2:
                                            if (!updatePromises.length) return [3 /*break*/, 4];
                                            return [4 /*yield*/, Promise.all(updatePromises)];
                                        case 3:
                                            _a.sent();
                                            _a.label = 4;
                                        case 4:
                                            if (!createList.length) return [3 /*break*/, 6];
                                            return [4 /*yield*/, prismaTxn.serieVariavel.deleteMany({
                                                    where: {
                                                        'OR': createList.map(function (e) {
                                                            return {
                                                                data_valor: e.data_valor,
                                                                variavel_id: e.variavel_id,
                                                                serie: e.serie
                                                            };
                                                        })
                                                    }
                                                })];
                                        case 5:
                                            _a.sent();
                                            _a.label = 6;
                                        case 6:
                                            if (!idsToBeRemoved.length) return [3 /*break*/, 8];
                                            return [4 /*yield*/, prismaTxn.serieVariavel.deleteMany({
                                                    where: {
                                                        'id': { 'in': idsToBeRemoved }
                                                    }
                                                })];
                                        case 7:
                                            _a.sent();
                                            _a.label = 8;
                                        case 8:
                                            if (!createList.length) return [3 /*break*/, 10];
                                            return [4 /*yield*/, prismaTxn.serieVariavel.createMany({
                                                    data: createList
                                                })];
                                        case 9:
                                            _a.sent();
                                            _a.label = 10;
                                        case 10:
                                            variaveisMod = Object.keys(variaveisModificadas).map(function (e) { return +e; });
                                            this.logger.log("Vari\u00E1veis modificadas: ".concat(JSON.stringify(variaveisMod)));
                                            return [4 /*yield*/, this.recalc_variaveis_acumulada(variaveisMod, prismaTxn)];
                                        case 11:
                                            _a.sent();
                                            return [4 /*yield*/, this.recalc_indicador_usando_variaveis(variaveisMod, prismaTxn)];
                                        case 12:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); }, {
                                isolationLevel: 'Serializable',
                                maxWait: 15000,
                                timeout: 25000
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    VariavelService.prototype.recalc_variaveis_acumulada = function (variaveis, prismaTxn) {
        return __awaiter(this, void 0, void 0, function () {
            var afetadas, _i, afetadas_1, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger.log("called recalc_variaveis_acumulada (".concat(JSON.stringify(variaveis), ")"));
                        return [4 /*yield*/, prismaTxn.variavel.findMany({
                                where: {
                                    id: { 'in': variaveis },
                                    acumulativa: true
                                },
                                select: {
                                    id: true
                                }
                            })];
                    case 1:
                        afetadas = _a.sent();
                        this.logger.log("query.afetadas => ".concat(JSON.stringify(afetadas)));
                        _i = 0, afetadas_1 = afetadas;
                        _a.label = 2;
                    case 2:
                        if (!(_i < afetadas_1.length)) return [3 /*break*/, 5];
                        row = afetadas_1[_i];
                        this.logger.debug("Recalculando serie acumulada variavel ".concat(row.id, "..."));
                        return [4 /*yield*/, prismaTxn.$queryRaw(templateObject_2 || (templateObject_2 = __makeTemplateObject(["select monta_serie_acumulada(", "::int, null)"], ["select monta_serie_acumulada(", "::int, null)"])), row.id)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    VariavelService.prototype.recalc_indicador_usando_variaveis = function (variaveis, prismaTxn) {
        return __awaiter(this, void 0, void 0, function () {
            var indicadores, _i, indicadores_1, row;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger.log("called recalc_indicador_usando_variaveis (".concat(JSON.stringify(variaveis), ")"));
                        return [4 /*yield*/, prismaTxn.indicadorFormulaVariavel.findMany({
                                where: {
                                    variavel_id: { 'in': variaveis }
                                },
                                distinct: ['indicador_id'],
                                select: {
                                    indicador_id: true
                                }
                            })];
                    case 1:
                        indicadores = _a.sent();
                        this.logger.log("query.indicadores => ".concat(JSON.stringify(indicadores)));
                        _i = 0, indicadores_1 = indicadores;
                        _a.label = 2;
                    case 2:
                        if (!(_i < indicadores_1.length)) return [3 /*break*/, 5];
                        row = indicadores_1[_i];
                        this.logger.log("Recalculando indicador ... ".concat(row.indicador_id));
                        return [4 /*yield*/, prismaTxn.$queryRaw(templateObject_3 || (templateObject_3 = __makeTemplateObject(["select monta_serie_indicador(", "::int, null, null, null)"], ["select monta_serie_indicador(", "::int, null, null, null)"])), row.indicador_id)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    VariavelService.prototype.getMetaIdDaVariavel = function (variavel_id, prismaTxn) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prismaTxn.$queryRaw(templateObject_4 || (templateObject_4 = __makeTemplateObject(["\n            select coalesce(\n\n                -- busca pela diretamente na meta\n                (\n                    select m.id\n                    from meta m\n                    join indicador i on i.meta_id = m.id and i.removido_em is null\n                    join indicador_variavel iv on iv.indicador_id = i.id and iv.desativado=false and iv.indicador_origem_id is null\n                    where iv.variavel_id = ", "::int\n                ),\n                (\n                    select m.id\n                    from meta m\n                    join iniciativa _i on _i.meta_id = m.id\n                    join indicador i on  i.iniciativa_id = _i.id\n                    join indicador_variavel iv on iv.indicador_id = i.id and iv.desativado=false and iv.indicador_origem_id is null\n                    where iv.variavel_id = ", "::int\n                ),\n                (\n                    select m.id\n                    from meta m\n                    join iniciativa _i on _i.meta_id = m.id\n                    join atividade _a on _a.iniciativa_id = _i.id\n                    join indicador i on  i.atividade_id = _a.id\n                    join indicador_variavel iv on iv.indicador_id = i.id and iv.desativado=false and iv.indicador_origem_id is null\n                    where iv.variavel_id = ", "::int\n                )\n            ) as meta_id\n        "], ["\n            select coalesce(\n\n                -- busca pela diretamente na meta\n                (\n                    select m.id\n                    from meta m\n                    join indicador i on i.meta_id = m.id and i.removido_em is null\n                    join indicador_variavel iv on iv.indicador_id = i.id and iv.desativado=false and iv.indicador_origem_id is null\n                    where iv.variavel_id = ", "::int\n                ),\n                (\n                    select m.id\n                    from meta m\n                    join iniciativa _i on _i.meta_id = m.id\n                    join indicador i on  i.iniciativa_id = _i.id\n                    join indicador_variavel iv on iv.indicador_id = i.id and iv.desativado=false and iv.indicador_origem_id is null\n                    where iv.variavel_id = ", "::int\n                ),\n                (\n                    select m.id\n                    from meta m\n                    join iniciativa _i on _i.meta_id = m.id\n                    join atividade _a on _a.iniciativa_id = _i.id\n                    join indicador i on  i.atividade_id = _a.id\n                    join indicador_variavel iv on iv.indicador_id = i.id and iv.desativado=false and iv.indicador_origem_id is null\n                    where iv.variavel_id = ", "::int\n                )\n            ) as meta_id\n        "])), variavel_id, variavel_id, variavel_id)];
                    case 1:
                        result = _a.sent();
                        console.log(result);
                        if (!result[0].meta_id)
                            throw "getMetaIdDaVariavel: nenhum resultado para variavel ".concat(variavel_id);
                        return [2 /*return*/, result[0].meta_id];
                }
            });
        });
    };
    var VariavelService_1;
    VariavelService = VariavelService_1 = __decorate([
        (0, common_1.Injectable)()
    ], VariavelService);
    return VariavelService;
}());
exports.VariavelService = VariavelService;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
