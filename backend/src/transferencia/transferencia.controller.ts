import { Controller, Post, Body, Patch, Param, Get, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiUnauthorizedResponse, ApiNoContentResponse, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { TransferenciaService } from './transferencia.service';
import { CreateTransferenciaAnexoDto, CreateTransferenciaDto } from './dto/create-transferencia.dto';
import { ListTransferenciaAnexoDto, ListTransferenciaDto, TransferenciaDetailDto } from './entities/transferencia.dto';
import { UpdateTransferenciaAnexoDto, UpdateTransferenciaDto } from './dto/update-transferencia.dto';
import { FindOneParams, FindTwoParams } from 'src/common/decorators/find-params';
import { Roles } from 'src/auth/decorators/roles.decorator';

@ApiTags('Transferência')
@Controller('transferencia')
export class TransferenciaController {
    constructor(private readonly transferenciaService: TransferenciaService) {}

    @Post('')
    @ApiBearerAuth('access-token')
    @Roles('CadastroTransferencia.inserir')
    @ApiUnauthorizedResponse()
    async create(@Body() dto: CreateTransferenciaDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.transferenciaService.createTransferencia(dto, user);
    }

    @ApiBearerAuth('access-token')
    @Roles('CadastroTransferencia.listar')
    @Get()
    async findAll(@CurrentUser() user: PessoaFromJwt): Promise<ListTransferenciaDto> {
        return { linhas: await this.transferenciaService.findAllTransferencia(user) };
    }

    @Get(':id')
    @ApiBearerAuth('access-token')
    @Roles('CadastroTransferencia.listar')
    @ApiUnauthorizedResponse()
    async findOne(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<TransferenciaDetailDto> {
        return await this.transferenciaService.findOneTransferencia(params.id, user);
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles('CadastroTransferencia.editar')
    @ApiUnauthorizedResponse()
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdateTransferenciaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.transferenciaService.updateTransferencia(+params.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroTransferencia.remover')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.transferenciaService.removeTransferencia(+params.id, user);
        return '';
    }

    @Post(':id/anexo')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroTransferencia.inserir')
    async upload(
        @Param() params: FindOneParams,
        @Body() createTransferenciaAnexo: CreateTransferenciaAnexoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.transferenciaService.append_document(params.id, createTransferenciaAnexo, user);
    }

    @Get(':id/anexo')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroTransferencia.listar')
    async download(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListTransferenciaAnexoDto> {
        return { linhas: await this.transferenciaService.list_document(params.id, user) };
    }

    @Patch(':id/anexo/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroTransferencia.editar')
    async updateDocumento(
        @Param() params: FindTwoParams,
        @Body() dto: UpdateTransferenciaAnexoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.transferenciaService.updateDocumento(params.id, params.id2, dto, user);
    }

    @Delete(':id/anexo/:id2')
    @ApiBearerAuth('access-token')
    @Roles('CadastroTransferencia.remover')
    @ApiUnauthorizedResponse()
    @ApiResponse({ description: 'sucesso ao remover', status: 204 })
    @HttpCode(HttpStatus.NO_CONTENT)
    async removerDownload(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        await this.transferenciaService.remove_document(params.id, params.id2, user);
        return null;
    }
}
