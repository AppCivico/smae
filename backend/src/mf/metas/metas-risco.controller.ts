import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiOkResponse, ApiTags, refs } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { FilterRiscoDto, MfListRiscoDto, RiscoDto } from './../metas/dto/mf-meta-risco.dto';
import { RequestInfoDto } from './../metas/dto/mf-meta.dto';
import { MetasRiscoService } from './../metas/metas-risco.service';
import { MfService } from '../mf.service';

@ApiTags('Monitoramento Fisico - Risco')
@Controller('metas')
export class MetasRiscoController {
    constructor(private readonly metasRiscoService: MetasRiscoService, private readonly mfService: MfService) {}

    @ApiBearerAuth('access-token')
    @Get('risco')
    @Roles('PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal')
    @ApiExtraModels(RecordWithId, RequestInfoDto)
    @ApiOkResponse({
        schema: { allOf: refs(MfListRiscoDto, RequestInfoDto) },
    })
    async GetMetaRisco(@Query() dto: FilterRiscoDto, @CurrentUser() user: PessoaFromJwt): Promise<MfListRiscoDto & RequestInfoDto> {
        const start = Date.now();
        const config = await this.mfService.pessoaAcessoPdm(user);

        return {
            ...(await this.metasRiscoService.getMetaRisco(dto, config, user)),
            requestInfo: { queryTook: Date.now() - start },
        };
    }

    @ApiBearerAuth('access-token')
    @Patch('risco')
    @Roles('PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal')
    @ApiExtraModels(RecordWithId, RequestInfoDto)
    @ApiOkResponse({
        schema: { allOf: refs(RecordWithId, RequestInfoDto) },
    })
    async AddMetaRisco(@Body() dto: RiscoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId & RequestInfoDto> {
        const start = Date.now();
        const config = await this.mfService.pessoaAcessoPdm(user);

        return {
            ...(await this.metasRiscoService.addMetaRisco(dto, config, user)),
            requestInfo: { queryTook: Date.now() - start },
        };
    }
}
