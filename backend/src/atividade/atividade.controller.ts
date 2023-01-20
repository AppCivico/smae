import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
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
    constructor(private readonly atividadeService: AtividadeService) { }

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroAtividade.inserir', 'PDM.tecnico_cp', 'PDM.admin_cp')
    async create(@Body() createAtividadeDto: CreateAtividadeDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.atividadeService.create(createAtividadeDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    // se um dia colocar @Roles, lembrar que existe o 'PDM.tecnico_cp', 'PDM.admin_cp'
    // que também usa esse endpoint
    async findAll(@Query() filters: FilterAtividadeDto, @CurrentUser() user: PessoaFromJwt): Promise<ListAtividadeDto> {
        return { 'linhas': await this.atividadeService.findAll(filters, user) };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroAtividade.editar', 'PDM.tecnico_cp', 'PDM.admin_cp')
    async update(@Param() params: FindOneParams, @Body() updateAtividadeDto: UpdateAtividadeDto, @CurrentUser() user: PessoaFromJwt) {
        return await this.atividadeService.update(+params.id, updateAtividadeDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroAtividade.remover', 'PDM.tecnico_cp', 'PDM.admin_cp')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.atividadeService.remove(+params.id, user);
        return '';
    }

}
