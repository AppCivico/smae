import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { ApiExtraModels, ApiTags } from '@nestjs/swagger';
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
import { EmailConfigService, SmaeConfigService, SysadminService } from './smae-config.service';

@ApiTags('SMAE Configurações')
@Controller('smae-config')
export class SmaeConfigController {
    constructor(private readonly smaeConfigService: SmaeConfigService) {}

    @Get()
    @Roles(['SMAE.sysadmin'])
    async findAll(): Promise<ListSmaeConfigDto> {
        return {
            linhas: await this.smaeConfigService.findAll(),
        };
    }

    @Patch()
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
    @Roles(['SMAE.sysadmin'])
    @ApiExtraModels(TemplateResolverConfigDto, TransporterConfigDto)
    async create(@Body() dto: CreateEmailConfigDto): Promise<EmailConfigResponseDto> {
        return await this.emailConfigService.create(dto);
    }

    @Get()
    @Roles(['SMAE.sysadmin'])
    async findAll(): Promise<EmailConfigResponseDto[]> {
        return await this.emailConfigService.findAll();
    }

    @Get(':id')
    @Roles(['SMAE.sysadmin'])
    async findOne(@Param() params: FindOneParams): Promise<EmailConfigResponseDto> {
        const r = await this.emailConfigService.findOne(params.id);
        if (!r) throw new NotFoundException('Configuração de e-mail não encontrada');
        return r;
    }

    @Patch(':id')
    @Roles(['SMAE.sysadmin'])
    async update(@Param() params: FindOneParams, @Body() dto: UpdateEmailConfigDto): Promise<EmailConfigResponseDto> {
        return await this.emailConfigService.update(params.id, dto);
    }

    @Delete(':id')
    @Roles(['SMAE.sysadmin'])
    async remove(@Param() params: FindOneParams): Promise<void> {
        await this.emailConfigService.remove(params.id);
    }
}

@ApiTags('SMAE Configurações')
@Controller('smae-config/sysadmin')
export class SysadminController {
    constructor(private readonly sysadminService: SysadminService) {}

    @Post(':id')
    @Roles(['SMAE.sysadmin'])
    async grant(@Param() params: FindOneParams): Promise<void> {
        await this.sysadminService.grantSysadmin(params.id);
    }

    @Delete(':id')
    @Roles(['SMAE.sysadmin'])
    async revoke(@Param() params: FindOneParams): Promise<void> {
        await this.sysadminService.revokeSysadmin(params.id);
    }
}
