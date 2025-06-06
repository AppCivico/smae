import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { CreateOrgaoDto } from './dto/create-orgao.dto';
import { ListOrgaoDto } from './dto/list-orgao.dto';
import { UpdateOrgaoDto } from './dto/update-orgao.dto';
import { OrgaoService } from './orgao.service';
import { FilterOrgaoDto } from './dto/filter-orgao.dto';
import { OrgaoResumo } from './entities/orgao.entity';

@ApiTags('Órgão')
@Controller('orgao')
export class OrgaoController {
    constructor(private readonly orgaoService: OrgaoService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['CadastroOrgao.inserir'])
    async create(@Body() createOrgaoDto: CreateOrgaoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.orgaoService.create(createOrgaoDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(): Promise<ListOrgaoDto> {
        return { linhas: await this.orgaoService.findAll() };
    }

    @ApiBearerAuth('access-token')
    @Get('search')
    async search(@Query() dto: FilterOrgaoDto): Promise<OrgaoResumo[]> {
        const resultados = await this.orgaoService.search(dto);
        return resultados.map((orgao) => ({
            id: orgao.id,
            sigla: orgao.sigla,
            descricao: orgao.descricao,
        }));
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroOrgao.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() updateOrgaoDto: UpdateOrgaoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.orgaoService.update(+params.id, updateOrgaoDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroOrgao.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.orgaoService.remove(+params.id, user);
        return '';
    }
}
