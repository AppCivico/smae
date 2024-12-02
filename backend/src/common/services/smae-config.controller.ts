import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { ApiExtraModels, ApiTags } from '@nestjs/swagger';
import { IsPublic } from '../../auth/decorators/is-public.decorator';
import { FindOneParams } from '../decorators/find-params';
import {
    CreateEmailConfigDto,
    EmailConfigResponseDto,
    TemplateResolverConfigDto,
    TransporterConfigDto,
    UpdateEmailConfigDto,
} from './smae-config-dto/smae-config.email.dto';
import { EmailConfigService } from './smae-config.service';

@ApiTags('Configurações de e-mail')
@Controller('smae-config/email')
export class EmailConfigController {
    constructor(private readonly emailConfigService: EmailConfigService) {}

    @Post()
    @IsPublic()
    @ApiExtraModels(TemplateResolverConfigDto, TransporterConfigDto)
    async create(@Body() dto: CreateEmailConfigDto): Promise<EmailConfigResponseDto> {
        return await this.emailConfigService.create(dto);
    }

    @Get()
    @IsPublic()
    async findAll(): Promise<EmailConfigResponseDto[]> {
        return await this.emailConfigService.findAll();
    }

    @Get(':id')
    @IsPublic()
    async findOne(@Param() params: FindOneParams): Promise<EmailConfigResponseDto> {
        const r = await this.emailConfigService.findOne(params.id);
        if (!r) throw new NotFoundException('Configuração de e-mail não encontrada');
        return r;
    }

    @Patch(':id')
    @IsPublic()
    async update(@Param() params: FindOneParams, @Body() dto: UpdateEmailConfigDto): Promise<EmailConfigResponseDto> {
        return await this.emailConfigService.update(params.id, dto);
    }

    @Delete(':id')
    @IsPublic()
    async remove(@Param() params: FindOneParams): Promise<void> {
        await this.emailConfigService.remove(params.id);
    }
}
