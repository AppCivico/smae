import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { FindOneParams } from 'src/common/decorators/find-params';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { VinculoService } from './vinculo.service';
import { CreateVinculoDto } from './dto/create-vinculo.dto';
import { UpdateVinculoDto } from './dto/update-vinculo.dto';
import { ListVinculoDto } from './entities/vinculo.entity';
import { FilterVinculoDto } from './dto/filter-vinculo.dto';

@ApiTags('Vinculo')
@Controller('distribuicao-recurso-vinculo')
export class VinculoController {
    constructor(private readonly vinculoService: VinculoService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['CadastroVinculo.inserir'])
    async create(@Body() dto: CreateVinculoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.vinculoService.upsert(dto, user);
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroVinculo.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdateVinculoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.vinculoService.upsert(dto, user, +params.id);
    }

    @ApiBearerAuth('access-token')
    @Get()
    @Roles(['CadastroVinculo.listar'])
    async findAll(@Query() filters: FilterVinculoDto): Promise<ListVinculoDto> {
        return { linhas: await this.vinculoService.findAll(filters) };
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroVinculo.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.vinculoService.remove(+params.id, user);
        return '';
    }
}
