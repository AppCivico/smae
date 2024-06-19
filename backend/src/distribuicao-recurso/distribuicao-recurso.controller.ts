import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { DistribuicaoRecursoService } from './distribuicao-recurso.service';
import { CreateDistribuicaoRecursoDto } from './dto/create-distribuicao-recurso.dto';
import { DistribuicaoRecursoDetailDto, ListDistribuicaoRecursoDto } from './entities/distribuicao-recurso.entity';
import { UpdateDistribuicaoRecursoDto } from './dto/update-distribuicao-recurso.dto';
import { FilterDistribuicaoRecursoDto } from './dto/filter-distribuicao-recurso.dto';

@ApiTags('Transferência - Distribuição de Recursos')
@Controller('distribuicao-recurso')
export class DistribuicaoRecursoController {
    constructor(private readonly distribuicaoRecursoService: DistribuicaoRecursoService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTransferencia.inserir'])
    async create(@Body() dto: CreateDistribuicaoRecursoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.distribuicaoRecursoService.create(dto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(@Query() filters: FilterDistribuicaoRecursoDto): Promise<ListDistribuicaoRecursoDto> {
        return { linhas: await this.distribuicaoRecursoService.findAll(filters) };
    }

    @Get(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTransferencia.listar'])
    async findOne(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<DistribuicaoRecursoDetailDto> {
        return await this.distribuicaoRecursoService.findOne(params.id, user);
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTransferencia.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdateDistribuicaoRecursoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.distribuicaoRecursoService.update(+params.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTransferencia.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.distribuicaoRecursoService.remove(+params.id, user);
        return '';
    }
}
