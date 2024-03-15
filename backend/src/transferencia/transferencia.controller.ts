import { Controller, Post, Body, Patch, Param, Get, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiUnauthorizedResponse, ApiNoContentResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { TransferenciaService } from './transferencia.service';
import { CreateTransferenciaDto } from './dto/create-transferencia.dto';

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
}
