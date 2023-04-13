import { Controller, Get, ParseArrayPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ListDadosMetaIniciativaAtividadesDto } from '../../meta/dto/create-meta.dto';
import { MetaService } from '../../meta/meta.service';
import { ListProjetoProxyPdmMetaDto } from './entities/projeto.proxy-pdm-meta.entity';
import { ProjetoProxyPdmMetasService } from './projeto.proxy-pdm-metas.service';

@ApiTags('Projeto')
@Controller('projeto/proxy')
export class ProjetoProxyPdmMetasController {
    constructor(
        private readonly svc: ProjetoProxyPdmMetasService,
        private readonly metaService: MetaService
    ) { }

    @Get('pdm-e-metas')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Projeto.administrador_no_orgao', 'SMAE.gestor_de_projeto', 'SMAE.colaborador_de_projeto')
    @ApiOperation({
        summary: 'Consulta Metas e PDM do sistema',
        description: 'Como não há necessidade de puxar todo os dados da meta e do PDM, esse endpoint retorna um resumo de Meta+PDM',
    })
    async findAll(): Promise<ListProjetoProxyPdmMetaDto> {
        return { linhas: await this.svc.findAll() };
    }

    @ApiBearerAuth('access-token')
    @Get('iniciativas-atividades')
    @ApiUnauthorizedResponse({ description: 'Precisa: CadastroMeta.listar' })
    @Roles('Projeto.administrador_no_orgao', 'SMAE.gestor_de_projeto', 'SMAE.colaborador_de_projeto')
    async buscaMetasIniciativaAtividades(@Query('meta_ids', new ParseArrayPipe({ items: Number, separator: ',' })) ids: number[]): Promise<ListDadosMetaIniciativaAtividadesDto> {
        return { linhas: await this.metaService.buscaMetasIniciativaAtividades(ids) };
    }
}
