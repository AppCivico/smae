import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiTags } from '@nestjs/swagger';
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
@ApiBearerAuth('access-token')
@Roles(['SMAE.sysadmin'])
@Controller('smae-config/email')
export class EmailConfigController {
    constructor(private readonly emailConfigService: EmailConfigService) {}

    @Post()
    @ApiExtraModels(TemplateResolverConfigDto, TransporterConfigDto)
    async create(@Body() dto: CreateEmailConfigDto): Promise<EmailConfigResponseDto> {
        return await this.emailConfigService.create(dto);
    }

    @Get()
    async findAll(): Promise<EmailConfigResponseDto[]> {
        return await this.emailConfigService.findAll();
    }

    @Get(':id')
    async findOne(@Param() params: FindOneParams): Promise<EmailConfigResponseDto> {
        const r = await this.emailConfigService.findOne(params.id);
        if (!r) throw new NotFoundException('Configuração de e-mail não encontrada');
        return r;
    }

    @Patch(':id')
    async update(@Param() params: FindOneParams, @Body() dto: UpdateEmailConfigDto): Promise<EmailConfigResponseDto> {
        return await this.emailConfigService.update(params.id, dto);
    }

    @Delete(':id')
    async remove(@Param() params: FindOneParams): Promise<void> {
        await this.emailConfigService.remove(params.id);
    }
}

@ApiTags('SMAE Configurações')
@ApiBearerAuth('access-token')
@Roles(['SMAE.sysadmin'])
@Controller('smae-config/sysadmin')
export class SysadminController {
    constructor(private readonly sysadminService: SysadminService) {}

    @Post(':id')
    async grant(@Param() params: FindOneParams): Promise<void> {
        await this.sysadminService.grantSysadmin(params.id);
    }

    @Delete(':id')
    async revoke(@Param() params: FindOneParams): Promise<void> {
        await this.sysadminService.revokeSysadmin(params.id);
    }
}
