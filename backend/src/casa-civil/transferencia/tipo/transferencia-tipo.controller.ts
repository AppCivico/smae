import { Controller, Post, Body, Patch, Param, Get, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiNoContentResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { CreateTransferenciaTipoDto } from './dto/create-transferencia-tipo.dto';
import { UpdateTransferenciaTipoDto } from './dto/update-transferencia-tipo.dto';
import { FindOneParams } from 'src/common/decorators/find-params';
import { ListTransferenciaTipoDto } from './entities/transferencia-tipo.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { TransferenciaTipoService } from './transferencia-tipo.service';

@ApiTags('Transferência')
@Controller('transferencia-tipo')
export class TransferenciaTipoController {
    constructor(private readonly transferenciaTipoService: TransferenciaTipoService) {}

    @Post('')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTransferencia.inserir'])
    async create(@Body() dto: CreateTransferenciaTipoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.transferenciaTipoService.createTransferenciaTipo(dto, user);
    }

    @ApiBearerAuth('access-token')
    @Roles(['CadastroTransferencia.listar'])
    @Get()
    async findAll(): Promise<ListTransferenciaTipoDto> {
        return { linhas: await this.transferenciaTipoService.findAllTransferenciaTipo() };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTransferencia.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdateTransferenciaTipoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.transferenciaTipoService.updateTransferenciaTipo(+params.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTransferencia.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.transferenciaTipoService.removeTransferenciaTipo(+params.id, user);
        return '';
    }
}
