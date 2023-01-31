import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { DetalhePessoaDto } from './dto/detalhe-pessoa.dto';
import { ListPessoaDto } from './dto/list-pessoa.dto';
import { UpdatePessoaDto } from './dto/update-pessoa.dto';
import { CreatePessoaDto } from './dto/create-pessoa.dto';
import { FilterPessoaDto } from './dto/filter-pessoa.dto';
import { PessoaService } from './pessoa.service';

@ApiTags('Pessoa')
@Controller('pessoa')
export class PessoaController {
    constructor(private readonly pessoaService: PessoaService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroPessoa.inserir')
    create(@Body() createPessoaDto: CreatePessoaDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return this.pessoaService.criarPessoa(createPessoaDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    @Roles('CadastroPessoa.inserir', 'CadastroPessoa.editar', 'CadastroPessoa.inativar', 'PDM.admin_cp', 'PDM.tecnico_cp', 'PDM.ponto_focal')
    async findAll(@Query() filters: FilterPessoaDto): Promise<ListPessoaDto> {
        return { linhas: await this.pessoaService.findAll(filters) };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroPessoa.editar')
    async update(@Param() params: FindOneParams, @Body() updatePessoaDto: UpdatePessoaDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.pessoaService.update(+params.id, updatePessoaDto, user);
    }

    @Get(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroPessoa.inserir', 'CadastroPessoa.editar', 'CadastroPessoa.inativar')
    async get(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<DetalhePessoaDto> {
        return await this.pessoaService.getDetail(+params.id, user);
    }
}
