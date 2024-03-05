import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { CreateRegiaoDto, FilterRegiaoDto } from './dto/create-regiao.dto';
import { DetalheRegiaoDto } from './dto/detalhe-regiao.dto';
import { ListRegiaoDto } from './dto/list-regiao.dto';
import { UpdateRegiaoDto } from './dto/update-regiao.dto';
import { RegiaoService } from './regiao.service';

@ApiTags('Regiao')
@Controller('regiao')
export class RegiaoController {
    constructor(private readonly regiaoService: RegiaoService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroRegiao.inserir')
    async create(@Body() createRegiaoDto: CreateRegiaoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.regiaoService.create(createRegiaoDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(@Query() filters: FilterRegiaoDto, @CurrentUser() user: PessoaFromJwt): Promise<ListRegiaoDto> {
        return { linhas: await this.regiaoService.findAll(filters, user) };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroRegiao.editar')
    async update(
        @Param() params: FindOneParams,
        @Body() updateRegiaoDto: UpdateRegiaoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.regiaoService.update(+params.id, updateRegiaoDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroRegiao.remover')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.regiaoService.remove(+params.id, user);
        return '';
    }

    @Get(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroRegiao.remover')
    async get(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<DetalheRegiaoDto> {
        return await this.regiaoService.getDetail(+params.id, user);
    }
}
