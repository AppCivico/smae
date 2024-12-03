import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsEmail,
    IsNotEmpty,
    IsNumber,
    IsObject,
    IsOptional,
    IsString,
    MaxLength,
    ValidateNested,
} from 'class-validator';

export class TransporterConfigDto {
    @IsString()
    @IsNotEmpty()
    host: string;

    @IsString()
    @IsNotEmpty()
    port: string;

    @IsOptional()
    @IsString()
    user?: string;

    @IsOptional()
    @IsString()
    pass?: string;

    @IsOptional()
    @IsString()
    ssl?: string;

    @IsOptional()
    @IsObject()
    ssl_options?: any;

    @IsOptional()
    @IsNumber()
    timeout?: number;

    @IsOptional()
    @IsString()
    sasl_username?: string;

    @IsOptional()
    @IsString()
    sasl_password?: string;
}

export class TemplateResolverConfigDto {
    @IsString()
    @IsNotEmpty()
    base_url: string;

    @IsOptional()
    @IsString()
    cache_path?: string;

    @IsOptional()
    @IsString()
    cache_prefix?: string;

    @IsOptional()
    @IsString()
    cache_timeout?: string;

    @IsOptional()
    @IsString({ each: true })
    headers?: string[];
}

export class CreateEmailConfigDto {
    @IsString()
    @IsEmail({ require_display_name: true })
    @MaxLength(255)
    from: string;

    @ValidateNested()
    @Type(() => TemplateResolverConfigDto)
    template_resolver_config: TemplateResolverConfigDto;

    @ValidateNested()
    @Type(() => TransporterConfigDto)
    email_transporter_config: TransporterConfigDto;
}

export class UpdateEmailConfigDto extends PartialType(CreateEmailConfigDto) {}

export class EmailConfigResponseDto {
    id: number;

    @ApiProperty({ example: 'no-reply@example.com' })
    from: string;

    @ApiProperty({ example: 'Shypper::TemplateResolvers::HTTP' })
    template_resolver_class: string;

    template_resolver_config: TemplateResolverConfigDto;

    @ApiProperty({ example: 'Email::Sender::Transport::SMTP' })
    email_transporter_class: string;

    email_transporter_config: TransporterConfigDto;
}
