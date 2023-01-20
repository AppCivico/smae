import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { CreateIniciativaDto } from './dto/create-iniciativa.dto';
import { FilterIniciativaDto } from './dto/filter-iniciativa.dto';
import { ListIniciativaDto } from './dto/list-iniciativa.dto';
import { UpdateIniciativaDto } from './dto/update-iniciativa.dto';
import { IniciativaService } from './iniciativa.service';

@ApiTags('Iniciativa')
@Controller('iniciativa')
export class IniciativaController {
    constructor(private readonly iniciativaService: IniciativaService) { }

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroIniciativa.inserir')
    async create(@Body() createIniciativaDto: CreateIniciativaDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.iniciativaService.create(createIniciativaDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    // se um dia colocar @Roles, lembrar que existe o 'PDM.tecnico_cp', 'PDM.admin_cp'
    // que também usa esse endpoint
    async findAll(@Query() filters: FilterIniciativaDto, @CurrentUser() user: PessoaFromJwt): Promise<ListIniciativaDto> {
        return { 'linhas': await this.iniciativaService.findAll(filters, user) };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroIniciativa.editar')
    async update(@Param() params: FindOneParams, @Body() updateIniciativaDto: UpdateIniciativaDto, @CurrentUser() user: PessoaFromJwt) {
        return await this.iniciativaService.update(+params.id, updateIniciativaDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroIniciativa.remover')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.iniciativaService.remove(+params.id, user);
        return '';
    }

}
