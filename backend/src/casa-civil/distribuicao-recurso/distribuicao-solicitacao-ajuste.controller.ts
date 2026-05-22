import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { FindOneParams } from 'src/common/decorators/find-params';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { DistribuicaoSolicitacaoAjusteService } from './distribuicao-solicitacao-ajuste.service';
import { CreateDistribuicaoSolicitacaoAjusteDto } from './dto/create-distribuicao-solicitacao-ajuste.dto';
import { FilterDistribuicaoSolicitacaoAjusteDto } from './dto/filter-distribuicao-solicitacao-ajuste.dto';
import { GestaoDistribuicaoSolicitacaoAjusteDto } from './dto/gestao-distribuicao-solicitacao-ajuste.dto';
import { UpdateDistribuicaoSolicitacaoAjusteDto } from './dto/update-distribuicao-solicitacao-ajuste.dto';
import {
    DistribuicaoSolicitacaoAjusteDto,
    ListDistribuicaoSolicitacaoAjusteDto,
} from './entities/distribuicao-solicitacao-ajuste.entity';

@ApiTags('Transferência - Distribuição de Recursos - Solicitação de Ajuste')
@Controller('distribuicao-recurso-solicitacao-ajuste')
export class DistribuicaoSolicitacaoAjusteController {
    constructor(private readonly service: DistribuicaoSolicitacaoAjusteService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['SMAE.CadastroDistribuicaoSolicitacaoAjuste.inserir'])
    async create(
        @Body() dto: CreateDistribuicaoSolicitacaoAjusteDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.service.create(dto, user);
    }

    @Get()
    @ApiBearerAuth('access-token')
    @Roles(['SMAE.CadastroDistribuicaoSolicitacaoAjuste.listar'])
    async findAll(
        @Query() filters: FilterDistribuicaoSolicitacaoAjusteDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListDistribuicaoSolicitacaoAjusteDto> {
        return await this.service.findAll(filters, user);
    }

    @Get(':id')
    @ApiBearerAuth('access-token')
    @Roles(['SMAE.CadastroDistribuicaoSolicitacaoAjuste.listar'])
    async findOne(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<DistribuicaoSolicitacaoAjusteDto> {
        return await this.service.findOne(+params.id, user);
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['SMAE.CadastroDistribuicaoSolicitacaoAjuste.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdateDistribuicaoSolicitacaoAjusteDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.service.update(+params.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['SMAE.CadastroDistribuicaoSolicitacaoAjuste.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.service.remove(+params.id, user);
    }

    @Patch(':id/submeter')
    @ApiBearerAuth('access-token')
    @Roles(['SMAE.CadastroDistribuicaoSolicitacaoAjuste.inserir'])
    async submeter(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.service.submeter(+params.id, user);
    }

    @Patch(':id/gestao')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroDistribuicaoSolicitacaoAjuste.administrador'])
    async gestao(
        @Param() params: FindOneParams,
        @Body() dto: GestaoDistribuicaoSolicitacaoAjusteDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.service.gestao(+params.id, dto, user);
    }
}
