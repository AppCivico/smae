import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SmaeConfigDto } from './smae-config-dto/smae-config.dto';
import {
    CreateEmailConfigDto,
    EmailConfigResponseDto,
    TemplateResolverConfigDto,
    TransporterConfigDto,
    UpdateEmailConfigDto,
} from './smae-config-dto/smae-config.email.dto';

@Injectable()
export class SmaeConfigService {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(): Promise<SmaeConfigDto[]> {
        const configs = await this.prisma.smaeConfig.findMany({
            orderBy: { key: 'asc' },
            select: {
                key: true,
                value: true,
            },
        });

        return configs.map((config) => ({
            key: config.key,
            value: config.value,
        }));
    }

    async upsert(key: string, value: string): Promise<SmaeConfigDto> {
        return this.prisma.smaeConfig.upsert({
            where: { key },
            update: { value },
            create: { key, value },
            select: {
                key: true,
                value: true,
            },
        });
    }

    async getConfig(key: string): Promise<string | null> {
        const config = await this.prisma.smaeConfig.findFirst({
            where: {
                key: key,
            },
        });
        if (config) return config.value;

        if (process.env[key]) return process.env[key] ?? null;

        return null;
    }

    async getConfigWithDefault<T>(key: string, defaultValue: T, parser?: (value: string) => T): Promise<T> {
        try {
            const value = await this.getConfig(key);
            if (!value) return defaultValue;

            if (parser) {
                return parser(value);
            }

            try {
                // Tenta fazer o parse do valor como JSON primeiro
                return JSON.parse(value) as T;
            } catch {
                // Se não for JSON válido, retorna o valor como está
                return value as unknown as T;
            }
        } catch (error) {
            Logger.error(`Erro ao obter configuração para a chave "${key}": ${error?.message}`, error);
            return defaultValue;
        }
    }

    /**
     * Obtém o valor da configuração como número, com valor padrão e conversão segura.
     */
    async getConfigNumberWithDefault(key: string, defaultValue: number): Promise<number> {
        return this.getConfigWithDefault<number>(key, defaultValue, (value) => {
            const n = Number(value);
            return isNaN(n) ? defaultValue : n;
        });
    }

    /**
     * Obtém o valor da configuração como booleano, com valor padrão e conversão segura.
     * Trata strings como 'true' ou 'false' para conversão.
     */
    async getConfigBooleanWithDefault(key: string, defaultValue: boolean): Promise<boolean> {
        return this.getConfigWithDefault<boolean>(key, defaultValue, (value) => {
            // Converte o valor para booleano, tratando strings como 'true' ou 'false
            if (typeof value === 'string') {
                return value.toLowerCase() === 'true';
            }
            return Boolean(value);
        });
    }

    /*
     * Obtém a URL base configurada para o SMAE.
     * Serve para que os serviços que precisam de uma URL base possam gerar novas URLs a partir dela.
     * A URL base é obtida a partir da configuração 'URL_LOGIN_SMAE'.
     *
     */
    async getBaseUrl(key: 'URL_LOGIN_SMAE'): Promise<string> {
        const rawUrl = await this.getConfigWithDefault(key, 'http://smae-frontend');

        try {
            const parsedUrl = new URL(rawUrl);
            const baseUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}${parsedUrl.port ? ':' + parsedUrl.port : ''}`;
            Logger.log(`URL base inicializada: ${baseUrl}`);
            return baseUrl;
        } catch (error) {
            Logger.error(`Erro ao analisar a 'URL_LOGIN_SMAE' configurada: ${rawUrl}: ${error?.message}`);
            throw new InternalServerErrorException(`Erro ao analisar a URL base configurada: ${rawUrl}`);
        }
    }
}

@Injectable()
export class EmailConfigService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateEmailConfigDto): Promise<EmailConfigResponseDto> {
        const data: Prisma.EmaildbConfigCreateInput = {
            from: dto.from,
            template_resolver_class: 'Shypper::TemplateResolvers::HTTP',
            email_transporter_class: 'Email::Sender::Transport::SMTP',
        };

        const row = await this.prisma.emaildbConfig.create({ data });
        return {
            ...row,
            email_transporter_config: row.email_transporter_config?.valueOf() as TransporterConfigDto,
            template_resolver_config: row.template_resolver_config?.valueOf() as TemplateResolverConfigDto,
        };
    }

    async update(id: number, dto: UpdateEmailConfigDto): Promise<EmailConfigResponseDto> {
        const exists = await this.findOne(id);
        if (!exists) throw new BadRequestException('Configuração de e-mail não encontrada');

        const data: Prisma.EmaildbConfigUpdateInput = {
            from: dto.from,
            template_resolver_config: dto.template_resolver_config as any,
            email_transporter_config: dto.email_transporter_config as any,
        };

        const row = await this.prisma.emaildbConfig.update({
            where: { id },
            data,
        });

        return {
            ...row,
            email_transporter_config: row.email_transporter_config?.valueOf() as TransporterConfigDto,
            template_resolver_config: row.template_resolver_config?.valueOf() as TemplateResolverConfigDto,
        };
    }

    async findAll(): Promise<EmailConfigResponseDto[]> {
        const rows = await this.prisma.emaildbConfig.findMany({
            orderBy: { id: 'asc' },
        });

        return rows.map((row) => ({
            ...row,
            email_transporter_config: row.email_transporter_config?.valueOf() as TransporterConfigDto,
            template_resolver_config: row.template_resolver_config?.valueOf() as TemplateResolverConfigDto,
        }));
    }

    async findOne(id: number): Promise<EmailConfigResponseDto | null> {
        const row = await this.prisma.emaildbConfig.findUnique({
            where: { id },
        });
        if (!row) return null;

        return {
            ...row,
            email_transporter_config: row.email_transporter_config?.valueOf() as TransporterConfigDto,
            template_resolver_config: row.template_resolver_config?.valueOf() as TemplateResolverConfigDto,
        };
    }

    async remove(id: number): Promise<void> {
        const exists = await this.prisma.emaildbConfig.findUnique({ where: { id } });
        if (!exists) throw new BadRequestException('Configuração de e-mail não encontrada');

        await this.prisma.emaildbConfig.delete({ where: { id } });
    }
}
