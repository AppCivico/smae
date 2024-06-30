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
    CreateProjetoProgramaDto,
    FilterProjetoProgramaDto,
    ListProjetoProgramaDto,
    ProjetoProgramaDto,
    UpdateProgramaDto,
} from './dto/programa.dto';
import { ProjetoProgramaService } from './programa.service';

@ApiTags('Programas - Projeto MDO (Exclusivo para Obras)')
@Controller('projeto-programa-mdo')
export class ProjetoProgramaMDOController {
    constructor(private readonly programaService: ProjetoProgramaService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['ProjetoProgramaMDO.inserir'])
    async create(
        @Body() dto: CreateProjetoProgramaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.programaService.create(dto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(@Query() filters: FilterProjetoProgramaDto): Promise<ListProjetoProgramaDto> {
        return { linhas: await this.programaService.findAll(filters) };
    }

    @ApiBearerAuth('access-token')
    @Get(':id')
    async findOne(@Param() params: FindOneParams): Promise<ProjetoProgramaDto> {
        const linhas = await this.programaService.findAll({ id: +params.id });
        if (linhas.length === 0) throw new NotFoundException('Registro não encontrado');
        return linhas[0];
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['ProjetoProgramaMDO.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdateProgramaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.programaService.update(+params.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['ProjetoProgramaMDO.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.programaService.remove(+params.id, user);
        return '';
    }
}
