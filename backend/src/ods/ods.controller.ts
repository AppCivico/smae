import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { CreateOdsDto } from './dto/create-ods.dto';
import { ListOdsDto } from './dto/list-ods.dto';
import { UpdateOdsDto } from './dto/update-ods.dto';
import { OdsService } from './ods.service';

@ApiTags('ODS')
@Controller('ods')
export class OdsController {
    constructor(private readonly odsService: OdsService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroOds.inserir')
    async create(@Body() createOdsDto: CreateOdsDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.odsService.create(createOdsDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(): Promise<ListOdsDto> {
        return { linhas: await this.odsService.findAll() };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroOds.editar')
    async update(@Param() params: FindOneParams, @Body() updateOdsDto: UpdateOdsDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.odsService.update(+params.id, updateOdsDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroOds.remover')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.odsService.remove(+params.id, user);
        return '';
    }
}
