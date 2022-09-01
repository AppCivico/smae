import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { ListEixoDto } from 'src/eixo/dto/list-eixo.dto';
import { EixoService } from './eixo.service';
import { CreateEixoDto } from './dto/create-eixo.dto';
import { UpdateEixoDto } from './dto/update-eixo.dto';
import { FindOneParams } from 'src/common/decorators/find-one-params';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';

@ApiTags('Eixo')
@Controller('eixo')
export class EixoController {
    constructor(private readonly eixoService: EixoService) { }

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroEixo.inserir')
    async create(@Body() createEixoDto: CreateEixoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.eixoService.create(createEixoDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(): Promise<ListEixoDto> {
        return { 'linhas': await this.eixoService.findAll() };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroEixo.editar')
    async update(@Param() params: FindOneParams, @Body() updateEixoDto: UpdateEixoDto, @CurrentUser() user: PessoaFromJwt) {
        return await this.eixoService.update(+params.id, updateEixoDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroEixo.remover')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.eixoService.remove(+params.id, user);
        return '';
    }
}
