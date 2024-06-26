import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { CreateTipoOrgaoDto } from './dto/create-tipo-orgao.dto';
import { ListTipoOrgaoDto } from './dto/list-tipo-orgao.dto';
import { UpdateTipoOrgaoDto } from './dto/update-tipo-orgao.dto';
import { TipoOrgaoService } from './tipo-orgao.service';

@ApiTags('Tipo de Órgão')
@Controller('tipo-orgao')
export class TipoOrgaoController {
    constructor(private readonly tipoOrgaoService: TipoOrgaoService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTipoOrgao.inserir'])
    async create(
        @Body() createTipoOrgaoDto: CreateTipoOrgaoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.tipoOrgaoService.create(createTipoOrgaoDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(): Promise<ListTipoOrgaoDto> {
        return { linhas: await this.tipoOrgaoService.findAll() };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTipoOrgao.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() updateTipoOrgaoDto: UpdateTipoOrgaoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.tipoOrgaoService.update(+params.id, updateTipoOrgaoDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroTipoOrgao.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.tipoOrgaoService.remove(+params.id, user);
        return '';
    }
}
