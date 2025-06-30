import { Body, Controller, HttpException, HttpStatus, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { SmaeConfigService } from 'src/smae-config/smae-config.service';
import { UpsertConfigDto } from './dto/upsert-config.dto';

@ApiTags('SMAE Configurações')
@Controller('admin/configs')
export class SmaeConfigController {
    constructor(private readonly smaeConfigService: SmaeConfigService) {}

    @Put()
    @ApiBearerAuth('access-token')
    @Roles(['SMAE.superadmin'])
    async upsert(@Body() dto: UpsertConfigDto) {
        try {
            const result = await this.smaeConfigService.upsert(dto.key, dto.value);
            return { data: result.key };
        } catch (error) {
            throw new HttpException('Erro ao criar/atualizar configuração', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
