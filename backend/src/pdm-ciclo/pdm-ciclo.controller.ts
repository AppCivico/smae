import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { TipoPDM, TipoPdmType } from '../common/decorators/current-tipo-pdm';
import { FindOneParams, FindThreeParams, FindTwoParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { MetaSetorialController } from '../meta/meta.controller';
import { AnaliseQualitativaDocumentoDto, CreateAnaliseQualitativaDto } from '../mf/metas/dto/mf-meta-analise-quali.dto';
import { FechamentoDto } from '../mf/metas/dto/mf-meta-fechamento.dto';
import { RiscoDto } from '../mf/metas/dto/mf-meta-risco.dto';
import { FilterMonitCicloDto, FilterPdmCiclo, FilterPsCiclo, UpdatePdmCicloDto } from './dto/update-pdm-ciclo.dto';
import {
    CiclosRevisaoDto,
    ListPdmCicloDto,
    ListPdmCicloV2Dto,
    ListPSCicloDto,
    PsListAnaliseQualitativaDto,
    PsListFechamentoDto,
    PsListRiscoDto,
} from './entities/pdm-ciclo.entity';
import { PdmCicloService } from './pdm-ciclo.service';
import { PsCicloService } from './ps-ciclo.service';

@Controller('pdm-ciclo')
@ApiTags('PDM - Ciclo físico')
export class PdmCicloController {
    constructor(private readonly pdmCicloService: PdmCicloService) {}

    @Get()
    @ApiBearerAuth('access-token')
    @Roles(['CadastroPdm.editar', 'PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal'])
    async findAll(@Query() params: FilterPdmCiclo): Promise<ListPdmCicloDto> {
        return { linhas: await this.pdmCicloService.findAll(params) };
    }

    @Get('v2')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroPdm.editar', 'PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal'])
    async findAllV2(@Query() params: FilterPdmCiclo): Promise<ListPdmCicloV2Dto> {
        return { linhas: await this.pdmCicloService.findAllV2(params) };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroPdm.editar'])
    @ApiResponse({ description: 'sucesso ao atualizar', status: 204 })
    @HttpCode(HttpStatus.NO_CONTENT)
    async update(@Param() params: FindOneParams, @Body() dto: UpdatePdmCicloDto) {
        await this.pdmCicloService.update(params.id, dto);
        return null;
    }
}

@Controller('plano-setorial')
@ApiTags('Plano Setorial / Programa de Metas - Ciclo físico')
export class PsCicloController {
    constructor(private readonly psCicloService: PsCicloService) {}

    @Get(':id/ciclo')
    @ApiBearerAuth('access-token')
    @Roles(MetaSetorialController.ReadPerm)
    async findAll(
        @Param() params: FindOneParams,
        @Query() dto: FilterPsCiclo,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<ListPSCicloDto> {
        return await this.psCicloService.findAll(tipo,
            params.id,
            {
            ...dto,
        });
    }

    @Get(':id/ciclo/:id2/monitoramento')
    @ApiBearerAuth('access-token')
    @Roles(MetaSetorialController.ReadPerm)
    async getCicloRevisoes(
        @Param() params: FindTwoParams,
        @Query() dto: FilterMonitCicloDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<CiclosRevisaoDto> {
        return await this.psCicloService.getCicloRevisoes(tipo, params.id, params.id2, dto.meta_id, user);
    }

    @Post(':id/ciclo/:id2/analise')
    @ApiBearerAuth('access-token')
    @Roles(MetaSetorialController.WritePerm)
    async addMetaAnaliseQualitativa(
        @Param() params: FindTwoParams,
        @Body() dto: CreateAnaliseQualitativaDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<RecordWithId> {
        return await this.psCicloService.addMetaAnaliseQualitativa(
            tipo,
            +params.id,
            +params.id2,
            dto.meta_id,
            dto,
            user
        );
    }

    @Post(':id/ciclo/:id2/analise/documento')
    @ApiBearerAuth('access-token')
    @Roles(MetaSetorialController.WritePerm)
    async addMetaAnaliseQualitativaDocumento(
        @Param() params: FindTwoParams,
        @Body() dto: AnaliseQualitativaDocumentoDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<RecordWithId> {
        return await this.psCicloService.addMetaAnaliseQualitativaDocumento(
            tipo,
            +params.id,
            +params.id2,
            dto.meta_id,
            dto,
            user
        );
    }

    @Delete(':id/ciclo/:id2/analise/documento/:id3')
    @ApiBearerAuth('access-token')
    @Roles(MetaSetorialController.WritePerm)
    @HttpCode(204)
    async deleteMetaAnaliseQualitativaDocumento(
        @Param() params: FindThreeParams,
        @Query() dto: FilterMonitCicloDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<void> {
        await this.psCicloService.deleteMetaAnaliseQualitativaDocumento(
            tipo,
            +params.id,
            +params.id2,
            dto.meta_id,
            +params.id3,
            user
        );
    }

    @Post(':id/ciclo/:id2/risco')
    @ApiBearerAuth('access-token')
    @Roles(MetaSetorialController.WritePerm)
    async addMetaRisco(
        @Param() params: FindTwoParams,
        @Body() dto: RiscoDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<RecordWithId> {
        return await this.psCicloService.addMetaRisco(tipo, +params.id, +params.id2, dto.meta_id, dto, user);
    }

    @Post(':id/ciclo/:id2/fechamento')
    @ApiBearerAuth('access-token')
    @Roles(MetaSetorialController.WritePerm)
    async addMetaFechamento(
        @Param() params: FindTwoParams,
        @Body() dto: FechamentoDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<RecordWithId> {
        return await this.psCicloService.addMetaFechamento(tipo, +params.id, +params.id2, dto.meta_id, dto, user);
    }

    @Get(':id/ciclo/:id2/analise')
    @ApiBearerAuth('access-token')
    @Roles(MetaSetorialController.ReadPerm)
    async getMetaAnaliseQualitativa(
        @Param() params: FindTwoParams,
        @Query() dto: FilterMonitCicloDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<PsListAnaliseQualitativaDto> {
        return await this.psCicloService.getMetaAnaliseQualitativaWithPrevious(
            tipo,
            +params.id,
            +params.id2,
            dto.meta_id,
            user
        );
    }

    @Get(':id/ciclo/:id2/risco')
    @ApiBearerAuth('access-token')
    @Roles(MetaSetorialController.ReadPerm)
    async getMetaRisco(
        @Param() params: FindTwoParams,
        @Query() dto: FilterMonitCicloDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<PsListRiscoDto> {
        return await this.psCicloService.getMetaRiscoWithPrevious(tipo, +params.id, +params.id2, dto.meta_id, user);
    }

    @Get(':id/ciclo/:id2/fechamento')
    @ApiBearerAuth('access-token')
    @Roles(MetaSetorialController.ReadPerm)
    async getMetaFechamento(
        @Param() params: FindTwoParams,
        @Query() dto: FilterMonitCicloDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<PsListFechamentoDto> {
        return await this.psCicloService.getMetaFechamentoWithPrevious(
            tipo,
            +params.id,
            +params.id2,
            dto.meta_id,
            user
        );
    }
}
