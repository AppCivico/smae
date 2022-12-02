import { Injectable, Logger } from '@nestjs/common';
import got, { Got } from 'got';

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
type ValidationError = {
    loc: string
    msg: string
    type: string
};

export type ApiResponse = SuccessEmpenhosResponse | ErrorHttpResponse | ValidationError;

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
        this.SOF_API_PREFIX = process.env.SOF_API_PREFIX || 'http://smae_api_orcamento:80/'
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


    async empenhoDotacao(input: InputDotacao): Promise<ApiResponse> {
        const endpoint = '/v1/empnhos/dotacao';
        this.logger.debug(`empenhoDotacao - chamando ${endpoint} com ${JSON.stringify(input)}`);
        try {
            const res: ApiResponse = await this.got.post(endpoint, {
                json: input
            }).json();

            return res;

        } catch (error) {
            console.log(error);
            return { detail: `Falha ao acessar serviço: ${error}` } as ErrorHttpResponse;
        }
    }


}

