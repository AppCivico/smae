import { Controller, Post, Body, Patch, Param, Get, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiUnauthorizedResponse, ApiNoContentResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { TransferenciaService } from './transferencia.service';
import { CreateTransferenciaDto } from './dto/create-transferencia.dto';
import { ListTransferenciaDto } from './entities/transferencia.dto';
import { UpdateTransferenciaDto } from './dto/update-transferencia.dto';
import { FindOneParams } from 'src/common/decorators/find-params';

@ApiTags('Transferência')
@Controller('transferencia')
export class TransferenciaController {
    constructor(private readonly transferenciaService: TransferenciaService) {}

    @Post('')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    async create(@Body() dto: CreateTransferenciaDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.transferenciaService.createTransferencia(dto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(@CurrentUser() user: PessoaFromJwt): Promise<ListTransferenciaDto> {
        return { linhas: await this.transferenciaService.findAllTransferencia(user) };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
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
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.transferenciaService.removeTransferencia(+params.id, user);
        return '';
    }
}
