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
    CreateModalidadeContratacaoDto,
    FilterModalidadeContratacaoDto,
    ListModalidadeContratacaoDto,
    ProjetoModalidadeContratacaoDto,
    UpdateModalidadeContratacaoDto,
} from './dto/mod-contratacao.dto';
import { ProjetoModalidadeContratacaoService } from './mod-contratacao.service';

@ApiTags('Modalidade de Contratação (Exclusivo para Obras)')
@Controller('modalidade-contratacao-mdo')
export class ProjetoModalidadeContratacaoController {
    constructor(private readonly modContratacaoService: ProjetoModalidadeContratacaoService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['ModalidadeContratacao.inserir'])
    async create(
        @Body() dto: CreateModalidadeContratacaoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.modContratacaoService.create(dto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(@Query() filters: FilterModalidadeContratacaoDto): Promise<ListModalidadeContratacaoDto> {
        return { linhas: await this.modContratacaoService.findAll(filters) };
    }

    @ApiBearerAuth('access-token')
    @Get(':id')
    async findOne(@Param() params: FindOneParams): Promise<ProjetoModalidadeContratacaoDto> {
        const linhas = await this.modContratacaoService.findAll({ id: +params.id });
        if (linhas.length === 0) throw new NotFoundException('Registro não encontrado');
        return linhas[0];
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['ModalidadeContratacao.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdateModalidadeContratacaoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.modContratacaoService.update(+params.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['ModalidadeContratacao.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.modContratacaoService.remove(+params.id, user);
        return '';
    }
}
