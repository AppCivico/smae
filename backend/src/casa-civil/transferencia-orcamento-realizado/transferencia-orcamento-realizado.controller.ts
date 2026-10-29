import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { FindOneParams, FindTwoParams } from '../../common/decorators/find-params';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import {
    CreateTransferenciaOrcamentoRealizadoDto,
    ListTransferenciaOrcamentoRealizadoDto,
    UpdateTransferenciaOrcamentoRealizadoDto,
} from './dto/transferencia-orcamento-realizado.dto';
import { TransferenciaOrcamentoRealizadoService } from './transferencia-orcamento-realizado.service';

@ApiTags('Transferência - Orçamento (Realizado)')
@Controller('transferencia')
export class TransferenciaOrcamentoRealizadoController {
    constructor(private readonly service: TransferenciaOrcamentoRealizadoService) {}

    @Post(':id/orcamento-realizado')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTransferencia.editar'])
    async create(
        @Param() params: FindOneParams,
        @Body() dto: CreateTransferenciaOrcamentoRealizadoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const transferencia = await this.service.buscaTransferencia(params.id, user);
        return await this.service.create(transferencia.id, dto, user);
    }

    @Get(':id/orcamento-realizado')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTransferencia.listar'])
    async findAll(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListTransferenciaOrcamentoRealizadoDto> {
        const transferencia = await this.service.buscaTransferencia(params.id, user);
        return { linhas: await this.service.findAll(transferencia.id, user) };
    }

    @Patch(':id/orcamento-realizado/:id2')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTransferencia.editar'])
    async update(
        @Param() params: FindTwoParams,
        @Body() dto: UpdateTransferenciaOrcamentoRealizadoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const transferencia = await this.service.buscaTransferencia(params.id, user);
        return await this.service.update(transferencia.id, params.id2, dto, user);
    }

    @Delete(':id/orcamento-realizado/:id2')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTransferencia.editar'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        const transferencia = await this.service.buscaTransferencia(params.id, user);
        await this.service.remove(transferencia.id, params.id2, user);
        return '';
    }
}
