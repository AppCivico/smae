import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { FindOneParams, FindTwoParams } from '../../common/decorators/find-params';
import { RecordWithId } from '../../common/dto/record-with-id.dto';

import { ListaDePrivilegios } from 'src/common/ListaDePrivilegios';
import { CreateLicoesApreendidasDto } from './dto/create-licoes-aprendidas.dto';
import { UpdateLicoesAprendidasDto } from './dto/update-licoes-aprendidas.dto';
import { LicaoAprendida, ListLicoesAprendidasDto } from './entities/licoes-aprendidas.entity';
import { LicoesAprendidasService } from './licoes-aprendidas.service';

const roles: ListaDePrivilegios[] = ['Projeto.administrador', 'SMAE.gestor_de_projeto', 'SMAE.colaborador_de_projeto'];

@Controller('projeto')
@ApiTags('Projeto - Lições Aprendidas')
export class LicoesAprendidasController {
    constructor(private readonly licoesAprendidasService: LicoesAprendidasService) { }

    @Post(':id/licoes-aprendidas')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async create(@Param() params: FindOneParams, @Body() createLicoesAprendidasDto: CreateLicoesApreendidasDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.licoesAprendidasService.create(params.id, createLicoesAprendidasDto, user);
    }

    @Get(':id/licoes-aprendidas')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async findAll(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<ListLicoesAprendidasDto> {
        return {
            linhas: await this.licoesAprendidasService.findAll(params.id, user)
        };
    }

    @Get(':id/licoes-aprendidas/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async findOne(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt): Promise<LicaoAprendida> {
        return await this.licoesAprendidasService.findOne(params.id, params.id2, user);
    }

    @Patch(':id/licoes-aprendidas/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async update(@Param() params: FindTwoParams, @Body() dto: UpdateLicoesAprendidasDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.licoesAprendidasService.update(params.id, params.id2, dto, user)
    }

    @Delete(':id/licoes-aprendidas/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        await this.licoesAprendidasService.remove(params.id, params.id2, user);
        return ''
    }
}
