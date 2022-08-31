import { Body, Controller, Get, Param, Patch, Post, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { FindOneParams } from 'src/common/decorators/find-one-params';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { ListPdmDto } from 'src/pdm/dto/list-pdm.dto';
import { UpdatePdmDto } from 'src/pdm/dto/update-pdm.dto';
import { Pdm } from 'src/pdm/entities/pdm.entity';
import { CreatePdmDto } from './dto/create-pdm.dto';
import { PdmService } from './pdm.service';

@ApiTags('PDM')
@Controller('pdm')
export class PdmController {
    constructor(private readonly pdmService: PdmService) { }

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroPdm.inserir')
    create(@Body() createPdmDto: CreatePdmDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return this.pdmService.create(createPdmDto, user);
    }


    @ApiBearerAuth('access-token')
    @Get()
    @Roles('CadastroPdm.inserir', 'CadastroPdm.editar', 'CadastroPdm.inativar')
    async findAll(): Promise<ListPdmDto> {
        return { 'linhas': await this.pdmService.findAll() };
    }


    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroPdm.editar')
    async update(@Param() params: FindOneParams, @Body() updatePdmDto: UpdatePdmDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.pdmService.update(+params.id, updatePdmDto, user);
    }

    @Get(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroPdm.inserir', 'CadastroPdm.editar', 'CadastroPdm.inativar')
    async get(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<Pdm> {
        return await this.pdmService.getDetail(+params.id, user);
    }

}
