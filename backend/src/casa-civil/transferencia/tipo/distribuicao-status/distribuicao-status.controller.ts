import { Controller, Post, Body, Patch, Param, Get, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiNoContentResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { CreateDistribuicaoStatusDto } from './dto/create-distribuicao-status.dto';
import { UpdateDistribuicaoStatusDto } from './dto/update-distribuicao-status.dto';
import { FindOneParams, FindTwoParams } from 'src/common/decorators/find-params';
import { ListDistribuicaoStatusDto } from './entities/distribuicao-status.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { DistribuicaoStatusService } from './distribuicao-status.service';

@ApiTags('Transferência')
@Controller('transferencia-tipo')
export class DistribuicaoStatusController {
    constructor(private readonly distribuicaoStatusService: DistribuicaoStatusService) {}

    @Post(':id/distribuicao-status')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTransferencia.inserir'])
    async create(
        @Param() params: FindOneParams,
        @Body() dto: CreateDistribuicaoStatusDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.distribuicaoStatusService.create(+params.id, dto, user);
    }

    @ApiBearerAuth('access-token')
    @Roles(['CadastroTransferencia.listar'])
    @Get(':id/distribuicao-status')
    async findAll(@Param() params: FindOneParams): Promise<ListDistribuicaoStatusDto> {
        return await this.distribuicaoStatusService.findAllDistribuicaoStatus(+params.id);
    }

    @Patch(':id/distribuicao-status/:id2')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTransferencia.editar'])
    async update(
        @Param() params: FindTwoParams,
        @Body() dto: UpdateDistribuicaoStatusDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.distribuicaoStatusService.updateDistribuicaoStatus(+params.id2, dto, user);
    }

    @Delete(':id/distribuicao-status/:id2')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTransferencia.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        await this.distribuicaoStatusService.removeDistribuicaoStatus(+params.id2, user);
        return '';
    }
}
