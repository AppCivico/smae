import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams, FindTwoParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { DistribuicaoRecursoStatusService } from './distribuicao-recurso-status.service';
import { CreateDistribuicaoRecursoStatusDto } from './dto/create-distribuicao-recurso-status.dto';
import { UpdateDistribuicaoRecursoStatusDto } from './dto/update-distribuicao-recurso-status.dto';
import { ListDistribuicaoStatusHistoricoDto } from './entities/distribuicao-recurso.entity';

@ApiTags('Transferência - Distribuição de Recursos')
@Controller('distribuicao-recurso')
export class DistribuicaoRecursoStatusController {
    constructor(private readonly distribuicaoRecursoStatusService: DistribuicaoRecursoStatusService) {}

    @Get(':id/status')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTransferencia.inserir'])
    async get(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListDistribuicaoStatusHistoricoDto> {
        return { linhas: await this.distribuicaoRecursoStatusService.findAll(+params.id, user) };
    }

    @Post(':id/status')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTransferencia.inserir'])
    async create(
        @Param() params: FindOneParams,
        @Body() dto: CreateDistribuicaoRecursoStatusDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.distribuicaoRecursoStatusService.create(+params.id, dto, user);
    }

    @Patch(':id/status/:id2')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTransferencia.editar'])
    async update(
        @Param() params: FindTwoParams,
        @Body() dto: UpdateDistribuicaoRecursoStatusDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.distribuicaoRecursoStatusService.update(+params.id, +params.id2, dto, user);
    }

    @Delete(':id/status/:id2')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTransferencia.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        await this.distribuicaoRecursoStatusService.remove(+params.id, +params.id2, user);
        return '';
    }
}
