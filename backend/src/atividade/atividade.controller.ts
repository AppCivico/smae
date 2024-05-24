import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { AtividadeService } from './atividade.service';
import { CreateAtividadeDto } from './dto/create-atividade.dto';
import { FilterAtividadeDto } from './dto/filter-atividade.dto';
import { ListAtividadeDto } from './dto/list-atividade.dto';
import { UpdateAtividadeDto } from './dto/update-atividade.dto';

@ApiTags('Atividade')
@Controller('atividade')
export class AtividadeController {
    constructor(private readonly atividadeService: AtividadeService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['CadastroAtividade.inserir', 'CadastroMeta.inserir'])
    async create(
        @Body() createAtividadeDto: CreateAtividadeDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.atividadeService.create(createAtividadeDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    @Roles(['CadastroMeta.listar'])
    async findAll(@Query() filters: FilterAtividadeDto, @CurrentUser() user: PessoaFromJwt): Promise<ListAtividadeDto> {
        return { linhas: await this.atividadeService.findAll(filters, user) };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroAtividade.editar', 'CadastroMeta.inserir'])
    async update(
        @Param() params: FindOneParams,
        @Body() updateAtividadeDto: UpdateAtividadeDto,
        @CurrentUser() user: PessoaFromJwt
    ) {
        return await this.atividadeService.update(+params.id, updateAtividadeDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroAtividade.remover', 'CadastroMeta.inserir'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.atividadeService.remove(+params.id, user);
        return '';
    }
}
