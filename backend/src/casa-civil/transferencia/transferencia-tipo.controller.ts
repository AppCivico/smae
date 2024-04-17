import { Controller, Post, Body, Patch, Param, Get, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiUnauthorizedResponse, ApiNoContentResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { CreateTransferenciaTipoDto } from './dto/create-transferencia-tipo.dto';
import { TransferenciaService } from './transferencia.service';
import { UpdateTransferenciaTipoDto } from './dto/update-transferencia-tipo.dto';
import { FindOneParams } from 'src/common/decorators/find-params';
import { ListTransferenciaTipoDto } from './entities/transferencia-tipo.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';

@ApiTags('Transferência')
@Controller('transferencia-tipo')
export class TransferenciaTipoController {
    constructor(private readonly transferenciaService: TransferenciaService) {}

    @Post('')
    @ApiBearerAuth('access-token')
    @Roles('CadastroTransferencia.inserir')
    @ApiUnauthorizedResponse()
    async create(@Body() dto: CreateTransferenciaTipoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.transferenciaService.createTransferenciaTipo(dto, user);
    }

    @ApiBearerAuth('access-token')
    @Roles('CadastroTransferencia.listar')
    @Get()
    async findAll(): Promise<ListTransferenciaTipoDto> {
        return { linhas: await this.transferenciaService.findAllTransferenciaTipo() };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles('CadastroTransferencia.editar')
    @ApiUnauthorizedResponse()
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdateTransferenciaTipoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.transferenciaService.updateTransferenciaTipo(+params.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroTransferencia.remover')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.transferenciaService.removeTransferenciaTipo(+params.id, user);
        return '';
    }
}
