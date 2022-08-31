import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { ListOrgaoDto } from 'src/orgao/dto/list-orgao.dto';
import { OrgaoService } from './orgao.service';
import { CreateOrgaoDto } from './dto/create-orgao.dto';
import { UpdateOrgaoDto } from './dto/update-orgao.dto';
import { FindOneParams } from 'src/common/decorators/find-one-params';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';

@ApiTags('Órgão')
@Controller('orgao')
export class OrgaoController {
    constructor(private readonly orgaoService: OrgaoService) { }

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroOrgao.inserir')
    async create(@Body() createOrgaoDto: CreateOrgaoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.orgaoService.create(createOrgaoDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(): Promise<ListOrgaoDto> {
        return { 'linhas': await this.orgaoService.findAll() };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroOrgao.editar')
    async update(@Param() params: FindOneParams, @Body() updateOrgaoDto: UpdateOrgaoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.orgaoService.update(+params.id, updateOrgaoDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroOrgao.remover')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.orgaoService.remove(+params.id, user);
        return '';
    }
}
