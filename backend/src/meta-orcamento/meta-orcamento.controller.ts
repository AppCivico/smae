import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import {
    CreateMetaOrcamentoDto,
    FilterMetaOrcamentoDto,
    ListMetaOrcamentoDto,
    UpdateMetaOrcamentoDto,
    UpdateOrcamentoPrevistoZeradoDto,
} from './dto/meta-orcamento.dto';
import { MetaOrcamentoService } from './meta-orcamento.service';
import { PlanoSetorialController } from '../pdm/pdm.controller';

@Controller(['meta-orcamento', 'orcamento-previsto'])
@ApiTags('Orçamento - Meta (Custeio e Investimento)')
export class MetaOrcamentoController {
    constructor(private readonly metaOrcamentoService: MetaOrcamentoService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['CadastroMeta.orcamento', 'PDM.tecnico_cp', 'PDM.admin_cp'])
    async create(
        @Body() createMetaDto: CreateMetaOrcamentoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.metaOrcamentoService.create(createMetaDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    @Roles(['CadastroMeta.orcamento', 'PDM.tecnico_cp', 'PDM.admin_cp'])
    async findAll(
        @Query() filters: FilterMetaOrcamentoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListMetaOrcamentoDto> {
        return {
            linhas: await this.metaOrcamentoService.findAll(filters, user),
            ...(await this.metaOrcamentoService.orcamento_previsto_zero(filters.meta_id, filters.ano_referencia)),
        };
    }

    @Patch('zerado')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroMeta.orcamento', 'PDM.tecnico_cp', 'PDM.admin_cp'])
    @HttpCode(HttpStatus.ACCEPTED)
    @ApiNoContentResponse()
    async patchZerado(@Body() updateZeradoDto: UpdateOrcamentoPrevistoZeradoDto, @CurrentUser() user: PessoaFromJwt) {
        await this.metaOrcamentoService.patchZerado(updateZeradoDto, user);
        return '';
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroMeta.orcamento', 'PDM.tecnico_cp', 'PDM.admin_cp'])
    @HttpCode(HttpStatus.ACCEPTED)
    async patch(
        @Param() params: FindOneParams,
        @Body() updateMetaDto: UpdateMetaOrcamentoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<void> {
        await this.metaOrcamentoService.update(+params.id, updateMetaDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroMeta.orcamento', 'PDM.tecnico_cp', 'PDM.admin_cp'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.metaOrcamentoService.remove(+params.id, user);
        return '';
    }
}

@Controller('plano-setorial-orcamento-previsto')
@ApiTags('Orçamento - Meta (Custeio e Investimento)')
export class MetaPSOrcamentoController {
    // TODO fechar pra só ver o que realmente é PS
    constructor(private readonly metaOrcamentoService: MetaOrcamentoService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles([...PlanoSetorialController.OrcamentoWritePerms, ])
    async create(
        @Body() createMetaDto: CreateMetaOrcamentoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.metaOrcamentoService.create(createMetaDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    @Roles([...PlanoSetorialController.OrcamentoWritePerms, ])
    async findAll(
        @Query() filters: FilterMetaOrcamentoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListMetaOrcamentoDto> {
        return {
            linhas: await this.metaOrcamentoService.findAll(filters, user),
            ...(await this.metaOrcamentoService.orcamento_previsto_zero(filters.meta_id, filters.ano_referencia)),
        };
    }

    @Patch('zerado')
    @ApiBearerAuth('access-token')
    @Roles([...PlanoSetorialController.OrcamentoWritePerms, ])
    @HttpCode(HttpStatus.ACCEPTED)
    @ApiNoContentResponse()
    async patchZerado(@Body() updateZeradoDto: UpdateOrcamentoPrevistoZeradoDto, @CurrentUser() user: PessoaFromJwt) {
        await this.metaOrcamentoService.patchZerado(updateZeradoDto, user);
        return '';
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles([...PlanoSetorialController.OrcamentoWritePerms, ])
    @HttpCode(HttpStatus.ACCEPTED)
    async patch(
        @Param() params: FindOneParams,
        @Body() updateMetaDto: UpdateMetaOrcamentoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<void> {
        await this.metaOrcamentoService.update(+params.id, updateMetaDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles([...PlanoSetorialController.OrcamentoWritePerms, ])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.metaOrcamentoService.remove(+params.id, user);
        return '';
    }
}
