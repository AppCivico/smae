import { Body, Controller, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../../auth/models/PessoaFromJwt';
import { DemandaAcaoService } from './acao.service';
import { CreateDemandaAcaoDto } from './dto/acao.dto';

@ApiTags('Casa Civil - Demandas')
@Controller('demanda-acao')
export class DemandaAcaoController {
    constructor(private readonly acaoService: DemandaAcaoService) {}

    @Patch()
    @ApiBearerAuth('access-token')
    @Roles(['CadastroDemanda.editar', 'CadastroDemanda.validar'])
    @ApiResponse({ description: 'sucesso ao executar ação', status: 200 })
    @HttpCode(HttpStatus.OK)
    async create(@Body() dto: CreateDemandaAcaoDto, @CurrentUser() user: PessoaFromJwt) {
        return await this.acaoService.create(dto, user);
    }
}
