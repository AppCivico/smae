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
import { TipoPdm } from '@prisma/client';

@ApiTags('Atividade')
@Controller('atividade')
export class AtividadeController {
    private tipoPdm: TipoPdm = 'PDM';
    constructor(private readonly atividadeService: AtividadeService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['CadastroAtividade.inserir', 'CadastroMeta.inserir'])
    async create(
        @Body() createAtividadeDto: CreateAtividadeDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.atividadeService.create(this.tipoPdm, createAtividadeDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    @Roles(['CadastroMeta.listar'])
    async findAll(@Query() filters: FilterAtividadeDto, @CurrentUser() user: PessoaFromJwt): Promise<ListAtividadeDto> {
        return { linhas: await this.atividadeService.findAll(this.tipoPdm, filters, user) };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroAtividade.editar', 'CadastroMeta.inserir'])
    async update(
        @Param() params: FindOneParams,
        @Body() updateAtividadeDto: UpdateAtividadeDto,
        @CurrentUser() user: PessoaFromJwt
    ) {
        return await this.atividadeService.update(this.tipoPdm, +params.id, updateAtividadeDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroAtividade.remover', 'CadastroMeta.inserir'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.atividadeService.remove(this.tipoPdm, +params.id, user);
        return '';
    }
}

@ApiTags('Atividade')
@Controller('atividade-setorial')
export class AtividadeSetorialController {
    private tipoPdm: TipoPdm = 'PS';
    constructor(private readonly atividadeService: AtividadeService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['CadastroAtividadePS.inserir', 'CadastroMetaPS.inserir'])
    async create(
        @Body() createAtividadeDto: CreateAtividadeDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.atividadeService.create(this.tipoPdm, createAtividadeDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    @Roles(['CadastroMetaPS.listar'])
    async findAll(@Query() filters: FilterAtividadeDto, @CurrentUser() user: PessoaFromJwt): Promise<ListAtividadeDto> {
        return { linhas: await this.atividadeService.findAll(this.tipoPdm, filters, user) };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroAtividadePS.editar', 'CadastroMetaPS.inserir'])
    async update(
        @Param() params: FindOneParams,
        @Body() updateAtividadeDto: UpdateAtividadeDto,
        @CurrentUser() user: PessoaFromJwt
    ) {
        return await this.atividadeService.update(this.tipoPdm, +params.id, updateAtividadeDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroAtividadePS.remover', 'CadastroMetaPS.inserir'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.atividadeService.remove(this.tipoPdm, +params.id, user);
        return '';
    }
}
