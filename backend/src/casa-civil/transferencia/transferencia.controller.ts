import { Controller, Post, Body, Patch, Param, Get, Delete, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiNoContentResponse, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { TransferenciaService } from './transferencia.service';
import { CreateTransferenciaAnexoDto, CreateTransferenciaDto } from './dto/create-transferencia.dto';
import {
    ListTransferenciaAnexoDto,
    ListTransferenciaHistoricoDto,
    TransferenciaDetailDto,
    TransferenciaDto,
} from './entities/transferencia.dto';
import {
    CompletarTransferenciaDto,
    UpdateTransferenciaAnexoDto,
    UpdateTransferenciaDto,
} from './dto/update-transferencia.dto';
import { FindOneParams, FindTwoParams } from 'src/common/decorators/find-params';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ApiPaginatedResponse } from 'src/auth/decorators/paginated.decorator';
import { PaginatedDto, PaginatedWithPagesDto } from 'src/common/dto/paginated.dto';
import { FilterTransferenciaDto, FilterTransferenciaHistoricoDto } from './dto/filter-transferencia.dto';
import { FilterTransferenciaV2Dto } from './dto/filter-transferencia-v2.dto';

@ApiTags('Transferência')
@Controller('transferencia')
export class TransferenciaController {
    constructor(private readonly transferenciaService: TransferenciaService) {}

    @Post('')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTransferencia.inserir'])
    async create(@Body() dto: CreateTransferenciaDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.transferenciaService.createTransferencia(dto, user);
    }

    @ApiBearerAuth('access-token')
    @Roles(['CadastroTransferencia.listar'])
    @ApiPaginatedResponse(TransferenciaDto)
    @Get('v2')
    async findAllV2(
        @Query() filters: FilterTransferenciaV2Dto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<PaginatedWithPagesDto<TransferenciaDto>> {
        return await this.transferenciaService.findAllTransferenciaV2(filters, user);
    }

    @ApiBearerAuth('access-token')
    @Roles(['CadastroTransferencia.listar'])
    @ApiPaginatedResponse(TransferenciaDto)
    @Get()
    async findAll(
        @Query() filters: FilterTransferenciaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<PaginatedDto<TransferenciaDto>> {
        return await this.transferenciaService.findAllTransferencia(filters, user);
    }

    @Get(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTransferencia.listar'])
    async findOne(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<TransferenciaDetailDto> {
        return await this.transferenciaService.findOneTransferencia(params.id, user);
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTransferencia.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdateTransferenciaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.transferenciaService.updateTransferencia(+params.id, dto, user);
    }

    @Patch(':id/completar-registro')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTransferencia.editar'])
    async completeRegister(
        @Param() params: FindOneParams,
        @Body() dto: CompletarTransferenciaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.transferenciaService.completeTransferencia(+params.id, dto, user);
    }

    @Patch(':id/limpar-workflow')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTransferencia.editar'])
    async limparWorkflow(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        return await this.transferenciaService.limparWorkflowCronograma(+params.id, user, undefined);
    }

    @Get(':id/historico')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTransferencia.listar'])
    async findHistorico(
        @Param() params: FindOneParams,
        @Query() filters: FilterTransferenciaHistoricoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListTransferenciaHistoricoDto> {
        return { linhas: await this.transferenciaService.findTransferenciaHistorico(params.id, filters, user) };
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTransferencia.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.transferenciaService.removeTransferencia(+params.id, user);
        return '';
    }

    @Post(':id/anexo')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTransferencia.inserir'])
    async upload(
        @Param() params: FindOneParams,
        @Body() createTransferenciaAnexo: CreateTransferenciaAnexoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.transferenciaService.append_document(params.id, createTransferenciaAnexo, user);
    }

    @Get(':id/anexo')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTransferencia.listar'])
    async download(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListTransferenciaAnexoDto> {
        return { linhas: await this.transferenciaService.list_document(params.id, user) };
    }

    @Patch(':id/anexo/:id2')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTransferencia.editar'])
    async updateDocumento(
        @Param() params: FindTwoParams,
        @Body() dto: UpdateTransferenciaAnexoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.transferenciaService.updateDocumento(params.id, params.id2, dto, user);
    }

    @Delete(':id/anexo/:id2')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTransferencia.remover'])
    @ApiResponse({ description: 'sucesso ao remover', status: 204 })
    @HttpCode(HttpStatus.NO_CONTENT)
    async removerDownload(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        await this.transferenciaService.remove_document(params.id, params.id2, user);
        return null;
    }
}
