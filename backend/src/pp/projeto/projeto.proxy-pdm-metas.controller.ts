import { Controller, Get, Inject, ParseArrayPipe, Query, forwardRef } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ListaDePrivilegios } from '../../common/ListaDePrivilegios';
import { ListDadosMetaIniciativaAtividadesDto } from '../../meta/dto/create-meta.dto';
import { MetaService } from '../../meta/meta.service';
import { PlanoSetorialController } from '../../pdm/pdm.controller';
import { FilterPdmOrNotDto } from './dto/create-projeto.dto';
import { ListProjetoProxyPdmMetaDto } from './entities/projeto.proxy-pdm-meta.entity';
import { ProjetoProxyPdmMetasService } from './projeto.proxy-pdm-metas.service';

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
            'Reports.executar.ProgramaDeMetas',
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
        'Reports.executar.ProgramaDeMetas',
    ])
    async buscaMetasIniciativaAtividades(
        @Query('meta_ids', new ParseArrayPipe({ items: Number, separator: ',' })) ids: number[]
    ): Promise<ListDadosMetaIniciativaAtividadesDto> {
        return { linhas: await this.metaService.buscaMetasIniciativaAtividades(null, ids) };
    }
}

@ApiTags('Projeto de Obras')
@Controller(['projeto-mdo/proxy', 'auxiliar/proxy'])
export class ProjetoMDOProxyPdmMetasController {
    static readonly ReadPerms: ListaDePrivilegios[] = [
        'ProjetoMDO.administrador',
        'ProjetoMDO.administrador_no_orgao',
        'MDO.gestor_de_projeto',
        'MDO.colaborador_de_projeto',
        'Reports.executar.PDM',
        'Reports.executar.MDO',
        'Reports.executar.CasaCivil',
        'Reports.executar.PlanoSetorial',
        'Reports.executar.Projetos',
        ...PlanoSetorialController.WritePerms, // Quem for editar o PS, precisa listar para pode fazer o vinculo
    ];
    constructor(
        private readonly svc: ProjetoProxyPdmMetasService,
        @Inject(forwardRef(() => MetaService))
        private readonly metaService: MetaService
    ) {}

    @Get('pdm-e-metas')
    @ApiBearerAuth('access-token')
    @Roles(ProjetoMDOProxyPdmMetasController.ReadPerms, 'Consulta Metas e PDM do sistema')
    @ApiOperation({
        description:
            'Como não há necessidade de puxar todo os dados da meta e do PDM, esse endpoint retorna um resumo de Meta+PDM',
    })
    async findAll(@Query() filters: FilterPdmOrNotDto): Promise<ListProjetoProxyPdmMetaDto> {
        return { linhas: await this.svc.findAll(filters) };
    }

    @ApiBearerAuth('access-token')
    @Get('iniciativas-atividades')
    @Roles(ProjetoMDOProxyPdmMetasController.ReadPerms)
    async buscaMetasIniciativaAtividades(
        @Query('meta_ids', new ParseArrayPipe({ items: Number, separator: ',' })) ids: number[]
    ): Promise<ListDadosMetaIniciativaAtividadesDto> {
        return { linhas: await this.metaService.buscaMetasIniciativaAtividades(null, ids) };
    }
}
