import { Controller, Get, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuditLogService } from "./audit-log.service";
import { Roles } from "src/auth/decorators/roles.decorator";
import { FilterAuditLogDto, GroupByFieldsDto, GroupByFilterDto } from "./dto/audit-log.dto";
import { AuditLogSummaryDto } from "./entities/audit-log.entity";

@Controller('audit-log')
@ApiTags('Audit Log')
export class AuditLogController {
    constructor(private readonly auditLogService: AuditLogService) {}

    @Get()
    @ApiBearerAuth('access-token')
    @Roles(['SMAE.superadmin'])
    async findAll(@Query() filters: FilterAuditLogDto) {
        return await this.auditLogService.findAll(filters);
    }

    @Get('/summary')
    @ApiBearerAuth('access-token')
    @Roles(['SMAE.superadmin'])
    async getSummary(
        @Query() filters: GroupByFilterDto,
        @Query() groupBy: GroupByFieldsDto
    ): Promise<AuditLogSummaryDto> {
        return {
            linhas: await this.auditLogService.getSummary(filters, groupBy),
        };
    }
}
