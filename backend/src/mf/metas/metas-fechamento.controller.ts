import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiOkResponse, ApiTags, refs } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { FechamentoDto, FilterFechamentoDto, MfListFechamentoDto } from 'src/mf/metas/dto/mf-meta-fechamento.dto';
import { RequestInfoDto } from 'src/mf/metas/dto/mf-meta.dto';
import { MfService } from '../mf.service';
import { MetasFechamentoService } from './metas-fechamento.service';


@ApiTags('Monitoramento Fisico - Fechamento')
@Controller('metas')
export class MetasFechamentoController {
    constructor(
        private readonly metasFechamentoService: MetasFechamentoService,
        private readonly mfService: MfService
    ) { }

    @ApiBearerAuth('access-token')
    @Get('Fechamento')
    @Roles('PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal')
    @ApiExtraModels(RecordWithId, RequestInfoDto)
    @ApiOkResponse({
        schema: { allOf: refs(MfListFechamentoDto, RequestInfoDto) },
    })
    async GetMetaFechamento(
        @Query() dto: FilterFechamentoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<MfListFechamentoDto & RequestInfoDto> {
        const start = Date.now();
        const config = await this.mfService.pessoaAcessoPdm(user);

        return {
            ...await this.metasFechamentoService.getMetaFechamento(
                dto,
                config,
                user
            ),
            requestInfo: { queryTook: Date.now() - start },
        };
    }

    @ApiBearerAuth('access-token')
    @Patch('Fechamento')
    @Roles('PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal')
    @ApiExtraModels(RecordWithId, RequestInfoDto)
    @ApiOkResponse({
        schema: { allOf: refs(RecordWithId, RequestInfoDto) },
    })
    async AddMetaFechamento(
        @Body() dto: FechamentoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId & RequestInfoDto> {
        const start = Date.now();
        const config = await this.mfService.pessoaAcessoPdm(user);

        return {
            ...await this.metasFechamentoService.addMetaFechamento(
                dto,
                config,
                user
            ),
            requestInfo: { queryTook: Date.now() - start },
        };
    }
}
