import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { FindOneParams } from 'src/common/decorators/find-params';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { AreaTematicaService } from './area-tematica.service';
import { CreateAreaTematicaDto } from './dto/create-area-tematica.dto';
import { UpdateAreaTematicaDto } from './dto/update-area-tematica.dto';
import { ListAreaTematicaDto, AreaTematicaDto } from './entities/area-tematica.entity';

@ApiTags('Configurações - Demandas - Área Temática')
@Controller('area-tematica')
export class AreaTematicaController {
    constructor(private readonly areaTematicaService: AreaTematicaService) {}

    @Post('')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroAreaTematica.inserir'])
    async create(@Body() dto: CreateAreaTematicaDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.areaTematicaService.create(dto, user);
    }

    @Get()
    @ApiBearerAuth('access-token')
    @Roles(['CadastroAreaTematica.listar'])
    async findAll(): Promise<ListAreaTematicaDto> {
        return { linhas: await this.areaTematicaService.findAll() };
    }

    @Get(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroAreaTematica.listar'])
    async findOne(@Param() params: FindOneParams): Promise<AreaTematicaDto> {
        return await this.areaTematicaService.findOne(+params.id);
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroAreaTematica.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdateAreaTematicaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.areaTematicaService.update(+params.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroAreaTematica.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.areaTematicaService.remove(+params.id, user);
        return '';
    }
}
