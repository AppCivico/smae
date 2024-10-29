import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Transform, Type, plainToClass } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString, IsUrl, ValidateNested, validate } from 'class-validator';
import got, { Got } from 'got';
import { DateTransformDMY } from '../auth/transforms/date.transform';
import { IsOnlyDate } from '../common/decorators/IsDateOnly';

export class SeiError extends Error {
    constructor(msg: string) {
        console.log(`SEI ERROR: ${msg}`);
        super(msg);
        Object.setPrototypeOf(this, SeiError.prototype);
    }
}

class Assunto {
    @IsString()
    codigo: string;

    @IsString()
    descricao: string;
}

class Unidade {
    @IsString()
    id_unidade: string;

    @IsString()
    sigla: string;

    @IsString()
    descricao: string;

    @IsEnum(['protocolo', 'arquivo', 'ouvidoria', 'regular'])
    tipo_unidade: 'protocolo' | 'arquivo' | 'ouvidoria' | 'regular';
}

class Usuario {
    @IsString()
    id: string;

    @IsString()
    nome: string;

    @IsString()
    rf: string;
}

class AndamentoSimples {
    @ValidateNested()
    @Type(() => Unidade)
    unidade: Unidade;

    @ValidateNested()
    @Type(() => Usuario)
    usuario: Usuario;
}

class AndamentoCompleto extends AndamentoSimples {
    @IsOnlyDate()
    @Transform(DateTransformDMY)
    data: Date;

    @IsString()
    descricao: string;
}

class ReportUnidadeAberto {
    @ValidateNested()
    @Type(() => Unidade)
    unidade: Unidade;

    @IsOptional()
    @ValidateNested()
    @Type(() => Usuario)
    usuario_atribuido?: Usuario;
}

export class RetornoResumoProcesso {
    @IsString()
    numero_processo: string;

    @IsString()
    especificacao: string;

    @IsString()
    tipo: string;

    @IsOnlyDate()
    @Transform(DateTransformDMY)
    data_autuacao: Date;

    @IsUrl()
    link: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => Assunto)
    assuntos: Assunto[];
}

export class RetornoRelatorioProcesso extends RetornoResumoProcesso {
    @ValidateNested()
    @Type(() => AndamentoSimples)
    abertura: AndamentoSimples;

    @ValidateNested()
    @Type(() => AndamentoCompleto)
    ultimo_andamento: AndamentoCompleto;

    @IsOptional()
    @ValidateNested()
    @Type(() => AndamentoCompleto)
    conclusao?: AndamentoCompleto;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ReportUnidadeAberto)
    unidades_aberto: ReportUnidadeAberto[];
}

@Injectable()
export class SeiApiService {
    private got: Got;
    private readonly logger = new Logger(SeiApiService.name);
    SEI_API_PREFIX: string;

    constructor() {
        this.SEI_API_PREFIX = process.env.SEI_API_PREFIX || 'http://smae_sei:80/';
        this.got = got.extend({
            prefixUrl: this.SEI_API_PREFIX,
            timeout: 18 * 1000,
            retry: {
                limit: 2,
                methods: ['GET', 'PUT', 'HEAD', 'DELETE', 'OPTIONS', 'TRACE', 'POST'],
                statusCodes: [408, 413, 429, 500, 502, 503, 521, 522, 524],
            },
        });
        this.logger.debug(`API SEI configurada para usar endereço ${this.SEI_API_PREFIX}`);
    }

    async getResumoProcesso(numProcesso: string): Promise<RetornoResumoProcesso> {
        const endpoint = 'v1/processos/resumo';
        return await this.doGetRequest<RetornoResumoProcesso>(
            endpoint,
            { num_processo: numProcesso },
            RetornoResumoProcesso
        );
    }

    async getRelatorioProcesso(numProcesso: string): Promise<RetornoRelatorioProcesso> {
        const endpoint = 'v1/processos/relatorio';
        return await this.doGetRequest<RetornoRelatorioProcesso>(
            endpoint,
            { num_processo: numProcesso },
            RetornoRelatorioProcesso
        );
    }

    private async doGetRequest<T>(endpoint: string, params: any, dto: new () => T): Promise<T> {
        const logStr =
            'GET ' +
            endpoint +
            '?' +
            Object.entries(params)
                .map(([key, value]) => `${key}=${value}`)
                .join('&');

        this.logger.debug(`Iniciando ${logStr}...`);
        try {
            const response = await this.got.get(endpoint, { searchParams: params }).json();
            this.logger.debug(`${logStr} resposta: ${JSON.stringify(response)}`);

            // Validate the response
            const dtoInstance = plainToClass(dto, response);
            const errors = await validate(dtoInstance as any);
            if (errors.length > 0) {
                const errorMessages = errors.map((error) => Object.values((error as any).constraints)).flat();
                throw new HttpException(`Validation failed: ${errorMessages.join(', ')}`, 400);
            }

            return dtoInstance as T;
        } catch (error: any) {
            this.logger.debug(`${logStr} falhou: ${error}`);
            let body = '';
            if (error instanceof got.HTTPError) {
                body = String(error.response.body);
                this.logger.debug(`${logStr}.res.body: ${body}`);
            }

            if (error instanceof HttpException) {
                throw error;
            }

            throw new SeiError(`Serviço SEI: falha ao acessar serviço: ${error}\n\nResponse.Body: ${body}`);
        }
    }
}
