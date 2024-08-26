import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { ApiPaginatedResponse } from '../../auth/decorators/paginated.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { FindOneParams } from '../../common/decorators/find-params';
import { PaginatedDto } from '../../common/dto/paginated.dto';
import { FilterNotaComunicadoDto, NotaComunicadoItemDto, NotaComunicadoMarcarLidoDto } from './dto/comunicados.dto';
import { NotaService } from './nota.service';

@ApiTags('Bloco Nota / Nota')
@Controller('nota-comunicados')
export class NotaComunicadoController {
    constructor(private readonly notaService: NotaService) {}

    @Get()
    @ApiBearerAuth('access-token')
    @ApiPaginatedResponse(NotaComunicadoItemDto)
    async listComunicados(
        @Query() filters: FilterNotaComunicadoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<PaginatedDto<NotaComunicadoItemDto>> {
        return await this.notaService.listaComunicados(filters, user);
    }

    @Patch(':id/lido')
    @ApiBearerAuth('access-token')
    async marcarLido(
        @Param() params: FindOneParams,
        @Body() dto: NotaComunicadoMarcarLidoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<void> {
        await this.notaService.marcaLidoStatusComunicado(params.id, user.id, dto.lido);
    }
}
