import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { ApiPaginatedWithPagesResponse } from 'src/auth/decorators/paginated.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { FindOneParams } from 'src/common/decorators/find-params';
import { PaginatedWithPagesDto } from 'src/common/dto/paginated.dto';
import {
    FilterPainelParlamentarDto,
    FilterPainelParlamentarTransferenciasDto,
} from './dto/filter-painel-parlamentar.dto';
import { PainelParlamentarDto, PainelParlamentarTransferenciaDto } from './entities/painel-parlamentar.entity';
import { PainelParlamentarService } from './painel-parlamentar.service';

@ApiTags('Painel do Parlamentar')
@Controller('painel-parlamentar')
export class PainelParlamentarController {
    constructor(private readonly painelParlamentarService: PainelParlamentarService) {}

    @Get(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroParlamentar.painel'])
    async painel(
        @Param() params: FindOneParams,
        @Query() filtro: FilterPainelParlamentarDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<PainelParlamentarDto> {
        return await this.painelParlamentarService.painel(+params.id, filtro, user);
    }

    @Get(':id/transferencias')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroParlamentar.painel'])
    @ApiPaginatedWithPagesResponse(PainelParlamentarTransferenciaDto)
    async transferencias(
        @Param() params: FindOneParams,
        @Query() filtro: FilterPainelParlamentarTransferenciasDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<PaginatedWithPagesDto<PainelParlamentarTransferenciaDto>> {
        return await this.painelParlamentarService.transferencias(+params.id, filtro, user);
    }
}
