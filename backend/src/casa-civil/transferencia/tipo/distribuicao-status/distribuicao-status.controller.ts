import { Controller, Post, Body, Patch, Param, Get, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiNoContentResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { CreateDistribuicaoStatusDto } from './dto/create-distribuicao-status.dto';
import { UpdateDistribuicaoStatusDto } from './dto/update-distribuicao-status.dto';
import { FindOneParams } from 'src/common/decorators/find-params';
import { ListDistribuicaoStatusDto } from './entities/distribuicao-status.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { DistribuicaoStatusService } from './distribuicao-status.service';

@ApiTags('Status de Distribuição')
@Controller('distribuicao-status')
export class DistribuicaoStatusController {
    constructor(private readonly distribuicaoStatusService: DistribuicaoStatusService) {}

    @Post('')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTransferencia.inserir'])
    async create(@Body() dto: CreateDistribuicaoStatusDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.distribuicaoStatusService.create(dto, user);
    }

    @ApiBearerAuth('access-token')
    @Roles(['CadastroTransferencia.listar'])
    @Get('')
    async findAll(): Promise<ListDistribuicaoStatusDto> {
        return await this.distribuicaoStatusService.findAllDistribuicaoStatus();
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTransferencia.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdateDistribuicaoStatusDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.distribuicaoStatusService.updateDistribuicaoStatus(+params.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTransferencia.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.distribuicaoStatusService.removeDistribuicaoStatus(+params.id, user);
        return '';
    }
}
