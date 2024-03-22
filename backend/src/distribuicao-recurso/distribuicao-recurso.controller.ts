import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { DistribuicaoRecursoService } from './distribuicao-recurso.service';
import { CreateDistribuicaoRecursoDto } from './dto/create-distribuicao-recurso.dto';
import { DistribuicaoRecursoDetailDto, ListDistribuicaoRecursoDto } from './entities/distribuicao-recurso.entity';
import { UpdateDistribuicaoRecursoDto } from './dto/update-distribuicao-recurso.dto';

@ApiTags('Transfêrencia - Distribuição de Recursos')
@Controller('distribuicao-recurso')
export class DistribuicaoRecursoController {
    constructor(private readonly distribuicaoRecursoService: DistribuicaoRecursoService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroBancada.inserir')
    async create(@Body() dto: CreateDistribuicaoRecursoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.distribuicaoRecursoService.create(dto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(): Promise<ListDistribuicaoRecursoDto> {
        return { linhas: await this.distribuicaoRecursoService.findAll() };
    }

    @Get(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroBancada.editar', 'CadastroBancada.inserir')
    async findOne(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<DistribuicaoRecursoDetailDto> {
        return await this.distribuicaoRecursoService.findOne(params.id, user);
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroBancada.editar')
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdateDistribuicaoRecursoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.distribuicaoRecursoService.update(+params.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroBancada.remover')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.distribuicaoRecursoService.remove(+params.id, user);
        return '';
    }
}
