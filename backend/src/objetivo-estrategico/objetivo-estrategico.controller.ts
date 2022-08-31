import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { ListObjetivoEstrategicoDto } from './dto/list-objetivo-estrategico.dto';
import { ObjetivoEstrategicoService } from './objetivo-estrategico.service';
import { CreateObjetivoEstrategicoDto } from './dto/create-objetivo-estrategico.dto';
import { UpdateObjetivoEstrategicoDto } from './dto/update-objetivo-estrategico.dto';
import { FindOneParams } from 'src/common/decorators/find-one-params';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';

@ApiTags('Objetivo Estratégico')
@Controller('objetivo-estrategico')
export class ObjetivoEstrategicoController {
    constructor(private readonly objetivoEstrategicoService: ObjetivoEstrategicoService) { }

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroObjetivoEstrategico.inserir')
    async create(@Body() createObjetivoEstrategicoDto: CreateObjetivoEstrategicoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.objetivoEstrategicoService.create(createObjetivoEstrategicoDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(): Promise<ListObjetivoEstrategicoDto> {
        return { 'linhas': await this.objetivoEstrategicoService.findAll() };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroObjetivoEstrategico.editar')
    async update(@Param() params: FindOneParams, @Body() updateObjetivoEstrategicoDto: UpdateObjetivoEstrategicoDto, @CurrentUser() user: PessoaFromJwt) : Promise<RecordWithId>{
        return await this.objetivoEstrategicoService.update(+params.id, updateObjetivoEstrategicoDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroObjetivoEstrategico.remover')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.objetivoEstrategicoService.remove(+params.id, user);
        return '';
    }
}
