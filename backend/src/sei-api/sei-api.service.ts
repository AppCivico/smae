import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Transform, Type, plainToClass } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString, IsUrl, ValidateNested, validate } from 'class-validator';
import got, { Got } from 'got';
import { DateTransformDMY } from '../auth/transforms/date.transform';
import { IsOnlyDate } from '../common/decorators/IsDateOnly';
import { FormatValidationErrors } from '../common/helpers/FormatValidationErrors';
import { SmaeConfigService } from 'src/common/services/smae-config.service';

export class SeiError extends Error {
    constructor(msg: string) {
        console.log(`SEI ERROR: ${msg}`);
        super(msg);
        Object.setPrototypeOf(this, SeiError.prototype);
    }
}

class Assunto {
    @IsOptional()
    @IsString()
    codigo: string | null;

    @IsOptional()
    @IsString()
    descricao: string | null;
}

class Unidade {
    @IsOptional()
    @IsString()
    id_unidade: string | null;

    @IsOptional()
    @IsString()
    sigla: string | null;

    @IsOptional()
    @IsString()
    descricao: string | null;

    @IsEnum(['protocolo', 'arquivo', 'ouvidoria', 'regular'])
    tipo_unidade: 'protocolo' | 'arquivo' | 'ouvidoria' | 'regular';
}
class Usuario {
    @IsOptional()
    @IsString()
    id: string | null;

    @IsOptional()
    @IsString()
    nome: string | null;

    @IsOptional()
    @IsString()
    rf: string | null;
}

class AndamentoSimples {
    @IsOptional()
    @ValidateNested()
    @Type(() => Unidade)
    unidade: Unidade | null;

    @IsOptional()
    @ValidateNested()
    @Type(() => Usuario)
    usuario: Usuario | null;
}

class AndamentoCompleto extends AndamentoSimples {
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransformDMY)
    data: Date | null;

    @IsOptional()
    @IsString()
    descricao: string | null;
}

class ReportUnidadeAberto {
    @ValidateNested()
    @Type(() => Unidade)
    unidade: Unidade;

    @IsOptional()
    @ValidateNested()
    @Type(() => Usuario)
    usuario_atribuido?: Usuario | null;
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
    abertura: AndamentoSimples | null;

    @ValidateNested()
    @Type(() => AndamentoCompleto)
    ultimo_andamento: AndamentoCompleto | null;

    @IsOptional()
    @ValidateNested()
    @Type(() => AndamentoCompleto)
    conclusao?: AndamentoCompleto | null;

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

    constructor(private readonly smaeConfigService: SmaeConfigService) {
        this.got = got;
    }

    async onModuleInit() {
        const seiApiPrefix = await this.smaeConfigService.getConfigWithDefault<string>(
            'SEI_API_PREFIX',
            'http://smae_sei:80/'
        );

        this.SEI_API_PREFIX = seiApiPrefix;
        console.log(this.SEI_API_PREFIX);

        this.got = this.got.extend({
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
                const errorMessages = FormatValidationErrors(errors);
                throw new HttpException(`Falha na resposta do SEI: ${errorMessages.join(', ')}`, 400);
            }

            return dtoInstance as T;
        } catch (error: any) {
            console.trace(error);
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
