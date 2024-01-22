import { Body, Controller, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpsertFeatureFlagDto } from './dto/feature-flag.dto';
import { FeatureFlagService } from './feature-flag.service';

@ApiTags('Feature-Flag')
@Controller('feature-flag')
export class FeatureFlagController {
    constructor(private readonly featureFlagService: FeatureFlagService) {}

    @Patch('')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('SMAE.superadmin')
    async update(@Body() dto: UpsertFeatureFlagDto) {
        return await this.featureFlagService.update(dto);
    }
}
