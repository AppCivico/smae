import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaginatedDto } from '../common/dto/paginated.dto';
import { FilterTransfereGovListDto, TransfereGovDto, TransfereGovSyncDto } from './entities/transfere-gov-sync.entity';
import { TransfereGovSyncService } from './transfere-gov-sync.service';
import { ApiPaginatedResponse } from '../auth/decorators/paginated.decorator';

@Controller('transfere-gov')
@ApiTags('TransfereGov Integração')
export class TransfereGovController {
    constructor(private readonly transfereGovSyncService: TransfereGovSyncService) {}

    @Post('sync')
    @ApiBearerAuth('access-token')
    async manualSync(): Promise<TransfereGovSyncDto> {
        const newItems = await this.transfereGovSyncService.manualSync();
        return { novos_itens: newItems.map((item) => item.id) };
    }

    @Get('lista')
    @ApiBearerAuth('access-token')
    @ApiPaginatedResponse(TransfereGovDto)
    async listaComunicados(@Query() params: FilterTransfereGovListDto): Promise<PaginatedDto<TransfereGovDto>> {
        return await this.transfereGovSyncService.listaComunicados(params);
    }
}
