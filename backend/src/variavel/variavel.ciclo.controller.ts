import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiTags } from '@nestjs/swagger';
import { TipoVariavel } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { MetaSetorialController } from '../meta/meta.controller';
import {
    BatchAnaliseQualitativaDto,
    FilterVariavelGlobalCicloDto,
    ListVariavelGlobalCicloDto,
} from './dto/variavel.ciclo.dto';
import { SerieIndicadorValorNominal, SerieValorNomimal } from './entities/variavel.entity';
import { VariavelCicloService } from './variavel.ciclo.service';
import { VariavelGlobalController } from './variavel.controller';

@ApiTags('Variável Global - Ciclo')
@Controller('')
export class VariavelCicloGlobalController {
    private tipo: TipoVariavel = 'Global';

    constructor(private readonly variavelCicloService: VariavelCicloService) {}

    @ApiExtraModels(SerieValorNomimal, SerieIndicadorValorNominal)
    @Get('plano-setorial-variavel-ciclo')
    @ApiBearerAuth('access-token')
    @Roles([...VariavelGlobalController.WritePerm, ...MetaSetorialController.ReadPerm])
    async getVariavelCiclo(
        @Query() filters: FilterVariavelGlobalCicloDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListVariavelGlobalCicloDto> {
        return {
            linhas: await this.variavelCicloService.getVariavelCiclo(filters, user),
        };
    }

    @ApiExtraModels(SerieValorNomimal, SerieIndicadorValorNominal)
    @Patch('plano-setorial-variavel-ciclo')
    @ApiBearerAuth('access-token')
    @Roles([...VariavelGlobalController.WritePerm, ...MetaSetorialController.ReadPerm])
    async patchVariavelCiclo(
        @Body() dto: BatchAnaliseQualitativaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<void> {
        return await this.variavelCicloService.patchVariavelCiclo(dto, user);
    }
}
