import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiTags } from '@nestjs/swagger';
import { IsPublic } from '../../auth/decorators/is-public.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { FindOneParams } from '../decorators/find-params';
import { ListSmaeConfigDto, SmaeConfigDto } from './smae-config-dto/smae-config.dto';
import {
    CreateEmailConfigDto,
    EmailConfigResponseDto,
    TemplateResolverConfigDto,
    TransporterConfigDto,
    UpdateEmailConfigDto,
} from './smae-config-dto/smae-config.email.dto';
import { EmailConfigService, SmaeConfigService } from './smae-config.service';

@ApiTags('SMAE Configurações')
@Controller('smae-config')
export class SmaeConfigController {
    constructor(private readonly smaeConfigService: SmaeConfigService) {}

    @Get()
    @ApiBearerAuth('access-token')
    @Roles(['SMAE.sysadmin'])
    async findAll(): Promise<ListSmaeConfigDto> {
        return {
            linhas: await this.smaeConfigService.findAll(),
        };
    }

    @Patch()
    @ApiBearerAuth('access-token')
    @Roles(['SMAE.sysadmin'])
    async upsert(@Body() dto: SmaeConfigDto): Promise<SmaeConfigDto> {
        return await this.smaeConfigService.upsert(dto.key, dto.value);
    }
}

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
