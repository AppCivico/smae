import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { ListTagDto } from './dto/list-tag.dto';
import { TagService } from './tag.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { FindOneParams } from 'src/common/decorators/find-params';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { FilterTagDto } from './dto/filter-tag.dto';

@ApiTags('Tag')
@Controller('tag')
export class TagController {
    constructor(private readonly tagService: TagService) { }

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroTag.inserir')
    async create(@Body() createTagDto: CreateTagDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.tagService.create(createTagDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(@Query() filters: FilterTagDto): Promise<ListTagDto> {
        return { 'linhas': await this.tagService.findAll(filters) };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroTag.editar')
    async update(@Param() params: FindOneParams, @Body() updateTagDto: UpdateTagDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.tagService.update(+params.id, updateTagDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroTag.remover')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.tagService.remove(+params.id, user);
        return '';
    }
}
