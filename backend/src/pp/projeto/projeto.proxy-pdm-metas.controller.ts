import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { FilterProjetoDto } from './dto/filter-projeto.dto';
import { ListProjetoDto } from './entities/projeto.entity';
import { ProjetoService } from './projeto.service';

@ApiTags('Projeto')
@Controller('projeto/proxy')
export class ProjetoProxyPdmMetasController {
    constructor(private readonly projetoService: ProjetoService) { }

    @Get('pdm-e-metas')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Projeto.administrador', 'SMAE.gestor_de_projeto')
    @ApiOperation({
        summary: 'Consulta Metas e PDM do sistema',
        description: 'Como não há necessidade de puxar todo os dados da meta e do PDM, esse endpoint retorna um resumo de Meta+PDM',
    })
    async findAll(@Query() filters: FilterProjetoDto, @CurrentUser() user: PessoaFromJwt): Promise<ListProjetoDto> {
        return { linhas: await this.projetoService.findAll(filters, user) };
    }
}
