import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { ListFonteRecursoDto } from 'src/fonte-recurso/dto/list-fonte-recurso.dto';
import { FonteRecursoService } from './fonte-recurso.service';
import { CreateFonteRecursoDto } from './dto/create-fonte-recurso.dto';
import { UpdateFonteRecursoDto } from './dto/update-fonte-recurso.dto';
import { FindOneParams } from 'src/common/decorators/find-params';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';

@ApiTags('Fonte de Recurso')
@Controller('fonte-recurso')
export class FonteRecursoController {
    constructor(private readonly fonteRecursoService: FonteRecursoService) { }

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroFonteRecurso.inserir')
    async create(@Body() createFonteRecursoDto: CreateFonteRecursoDto, @CurrentUser() user: PessoaFromJwt) : Promise<RecordWithId>{
        return await this.fonteRecursoService.create(createFonteRecursoDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(): Promise<ListFonteRecursoDto> {
        return { 'linhas': await this.fonteRecursoService.findAll() };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroFonteRecurso.editar')
    async update(@Param() params: FindOneParams, @Body() updateFonteRecursoDto: UpdateFonteRecursoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.fonteRecursoService.update(+params.id, updateFonteRecursoDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroFonteRecurso.remover')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.fonteRecursoService.remove(+params.id, user);
        return '';
    }
}
