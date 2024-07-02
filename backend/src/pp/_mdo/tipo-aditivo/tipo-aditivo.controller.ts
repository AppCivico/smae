import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    NotFoundException,
    Param,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../../auth/models/PessoaFromJwt';
import { FindOneParams } from '../../../common/decorators/find-params';
import { RecordWithId } from '../../../common/dto/record-with-id.dto';
import {
    CreateTipoAditivoDto,
    FilterTipoAditivoDto,
    ListTipoAditivoDto,
    ProjetoTipoAditivoDto,
    UpdateTipoAditivoDto,
} from './dto/tipo-aditivo.dto';
import { ProjetoTipoAditivoService } from './tipo-aditivo.service';

@ApiTags('Tipo de Aditivo (Exclusivo para Obras)')
@Controller('tipo-aditivo-mdo')
export class ProjetoTipoAditivoController {
    constructor(private readonly tipoAditivoService: ProjetoTipoAditivoService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['TipoAditivoMDO.inserir'])
    async create(@Body() dto: CreateTipoAditivoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.tipoAditivoService.create(dto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(@Query() filters: FilterTipoAditivoDto): Promise<ListTipoAditivoDto> {
        return { linhas: await this.tipoAditivoService.findAll(filters) };
    }

    @ApiBearerAuth('access-token')
    @Get(':id')
    async findOne(@Param() params: FindOneParams): Promise<ProjetoTipoAditivoDto> {
        const linhas = await this.tipoAditivoService.findAll({ id: +params.id });
        if (linhas.length === 0) throw new NotFoundException('Registro não encontrado');
        return linhas[0];
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['TipoAditivoMDO.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdateTipoAditivoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.tipoAditivoService.update(+params.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['TipoAditivoMDO.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.tipoAditivoService.remove(+params.id, user);
        return '';
    }
}
