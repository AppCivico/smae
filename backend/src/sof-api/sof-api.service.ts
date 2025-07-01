import { HttpException, Injectable, Logger } from '@nestjs/common';
import got, { Got } from 'got';
import { DateTime } from 'luxon';
import { SYSTEM_TIMEZONE } from '../common/date2ymd';
import { SmaeConfigService } from 'src/common/services/smae-config.service';

export class SofError extends Error {
    constructor(msg: string) {
        console.log(`SOF ERROR: ${msg}`);
        super(msg);
        Object.setPrototypeOf(this, SofError.prototype);
    }
}

type RetornoEmpenho = {
    empenho_liquido: number;
    val_liquidado: number;
    dotacao: string;
    processo: string;
};

type RetornoOrcado = {
    val_orcado_inicial: number;
    val_orcado_atualizado: number;
    saldo_disponivel: number;
};

type MetaDados = {
    sucess: boolean;
    message: string;
};

type Entidade = {
    codigo: string;
    descricao: string;
};

type EntidadeUnidade = {
    codigo: string;
    descricao: string;
    cod_orgao: string;
};

type SuccessEmpenhosResponse = {
    data: RetornoEmpenho[];
    metadados: MetaDados;
};

type SuccessEntidadesResponse = {
    metadados: MetaDados;
    orgaos: Entidade[];
    unidades: EntidadeUnidade[];
    funcoes: Entidade[];
    subfuncoes: Entidade[];
    programas: Entidade[];
    projetos_atividades: Entidade[];
    categorias: Entidade[];
    grupos: Entidade[];
    modalidades: Entidade[];
    elementos: Entidade[];
    fonte_recursos: Entidade[];
};

type SuccessOrcadoResponse = {
    data: RetornoOrcado[];
    metadados: MetaDados;
};

type ErrorHttpResponse = {
    detail: string;
};

type ApiResponse = SuccessEmpenhosResponse | ErrorHttpResponse | SuccessEntidadesResponse | SuccessOrcadoResponse;

export type InputOrcadoProjeto = {
    ano: number;
    mes: number;
    orgao: string;
    unidade: string;
    proj_atividade: string;
    fonte: string;
};

export type InputOrcadoDotacao = {
    ano: number;
    mes: number;
    dotacao: string;
};

export type InputDotacao = {
    ano: number;
    mes: number;
    dotacao: string;
};

export type InputNotaEmpenho = {
    ano: number;
    mes: number;
    nota_empenho: string;
};

export type InputProcesso = {
    ano: number;
    mes: number;
    processo: string;
};

export function TrataDotacaoGrande(dotacao: string): string {
    // trata o caso de dotação grandes
    // "14.10.16.482.3002.3.354.44905100.02.1.700.0769"   // registros do SOF vem assim
    // "84.11.10.301.3003.5.204.44905100.01.2.634.1225.1" // planilha do setoriais vem assim
    //  ->
    // "14.10.16.482.3002.3.354.44905100.02"
    if (dotacao.length > 35) return dotacao.split('.').splice(0, 9).join('.');

    return dotacao;
}

export function ExtraiComplementoDotacao(row: { dotacao: string; dotacao_complemento?: string | null }): string | null {
    row.dotacao = row.dotacao.trim();
    // prioridade na dotação
    // era pra ser só 48, vamos aceitar tbm salvar com 46
    if (row.dotacao.length == 48 || row.dotacao.length == 46) return row.dotacao.substring(36);
    // depois no campo extra
    if (row.dotacao_complemento) return row.dotacao_complemento;
    // se não continua null
    return null;
}

@Injectable()
export class SofApiService {
    private got: Got;
    private readonly logger = new Logger(SofApiService.name);
    SOF_API_PREFIX: string;

    constructor(private readonly smaeConfigService: SmaeConfigService) {
        this.got = got;
    }

    /**
     * recebe um ano, retorna o mês mais recente, desde q não esteja no futuro
     **/
    mesMaisRecenteDoAno(ano: number, tipo: 'planejado' | 'realizado'): number {
        const nowSp = DateTime.local({ zone: SYSTEM_TIMEZONE });

        const anoCorrente = nowSp.year;
        if (anoCorrente == +ano) return nowSp.month;

        if (+ano > anoCorrente) {
            // se está planejando, volta o mes de janeiro do ano futuro
            if (tipo == 'planejado') return 1;

            // realizado continua dando erro
            throw new HttpException('Não é possível buscar por realizado ou planejado no futuro', 400);
        }

        return 12; // mes mais recente do ano pesquisado
    }

    async onModuleInit() {
        const sofApiPrefix = await this.smaeConfigService.getConfigWithDefault<string>(
            'SOF_API_PREFIX',
            'http://smae_orcamento:80/'
        );

        this.SOF_API_PREFIX = sofApiPrefix;

        this.got = got.extend({
            prefixUrl: this.SOF_API_PREFIX,
            timeout: 18 * 1000,
            retry: {
                limit: 2,
                methods: ['GET', 'PUT', 'HEAD', 'DELETE', 'OPTIONS', 'TRACE', 'POST'],
                statusCodes: [408, 413, 429, 500, 502, 503, 521, 522, 524],
            },
        });
        this.logger.debug(`API SOF configurada para usar endereço ${this.SOF_API_PREFIX}`);
    }

    // chamado pelo sincronizarDotacaoPlanejado
    async orcadoDotacao(input: InputOrcadoDotacao): Promise<SuccessOrcadoResponse> {
        return await this.doGetOrcadoDotacaoRequest(input);
    }

    async empenhoDotacao(input: InputDotacao): Promise<SuccessEmpenhosResponse> {
        const endpoint = 'v1/empenhos/dotacao';
        return await this.doEmpenhoRequest(endpoint, input);
    }

    async empenhoNotaEmpenho(input: InputNotaEmpenho): Promise<SuccessEmpenhosResponse> {
        const endpoint = 'v1/empenhos/nota_empenho';
        return await this.doEmpenhoRequest(endpoint, input);
    }

    async empenhoProcesso(input: InputProcesso): Promise<SuccessEmpenhosResponse> {
        const endpoint = 'v1/empenhos/processo';
        return await this.doEmpenhoRequest(endpoint, input);
    }

    async entidades(ano: number): Promise<SuccessEntidadesResponse> {
        const endpoint = 'v1/itens_dotacao/all_items?ano=' + encodeURIComponent(ano);
        return (await this.doGetEntidadeRequest(endpoint)) as SuccessEntidadesResponse;
    }

    private async doGetEntidadeRequest(endpoint: string): Promise<SuccessEntidadesResponse> {
        this.logger.debug(`chamando GET ${endpoint}`);
        try {
            const response: ApiResponse = await this.got.get<ApiResponse>(endpoint).json();
            this.logger.debug(`resposta: ${JSON.stringify(response)}`);
            if ('metadados' in response && response.metadados.sucess && endpoint.includes('v1/itens_dotacao/')) {
                return response as SuccessEntidadesResponse;
            }

            throw new Error(`Serviço SOF retornou dados desconhecidos: ${JSON.stringify(response)}`);
        } catch (error: any) {
            this.logger.debug(`${endpoint} falhou: ${error}`);
            let body = '';
            if (error instanceof got.HTTPError) {
                body = String(error.response.body);
                this.logger.debug(`${endpoint}.res.body: ${body}`);
            }

            throw new SofError(`Serviço SOF: falha ao acessar serviço: ${error}\n\nResponse.Body: ${body}`);
        }
    }

    private async doGetOrcadoDotacaoRequest(input: InputOrcadoDotacao): Promise<SuccessOrcadoResponse> {
        let endpoint = 'v1/orcado/orcado_dotacao';

        endpoint += '?ano=' + encodeURIComponent(input.ano);
        endpoint += '&mes=' + encodeURIComponent(input.mes);
        endpoint += '&dotacao=' + encodeURIComponent(input.dotacao);

        this.logger.debug(`chamando GET ${endpoint}`);
        try {
            const response: ApiResponse = await this.got.get<ApiResponse>(endpoint).json();
            this.logger.debug(`resposta: ${JSON.stringify(response)}`);
            if ('metadados' in response && response.metadados.sucess) {
                return {
                    metadados: response.metadados,
                    data: (response as SuccessOrcadoResponse).data.map((r) => {
                        return {
                            val_orcado_atualizado: Number(r.val_orcado_atualizado),
                            val_orcado_inicial: Number(r.val_orcado_inicial),
                            saldo_disponivel: Number(r.saldo_disponivel),
                        };
                    }),
                };
            }

            throw new Error(`Serviço SOF retornou dados desconhecidos: ${JSON.stringify(response)}`);
        } catch (error: any) {
            this.logger.debug(`${endpoint} falhou: ${error}`);
            let body = '';
            if (error instanceof got.HTTPError) {
                body = String(error.response.body);
                this.logger.debug(`${endpoint}.res.body: ${body}`);

                if (error.response.statusCode == 404) {
                    throw new HttpException('Não há resultados para a pesquisa, confira os valores informados.', 400);
                } else if (error.response.statusCode == 422) {
                    throw new HttpException(`Confira os valores informados: ${body}`, 400);
                }
            }

            throw new SofError(`Serviço SOF: falha ao acessar serviço: ${error}\n\nResponse.Body: ${body}`);
        }
    }

    private async doEmpenhoRequest(
        endpoint: string,
        input: InputDotacao | InputProcesso | InputNotaEmpenho
    ): Promise<SuccessEmpenhosResponse> {
        interface ResDataObj {
            [dotacao: string]: {
                dotacao: string;
                processo: string;
                empenho_liquido: number;
                val_liquidado: number;
            };
        }

        this.logger.debug(`chamando ${endpoint} com ${JSON.stringify(input)}`);
        try {
            const response: ApiResponse = await this.got
                .post<ApiResponse>(endpoint, {
                    json: input,
                })
                .json();
            this.logger.debug(`resposta: ${JSON.stringify(response)}`);
            //console.dir(response , {depth: 99});

            const byProcesso = endpoint.includes('v1/empenhos/processo');
            // busca por nota e por processo deve continuar da forma que estava,
            if (
                'metadados' in response &&
                response.metadados.sucess &&
                (endpoint.includes('v1/empenhos/dotacao') || byProcesso)
            ) {
                const processedData = (response as SuccessEmpenhosResponse).data.reduce((row: ResDataObj, d) => {
                    const dotacao = TrataDotacaoGrande(d.dotacao);
                    const processo = String(d.processo);
                    const empenho_liquido = Number(d.empenho_liquido);
                    const val_liquidado = Number(d.val_liquidado);

                    if (row[dotacao]) {
                        row[dotacao].empenho_liquido += empenho_liquido;
                        row[dotacao].val_liquidado += val_liquidado;
                    } else {
                        row[dotacao] = {
                            dotacao,
                            processo,
                            empenho_liquido,
                            val_liquidado,
                        };
                    }

                    return row;
                }, {} as ResDataObj);

                if (byProcesso) {
                    // adiciona a versão original do processo (com a dotação completa
                    for (const item of (response as SuccessEmpenhosResponse).data) {
                        if (item.dotacao.length <= 35) continue;

                        processedData[item.dotacao] = {
                            dotacao: String(item.dotacao),
                            processo: String(item.processo),
                            empenho_liquido: Number(item.empenho_liquido),
                            val_liquidado: Number(item.val_liquidado),
                        };
                    }
                }

                return {
                    data: Object.values(processedData),
                    metadados: response.metadados,
                };
            } else if ('metadados' in response && response.metadados.sucess) {
                return {
                    data: (response as SuccessEmpenhosResponse).data.map((r) => {
                        return {
                            dotacao: TrataDotacaoGrande(r.dotacao),
                            processo: String(r.processo),
                            empenho_liquido: Number(r.empenho_liquido),
                            val_liquidado: Number(r.val_liquidado),
                        };
                    }),
                    metadados: response.metadados,
                };
            }

            throw new Error(`Serviço SOF retornou dados desconhecidos: ${JSON.stringify(response)}`);
        } catch (error: any) {
            this.logger.debug(`${endpoint} falhou: ${error}`);
            let body = '';
            if (error instanceof got.HTTPError) {
                body = String(error.response.body);
                this.logger.debug(`${endpoint}.res.body: ${body}`);
                if (error.response.statusCode == 404) {
                    throw new HttpException(
                        'Dotação/Processo ou Nota de Empenho não foi encontrada, confira os valores informados.',
                        400
                    );
                } else if (error.response.statusCode == 422) {
                    throw new HttpException(`Confira os valores informados: ${body}`, 400);
                }
            }

            throw new SofError(`Serviço SOF: falha ao acessar serviço: ${error}\n\nResponse.Body: ${body}`);
        }
    }
}
