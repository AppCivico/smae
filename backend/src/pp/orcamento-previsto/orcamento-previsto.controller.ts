import { Body, Controller, Delete, Get, HttpCode, HttpException, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { FindOneParams, FindTwoParams } from '../../common/decorators/find-params';
import { CreateOrcamentoPrevistoDto, FilterOrcamentoPrevistoDto, ListOrcamentoPrevistoDto, ProjetoUpdateOrcamentoPrevistoZeradoDto, UpdateOrcamentoPrevistoDto } from './dto/create-orcamento-previsto.dto';
import { OrcamentoPrevistoService } from './orcamento-previsto.service';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { ProjetoService } from '../projeto/projeto.service';

@Controller('projeto')
@ApiTags('Projeto - Orçamento (Custeio e Investimento)')
export class OrcamentoPrevistoController {
    constructor(
        private readonly metaOrcamentoService: OrcamentoPrevistoService,
        private readonly projetoService: ProjetoService,
    ) { }

    @Post(':id/orcamento-previsto')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Projeto.orcamento')
    async create(@Param() params: FindOneParams, @Body() createMetaDto: CreateOrcamentoPrevistoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        const projeto = await this.projetoService.findOne(params.id, user, 'ReadWrite');
        if (projeto.permissoes.apenas_leitura_planejamento) {
            throw new HttpException("Não é possível criar o orçamento no modo apenas leitura.", 400);
        }

        return await this.metaOrcamentoService.create(+params.id, createMetaDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get(':id/orcamento-previsto')
    @Roles('Projeto.orcamento')
    async findAll(@Param() params: FindOneParams, @Query() filters: FilterOrcamentoPrevistoDto, @CurrentUser() user: PessoaFromJwt): Promise<ListOrcamentoPrevistoDto> {
        await this.projetoService.findOne(params.id, user, 'ReadOnly');

        return {
            linhas: await this.metaOrcamentoService.findAll(params.id, filters, user),
            ...(await this.metaOrcamentoService.orcamento_previsto_zero(+params.id, filters.ano_referencia))
        };
    }

    @Patch(':id/orcamento-previsto/zerado')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Projeto.orcamento')
    @HttpCode(HttpStatus.ACCEPTED)
    @ApiNoContentResponse()
    async patchZerado(@Param() params: FindOneParams, @Body() updateZeradoDto: ProjetoUpdateOrcamentoPrevistoZeradoDto, @CurrentUser() user: PessoaFromJwt) {
        await this.metaOrcamentoService.patchZerado(+params.id, updateZeradoDto, user);
        return '';
    }

    @Patch(':id/orcamento-previsto/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Projeto.orcamento')
    @HttpCode(HttpStatus.ACCEPTED)
    async patch(@Param() params: FindTwoParams, @Body() updateMetaDto: UpdateOrcamentoPrevistoDto, @CurrentUser() user: PessoaFromJwt): Promise<void> {
        await this.metaOrcamentoService.update(+params.id, +params.id2, updateMetaDto, user);
    }

    @Delete(':id/orcamento-previsto/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('Projeto.orcamento')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        const projeto = await this.projetoService.findOne(params.id, user, 'ReadWrite');
        if (projeto.permissoes.apenas_leitura_planejamento) {
            throw new HttpException("Não é possível editar o orçamento no modo apenas leitura.", 400);
        }

        await this.metaOrcamentoService.remove(+params.id, +params.id2, user);
        return '';
    }
}
