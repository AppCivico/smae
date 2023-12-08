import { Controller, Get, Query } from '@nestjs/common';
import { RequestLogService } from './request_log.service';
import { ApiBearerAuth, ApiQuery, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { FilterRequestLogDto, GroupByFieldsDto, GroupByFilterDto } from './dto/request_log.dto';
import { RequestSummaryDto } from './entities/request_log.entity';

@Controller('request-log')
@ApiTags('Request Log')
export class RequestLogController {
    constructor(private readonly requestLogService: RequestLogService) {}

    @Get()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('SMAE.superadmin')
    async findAll(@Query() filters: FilterRequestLogDto) {
        return await this.requestLogService.findAll(filters);
    }

    @Get('/summary')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('SMAE.superadmin')
    async getSummary(
        @Query() filters: GroupByFilterDto,
        @Query() groupBy: GroupByFieldsDto
    ): Promise<RequestSummaryDto> {
        return {
            linhas: await this.requestLogService.getSummary(filters, groupBy),
        };
    }
}
