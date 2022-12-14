import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { CreateMetaOrcamentoDto, FilterMetaOrcamentoDto, ListMetaOrcamentoDto, UpdateMetaOrcamentoDto } from './dto/meta-orcamento.dto';
import { MetaOrcamentoService } from './meta-orcamento.service';

@Controller('meta-orcamento')
@ApiTags('Orçamento - Meta (Custeio e Investimento)')
export class MetaOrcamentoController {
    constructor(private readonly metaOrcamentoService: MetaOrcamentoService) { }

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroMeta.orcamento')
    async create(@Body() createMetaDto: CreateMetaOrcamentoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.metaOrcamentoService.create(createMetaDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    @Roles('CadastroMeta.orcamento')
    async findAll(@Query() filters: FilterMetaOrcamentoDto): Promise<ListMetaOrcamentoDto> {
        return { 'linhas': await this.metaOrcamentoService.findAll(filters) };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroMeta.orcamento')
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
    @ApiUnauthorizedResponse()
    @Roles('CadastroMeta.orcamento')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.metaOrcamentoService.remove(+params.id, user);
        return '';
    }

}
