import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ListaDePrivilegios } from 'src/common/ListaDePrivilegios';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { FindOneParams, FindTwoParams } from '../../common/decorators/find-params';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { AcompanhamentoService } from './acompanhamento.service';
import { CreateProjetoAcompanhamentoDto } from './dto/create-acompanhamento.dto';
import { UpdateProjetoAcompanhamentoDto } from './dto/update-acompanhamento.dto';
import { DetailProjetoAcompanhamentoDto, ListProjetoAcompanhamentoDto } from './entities/acompanhamento.entity';

const roles: ListaDePrivilegios[] = ['Projeto.administrador', 'SMAE.gestor_de_projeto', 'SMAE.colaborador_de_projeto'];

@Controller('projeto')
@ApiTags('Projeto - Acompanhamento')
export class AcompanhamentoController {
    constructor(private readonly acompanhamentoService: AcompanhamentoService) { }

    @Post(':id/acompanhamento')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async create(@Param() params: FindOneParams, @Body() createAcompanhamentoDto: CreateProjetoAcompanhamentoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.acompanhamentoService.create(params.id, createAcompanhamentoDto, user);
    }

    @Get(':id/acompanhamento')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async findAll(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<ListProjetoAcompanhamentoDto> {
        return {
            linhas: await this.acompanhamentoService.findAll(params.id, user)
        };
    }

    @Get(':id/acompanhamento/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async findOne(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt): Promise<DetailProjetoAcompanhamentoDto> {
        return await this.acompanhamentoService.findOne(params.id, params.id2, user);
    }

    @Patch(':id/acompanhamento/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async update(@Param() params: FindTwoParams, @Body() dto: UpdateProjetoAcompanhamentoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.acompanhamentoService.update(params.id, params.id2, dto, user)
    }

    @Delete(':id/acompanhamento/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        await this.acompanhamentoService.remove(params.id, params.id2, user);
        return ''
    }
}
