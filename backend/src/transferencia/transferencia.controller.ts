import { Controller, Post, Body, Patch, Param, Get, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiUnauthorizedResponse, ApiNoContentResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { TransferenciaService } from './transferencia.service';
import { CreateTransferenciaDto } from './dto/create-transferencia.dto';
import { ListTransferenciaDto, TransferenciaDetailDto } from './entities/transferencia.dto';
import { UpdateTransferenciaDto } from './dto/update-transferencia.dto';
import { FindOneParams } from 'src/common/decorators/find-params';
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
    @Roles('CadastroTransferencia.inserir')
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
}
