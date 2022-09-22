import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { CreateIniciativaDto } from './dto/create-iniciativa.dto';
import { FilterIniciativaDto } from './dto/filter-iniciativa.dto';
import { ListIniciativaDto } from './dto/list-iniciativa.dto';
import { IniciativaService } from './iniciativa.service';

@ApiTags('Iniciativa')
@Controller('iniciativa')
export class IniciativaController {
    constructor(private readonly iniciativaService: IniciativaService) { }

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('cadastroIniciativa.inserir')
    async create(@Body() createIniciativaDto: CreateIniciativaDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.iniciativaService.create(createIniciativaDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(@Query() filters: FilterIniciativaDto): Promise<ListIniciativaDto> {
        return { 'linhas': await this.iniciativaService.findAll(filters) };
    }

}
