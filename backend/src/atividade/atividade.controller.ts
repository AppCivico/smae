import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpException,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiNotFoundResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { TipoPDM, TipoPdmType } from '../common/decorators/current-tipo-pdm';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { MetaController, MetaSetorialController } from '../meta/meta.controller';
import { AtividadeService } from './atividade.service';
import { CreateAtividadeDto } from './dto/create-atividade.dto';
import { FilterAtividadeDto } from './dto/filter-atividade.dto';
import { ListAtividadeDto } from './dto/list-atividade.dto';
import { UpdateAtividadeDto } from './dto/update-atividade.dto';
import { AtividadeDto } from './entities/atividade.entity';
import { RelacionadosDTO } from '../meta/entities/meta.entity';
import { FilterRelacionadosDTO } from '../meta/dto/filter-meta.dto';

@ApiTags('Atividade')
@Controller('atividade')
export class AtividadeController {
    private tipoPdm: TipoPdmType = '_PDM';
    constructor(private readonly atividadeService: AtividadeService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(MetaController.WritePerm)
    async create(
        @Body() createAtividadeDto: CreateAtividadeDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.atividadeService.create(this.tipoPdm, createAtividadeDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    @Roles(MetaController.ReadPerm)
    async findAll(@Query() filters: FilterAtividadeDto, @CurrentUser() user: PessoaFromJwt): Promise<ListAtividadeDto> {
        return { linhas: await this.atividadeService.findAll(this.tipoPdm, filters, user) };
    }

    @ApiBearerAuth('access-token')
    @ApiNotFoundResponse()
    @Get(':id')
    @Roles(MetaController.ReadPerm)
    async findOne(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<AtividadeDto> {
        const r = await this.atividadeService.findAll(this.tipoPdm, { id: params.id }, user);
        if (!r.length) throw new HttpException('Atividade não encontrada.', 404);
        return r[0];
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(MetaController.WritePerm)
    async update(
        @Param() params: FindOneParams,
        @Body() updateAtividadeDto: UpdateAtividadeDto,
        @CurrentUser() user: PessoaFromJwt
    ) {
        return await this.atividadeService.update(this.tipoPdm, +params.id, updateAtividadeDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(MetaController.WritePerm)
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.atividadeService.remove(this.tipoPdm, +params.id, user);
        return '';
    }
}

@ApiTags('Atividade')
@Controller('plano-setorial-atividade')
export class AtividadeSetorialController {
    constructor(private readonly atividadeService: AtividadeService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(MetaSetorialController.WritePerm)
    async create(
        @Body() createAtividadeDto: CreateAtividadeDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<RecordWithId> {
        return await this.atividadeService.create(tipo, createAtividadeDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    @Roles(MetaSetorialController.ReadPerm)
    async findAll(
        @Query() filters: FilterAtividadeDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<ListAtividadeDto> {
        return { linhas: await this.atividadeService.findAll(tipo, filters, user) };
    }

    @ApiBearerAuth('access-token')
    @ApiNotFoundResponse()
    @Get('relacionados')
    @Roles(MetaSetorialController.ReadPerm)
    async buscaRelacionados(
        @Query() dto: FilterRelacionadosDTO,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<RelacionadosDTO> {
        return await this.atividadeService.metaService.buscaRelacionados(tipo, dto, user);
    }

    @ApiBearerAuth('access-token')
    @ApiNotFoundResponse()
    @Get(':id')
    @Roles(MetaSetorialController.ReadPerm)
    async findOne(
        @Param() params: FindOneParams,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ): Promise<AtividadeDto> {
        const r = await this.atividadeService.findAll(tipo, { id: params.id }, user);
        if (!r.length) throw new HttpException('Atividade não encontrada.', 404);
        return r[0];
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(MetaSetorialController.WritePerm)
    async update(
        @Param() params: FindOneParams,
        @Body() updateAtividadeDto: UpdateAtividadeDto,
        @CurrentUser() user: PessoaFromJwt,
        @TipoPDM() tipo: TipoPdmType
    ) {
        return await this.atividadeService.update(tipo, +params.id, updateAtividadeDto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(MetaSetorialController.WritePerm)
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt, @TipoPDM() tipo: TipoPdmType) {
        await this.atividadeService.remove(tipo, +params.id, user);
        return '';
    }
}
