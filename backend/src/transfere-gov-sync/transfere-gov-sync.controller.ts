import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaginatedDto } from '../common/dto/paginated.dto';
import {
    FilterTransfereGovListDto,
    FilterTransfereGovTransferenciasDto,
    TransfereGovDto,
    TransfereGovSyncDto,
    TransfereGovTransferenciasDto,
    UpdateTransfereGovTransferenciaDto,
} from './entities/transfere-gov-sync.entity';
import { TransfereGovSyncService } from './transfere-gov-sync.service';
import { ApiPaginatedResponse } from '../auth/decorators/paginated.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { FindOneParams } from 'src/common/decorators/find-params';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';

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

    @Get('transferencia')
    @ApiBearerAuth('access-token')
    @ApiPaginatedResponse(TransfereGovTransferenciasDto)
    async listaTransferencias(
        @Query() params: FilterTransfereGovTransferenciasDto
    ): Promise<PaginatedDto<TransfereGovTransferenciasDto>> {
        return await this.transfereGovSyncService.listaTransferencias(params);
    }

    @Patch('transferencia/:id')
    @ApiBearerAuth('access-token')
    @ApiPaginatedResponse(TransfereGovDto)
    async updateTransferencia(
        @Param() params: FindOneParams,
        @Body() dto: UpdateTransfereGovTransferenciaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.transfereGovSyncService.atualizarTransferencia(+params.id, dto, user);
    }
}
