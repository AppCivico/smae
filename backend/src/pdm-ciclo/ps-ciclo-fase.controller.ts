import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { TipoPDM, TipoPdmType } from '../common/decorators/current-tipo-pdm';
import { FindThreeParams, FindTwoParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { MetaSetorialController } from '../meta/meta.controller';
import {
    CreatePsCicloFaseDocumentoDto,
    SalvarPsCicloFaseDto,
    UpdatePsCicloFaseDocumentoDto,
} from './dto/ps-ciclo-fase.dto';
import { FilterMonitCicloDto } from './dto/update-pdm-ciclo.dto';
import { PsCicloFasesDto } from './entities/ps-ciclo-fase.entity';
import { PsCicloFaseService } from './ps-ciclo-fase.service';

@Controller('plano-setorial')
@ApiTags('Plano Setorial / Programa de Metas - Ciclo físico')
export class PsCicloFaseController {
    constructor(private readonly psCicloFaseService: PsCicloFaseService) {}

    @Get(':id/ciclo/:id2/fase')
    @ApiBearerAuth('access-token')
    @Roles(MetaSetorialController.ReadPerm)
    async buscaFases(
        @Param() params: FindTwoParams,
        @Query() query: FilterMonitCicloDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<PsCicloFasesDto> {
        return await this.psCicloFaseService.buscaFases(tipo, params.id, params.id2, query.meta_id, user);
    }

    @Post(':id/ciclo/:id2/fase/:id3')
    @ApiBearerAuth('access-token')
    @Roles(MetaSetorialController.WritePerm)
    async salvaFase(
        @Param() params: FindThreeParams,
        @Query() query: FilterMonitCicloDto,
        @Body() dto: SalvarPsCicloFaseDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<RecordWithId> {
        return await this.psCicloFaseService.salvaFase(
            tipo,
            params.id,
            params.id2,
            params.id3,
            query.meta_id,
            dto,
            user
        );
    }

    @Post(':id/ciclo/:id2/fase/:id3/documento')
    @ApiBearerAuth('access-token')
    @Roles(MetaSetorialController.WritePerm)
    async adicionaDocumento(
        @Param() params: FindThreeParams,
        @Query() query: FilterMonitCicloDto,
        @Body() dto: CreatePsCicloFaseDocumentoDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<RecordWithId> {
        return await this.psCicloFaseService.adicionaDocumento(
            tipo,
            params.id,
            params.id2,
            params.id3,
            query.meta_id,
            dto,
            user
        );
    }

    @Patch(':id/ciclo/:id2/fase-documento/:id3')
    @ApiBearerAuth('access-token')
    @Roles(MetaSetorialController.WritePerm)
    async atualizaDocumento(
        @Param() params: FindThreeParams,
        @Query() query: FilterMonitCicloDto,
        @Body() dto: UpdatePsCicloFaseDocumentoDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<RecordWithId> {
        return await this.psCicloFaseService.atualizaDocumento(
            tipo,
            params.id,
            params.id2,
            params.id3,
            query.meta_id,
            dto,
            user
        );
    }

    @Delete(':id/ciclo/:id2/fase-documento/:id3')
    @ApiBearerAuth('access-token')
    @Roles(MetaSetorialController.WritePerm)
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeDocumento(
        @Param() params: FindThreeParams,
        @Query() query: FilterMonitCicloDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<void> {
        await this.psCicloFaseService.removeDocumento(tipo, params.id, params.id2, params.id3, query.meta_id, user);
    }
}
