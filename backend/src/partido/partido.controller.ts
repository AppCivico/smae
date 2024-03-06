import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { CreatePartidoDto } from './dto/create-partido.dto';
import { ListPartidoDto, PartidoOneDto } from './entities/partido.entity';
import { UpdatePartidoDto } from './dto/update-partido.dto';
import { PartidoService } from './partido.service';

@ApiTags('Partido')
@Controller('partido')
export class PartidoController {
    constructor(private readonly partidoService: PartidoService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroPartido.inserir')
    async create(@Body() dto: CreatePartidoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.partidoService.create(dto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(): Promise<ListPartidoDto> {
        return { linhas: await this.partidoService.findAll() };
    }

    @Get(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroPartido.editar', 'CadastroPartido.inserir')
    async findOne(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<PartidoOneDto> {
        return await this.partidoService.findOne(params.id, user);
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroPartido.editar')
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdatePartidoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.partidoService.update(+params.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroPartido.remover')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.partidoService.remove(+params.id, user);
        return '';
    }
}
