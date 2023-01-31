import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { ListSubTemaDto } from './dto/list-subtema.dto';
import { SubTemaService } from './subtema.service';
import { CreateSubTemaDto } from './dto/create-subtema.dto';
import { UpdateSubTemaDto } from './dto/update-subtema.dto';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { FilterSubTemaDto } from './dto/filter-subtema.dto';

@ApiTags('SubTema')
@Controller('subtema')
export class SubTemaController {
    constructor(private readonly subTemaService: SubTemaService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroSubTema.inserir')
    async create(@Body() createSubTemaDto: CreateSubTemaDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.subTemaService.create(createSubTemaDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(@Query() filters: FilterSubTemaDto): Promise<ListSubTemaDto> {
        return { linhas: await this.subTemaService.findAll(filters) };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroSubTema.editar')
    async update(@Param() params: FindOneParams, @Body() updateSubTemaDto: UpdateSubTemaDto, @CurrentUser() user: PessoaFromJwt) {
        return await this.subTemaService.update(+params.id, updateSubTemaDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroSubTema.remover')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.subTemaService.remove(+params.id, user);
        return '';
    }
}
