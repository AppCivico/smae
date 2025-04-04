import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { ApiPaginatedWithPagesResponse } from 'src/auth/decorators/paginated.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { FindOneParams } from 'src/common/decorators/find-params';
import { ListaDePrivilegios } from 'src/common/ListaDePrivilegios';

import { RecordWithId } from '../common/dto/record-with-id.dto';
import { CreateRunUpdateDto } from '../task/run_update/dto/create-run-update.dto';
import { AtualizacaoEmLoteService } from './atualizacao-em-lote.service';
import {
    AtualizacaoEmLoteDetalheDto,
    AtualizacaoEmLoteResumoDto,
    FilterAtualizacaoEmLoteDto,
    ListAtualizacaoEmLoteDto,
} from './dto/atualizacao-em-lote.dto';

// Lista dos privilegios necessários para acessar os logs de atualizações em lote
const BASE_ROLE: ListaDePrivilegios[] = [
    'SMAE.AtualizacaoEmLote',
    ...Object.values(AtualizacaoEmLoteService.FULL_ADMIN_ROLE),
    ...Object.values(AtualizacaoEmLoteService.ORG_ADMIN_ROLE),
];

@ApiTags('Atualização em Lote')
@Controller('atualizacao-em-lote')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class AtualizacaoEmLoteController {
    constructor(private readonly atualizacaoEmLoteService: AtualizacaoEmLoteService) {}

    @Post('')
    @Roles(BASE_ROLE)
    @ApiOperation({ summary: 'Cria uma tarefa de atualização em lote e submete para processamento assíncrono.' })
    async createRunUpdateTask(
        @Body() dto: CreateRunUpdateDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return this.atualizacaoEmLoteService.create(dto, user);
    }

    @Get()
    @Roles(BASE_ROLE)
    @ApiOperation({ summary: 'Lista os registros de atualizações em lote.' })
    @ApiPaginatedWithPagesResponse(AtualizacaoEmLoteResumoDto)
    async list(
        @Query() filters: FilterAtualizacaoEmLoteDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListAtualizacaoEmLoteDto> {
        return this.atualizacaoEmLoteService.findAllPaginated(filters, user);
    }

    @Get(':id')
    @Roles(BASE_ROLE)
    @ApiOperation({ summary: 'Obtém os detalhes de um registro específico de atualização em lote.' })
    async getById(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<AtualizacaoEmLoteDetalheDto> {
        return this.atualizacaoEmLoteService.getById(params.id, user);
    }
}
