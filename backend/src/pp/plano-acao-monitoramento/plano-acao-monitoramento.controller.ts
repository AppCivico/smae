import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ListaDePrivilegios } from '../../common/ListaDePrivilegios';
import { CreatePlanoAcaoMonitoramentoDto } from './dto/create-plano-acao-monitoramento.dto';
import { PlanoAcaoMonitoramentoService } from './plano-acao-monitoramento.service';

const roles: ListaDePrivilegios[] = ['Projeto.administrador', 'SMAE.gestor_de_projeto', 'SMAE.colaborador_de_projeto'];

@Controller('projeto')
@ApiTags('Projeto - Risco')
export class PlanoAcaoMonitoramentoController {
    constructor(private readonly planoAcaoMonitoramentoService: PlanoAcaoMonitoramentoService) { }

    @Post(':id/plano-acao-monitoramento')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async create(@Body() createPlanoAcaoMonitoramentoDto: CreatePlanoAcaoMonitoramentoDto) {

    }

    @Post(':id/plano-acao-monitoramento')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async findAll() {

    }

    @Delete(':id/plano-acao-monitoramento')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async remove(@Param('id') id: string) {

    }
}
