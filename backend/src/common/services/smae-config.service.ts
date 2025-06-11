import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
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
