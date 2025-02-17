import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { CreateRelPrevisaoCustoDto } from './dto/create-previsao-custo.dto';
import { ListPrevisaoCustoDto } from './entities/previsao-custo.entity';
import { PrevisaoCustoService } from './previsao-custo.service';

@ApiTags('Relatórios - API')
@Controller('relatorio/previsao-custo')
export class PrevisaoCustoController {
    constructor(private readonly previsaoCustoService: PrevisaoCustoService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['Reports.executar.PDM'])
    async create(
        @Body() createPrevisaoCustDto: CreateRelPrevisaoCustoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListPrevisaoCustoDto> {
        return await this.previsaoCustoService.asJSON(createPrevisaoCustDto, user);
    }
}

@ApiTags('Relatórios - API')
@Controller('relatorio/plano-setorial-previsao-custo')
export class PSPrevisaoCustoController {
    constructor(private readonly previsaoCustoService: PrevisaoCustoService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['Reports.executar.PlanoSetorial'])
    async create(
        @Body() createPrevisaoCustDto: CreateRelPrevisaoCustoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListPrevisaoCustoDto> {
        return await this.previsaoCustoService.asJSON(createPrevisaoCustDto, user);
    }
}
