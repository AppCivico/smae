import { Controller, Get, Inject, ParseArrayPipe, Query, forwardRef } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ListDadosMetaIniciativaAtividadesDto } from '../../meta/dto/create-meta.dto';
import { MetaService } from '../../meta/meta.service';
import { ListProjetoProxyPdmMetaDto } from './entities/projeto.proxy-pdm-meta.entity';
import { ProjetoProxyPdmMetasService } from './projeto.proxy-pdm-metas.service';
import { FilterPdmOrNotDto } from './dto/create-projeto.dto';

@ApiTags('Projeto')
@Controller('projeto/proxy')
export class ProjetoProxyPdmMetasController {
    constructor(
        private readonly svc: ProjetoProxyPdmMetasService,
        @Inject(forwardRef(() => MetaService))
        private readonly metaService: MetaService
    ) {}

    @Get('pdm-e-metas')
    @ApiBearerAuth('access-token')
    @Roles(
        [
            'Projeto.administrador',
            'Projeto.administrador_no_orgao',
            'SMAE.gestor_de_projeto',
            'SMAE.colaborador_de_projeto',
            'Reports.executar.PDM',
            'Reports.executar.MDO',
            'Reports.executar.CasaCivil',
            'Reports.executar.PlanoSetorial',
            'Reports.executar.Projetos',
        ],
        'Consulta Metas e PDM do sistema'
    )
    @ApiOperation({
        description:
            'Como não há necessidade de puxar todo os dados da meta e do PDM, esse endpoint retorna um resumo de Meta+PDM',
    })
    async findAll(@Query() filters: FilterPdmOrNotDto): Promise<ListProjetoProxyPdmMetaDto> {
        return { linhas: await this.svc.findAll(filters) };
    }

    @ApiBearerAuth('access-token')
    @Get('iniciativas-atividades')
    @Roles([
        'Projeto.administrador',
        'Projeto.administrador_no_orgao',
        'SMAE.gestor_de_projeto',
        'SMAE.colaborador_de_projeto',
        'Reports.executar.PDM',
        'Reports.executar.MDO',
        'Reports.executar.CasaCivil',
        'Reports.executar.PlanoSetorial',
        'Reports.executar.Projetos',
    ])
    async buscaMetasIniciativaAtividades(
        @Query('meta_ids', new ParseArrayPipe({ items: Number, separator: ',' })) ids: number[]
    ): Promise<ListDadosMetaIniciativaAtividadesDto> {
        return { linhas: await this.metaService.buscaMetasIniciativaAtividades('PDM', ids) };
    }
}

@ApiTags('Projeto de Obras')
@Controller('projeto-mdo/proxy')
export class ProjetoMDOProxyPdmMetasController {
    constructor(
        private readonly svc: ProjetoProxyPdmMetasService,
        @Inject(forwardRef(() => MetaService))
        private readonly metaService: MetaService
    ) {}

    @Get('pdm-e-metas')
    @ApiBearerAuth('access-token')
    @Roles(
        [
            'ProjetoMDO.administrador',
            'ProjetoMDO.administrador_no_orgao',
            'MDO.gestor_de_projeto',
            'MDO.colaborador_de_projeto',
            'Reports.executar.PDM',
            'Reports.executar.MDO',
            'Reports.executar.CasaCivil',
            'Reports.executar.PlanoSetorial',
            'Reports.executar.Projetos',
        ],
        'Consulta Metas e PDM do sistema'
    )
    @ApiOperation({
        description:
            'Como não há necessidade de puxar todo os dados da meta e do PDM, esse endpoint retorna um resumo de Meta+PDM',
    })
    async findAll(@Query() filters: FilterPdmOrNotDto): Promise<ListProjetoProxyPdmMetaDto> {
        return { linhas: await this.svc.findAll(filters) };
    }

    @ApiBearerAuth('access-token')
    @Get('iniciativas-atividades')
    @Roles([
        'ProjetoMDO.administrador',
        'ProjetoMDO.administrador_no_orgao',
        'MDO.gestor_de_projeto',
        'MDO.colaborador_de_projeto',
        'Reports.executar.PDM',
        'Reports.executar.MDO',
        'Reports.executar.CasaCivil',
        'Reports.executar.PlanoSetorial',
        'Reports.executar.Projetos',
    ])
    async buscaMetasIniciativaAtividades(
        @Query('meta_ids', new ParseArrayPipe({ items: Number, separator: ',' })) ids: number[]
    ): Promise<ListDadosMetaIniciativaAtividadesDto> {
        return { linhas: await this.metaService.buscaMetasIniciativaAtividades('PDM', ids) };
    }
}
