import { HttpException, Injectable, Logger } from '@nestjs/common';
import got, { Got } from 'got';
import { DateTime } from 'luxon';

export class SofError extends Error {
    constructor(msg: string) {
        console.log(`SOF ERROR: ${msg}`)
        super(msg);
        Object.setPrototypeOf(this, SofError.prototype);
    }
}

type RetornoEmpenho = {
    empenho_liquido: number
    val_liquidado: number
    dotacao: string
    processo: string
}

type MetaDados = {
    sucess: boolean
    message: string
}

type SuccessEmpenhosResponse = {
    data: RetornoEmpenho[]
    metadados: MetaDados
};

type ErrorHttpResponse = {
    detail: string
};

type ApiResponse = SuccessEmpenhosResponse | ErrorHttpResponse;

export type InputDotacao = {
    ano: number
    mes: number
    dotacao: string
};

export type InputNotaEmpenho = {
    ano: number
    mes: number
    nota_empenho: string
};

export type InputProcesso = {
    ano: number
    mes: number
    processo: string
};


@Injectable()
export class SofApiService {
    private got: Got
    private readonly logger = new Logger(SofApiService.name);
    SOF_API_PREFIX: string;

    constructor() {
        this.SOF_API_PREFIX = process.env.SOF_API_PREFIX || 'http://smae_orcamento:80/'
    }

    realizadoMesMaisAtual(ano: number): number {
        const nowSp = DateTime.local({ zone: "America/Sao_Paulo" });

        const anoCorrente = nowSp.year;
        if (anoCorrente == +ano)
            return nowSp.month;

        if (+ano > anoCorrente)
            throw new HttpException('Não é possível buscar por realizado no futuro', 400);

        return 12; // mes mais recente do ano pesquisado
    }


    onModuleInit() {
        this.got = got.extend({
            prefixUrl: this.SOF_API_PREFIX,
            retry: {
                methods: [
                    'GET',
                    'PUT',
                    'HEAD',
                    'DELETE',
                    'OPTIONS',
                    'TRACE',
                    'POST',
                ],
                statusCodes: [
                    408,
                    413,
                    429,
                    500,
                    502,
                    503,
                    521,
                    522,
                    524,
                ],

            }
        });
        this.logger.debug(`API SOF configurada para usar endereço ${this.SOF_API_PREFIX}`);
    }

    async empenhoDotacao(input: InputDotacao): Promise<SuccessEmpenhosResponse> {
        const endpoint = 'v1/empenhos/dotacao';
        return await this.doRequest(endpoint, input);
    }

    async empenhoNotaEmpenho(input: InputNotaEmpenho): Promise<SuccessEmpenhosResponse> {
        const endpoint = 'v1/empenhos/nota_empenho';
        return await this.doRequest(endpoint, input);
    }

    async empenhoProcesso(input: InputProcesso): Promise<SuccessEmpenhosResponse> {
        const endpoint = 'v1/empenhos/processo';
        return await this.doRequest(endpoint, input);
    }

    private async doRequest(endpoint: string, input: InputDotacao | InputProcesso | InputNotaEmpenho): Promise<SuccessEmpenhosResponse> {

        this.logger.debug(`chamando ${endpoint} com ${JSON.stringify(input)}`);
        try {
            const response: ApiResponse = await this.got.post<ApiResponse>(endpoint, {
                json: input
            }).json();
            this.logger.debug(`resposta: ${JSON.stringify(response)}`);
            if ("metadados" in response && response.metadados.sucess) {
                return {
                    data: response.data.map((d) => {
                        return {
                            dotacao: d.dotacao,
                            processo: String(d.processo),
                            empenho_liquido: Number(d.empenho_liquido),
                            val_liquidado: Number(d.val_liquidado),
                        }
                    }),
                    metadados: response.metadados
                };
            }

            throw new Error(`Serviço SOF retornou dados desconhecidos: ${JSON.stringify(response)}`);
        } catch (error: any) {
            this.logger.debug(`${endpoint} falhou: ${error}`);
            if (error instanceof got.HTTPError) {
                this.logger.debug(`${endpoint}.res.body: ${error.response.body}`);
                if (error.response.statusCode == 404) {
                    throw new HttpException('Dotação/Processo ou Nota de Empenho não foi encontrada, confira os valores informados.', 400);
                } else if (error.response.statusCode == 422) {
                    throw new HttpException(`Confira os valores informados: ${error.response.body}`, 400);
                }
            }

            throw new SofError(`Serviço SOF: falha ao acessar serviço: ${error}`)
        }
    }

}

