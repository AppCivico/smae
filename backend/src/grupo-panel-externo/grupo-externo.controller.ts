import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { ListaDePrivilegios } from '../common/ListaDePrivilegios';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { CreateGrupoPainelExternoDto } from './dto/create-grupo-externo.dto';
import { UpdateGrupoPainelExternoDto } from './dto/update-grupo-externo.dto';
import { FilterGrupoPainelExternoDto, ListGrupoPainelExternoDto } from './entities/grupo-externo.entity';
import { GrupoPainelExternoService } from './grupo-externo.service';

const roles: ListaDePrivilegios[] = [
    'CadastroGrupoPainelExterno.administrador',
    'CadastroGrupoPainelExterno.administrador_no_orgao',
];

@ApiTags('Grupo Painel Externo')
@Controller('grupo-painel-externo')
export class GrupoPainelExternoController {
    constructor(private readonly grupoPainelExternoService: GrupoPainelExternoService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async create(@Body() dto: CreateGrupoPainelExternoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.grupoPainelExternoService.create(dto, user);
    }

    @Get()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async findAll(@Query() filter: FilterGrupoPainelExternoDto): Promise<ListGrupoPainelExternoDto> {
        return { linhas: await this.grupoPainelExternoService.findAll(filter) };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async update(
        @Param() id: FindOneParams,
        @Body() dto: UpdateGrupoPainelExternoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.grupoPainelExternoService.update(id.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() id: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.grupoPainelExternoService.remove(id.id, user);

        return '';
    }
}
