import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiNoContentResponse, ApiOkResponse, ApiTags, refs } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { FindOneParams } from 'src/common/decorators/find-params';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { AnaliseQualitativaDocumentoDto, AnaliseQualitativaDto, FilterAnaliseQualitativaDto, MfListAnaliseQualitativaDto } from 'src/mf/metas/dto/mf-meta-analise-quali.dto';
import { MetasAnaliseQualiService } from 'src/mf/metas/metas-analise-quali.service';
import { MfService } from '../mf.service';
import { MfListVariavelAnaliseQualitativaDto, RequestInfoDto } from './dto/mf-meta.dto';


@ApiTags('Monitoramento Fisico - análise qualitativa da meta')
@Controller('metas')
export class MetasAnaliseQualiController {
    constructor(
        private readonly metasAnaliseQualiService: MetasAnaliseQualiService,
        private readonly mfService: MfService
    ) { }

    @ApiBearerAuth('access-token')
    @Get('analise-qualitativa')
    @Roles('PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal')
    @ApiExtraModels(RecordWithId, RequestInfoDto)
    @ApiOkResponse({
        schema: { allOf: refs(MfListVariavelAnaliseQualitativaDto, RequestInfoDto) },
    })
    async GetMetaAnaliseQualitativa(
        @Query() dto: FilterAnaliseQualitativaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<MfListAnaliseQualitativaDto & RequestInfoDto> {
        const start = Date.now();
        const config = await this.mfService.pessoaAcessoPdm(user);

        return {
            ...await this.metasAnaliseQualiService.getMetaAnaliseQualitativa(
                dto,
                config,
                user
            ),
            requestInfo: { queryTook: Date.now() - start },
        };
    }

    @ApiBearerAuth('access-token')
    @Patch('analise-qualitativa/documento')
    @Roles('PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal')
    @ApiExtraModels(RecordWithId, RequestInfoDto)
    @ApiOkResponse({
        schema: { allOf: refs(RecordWithId, RequestInfoDto) },
    })
    async AddMetaAnaliseQualitativaDocumento(
        @Body() dto: AnaliseQualitativaDocumentoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId & RequestInfoDto> {
        const start = Date.now();
        const config = await this.mfService.pessoaAcessoPdm(user);
        return {
            ...await this.metasAnaliseQualiService.addMetaAnaliseQualitativaDocumento(
                dto,
                config,
                user
            ),
            requestInfo: { queryTook: Date.now() - start },
        };
    }


    @ApiBearerAuth('access-token')
    @Delete('analise-qualitativa/documento/:id')
    @Roles('PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.NO_CONTENT)
    async DeleteMetaAnaliseQualitativaDocumento(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt
    ) {
        const config = await this.mfService.pessoaAcessoPdm(user);
        await this.metasAnaliseQualiService.deleteMetaAnaliseQualitativaDocumento(
            params.id,
            config,
            user
        );

        return '';
    }

    @ApiBearerAuth('access-token')
    @Patch('analise-qualitativa')
    @Roles('PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal')
    @ApiExtraModels(RecordWithId, RequestInfoDto)
    @ApiOkResponse({
        schema: { allOf: refs(RecordWithId, RequestInfoDto) },
    })
    async AddMetaAnaliseQualitativa(
        @Body() dto: AnaliseQualitativaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId & RequestInfoDto> {
        const start = Date.now();
        const config = await this.mfService.pessoaAcessoPdm(user);

        return {
            ...await this.metasAnaliseQualiService.addMetaAnaliseQualitativa(
                dto,
                config,
                user
            ),
            requestInfo: { queryTook: Date.now() - start },
        };
    }
}
