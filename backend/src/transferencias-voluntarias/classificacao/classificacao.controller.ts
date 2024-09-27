import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ClassificacaoService } from './classificacao.service';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { CreateClassificacaoDto, UpdateClassificacaoDto } from './dto/create-classificacao.dto';
import { ClassificacaoDto, ListClassificacaoDto } from './entities/classificacao.dto';
import { FindOneParams } from '../../common/decorators/find-params';

@ApiTags('Classificação')
@Controller('classificacao')
export class ClassificacaoController {
    constructor(private readonly classficacaoService: ClassificacaoService) {}
    @Post('')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroClassificacao.inserir'])
    async create(@Body() dto: CreateClassificacaoDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.classficacaoService.create(dto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    @Roles(['CadastroClassificacao.listar'])
    async findAll(): Promise<ListClassificacaoDto> {
        return { linhas: await this.classficacaoService.findAll() };
    }

    @ApiBearerAuth('access-token')
    @Get(':id')
    @Roles(['CadastroClassificacao.listar'])
    async findById(@Param() params: FindOneParams): Promise<ClassificacaoDto> {
        return await this.classficacaoService.findOne(+params.id);
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroClassificacao.editar'])
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdateClassificacaoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.classficacaoService.update(+params.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroClassificacao.remover'])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.classficacaoService.remove(+params.id, user);
        return '';
    }
}
