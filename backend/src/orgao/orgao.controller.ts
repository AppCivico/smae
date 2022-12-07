import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { ListOrgaoDto } from './dto/list-orgao.dto';
import { OrgaoService } from './orgao.service';
import { CreateOrgaoDto } from './dto/create-orgao.dto';
import { UpdateOrgaoDto } from './dto/update-orgao.dto';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';

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
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.orgaoService.remove(+params.id, user);
        return '';
    }
}
