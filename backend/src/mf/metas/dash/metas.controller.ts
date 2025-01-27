import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiOkResponse, ApiTags, refs } from '@nestjs/swagger';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../../auth/models/PessoaFromJwt';
import { FilterMetaDto } from '../../../meta/dto/filter-meta.dto';
import { ListMetaDto } from '../../../meta/dto/list-meta.dto';
import { MetaService } from '../../../meta/meta.service';
import { MfService } from '../../mf.service';
import { RequestInfoDto } from '../dto/mf-meta.dto';
import {
    FilterMfDashEtapasDto,
    FilterMfDashMetasDto,
    ListMfDashEtapaHierarquiaDto,
    ListMfDashMetasDto,
} from './dto/metas.dto';
import { MfDashMetasService } from './metas.service';

@ApiTags('Monitoramento Fisico - Metas e variáveis')
@Controller('panorama')
export class MfDashMetasController {
    constructor(
        private readonly mfService: MfService,
        private readonly metasDashService: MfDashMetasService,
        private readonly metaService: MetaService
    ) {}

    @Get('metas')
    @ApiBearerAuth('access-token')
    @Roles(['PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal'])
    @ApiExtraModels(ListMfDashMetasDto, RequestInfoDto)
    @ApiOkResponse({
        schema: { allOf: refs(ListMfDashMetasDto, RequestInfoDto) },
    })
    async metas(
        @Query() params: FilterMfDashMetasDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListMfDashMetasDto & RequestInfoDto> {
        const start = Date.now();
        const config = await this.mfService.pessoaAcessoPdm(user);
        const cicloFisicoAtivo = await this.mfService.cicloFisicoAtivo();
        const metas = await this.metasDashService.metas(config, cicloFisicoAtivo.id, params);

        return {
            ...metas,
            requestInfo: { queryTook: Date.now() - start },
        };
    }

    @Get('filtros-metas')
    @ApiBearerAuth('access-token')
    @Roles(['PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal'])
    async filtroMetas(@Query() filters: FilterMetaDto, @CurrentUser() user: PessoaFromJwt): Promise<ListMetaDto> {
        return { linhas: await this.metaService.findAll('_PDM', filters, user.cloneWithRoles(['SMAE.acesso_bi'])) };
    }

    @Get('etapa-hierarquia')
    @ApiBearerAuth('access-token')
    @Roles(['PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal'])
    async etapaHierarquia(
        @Query() filters: FilterMfDashEtapasDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListMfDashEtapaHierarquiaDto> {
        return { linhas: await this.metasDashService.etapaHierarquia(filters) };
    }
}
