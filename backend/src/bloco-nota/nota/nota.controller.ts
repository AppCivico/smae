import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import {
    BuscaNotaDto,
    CreateNotaDto,
    FindNotaParam,
    DeleteNotaRespostaParam,
    ListTipoNotaDto,
    NovaRespostaDto,
    RecordWithIdJwt,
    TipoNotaDetail,
    UpdateNotaDto,
} from './dto/nota.dto';
import { NotaService } from './nota.service';
import { RecordWithId } from '../../common/dto/record-with-id.dto';

@ApiTags('Bloco Nota / Nota')
@Controller('nota')
export class NotaController {
    constructor(private readonly tipoNotaService: NotaService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    async create(@Body() createTagDto: CreateNotaDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithIdJwt> {
        return await this.tipoNotaService.create(createTagDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get('busca-por-bloco')
    async findAll(@Query() filter: BuscaNotaDto, @CurrentUser() user: PessoaFromJwt): Promise<ListTipoNotaDto> {
        return { linhas: await this.tipoNotaService.findAll(filter, user) };
    }

    @ApiBearerAuth('access-token')
    @Get(':id_jwt')
    async findOne(@Param() params: FindNotaParam, @CurrentUser() user: PessoaFromJwt): Promise<TipoNotaDetail> {
        return await this.tipoNotaService.findOne(params.id_jwt, user);
    }

    @Delete(':id_jwt/resposta/:id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async deleteResposta(@Param() params: DeleteNotaRespostaParam, @CurrentUser() user: PessoaFromJwt) {
        await this.tipoNotaService.removeResposta(params.id_jwt, params.id, user);
        return '';
    }

    @Patch(':id_jwt/resposta')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    async novaResposta(
        @Param() params: FindNotaParam,
        @Body() dto: NovaRespostaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.tipoNotaService.novaResposta(params.id_jwt, dto, user);
    }

    @Patch(':id_jwt')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    async update(
        @Param() params: FindNotaParam,
        @Body() updateTagDto: UpdateNotaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithIdJwt> {
        return await this.tipoNotaService.update(params.id_jwt, updateTagDto, user);
    }

    @Delete(':id_jwt')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindNotaParam, @CurrentUser() user: PessoaFromJwt) {
        await this.tipoNotaService.remove(params.id_jwt, user);
        return '';
    }
}
